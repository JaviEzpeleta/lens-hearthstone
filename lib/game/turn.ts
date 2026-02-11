import { GameState, GameAction, PlayerTurn } from './types';
import { getOtherPlayer } from './utils';

/**
 * Creates the START_TURN action
 */
export function createStartTurnAction(): GameAction {
  return { type: 'START_TURN' };
}

/**
 * Creates the END_TURN action
 */
export function createEndTurnAction(): GameAction {
  return { type: 'END_TURN' };
}

/**
 * Checks if the current player can end their turn
 */
export function canEndTurn(state: GameState): boolean {
  return state.phase === 'PLAYING';
}

/**
 * Gets the current turn's player state
 */
export function getCurrentPlayer(state: GameState) {
  return state.turn === 'player' ? state.player : state.opponent;
}

/**
 * Gets the waiting player's state
 */
export function getWaitingPlayer(state: GameState) {
  return state.turn === 'player' ? state.opponent : state.player;
}

/**
 * Determines if it's the specified player's turn
 */
export function isPlayerTurn(state: GameState, player: PlayerTurn): boolean {
  return state.turn === player && state.phase === 'PLAYING';
}
