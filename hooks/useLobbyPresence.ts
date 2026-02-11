"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import {
  LobbyUser,
  Challenge,
  LobbyClientMessage,
  LobbyServerMessage,
  LOBBY_ROOM_ID,
  HEARTBEAT_INTERVAL_MS,
} from "@/lib/game/lobby-types";

// PartyKit host - change for production
const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

export type LobbyConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface UseLobbyPresenceOptions {
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
  autoConnect?: boolean;
}

interface UseLobbyPresenceReturn {
  // Connection state
  status: LobbyConnectionStatus;
  error: string | null;

  // Lobby state
  onlineUsers: LobbyUser[];
  incomingChallenge: Challenge | null;
  outgoingChallenge: Challenge | null;
  gameReady: { roomCode: string; opponent: LobbyUser } | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendChallenge: (targetAddress: string) => void;
  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: (challengeId: string) => void;
  clearGameReady: () => void;
}

export function useLobbyPresence({
  lensAddress,
  lensHandle,
  lensAvatar,
  autoConnect = false,
}: UseLobbyPresenceOptions): UseLobbyPresenceReturn {
  // Initialize as 'connecting' when autoConnect is true to avoid flash of "Disconnected" UI
  const [status, setStatus] = useState<LobbyConnectionStatus>(
    autoConnect && lensAddress ? "connecting" : "disconnected"
  );
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<Challenge | null>(null);
  const [gameReady, setGameReady] = useState<{ roomCode: string; opponent: LobbyUser } | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const statusRef = useRef<LobbyConnectionStatus>("disconnected");

  // Sync status ref
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: LobbyServerMessage = JSON.parse(event.data);
      console.log("[Lobby] Received:", message.type);

      switch (message.type) {
        case "USER_LIST":
          setOnlineUsers(message.users);
          break;

        case "USER_JOINED":
          setOnlineUsers((prev) => {
            // Avoid duplicates
            if (prev.find((u) => u.lensAddress === message.user.lensAddress)) {
              return prev.map((u) =>
                u.lensAddress === message.user.lensAddress ? message.user : u
              );
            }
            return [...prev, message.user];
          });
          break;

        case "USER_LEFT":
          setOnlineUsers((prev) =>
            prev.filter((u) => u.lensAddress !== message.lensAddress)
          );
          break;

        case "USER_STATE_CHANGED":
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u.lensAddress === message.lensAddress
                ? { ...u, state: message.state }
                : u
            )
          );
          break;

        case "CHALLENGE_RECEIVED":
          setIncomingChallenge(message.challenge);
          break;

        case "CHALLENGE_SENT":
          setOutgoingChallenge(message.challenge);
          break;

        case "CHALLENGE_ACCEPTED":
          // Clear outgoing challenge - START_GAME will follow
          setOutgoingChallenge(null);
          break;

        case "CHALLENGE_DECLINED":
          setOutgoingChallenge(null);
          setError("Challenge was declined");
          setTimeout(() => setError(null), 3000);
          break;

        case "CHALLENGE_EXPIRED":
          setIncomingChallenge(null);
          setOutgoingChallenge(null);
          setError("Challenge expired");
          setTimeout(() => setError(null), 3000);
          break;

        case "CHALLENGE_CANCELLED":
          setIncomingChallenge(null);
          setOutgoingChallenge(null);
          break;

        case "START_GAME":
          setIncomingChallenge(null);
          setOutgoingChallenge(null);
          setGameReady({
            roomCode: message.roomCode,
            opponent: message.opponent,
          });
          break;

        case "ERROR":
          setError(message.message);
          setTimeout(() => setError(null), 3000);
          break;

        case "PONG":
          // Heartbeat response
          break;
      }
    } catch (err) {
      console.error("[Lobby] Failed to parse message:", err);
    }
  }, []);

  // Connect to the lobby
  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    if (!lensAddress) {
      setError("No address provided");
      return;
    }

    setStatus("connecting");
    setError(null);

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: LOBBY_ROOM_ID,
      party: "lobby", // Use the lobby party
    });

    socket.addEventListener("open", () => {
      console.log("[Lobby] Connected to lobby");
      setStatus("connected");

      // Send join message
      const joinMessage: LobbyClientMessage = {
        type: "JOIN",
        lensAddress,
        lensHandle,
        lensAvatar,
      };
      socket.send(JSON.stringify(joinMessage));
    });

    socket.addEventListener("message", handleMessage);

    socket.addEventListener("close", () => {
      console.log("[Lobby] Disconnected from lobby");
      const currentStatus = statusRef.current;
      if (currentStatus !== "error") {
        setStatus("disconnected");
      }
    });

    socket.addEventListener("error", (err) => {
      console.error("[Lobby] Socket error:", err);
      setError("Connection error");
      setStatus("error");
    });

    socketRef.current = socket;
  }, [lensAddress, lensHandle, lensAvatar, handleMessage]);

  // Disconnect from the lobby
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Send leave message before closing
      if (socketRef.current.readyState === WebSocket.OPEN) {
        const leaveMessage: LobbyClientMessage = { type: "LEAVE" };
        socketRef.current.send(JSON.stringify(leaveMessage));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("disconnected");
    setOnlineUsers([]);
    setIncomingChallenge(null);
    setOutgoingChallenge(null);
    setGameReady(null);
    setError(null);
  }, []);

  // Send a challenge to another user
  const sendChallenge = useCallback((targetAddress: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to lobby");
      return;
    }

    const message: LobbyClientMessage = {
      type: "SEND_CHALLENGE",
      targetAddress,
    };
    socketRef.current.send(JSON.stringify(message));
  }, []);

  // Accept an incoming challenge
  const acceptChallenge = useCallback((challengeId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to lobby");
      return;
    }

    const message: LobbyClientMessage = {
      type: "ACCEPT_CHALLENGE",
      challengeId,
    };
    socketRef.current.send(JSON.stringify(message));
  }, []);

  // Decline an incoming challenge
  const declineChallenge = useCallback((challengeId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to lobby");
      return;
    }

    const message: LobbyClientMessage = {
      type: "DECLINE_CHALLENGE",
      challengeId,
    };
    socketRef.current.send(JSON.stringify(message));
    setIncomingChallenge(null);
  }, []);

  // Cancel an outgoing challenge
  const cancelChallenge = useCallback((challengeId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to lobby");
      return;
    }

    const message: LobbyClientMessage = {
      type: "CANCEL_CHALLENGE",
      challengeId,
    };
    socketRef.current.send(JSON.stringify(message));
    setOutgoingChallenge(null);
  }, []);

  // Clear game ready state (after navigating to game)
  const clearGameReady = useCallback(() => {
    setGameReady(null);
  }, []);

  // Auto-connect if enabled (only on mount)
  const hasAutoConnected = useRef(false);
  useEffect(() => {
    if (autoConnect && lensAddress && !hasAutoConnected.current) {
      hasAutoConnected.current = true;
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        connect();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoConnect, lensAddress, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const pingMessage: LobbyClientMessage = { type: "PING" };
        socketRef.current.send(JSON.stringify(pingMessage));
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    error,
    onlineUsers,
    incomingChallenge,
    outgoingChallenge,
    gameReady,
    connect,
    disconnect,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    clearGameReady,
  };
}
