// ===========================================
// Game Constants
// ===========================================

// Mana
export const MAX_MANA = 10;
export const STARTING_MANA = 0;

// Health
export const STARTING_HEALTH = 30;
export const MAX_HEALTH = 30;

// Board
export const MAX_BOARD_SIZE = 7;

// Hand
export const MAX_HAND_SIZE = 10;
export const STARTING_HAND_SIZE = 3;
export const OPPONENT_STARTING_HAND_SIZE = 4; // Opponent goes second, gets extra card

// Deck
export const DECK_SIZE = 15; // Smaller deck for faster games

// Combat
export const FATIGUE_START_DAMAGE = 1;

// Windfury
export const WINDFURY_ATTACKS = 2;
export const NORMAL_ATTACKS = 1;

// Animation Durations (ms)
export const ANIMATION_CARD_PLAY = 400;
export const ANIMATION_ATTACK = 500;
export const ANIMATION_DAMAGE = 300;
export const ANIMATION_HEAL = 300;
export const ANIMATION_DEATH = 400;
export const ANIMATION_BUFF = 300;
export const ANIMATION_SUMMON = 400;
export const ANIMATION_DRAW = 300;
export const ANIMATION_TURN_START = 600;

// AI Delays (ms) - base values for MEDIUM difficulty
export const AI_THINK_DELAY = 800;
export const AI_ACTION_DELAY = 600;
export const AI_TURN_END_DELAY = 500;

// AI Difficulty settings
export type AIDifficultyType = 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE' | 'MAXIMUM_HELL';

export const AI_DIFFICULTY_CONFIG = {
  EASY: {
    priorityMultiplier: 0.5,
    suboptimalChance: 0.3, // 30% chance to pick suboptimal move
    thinkDelay: 1200,
    actionDelay: 800,
  },
  MEDIUM: {
    priorityMultiplier: 1.0,
    suboptimalChance: 0,
    thinkDelay: 800,
    actionDelay: 600,
  },
  HARD: {
    priorityMultiplier: 1.3,
    suboptimalChance: 0,
    thinkDelay: 500,
    actionDelay: 400,
  },
  NIGHTMARE: {
    priorityMultiplier: 2.0,
    suboptimalChance: 0,
    thinkDelay: 300,
    actionDelay: 250,
    // Advanced AI features
    threatAssessment: true,
    lethalCalculation: 'FULL', // Considers minions + weapon + spells
    boardAwareness: true,
    manaEfficiency: true,
    spellConservation: true,
  },
  MAXIMUM_HELL: {
    priorityMultiplier: 3.0, // Absolutely ruthless priority
    suboptimalChance: 0,
    thinkDelay: 100, // Lightning fast - no mercy
    actionDelay: 100,
    // All advanced features maxed out
    threatAssessment: true,
    lethalCalculation: 'PERFECT', // Calculates ALL possible lethal paths
    boardAwareness: true,
    manaEfficiency: true,
    spellConservation: true,
    // MAXIMUM HELL exclusive features
    aggressionBonus: 1.5, // Extra face damage priority
    tradeEfficiency: 2.0, // Values efficient trades even more
    keywordPriority: 2.0, // Extra value for dangerous keywords
  },
} as const;

// NIGHTMARE AI evaluation weights
export const THREAT_WEIGHTS = {
  BASE_ATTACK: 3,
  BASE_HEALTH: 1.5,
  TAUNT: 15,
  DIVINE_SHIELD: 12,
  WINDFURY: 20, // Very dangerous - double damage
  LIFESTEAL: 10,
  RUSH: 5,
  HIGH_ATTACK_BONUS: 8, // Bonus for 4+ attack
  LOW_HEALTH_BONUS: 5, // Bonus for being easy to kill
} as const;

export const MANA_EFFICIENCY = {
  PERFECT_CURVE_BONUS: 25, // Using all mana
  NEAR_PERFECT_BONUS: 15, // 1 mana leftover
  WASTED_MANA_PENALTY: -5, // Per unused mana
} as const;

export function getAIDelays(difficulty: AIDifficultyType): { thinkDelay: number; actionDelay: number } {
  const config = AI_DIFFICULTY_CONFIG[difficulty];
  return {
    thinkDelay: config.thinkDelay,
    actionDelay: config.actionDelay,
  };
}

// Token minion defaults
export const TOKEN_NAME = 'Token';
export const TOKEN_IMAGE = '/cards/token.png';

// Feature Flags
export const ENABLE_TUTORIAL_MUSIC = false;
