"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import {
  ClientMessage,
  ServerMessage,
  ClientGameState,
  MultiplayerGameAction,
  PlayerInfo,
} from "@/lib/game/multiplayer-types";
// Note: ClientGameState now uses SerializedMinionInstance with keywords as Keyword[]
// No need to reconstruct Sets - JSON deserialization gives us arrays which is what we expect

// PartyKit host - change for production
const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "waiting"
  | "playing"
  | "finished"
  | "error";

interface UseMultiplayerGameOptions {
  roomCode: string;
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
}

interface UseMultiplayerGameReturn {
  // Connection state
  status: ConnectionStatus;
  error: string | null;

  // Game state
  gameState: ClientGameState | null;
  opponentInfo: PlayerInfo | null;
  isMyTurn: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendAction: (action: MultiplayerGameAction) => void;

  // Specific actions
  playCard: (instanceId: string, position?: number, targetId?: string) => void;
  selectCard: (instanceId: string) => void;
  deselectCard: () => void;
  selectMinion: (instanceId: string) => void;
  deselectMinion: () => void;
  attack: (attackerId: string, targetId: string) => void;
  heroAttack: (targetId: string) => void;
  endTurn: () => void;
}

export function useMultiplayerGame({
  roomCode,
  lensAddress,
  lensHandle,
  lensAvatar,
}: UseMultiplayerGameOptions): UseMultiplayerGameReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [opponentInfo, setOpponentInfo] = useState<PlayerInfo | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to hold current values for stable callbacks (prevents infinite re-render loops)
  const opponentInfoRef = useRef<PlayerInfo | null>(null);
  const statusRef = useRef<ConnectionStatus>("disconnected");

  // Sync refs with state values
  useEffect(() => {
    opponentInfoRef.current = opponentInfo;
  }, [opponentInfo]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Calculate if it's the player's turn
  const isMyTurn =
    gameState !== null &&
    ((gameState.yourRole === "player1" && gameState.turn === "player") ||
      (gameState.yourRole === "player2" && gameState.turn === "opponent"));

  // Handle incoming messages (uses refs to avoid dependency on changing state)
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);
      // Log full message for non-GAME_STATE types (GAME_STATE is too verbose)
      if (message.type === "GAME_STATE") {
        console.log("[Multiplayer] Received: GAME_STATE (phase:", message.state?.phase, "turn:", message.state?.turn, ")");
      } else {
        console.log("[Multiplayer] Received:", message.type, JSON.stringify(message).slice(0, 200));
      }

      switch (message.type) {
        case "WAITING_FOR_OPPONENT":
          setStatus("waiting");
          break;

        case "OPPONENT_JOINED":
          setOpponentInfo(message.opponentInfo);
          break;

        case "GAME_START":
        case "GAME_STATE":
          setGameState(message.state);
          if (message.state.phase === "PLAYING") {
            setStatus("playing");
          }
          if (message.state.opponentInfo) {
            setOpponentInfo({
              connectionId: "",
              lensAddress: message.state.opponentInfo.lensAddress,
              lensHandle: message.state.opponentInfo.lensHandle,
              lensAvatar: message.state.opponentInfo.lensAvatar,
              role: message.state.yourRole === "player1" ? "player2" : "player1",
              isConnected: true,
            });
          }
          break;

        case "INVALID_ACTION":
          console.warn("[Multiplayer] Invalid action:", message.reason);
          setError(message.reason);
          // Clear error after a short delay
          setTimeout(() => setError(null), 3000);
          break;

        case "OPPONENT_DISCONNECTED":
          // Use ref to get current opponentInfo without creating dependency
          setOpponentInfo((prev) => prev ? { ...prev, isConnected: false } : null);
          break;

        case "OPPONENT_RECONNECTED":
          // Use ref to get current opponentInfo without creating dependency
          setOpponentInfo((prev) => prev ? { ...prev, isConnected: true } : null);
          break;

        case "GAME_OVER":
          setGameState(message.state);
          setStatus("finished");
          break;

        case "ERROR":
          setError(message.message);
          break;

        case "ROOM_INFO":
          // Handle room info if needed
          break;

        case "PONG":
          // Heartbeat response
          break;
      }
    } catch (err) {
      console.error("[Multiplayer] Failed to parse message:", err);
    }
  }, []); // Empty dependencies - uses functional setState updates

  // Connect to the room (uses refs for status to avoid dependency loops)
  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus("connecting");
    setError(null);

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode,
    });

    socket.addEventListener("open", () => {
      console.log("[Multiplayer] Connected to room:", roomCode);
      setStatus("connected");

      // Send join message
      const joinMessage: ClientMessage = {
        type: "JOIN",
        lensAddress,
        lensHandle,
        lensAvatar,
      };
      socket.send(JSON.stringify(joinMessage));
    });

    socket.addEventListener("message", handleMessage);

    socket.addEventListener("close", (event) => {
      console.log(`[Multiplayer] Disconnected from room (code: ${event.code}, reason: "${event.reason || "no reason provided"}", wasClean: ${event.wasClean})`);
      // Use ref to check current status without creating dependency
      const currentStatus = statusRef.current;
      console.log(`[Multiplayer] Current status at disconnect: ${currentStatus}`);
      if (currentStatus !== "finished" && currentStatus !== "error") {
        setStatus("disconnected");
        // Attempt to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current === socket) {
            // Don't auto-reconnect, let user decide
            console.log("[Multiplayer] Socket closed, user can reconnect manually");
          }
        }, 2000);
      }
    });

    socket.addEventListener("error", (err) => {
      console.error("[Multiplayer] Socket error:", err);
      setError("Connection error");
      setStatus("error");
    });

    socketRef.current = socket;
  }, [roomCode, lensAddress, lensHandle, lensAvatar, handleMessage]); // Removed status dependency

  // Disconnect from the room
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("disconnected");
    setGameState(null);
    setOpponentInfo(null);
    setError(null);
  }, []);

  // Send an action to the server
  const sendAction = useCallback((action: MultiplayerGameAction) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[Multiplayer] Cannot send action - not connected");
      return;
    }

    const message: ClientMessage = {
      type: "ACTION",
      action,
    };
    socketRef.current.send(JSON.stringify(message));
  }, []);

  // Specific action helpers
  const playCard = useCallback(
    (instanceId: string, position?: number, targetId?: string) => {
      sendAction({ type: "PLAY_CARD", instanceId, position, targetId });
    },
    [sendAction]
  );

  const selectCard = useCallback(
    (instanceId: string) => {
      sendAction({ type: "SELECT_CARD", instanceId });
    },
    [sendAction]
  );

  const deselectCard = useCallback(() => {
    sendAction({ type: "DESELECT_CARD" });
  }, [sendAction]);

  const selectMinion = useCallback(
    (instanceId: string) => {
      sendAction({ type: "SELECT_MINION", instanceId });
    },
    [sendAction]
  );

  const deselectMinion = useCallback(() => {
    sendAction({ type: "DESELECT_MINION" });
  }, [sendAction]);

  const attack = useCallback(
    (attackerId: string, targetId: string) => {
      sendAction({ type: "ATTACK", attackerId, targetId });
    },
    [sendAction]
  );

  const heroAttack = useCallback(
    (targetId: string) => {
      sendAction({ type: "HERO_ATTACK", targetId });
    },
    [sendAction]
  );

  const endTurn = useCallback(() => {
    sendAction({ type: "END_TURN" });
  }, [sendAction]);

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
        const pingMessage: ClientMessage = { type: "PING" };
        socketRef.current.send(JSON.stringify(pingMessage));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    error,
    gameState,
    opponentInfo,
    isMyTurn,
    connect,
    disconnect,
    sendAction,
    playCard,
    selectCard,
    deselectCard,
    selectMinion,
    deselectMinion,
    attack,
    heroAttack,
    endTurn,
  };
}
