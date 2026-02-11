import { GameState, GameAction, CardInstance, MinionInstance, WeaponInstance, PlayerTurn, Keyword } from './types';

// ===========================================
// Room and Connection Types
// ===========================================

export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type PlayerRole = 'player1' | 'player2';

export interface RoomInfo {
  roomCode: string;
  status: RoomStatus;
  player1?: PlayerInfo;
  player2?: PlayerInfo;
  createdAt: number;
}

export interface PlayerInfo {
  connectionId: string;
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
  role: PlayerRole;
  isConnected: boolean;
}

// ===========================================
// Client Game State (Fog of War)
// ===========================================

// Hidden card back (opponent's hand)
export interface HiddenCard {
  instanceId: string;
  // No card data - just a card back
}

// Serialized minion instance (keywords as array for JSON serialization)
export interface SerializedMinionInstance extends Omit<MinionInstance, 'keywords'> {
  keywords: Keyword[];
}

// Client-side player state (what each player sees)
export interface ClientPlayerState {
  health: number;
  maxHealth: number;
  armor: number;
  maxMana: number;
  currentMana: number;
  hand: CardInstance[] | HiddenCard[]; // Full cards for self, hidden for opponent
  deckCount: number; // Just the count, not actual cards
  board: SerializedMinionInstance[]; // Keywords serialized as arrays for JSON
  weapon: WeaponInstance | null;
  canAttackWithHero: boolean;
  heroAttacksThisTurn: number;
}

// Full client game state sent to players
export interface ClientGameState {
  phase: 'WAITING' | 'PLAYING' | 'GAME_OVER';
  turn: PlayerTurn;
  turnNumber: number;

  // Your state (full visibility)
  you: ClientPlayerState;
  // Opponent state (limited visibility - hand hidden)
  opponent: ClientPlayerState;

  // Your role in the game
  yourRole: PlayerRole;

  // Winner info (if game over)
  winner: PlayerRole | null;

  // Targeting state
  targeting: GameState['targeting'];
  selectedCard: string | null;
  selectedMinion: string | null;

  // Opponent info
  opponentInfo: {
    lensAddress: string;
    lensHandle?: string;
    lensAvatar?: string;
  } | null;
}

// ===========================================
// WebSocket Messages: Client → Server
// ===========================================

export type ClientMessage =
  | { type: 'JOIN'; lensAddress: string; lensHandle?: string; lensAvatar?: string }
  | { type: 'ACTION'; action: MultiplayerGameAction }
  | { type: 'READY' } // Player is ready to start
  | { type: 'PING' };

// ===========================================
// WebSocket Messages: Server → Client
// ===========================================

export type ServerMessage =
  | { type: 'ROOM_INFO'; room: RoomInfo }
  | { type: 'WAITING_FOR_OPPONENT' }
  | { type: 'OPPONENT_JOINED'; opponentInfo: PlayerInfo }
  | { type: 'GAME_START'; state: ClientGameState }
  | { type: 'GAME_STATE'; state: ClientGameState }
  | { type: 'INVALID_ACTION'; reason: string }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'OPPONENT_RECONNECTED' }
  | { type: 'GAME_OVER'; winner: PlayerRole; state: ClientGameState }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' };

// ===========================================
// Multiplayer Game Actions
// ===========================================

// Actions that can be sent over the network
export type MultiplayerGameAction =
  | { type: 'END_TURN' }
  | { type: 'SELECT_CARD'; instanceId: string }
  | { type: 'DESELECT_CARD' }
  | { type: 'PLAY_CARD'; instanceId: string; position?: number; targetId?: string }
  | { type: 'SELECT_MINION'; instanceId: string }
  | { type: 'DESELECT_MINION' }
  | { type: 'ATTACK'; attackerId: string; targetId: string }
  | { type: 'HERO_ATTACK'; targetId: string };

// ===========================================
// Server-side Game State
// ===========================================

export interface ServerGameState {
  // Full game state (server sees everything)
  gameState: GameState;

  // Room info
  roomCode: string;
  status: RoomStatus;

  // Players
  player1: PlayerInfo | null;
  player2: PlayerInfo | null;

  // Turn tracking
  currentTurn: PlayerRole;

  // Timing
  createdAt: number;
  lastActivityAt: number;
  turnStartedAt: number;
}

// ===========================================
// Room Code Generation
// ===========================================

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===========================================
// State Conversion Helpers
// ===========================================

/**
 * Convert full GameState to ClientGameState for a specific player
 * Hides opponent's hand cards and deck
 */
