import { MinionInstance, Keyword } from './types';
import { WINDFURY_ATTACKS, NORMAL_ATTACKS } from './constants';

/**
 * Keyword descriptions for UI
 */
export const KEYWORD_DESCRIPTIONS: Record<Keyword, string> = {
  Taunt: 'Enemies must attack this minion.',
  Rush: 'Can attack enemy minions immediately.',
  'Divine Shield': 'The first time this takes damage, ignore it.',
  Lifesteal: 'Damage dealt also heals your hero.',
  Windfury: 'Can attack twice each turn.',
  Battlecry: 'Does something when you play it from your hand.',
};

/**
 * Keyword icons for UI
 */
export const KEYWORD_ICONS: Record<Keyword, string> = {
  Taunt: '🛡️',
  Rush: '🏃',
  'Divine Shield': '✨',
  Lifesteal: '💚',
  Windfury: '💨',
  Battlecry: '📢',
};

/**
 * Checks if minion has Taunt
 */
export function hasTaunt(minion: MinionInstance): boolean {
  return minion.keywords.has('Taunt');
}

/**
 * Checks if minion has Rush
 */
export function hasRush(minion: MinionInstance): boolean {
  return minion.keywords.has('Rush');
}

/**
 * Checks if minion has Divine Shield
 */
export function hasDivineShield(minion: MinionInstance): boolean {
  return minion.hasDivineShield;
}

/**
 * Checks if minion has Lifesteal
 */
export function hasLifesteal(minion: MinionInstance): boolean {
  return minion.keywords.has('Lifesteal');
}

/**
 * Checks if minion has Windfury
 */
export function hasWindfury(minion: MinionInstance): boolean {
  return minion.keywords.has('Windfury');
}

/**
 * Checks if minion has Battlecry
 */
export function hasBattlecry(minion: MinionInstance): boolean {
  return minion.keywords.has('Battlecry');
}

/**
 * Gets max attacks per turn based on Windfury
 */
export function getMaxAttacks(minion: MinionInstance): number {
  return hasWindfury(minion) ? WINDFURY_ATTACKS : NORMAL_ATTACKS;
}

/**
 * Checks if minion can attack on the turn it was played
 */
export function canAttackSameTurn(minion: MinionInstance): boolean {
  // Rush allows attacking minions (not heroes) on the same turn
  return hasRush(minion);
}

/**
 * Process Divine Shield - returns true if shield was consumed
 */
export function processDivineShield(minion: MinionInstance): boolean {
  if (minion.hasDivineShield) {
    return true; // Shield will be consumed
  }
  return false;
}

/**
 * Calculate Lifesteal healing amount
 */
export function calculateLifestealHealing(
  minion: MinionInstance,
  damageDealt: number
): number {
  if (!hasLifesteal(minion)) return 0;
  if (damageDealt <= 0) return 0;
  return damageDealt;
}

/**
 * Get remaining attacks for a minion this turn
 */
export function getRemainingAttacks(minion: MinionInstance): number {
  const maxAttacks = getMaxAttacks(minion);
  return Math.max(0, maxAttacks - minion.attacksThisTurn);
}

/**
 * Format keywords for display
 */
export function formatKeywords(keywords: Set<Keyword>): string {
  return Array.from(keywords)
    .map((k) => `${KEYWORD_ICONS[k]} ${k}`)
    .join(', ');
}

/**
 * Get keyword tooltip text
 */
export function getKeywordTooltip(keyword: Keyword): string {
  return `${KEYWORD_ICONS[keyword]} ${keyword}: ${KEYWORD_DESCRIPTIONS[keyword]}`;
}
