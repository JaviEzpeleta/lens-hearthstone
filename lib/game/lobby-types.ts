// ===========================================
// Lobby User Types
// ===========================================

export type LobbyUserState = 'ONLINE' | 'IN_GAME' | 'BUSY';

export interface LobbyUser {
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
  state: LobbyUserState;
  connectedAt: number;
}

// ===========================================
// Challenge Types
// ===========================================

export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface Challenge {
  id: string;
  challenger: LobbyUser;
  challenged: LobbyUser;
  status: ChallengeStatus;
  createdAt: number;
  expiresAt: number;
}

// ===========================================
// WebSocket Messages: Client → Server
// ===========================================

export type LobbyClientMessage =
  | { type: 'JOIN'; lensAddress: string; lensHandle?: string; lensAvatar?: string }
  | { type: 'LEAVE' }
  | { type: 'SEND_CHALLENGE'; targetAddress: string }
  | { type: 'ACCEPT_CHALLENGE'; challengeId: string }
  | { type: 'DECLINE_CHALLENGE'; challengeId: string }
  | { type: 'CANCEL_CHALLENGE'; challengeId: string }
  | { type: 'PING' };

// ===========================================
// WebSocket Messages: Server → Client
// ===========================================

export type LobbyServerMessage =
  | { type: 'USER_LIST'; users: LobbyUser[] }
  | { type: 'USER_JOINED'; user: LobbyUser }
  | { type: 'USER_LEFT'; lensAddress: string }
  | { type: 'USER_STATE_CHANGED'; lensAddress: string; state: LobbyUserState }
  | { type: 'CHALLENGE_RECEIVED'; challenge: Challenge }
  | { type: 'CHALLENGE_SENT'; challenge: Challenge }
  | { type: 'CHALLENGE_ACCEPTED'; challengeId: string; roomCode: string }
  | { type: 'CHALLENGE_DECLINED'; challengeId: string }
  | { type: 'CHALLENGE_EXPIRED'; challengeId: string }
  | { type: 'CHALLENGE_CANCELLED'; challengeId: string }
  | { type: 'START_GAME'; roomCode: string; opponent: LobbyUser }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' };

// ===========================================
// Constants
// ===========================================

export const CHALLENGE_TIMEOUT_MS = 30 * 1000; // 30 seconds
export const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
export const LOBBY_ROOM_ID = 'main-lobby'; // Single lobby room ID