export function toClientGameState(
  serverState: ServerGameState,
  forPlayer: PlayerRole
): ClientGameState {
  const { gameState, player1, player2 } = serverState;

  // Determine which player state is "you" vs "opponent"
  const isPlayer1 = forPlayer === 'player1';
  const yourState = isPlayer1 ? gameState.player : gameState.opponent;
  const opponentState = isPlayer1 ? gameState.opponent : gameState.player;
  const opponentInfo = isPlayer1 ? player2 : player1;

  // Map to determine winner role
  const winnerRole: PlayerRole | null = gameState.winner
    ? (gameState.winner === 'player' ? 'player1' : 'player2')
    : null;

  return {
    phase: gameState.phase === 'GAME_OVER' ? 'GAME_OVER' : 'PLAYING',
    turn: gameState.turn,
    turnNumber: gameState.turnNumber,

    you: {
      health: yourState.health,
      maxHealth: yourState.maxHealth,
      armor: yourState.armor,
      maxMana: yourState.maxMana,
      currentMana: yourState.currentMana,
      hand: yourState.hand, // Full visibility
      deckCount: yourState.deck.length,
      board: yourState.board.map(m => ({
        ...m,
        keywords: Array.from(m.keywords),
      })),
      weapon: yourState.weapon,
      canAttackWithHero: yourState.canAttackWithHero,
      heroAttacksThisTurn: yourState.heroAttacksThisTurn,
    },

    opponent: {
      health: opponentState.health,
      maxHealth: opponentState.maxHealth,
      armor: opponentState.armor,
      maxMana: opponentState.maxMana,
      currentMana: opponentState.currentMana,
      hand: opponentState.hand.map(c => ({ instanceId: c.instanceId })), // Hidden cards
      deckCount: opponentState.deck.length,
      board: opponentState.board.map(m => ({
        ...m,
        keywords: Array.from(m.keywords),
      })),
      weapon: opponentState.weapon,
      canAttackWithHero: opponentState.canAttackWithHero,
      heroAttacksThisTurn: opponentState.heroAttacksThisTurn,
    },

    yourRole: forPlayer,
    winner: winnerRole,
    targeting: gameState.targeting,
    selectedCard: gameState.selectedCard,
    selectedMinion: gameState.selectedMinion,

    opponentInfo: opponentInfo ? {
      lensAddress: opponentInfo.lensAddress,
      lensHandle: opponentInfo.lensHandle,
      lensAvatar: opponentInfo.lensAvatar,
    } : null,
  };
}

/**
 * Validate if an action is valid for the current player
 */
export function isValidAction(
  action: MultiplayerGameAction,
  gameState: GameState,
  playerRole: PlayerRole
): { valid: boolean; reason?: string } {
  // Check if it's this player's turn
  const isPlayer1Turn = gameState.turn === 'player';
  const isMyTurn = (playerRole === 'player1' && isPlayer1Turn) ||
                   (playerRole === 'player2' && !isPlayer1Turn);

  if (!isMyTurn && action.type !== 'SELECT_CARD' && action.type !== 'DESELECT_CARD') {
    return { valid: false, reason: "Not your turn" };
  }

  if (gameState.phase !== 'PLAYING') {
    return { valid: false, reason: "Game is not in playing phase" };
  }

  // Additional validation based on action type
  switch (action.type) {
    case 'PLAY_CARD': {
      const player = playerRole === 'player1' ? gameState.player : gameState.opponent;
      const card = player.hand.find(c => c.instanceId === action.instanceId);
      if (!card) {
        return { valid: false, reason: "Card not in hand" };
      }
      if (card.card.manaCost > player.currentMana) {
        return { valid: false, reason: "Not enough mana" };
      }
      break;
    }

    case 'ATTACK': {
      const player = playerRole === 'player1' ? gameState.player : gameState.opponent;
      const attacker = player.board.find(m => m.instanceId === action.attackerId);
      if (!attacker) {
        return { valid: false, reason: "Attacker not found" };
      }
      if (!attacker.canAttack || attacker.hasAttacked) {
        return { valid: false, reason: "Minion cannot attack" };
      }
      break;
    }

    case 'HERO_ATTACK': {
      const player = playerRole === 'player1' ? gameState.player : gameState.opponent;
      if (!player.weapon) {
        return { valid: false, reason: "No weapon equipped" };
      }
      const heroMaxAttacks = player.weapon.card.keywords.includes('Windfury') ? 2 : 1;
      if (player.heroAttacksThisTurn >= heroMaxAttacks) {
        return { valid: false, reason: "Hero already used all attacks this turn" };
      }
      break;
    }
  }

  return { valid: true };
}

// ===========================================
// Deserialization Helpers
// ===========================================

/**
 * Convert SerializedMinionInstance back to MinionInstance
 * Converts keywords array back to Set for use with game components
 */
export function deserializeMinionInstance(
  serialized: SerializedMinionInstance
): MinionInstance {
  return {
    ...serialized,
    keywords: new Set(serialized.keywords),
  };
}

// ===========================================
// Action Translation
// ===========================================

/**
 * Translate a multiplayer action to a game action
 * Adjusts player/opponent references based on role
 */
export function translateAction(
  action: MultiplayerGameAction,
  playerRole: PlayerRole
): GameAction {
  // For player1, actions map directly
  // For player2, player/opponent are swapped in the game state,
  // so we need to translate some actions

  return action as GameAction;
}
