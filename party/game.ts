import type * as Party from "partykit/server";
import {
  GameState,
  GameAction,
  Card,
  PlayerTurn,
  MinionInstance,
  Keyword,
} from "../lib/game/types";
import { gameReducer, createInitialGameState } from "../lib/game/reducer";
import { createDeck, shuffleArray } from "../lib/game/utils";
import { executeSpellEffect, executeBattlecry } from "../lib/game/effects";
import {
  ClientMessage,
  ServerMessage,
  ServerGameState,
  PlayerInfo,
  PlayerRole,
  RoomStatus,
  generateRoomCode,
  toClientGameState,
  isValidAction,
  MultiplayerGameAction,
} from "../lib/game/multiplayer-types";

// Default cards for multiplayer (loaded from environment or hardcoded)
// In production, these would come from a database or API
const DEFAULT_CARDS: Card[] = [];

// Room timeout in milliseconds (10 minutes of inactivity)
const ROOM_TIMEOUT = 10 * 60 * 1000;

// Turn timeout (60 seconds per turn)
const TURN_TIMEOUT = 60 * 1000;

export default class GameServer implements Party.Server {
  private serverState: ServerGameState | null = null;
  private connections: Map<string, Party.Connection> = new Map();
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private cards: Card[] = [];
  constructor(readonly room: Party.Room) {}

  // Load cards when the room starts
  async onStart() {
    // Try to load cards from storage or use defaults
    const storedCards = await this.room.storage.get<Card[]>("cards");
    if (storedCards) {
      this.cards = storedCards;
    }

    // Load existing game state if any
    const storedState = await this.room.storage.get<ServerGameState>("gameState");
    if (storedState) {
      // Reconstruct keyword Sets from arrays (JSON serialization converts Sets to arrays)
      this.serverState = this.reconstructKeywordSets(storedState);
    }
  }

  // Reconstruct keyword Sets from arrays after loading from storage
  private reconstructKeywordSets(state: ServerGameState): ServerGameState {
    return {
      ...state,
      gameState: {
        ...state.gameState,
        player: {
          ...state.gameState.player,
          board: state.gameState.player.board.map((m) => ({
            ...m,
            keywords: new Set(m.keywords as unknown as Keyword[]),
          })),
        },
        opponent: {
          ...state.gameState.opponent,
          board: state.gameState.opponent.board.map((m) => ({
            ...m,
            keywords: new Set(m.keywords as unknown as Keyword[]),
          })),
        },
      },
    };
  }

  // Handle new connections
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.connections.set(conn.id, conn);

    // Reset inactivity timer
    this.resetInactivityTimer();

