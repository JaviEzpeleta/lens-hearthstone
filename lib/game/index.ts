// Types
export * from './types';

// Constants
export * from './constants';

// Utils
export * from './utils';

// Reducer
export { gameReducer, createInitialGameState } from './reducer';

// Context
export { GameProvider, useGame } from './context';

// Turn management
export {
  createStartTurnAction,
  createEndTurnAction,
  canEndTurn,
  getCurrentPlayer,
  getWaitingPlayer,
  isPlayerTurn,
} from './turn';

// Card playing
export {
  canPlay,
  requiresTarget,
  getCardTargets,
  isValidTarget,
} from './play-card';

// Combat
export {
  canAttack,
  canAttackTarget,
  canHeroAttack,
  getHeroAttackTargets,
  calculateCombatResult,
  calculateHeroAttackResult,
  type CombatResult,
  type HeroAttackResult,
} from './combat';

// Keywords
export {
  KEYWORD_DESCRIPTIONS,
  KEYWORD_ICONS,
  hasTaunt as keywordHasTaunt,
  hasRush,
  hasDivineShield as keywordHasDivineShield,
  hasLifesteal,
  hasWindfury,
  hasBattlecry,
  getMaxAttacks,
  canAttackSameTurn,
  processDivineShield,
  calculateLifestealHealing,
  getRemainingAttacks,
  formatKeywords,
  getKeywordTooltip,
} from './keywords';

// Effects
export {
  executeEffect,
  executeSpellEffect,
  executeBattlecry,
  hasEffect,
  effectNeedsTarget,
} from './effects';

// AI
export {
  getAIDecisions,
  getBestDecision,
  executeAITurn,
} from './ai';
