import type * as Party from "partykit/server";
import {
  LobbyUser,
  LobbyUserState,
  Challenge,
  LobbyClientMessage,
  LobbyServerMessage,
  CHALLENGE_TIMEOUT_MS,
} from "../lib/game/lobby-types";
import { generateRoomCode } from "../lib/game/multiplayer-types";

export default class LobbyServer implements Party.Server {
  // Map of lensAddress -> LobbyUser
  private users: Map<string, LobbyUser> = new Map();
  // Map of connectionId -> lensAddress
  private connectionToUser: Map<string, string> = new Map();
  // Map of challengeId -> Challenge
  private challenges: Map<string, Challenge> = new Map();
  // Challenge timeout timers
  private challengeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  // Map of connectionId -> Party.Connection
  private connections: Map<string, Party.Connection> = new Map();

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load persisted users if any (though for lobby, we probably want fresh state)
    const storedUsers = await this.room.storage.get<[string, LobbyUser][]>("users");
    if (storedUsers) {
      this.users = new Map(storedUsers);
    }
  }

  async onConnect(conn: Party.Connection) {
    this.connections.set(conn.id, conn);
  }

  onClose(conn: Party.Connection) {
    this.connections.delete(conn.id);

    const lensAddress = this.connectionToUser.get(conn.id);
    if (lensAddress) {
      this.handleUserDisconnect(lensAddress, conn.id);
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: LobbyClientMessage = JSON.parse(message);

      switch (msg.type) {
        case "JOIN":
          this.handleJoin(sender, msg);
          break;
        case "LEAVE":
          this.handleLeave(sender);
          break;
        case "SEND_CHALLENGE":
          this.handleSendChallenge(sender, msg.targetAddress);
          break;
        case "ACCEPT_CHALLENGE":
          this.handleAcceptChallenge(sender, msg.challengeId);
          break;
        case "DECLINE_CHALLENGE":
          this.handleDeclineChallenge(sender, msg.challengeId);
          break;
        case "CANCEL_CHALLENGE":
          this.handleCancelChallenge(sender, msg.challengeId);
          break;
        case "PING":
          this.send(sender, { type: "PONG" });
          break;
      }
    } catch (error) {
      console.error("[Lobby] Error handling message:", error);
      this.send(sender, {
        type: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private handleJoin(
    conn: Party.Connection,
    msg: Extract<LobbyClientMessage, { type: "JOIN" }>
  ) {
    const { lensAddress, lensHandle, lensAvatar } = msg;

    // Check if user already exists (reconnecting)
    const existingUser = this.users.get(lensAddress);
    if (existingUser) {
      // Update connection mapping
      // Remove old connection mapping if exists
      for (const [connId, addr] of this.connectionToUser) {
        if (addr === lensAddress) {
          this.connectionToUser.delete(connId);
          break;
        }
      }
    }

    const user: LobbyUser = {
      lensAddress,
      lensHandle,
      lensAvatar,
      state: "ONLINE",
      connectedAt: Date.now(),
    };

    this.users.set(lensAddress, user);
    this.connectionToUser.set(conn.id, lensAddress);

    // Send current user list to the new user
    this.send(conn, {
      type: "USER_LIST",
      users: this.getOnlineUsers(lensAddress),
    });

    // Broadcast user joined to others
    this.broadcastExcept(conn.id, {
      type: "USER_JOINED",
      user,
    });

    this.saveState();
  }

  private handleLeave(conn: Party.Connection) {
    const lensAddress = this.connectionToUser.get(conn.id);
    if (lensAddress) {
      this.handleUserDisconnect(lensAddress, conn.id);
    }
  }

  private handleUserDisconnect(lensAddress: string, connectionId: string) {
    // Cancel any pending challenges involving this user
    this.cancelUserChallenges(lensAddress);

    // Remove user
    this.users.delete(lensAddress);
    this.connectionToUser.delete(connectionId);

    // Broadcast user left
    this.broadcast({ type: "USER_LEFT", lensAddress });

    this.saveState();
  }

  private handleSendChallenge(conn: Party.Connection, targetAddress: string) {
    const challengerAddress = this.connectionToUser.get(conn.id);
    if (!challengerAddress) {
      this.send(conn, { type: "ERROR", message: "Not logged in" });
      return;
    }

    const challenger = this.users.get(challengerAddress);
    const challenged = this.users.get(targetAddress);

    if (!challenger || !challenged) {
      this.send(conn, { type: "ERROR", message: "User not found" });
      return;
    }

    // Check if challenged user is available
    if (challenged.state !== "ONLINE") {
      this.send(conn, { type: "ERROR", message: "User is not available" });
      return;
    }

    // Check if challenger is available
    if (challenger.state !== "ONLINE") {
      this.send(conn, { type: "ERROR", message: "You are not available" });
      return;
    }

    // Check for mutual challenge (both challenged each other)
    const mutualChallenge = this.findMutualChallenge(challengerAddress, targetAddress);
    if (mutualChallenge) {
      // Auto-accept the existing challenge
      this.acceptChallenge(mutualChallenge.id);
      return;
    }

    // Check if there's already a pending challenge from this challenger
    const existingChallenge = this.findPendingChallengeFrom(challengerAddress);
    if (existingChallenge) {
      this.send(conn, { type: "ERROR", message: "You already have a pending challenge" });
      return;
    }

    // Create challenge
    const challenge: Challenge = {
      id: this.generateChallengeId(),
      challenger,
      challenged,
      status: "PENDING",
      createdAt: Date.now(),
      expiresAt: Date.now() + CHALLENGE_TIMEOUT_MS,
    };

    this.challenges.set(challenge.id, challenge);

    // Update user states
    this.updateUserState(challengerAddress, "BUSY");
    this.updateUserState(targetAddress, "BUSY");

    // Send challenge notification to challenged user
    const challengedConn = this.getConnectionByAddress(targetAddress);
    if (challengedConn) {
      this.send(challengedConn, { type: "CHALLENGE_RECEIVED", challenge });
    }

    // Confirm to challenger
    this.send(conn, { type: "CHALLENGE_SENT", challenge });

    // Set timeout for challenge
    const timer = setTimeout(() => {
      this.expireChallenge(challenge.id);
    }, CHALLENGE_TIMEOUT_MS);
    this.challengeTimers.set(challenge.id, timer);

    this.saveState();
  }

  private handleAcceptChallenge(conn: Party.Connection, challengeId: string) {
    const userAddress = this.connectionToUser.get(conn.id);
    if (!userAddress) {
      this.send(conn, { type: "ERROR", message: "Not logged in" });
      return;
    }

    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      this.send(conn, { type: "ERROR", message: "Challenge not found" });
      return;
    }

    // Verify this user is the challenged one
    if (challenge.challenged.lensAddress !== userAddress) {
      this.send(conn, { type: "ERROR", message: "You cannot accept this challenge" });
      return;
    }

    if (challenge.status !== "PENDING") {
      this.send(conn, { type: "ERROR", message: "Challenge is no longer pending" });
      return;
    }

    this.acceptChallenge(challengeId);
  }

  private acceptChallenge(challengeId: string) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return;

    // Clear timeout
    const timer = this.challengeTimers.get(challengeId);
    if (timer) {
      clearTimeout(timer);
      this.challengeTimers.delete(challengeId);
    }

    // Update challenge status
    challenge.status = "ACCEPTED";

    // Generate room code
    const roomCode = generateRoomCode();

    // Update user states to IN_GAME
    this.updateUserState(challenge.challenger.lensAddress, "IN_GAME");
    this.updateUserState(challenge.challenged.lensAddress, "IN_GAME");

    // Notify both players
    const challengerConn = this.getConnectionByAddress(challenge.challenger.lensAddress);
    const challengedConn = this.getConnectionByAddress(challenge.challenged.lensAddress);

    if (challengerConn) {
      this.send(challengerConn, {
        type: "CHALLENGE_ACCEPTED",
        challengeId,
        roomCode,
      });
      this.send(challengerConn, {
        type: "START_GAME",
        roomCode,
        opponent: challenge.challenged,
      });
    }

    if (challengedConn) {
      this.send(challengedConn, {
        type: "START_GAME",
        roomCode,
        opponent: challenge.challenger,
      });
    }

    // Clean up challenge
    this.challenges.delete(challengeId);

    this.saveState();
  }

  private handleDeclineChallenge(conn: Party.Connection, challengeId: string) {
    const userAddress = this.connectionToUser.get(conn.id);
    if (!userAddress) {
      this.send(conn, { type: "ERROR", message: "Not logged in" });
      return;
    }

    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      this.send(conn, { type: "ERROR", message: "Challenge not found" });
      return;
    }

    // Verify this user is the challenged one
    if (challenge.challenged.lensAddress !== userAddress) {
      this.send(conn, { type: "ERROR", message: "You cannot decline this challenge" });
      return;
    }

    if (challenge.status !== "PENDING") {
      this.send(conn, { type: "ERROR", message: "Challenge is no longer pending" });
      return;
    }

    // Clear timeout
    const timer = this.challengeTimers.get(challengeId);
    if (timer) {
      clearTimeout(timer);
      this.challengeTimers.delete(challengeId);
    }

    // Update challenge status
    challenge.status = "DECLINED";

    // Reset user states
    this.updateUserState(challenge.challenger.lensAddress, "ONLINE");
    this.updateUserState(challenge.challenged.lensAddress, "ONLINE");

    // Notify challenger
    const challengerConn = this.getConnectionByAddress(challenge.challenger.lensAddress);
    if (challengerConn) {
      this.send(challengerConn, { type: "CHALLENGE_DECLINED", challengeId });
    }

    // Clean up challenge
    this.challenges.delete(challengeId);

    this.saveState();
  }

  private handleCancelChallenge(conn: Party.Connection, challengeId: string) {
    const userAddress = this.connectionToUser.get(conn.id);
    if (!userAddress) {
      this.send(conn, { type: "ERROR", message: "Not logged in" });
      return;
    }

    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      this.send(conn, { type: "ERROR", message: "Challenge not found" });
      return;
    }

    // Verify this user is the challenger
    if (challenge.challenger.lensAddress !== userAddress) {
      this.send(conn, { type: "ERROR", message: "You cannot cancel this challenge" });
      return;
    }

    if (challenge.status !== "PENDING") {
      this.send(conn, { type: "ERROR", message: "Challenge is no longer pending" });
      return;
    }

    // Clear timeout
    const timer = this.challengeTimers.get(challengeId);
    if (timer) {
      clearTimeout(timer);
      this.challengeTimers.delete(challengeId);
    }

    // Update challenge status
    challenge.status = "CANCELLED";

    // Reset user states
    this.updateUserState(challenge.challenger.lensAddress, "ONLINE");
    this.updateUserState(challenge.challenged.lensAddress, "ONLINE");

    // Notify challenged user
    const challengedConn = this.getConnectionByAddress(challenge.challenged.lensAddress);
    if (challengedConn) {
      this.send(challengedConn, { type: "CHALLENGE_CANCELLED", challengeId });
    }

    // Clean up challenge
    this.challenges.delete(challengeId);

    this.saveState();
  }

  private expireChallenge(challengeId: string) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== "PENDING") return;

    challenge.status = "EXPIRED";

    // Reset user states
    this.updateUserState(challenge.challenger.lensAddress, "ONLINE");
    this.updateUserState(challenge.challenged.lensAddress, "ONLINE");

    // Notify both users
    const challengerConn = this.getConnectionByAddress(challenge.challenger.lensAddress);
    const challengedConn = this.getConnectionByAddress(challenge.challenged.lensAddress);

    if (challengerConn) {
      this.send(challengerConn, { type: "CHALLENGE_EXPIRED", challengeId });
    }
    if (challengedConn) {
      this.send(challengedConn, { type: "CHALLENGE_EXPIRED", challengeId });
    }

    // Clean up
    this.challenges.delete(challengeId);
    this.challengeTimers.delete(challengeId);

    this.saveState();
  }

  private cancelUserChallenges(lensAddress: string) {
    for (const [challengeId, challenge] of this.challenges) {
      if (
        challenge.status === "PENDING" &&
        (challenge.challenger.lensAddress === lensAddress ||
          challenge.challenged.lensAddress === lensAddress)
      ) {
        // Clear timeout
        const timer = this.challengeTimers.get(challengeId);
        if (timer) {
          clearTimeout(timer);
          this.challengeTimers.delete(challengeId);
        }

        challenge.status = "CANCELLED";

        // Reset the other user's state and notify them
        const otherAddress =
          challenge.challenger.lensAddress === lensAddress
            ? challenge.challenged.lensAddress
            : challenge.challenger.lensAddress;

        this.updateUserState(otherAddress, "ONLINE");

        const otherConn = this.getConnectionByAddress(otherAddress);
        if (otherConn) {
          this.send(otherConn, { type: "CHALLENGE_CANCELLED", challengeId });
        }

        this.challenges.delete(challengeId);
      }
    }
  }

  private findMutualChallenge(
    address1: string,
    address2: string
  ): Challenge | undefined {
    for (const challenge of this.challenges.values()) {
      if (
        challenge.status === "PENDING" &&
        challenge.challenger.lensAddress === address2 &&
        challenge.challenged.lensAddress === address1
      ) {
        return challenge;
      }
    }
    return undefined;
  }

  private findPendingChallengeFrom(lensAddress: string): Challenge | undefined {
    for (const challenge of this.challenges.values()) {
      if (
        challenge.status === "PENDING" &&
        challenge.challenger.lensAddress === lensAddress
      ) {
        return challenge;
      }
    }
    return undefined;
  }

  private updateUserState(lensAddress: string, state: LobbyUserState) {
    const user = this.users.get(lensAddress);
    if (user) {
      user.state = state;
      this.broadcast({
        type: "USER_STATE_CHANGED",
        lensAddress,
        state,
      });
    }
  }

  private getOnlineUsers(excludeAddress?: string): LobbyUser[] {
    const users: LobbyUser[] = [];
    for (const user of this.users.values()) {
      if (excludeAddress && user.lensAddress === excludeAddress) continue;
      users.push(user);
    }
    return users;
  }

  private getConnectionByAddress(lensAddress: string): Party.Connection | undefined {
    for (const [connId, addr] of this.connectionToUser) {
      if (addr === lensAddress) {
        return this.connections.get(connId);
      }
    }
    return undefined;
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private send(conn: Party.Connection, message: LobbyServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private broadcast(message: LobbyServerMessage) {
    const msg = JSON.stringify(message);
    for (const conn of this.connections.values()) {
      conn.send(msg);
    }
  }

  private broadcastExcept(excludeConnId: string, message: LobbyServerMessage) {
    const msg = JSON.stringify(message);
    for (const [connId, conn] of this.connections) {
      if (connId !== excludeConnId) {
        conn.send(msg);
      }
    }
  }

  private async saveState() {
    // Save users as array for JSON serialization
    await this.room.storage.put("users", Array.from(this.users.entries()));
  }
}