    // Send current room info if game exists
    if (this.serverState) {
      const playerRole = this.getPlayerRole(conn.id);
      if (playerRole) {
        // Reconnecting player
        const clientState = toClientGameState(this.serverState, playerRole);
        this.send(conn, { type: "GAME_STATE", state: clientState });

        // Notify opponent of reconnection
        this.broadcastToOther(conn.id, { type: "OPPONENT_RECONNECTED" });
      } else {
        // New player trying to join existing game
        this.send(conn, {
          type: "ROOM_INFO",
          room: {
            roomCode: this.serverState.roomCode,
            status: this.serverState.status,
            player1: this.serverState.player1 || undefined,
            player2: this.serverState.player2 || undefined,
            createdAt: this.serverState.createdAt,
          },
        });
      }
    }
  }

  // Handle disconnections
  onClose(conn: Party.Connection) {
    this.connections.delete(conn.id);

    if (this.serverState) {
      // Mark player as disconnected
      if (this.serverState.player1?.connectionId === conn.id) {
        this.serverState.player1.isConnected = false;
        this.broadcastToOther(conn.id, { type: "OPPONENT_DISCONNECTED" });
      } else if (this.serverState.player2?.connectionId === conn.id) {
        this.serverState.player2.isConnected = false;
        this.broadcastToOther(conn.id, { type: "OPPONENT_DISCONNECTED" });
      }

      this.saveState();
    }
  }

  // Handle incoming messages
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message);

      this.resetInactivityTimer();

      switch (msg.type) {
        case "JOIN":
          await this.handleJoin(sender, msg);
          break;
        case "READY":
          await this.handleReady(sender);
          break;
        case "ACTION":
          await this.handleAction(sender, msg.action);
          break;
        case "PING":
          this.send(sender, { type: "PONG" });
          break;
      }
    } catch (error) {
      console.error(`[Room ${this.room.id}] Error handling message:`, error);
      this.send(sender, {
        type: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Handle player joining
  private async handleJoin(
    conn: Party.Connection,
    msg: Extract<ClientMessage, { type: "JOIN" }>
  ) {
    // Initialize room if needed
    if (!this.serverState) {
      this.serverState = {
        gameState: createInitialGameState("MEDIUM"),
        roomCode: this.room.id,
        status: "waiting",
        player1: null,
        player2: null,
        currentTurn: "player1",
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        turnStartedAt: 0,
      };
    }

    const playerInfo: PlayerInfo = {
      connectionId: conn.id,
      lensAddress: msg.lensAddress,
      lensHandle: msg.lensHandle,
      lensAvatar: msg.lensAvatar,
      role: "player1",
      isConnected: true,
    };

    // Check if this player is reconnecting
    if (
      this.serverState.player1?.lensAddress === msg.lensAddress
    ) {
      this.serverState.player1 = {
        ...this.serverState.player1,
        connectionId: conn.id,
        isConnected: true,
      };

      if (this.serverState.status === "playing") {
        const clientState = toClientGameState(this.serverState, "player1");
        this.send(conn, { type: "GAME_STATE", state: clientState });
      }
      return;
    }

    if (
      this.serverState.player2?.lensAddress === msg.lensAddress
    ) {
      this.serverState.player2 = {
        ...this.serverState.player2,
        connectionId: conn.id,
        isConnected: true,
      };

      if (this.serverState.status === "playing") {
        const clientState = toClientGameState(this.serverState, "player2");
        this.send(conn, { type: "GAME_STATE", state: clientState });
      }
      return;
    }

    // Assign as player 1 or player 2
    if (!this.serverState.player1) {
      playerInfo.role = "player1";
      this.serverState.player1 = playerInfo;
      this.send(conn, { type: "WAITING_FOR_OPPONENT" });
    } else if (!this.serverState.player2) {
      playerInfo.role = "player2";
      this.serverState.player2 = playerInfo;
      // Notify player 1 that opponent joined
      const player1Conn = this.connections.get(
        this.serverState.player1.connectionId
      );
      if (player1Conn) {
        this.send(player1Conn, {
          type: "OPPONENT_JOINED",
          opponentInfo: playerInfo,
        });
      }

      // Notify player 2 about player 1
      this.send(conn, {
        type: "OPPONENT_JOINED",
        opponentInfo: this.serverState.player1,
      });

      // Both players joined - start the game
      await this.startGame();
    } else {
      // Room is full
      this.send(conn, { type: "ERROR", message: "Room is full" });
      return;
    }

    this.saveState();
  }

  // Handle player ready
  private async handleReady(conn: Party.Connection) {
    // For now, ready is automatic when both players join
  }

  // Handle game actions
  private async handleAction(
    conn: Party.Connection,
    action: MultiplayerGameAction
  ) {
    if (!this.serverState || this.serverState.status !== "playing") {
      this.send(conn, { type: "INVALID_ACTION", reason: "Game not in progress" });
      return;
    }

    // Determine which player sent the action
    const playerRole = this.getPlayerRole(conn.id);
    if (!playerRole) {
      this.send(conn, { type: "INVALID_ACTION", reason: "Not a player" });
      return;
    }

    // Validate the action
    const validation = isValidAction(
      action,
      this.serverState.gameState,
      playerRole
    );
    if (!validation.valid) {
      this.send(conn, { type: "INVALID_ACTION", reason: validation.reason || "Invalid action" });
      return;
    }

    // For PLAY_CARD, find the card BEFORE applying the action (it will be removed from hand)
    let playedCard: Card | null = null;
    if (action.type === "PLAY_CARD") {
      // Determine which player's hand to look in based on role
      const playerState = playerRole === "player1"
        ? this.serverState.gameState.player
        : this.serverState.gameState.opponent;
      const cardInstance = playerState.hand.find(
        (c) => c.instanceId === action.instanceId
      );
      if (cardInstance) {
        playedCard = cardInstance.card;
      }
    }

    // Apply the action to game state
    const gameAction = this.translateAction(action, playerRole);
    const newGameState = gameReducer(this.serverState.gameState, gameAction);
    this.serverState.gameState = newGameState;
    this.serverState.lastActivityAt = Date.now();

    // Execute spell/battlecry effects for PLAY_CARD
    if (action.type === "PLAY_CARD" && playedCard) {
      // Determine the owner from server perspective
      // player1 = 'player', player2 = 'opponent' in server state
      const sourceOwner: PlayerTurn = playerRole === "player1" ? "player" : "opponent";

      // Translate targetId for player2 (their targets reference "opponent" but server sees them differently)
      let effectTargetId = action.targetId;
      if (playerRole === "player2" && effectTargetId) {
        if (effectTargetId === "hero_opponent") effectTargetId = "hero_player";
        else if (effectTargetId === "hero_player") effectTargetId = "hero_opponent";
      }

      // Execute spell effect
      if (playedCard.cardType === "SPELL" && playedCard.spellEffect) {
        const effectActions = executeSpellEffect(
          this.serverState.gameState,
          playedCard.spellEffect,
          sourceOwner,
          effectTargetId
        );
        // Apply each effect action
        for (const effectAction of effectActions) {
          this.serverState.gameState = gameReducer(
            this.serverState.gameState,
            effectAction
          );
        }
      }

      // Execute battlecry for minions
      if (playedCard.cardType === "MINION" && playedCard.minionEffect) {
        const effectActions = executeBattlecry(
          this.serverState.gameState,
          playedCard.minionEffect,
          sourceOwner,
          action.instanceId,
          effectTargetId
        );
        // Apply each effect action
        for (const effectAction of effectActions) {
          this.serverState.gameState = gameReducer(
            this.serverState.gameState,
            effectAction
          );
        }
      }
    }

    // Check for end turn
    if (action.type === "END_TURN") {
      // Trigger START_TURN for next player
      this.serverState.gameState = gameReducer(this.serverState.gameState, {
        type: "START_TURN",
      });
      this.serverState.currentTurn =
        this.serverState.currentTurn === "player1" ? "player2" : "player1";
      this.serverState.turnStartedAt = Date.now();
      this.startTurnTimer();
    }

    // Check for deaths
    this.serverState.gameState = gameReducer(this.serverState.gameState, {
      type: "CHECK_DEATHS",
    });

    // Check for game over
    if (this.serverState.gameState.phase === "GAME_OVER") {
      this.serverState.status = "finished";
      const winner = this.serverState.gameState.winner;
      const winnerRole: PlayerRole = winner === "player" ? "player1" : "player2";

      // Send game over to each player with their correct perspective
      this.broadcastGameState();

      if (this.serverState.player1) {
        const conn = this.connections.get(this.serverState.player1.connectionId);
        if (conn) {
          this.send(conn, {
            type: "GAME_OVER",
            winner: winnerRole,
            state: toClientGameState(this.serverState, "player1"),
          });
        }
      }

      if (this.serverState.player2) {
        const conn = this.connections.get(this.serverState.player2.connectionId);
        if (conn) {
          this.send(conn, {
            type: "GAME_OVER",
            winner: winnerRole,
            state: toClientGameState(this.serverState, "player2"),
          });
        }
      }

      this.clearTurnTimer();
    } else {
      // Broadcast updated state to both players
      this.broadcastGameState();
    }

    this.saveState();
  }

  // Start the game
  private async startGame() {
    if (!this.serverState?.player1 || !this.serverState?.player2) {
      return;
    }

    // Verify both connections are still alive
    const player1Conn = this.connections.get(this.serverState.player1.connectionId);
    const player2Conn = this.connections.get(this.serverState.player2.connectionId);

    if (!player1Conn || !player2Conn) {
      this.broadcastError("A player disconnected before the game could start");
      return;
    }

    // Load cards from storage or fetch them
    let cards = await this.room.storage.get<Card[]>("cards");

    if (!cards || cards.length === 0) {
      // Fetch cards from static JSON file (avoids Vercel's API bot protection)
      const appUrl = (this.room.env.APP_URL as string) || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${appUrl}/all-cards.json`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LensHearthstone/1.0)",
            "Accept": "application/json",
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          cards = await response.json();
          await this.room.storage.put("cards", cards);
        } else {
          this.broadcastError(`Failed to load game cards (HTTP ${response.status})`);
          return;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.broadcastError(`Failed to load game cards: ${errorMessage}`);
        return;
      }
    }

    if (!cards || cards.length < 30) {
      this.broadcastError(`Not enough cards to start game (have: ${cards?.length || 0}, need: 30)`);
      return;
    }

    // Shuffle and split cards into two decks
    const shuffledCards = shuffleArray(cards);
    const midpoint = Math.floor(shuffledCards.length / 2);
    const player1Deck = shuffledCards.slice(0, midpoint);
    const player2Deck = shuffledCards.slice(midpoint);

    // Start the game
    let gameState = createInitialGameState("MEDIUM");
    gameState = gameReducer(gameState, {
      type: "START_GAME",
      playerDeck: player1Deck,
      opponentDeck: player2Deck,
      difficulty: "MEDIUM",
    });

    this.serverState.gameState = gameState;
    this.serverState.status = "playing";
    this.serverState.currentTurn = "player1";
    this.serverState.turnStartedAt = Date.now();

    // Broadcast game start
    this.broadcastGameState();
    this.startTurnTimer();
    this.saveState();

  }

  // Translate action based on player role
  private translateAction(
    action: MultiplayerGameAction,
    playerRole: PlayerRole
  ): GameAction {
    // Player1's perspective matches server state, no translation needed
    if (playerRole === "player1") {
      return action as GameAction;
    }

    // Player2 needs perspective swapped for hero references
    // Their "opponent" is server's "player", their "player" is server's "opponent"
    const swapHeroId = (id: string): string => {
      if (id === "hero_opponent") return "hero_player";
      if (id === "hero_player") return "hero_opponent";
      return id;
    };

    if (action.type === "HERO_ATTACK") {
      return { ...action, targetId: swapHeroId(action.targetId) } as GameAction;
    }

    if (action.type === "ATTACK") {
      return { ...action, targetId: swapHeroId(action.targetId) } as GameAction;
    }

    return action as GameAction;
  }

  // Get player role from connection ID
  private getPlayerRole(connectionId: string): PlayerRole | null {
    if (!this.serverState) return null;
    if (this.serverState.player1?.connectionId === connectionId) return "player1";
    if (this.serverState.player2?.connectionId === connectionId) return "player2";
    return null;
  }

  // Broadcast game state to both players
  private broadcastGameState() {
    if (!this.serverState) {
      return;
    }

    // Send appropriate state to each player
    if (this.serverState.player1) {
      const conn = this.connections.get(this.serverState.player1.connectionId);
      if (conn) {
        const state = toClientGameState(this.serverState, "player1");
        this.send(conn, { type: "GAME_STATE", state });
      }
    }

    if (this.serverState.player2) {
      const conn = this.connections.get(this.serverState.player2.connectionId);
      if (conn) {
        const state = toClientGameState(this.serverState, "player2");
        this.send(conn, { type: "GAME_STATE", state });
      }
    }
  }

  // Send message to a connection
  private send(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  // Broadcast to all connections
  private broadcast(message: ServerMessage) {
    const msg = JSON.stringify(message);
    for (const conn of this.connections.values()) {
      conn.send(msg);
    }
  }

  // Broadcast to all except one
  private broadcastToOther(excludeId: string, message: ServerMessage) {
    const msg = JSON.stringify(message);
    for (const [id, conn] of this.connections) {
      if (id !== excludeId) {
        conn.send(msg);
      }
    }
  }

  // Broadcast error to all connected players
  private broadcastError(message: string) {
    for (const conn of this.connections.values()) {
      this.send(conn, { type: "ERROR", message });
    }
  }

  // Save state to storage
  private async saveState() {
    if (this.serverState) {
      // Convert Set to Array for JSON serialization
      const stateToSave = {
        ...this.serverState,
        gameState: {
          ...this.serverState.gameState,
          player: {
            ...this.serverState.gameState.player,
            board: this.serverState.gameState.player.board.map((m) => ({
              ...m,
              keywords: Array.from(m.keywords),
            })),
          },
          opponent: {
            ...this.serverState.gameState.opponent,
            board: this.serverState.gameState.opponent.board.map((m) => ({
              ...m,
              keywords: Array.from(m.keywords),
            })),
          },
        },
      };
      await this.room.storage.put("gameState", stateToSave);
    }
  }

  // Turn timer
  private startTurnTimer() {
    this.clearTurnTimer();
    this.turnTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, TURN_TIMEOUT);
  }

  private clearTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private handleTurnTimeout() {
    if (!this.serverState || this.serverState.status !== "playing") return;

    // Auto-end turn for current player
    this.serverState.gameState = gameReducer(this.serverState.gameState, {
      type: "END_TURN",
    });
    this.serverState.gameState = gameReducer(this.serverState.gameState, {
      type: "START_TURN",
    });
    this.serverState.currentTurn =
      this.serverState.currentTurn === "player1" ? "player2" : "player1";
    this.serverState.turnStartedAt = Date.now();

    this.broadcastGameState();
    this.startTurnTimer();
    this.saveState();
  }

  // Inactivity timer
  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, ROOM_TIMEOUT);
  }

  private handleInactivityTimeout() {
    // Clean up the room
    this.serverState = null;
    this.clearTurnTimer();
    this.room.storage.deleteAll();
  }
}
