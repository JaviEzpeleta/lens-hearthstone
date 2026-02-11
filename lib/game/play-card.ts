import {
  GameState,
  CardInstance,
  Card,
  EffectTarget,
  PlayerTurn,
} from './types';
import { canPlayCard, needsManualTarget } from './utils';
import { MAX_BOARD_SIZE } from './constants';

/**
 * Checks if a card in hand can be played
 */
export function canPlay(
  state: GameState,
  cardInstance: CardInstance
): { canPlay: boolean; reason?: string } {
  const player = state.turn === 'player' ? state.player : state.opponent;
  const card = cardInstance.card;

  if (!canPlayCard(player, card)) {
    if (player.currentMana < card.manaCost) {
      return { canPlay: false, reason: 'Not enough mana' };
    }
    if (card.cardType === 'MINION' && player.board.length >= MAX_BOARD_SIZE) {
      return { canPlay: false, reason: 'Board is full' };
    }
    return { canPlay: false, reason: 'Cannot play this card' };
  }

  return { canPlay: true };
}

/**
 * Determines if a card requires manual target selection
 */
export function requiresTarget(card: Card): boolean {
  // Spells with targeted effects
  if (card.cardType === 'SPELL' && card.spellEffect) {
    return needsManualTarget(card.spellEffect.target);
  }

  // Minions with battlecry that needs target
  if (card.cardType === 'MINION' && card.minionEffect) {
    if (card.minionEffect.trigger === 'BATTLECRY') {
      return card.minionEffect.effects.some((e) => needsManualTarget(e.target));
    }
  }

  return false;
}

/**
 * Gets valid targets for a card being played
 */
export function getCardTargets(
  state: GameState,
  card: Card,
  casterOwner: PlayerTurn
): string[] {
  let targetType: EffectTarget | undefined;

  if (card.cardType === 'SPELL' && card.spellEffect) {
    targetType = card.spellEffect.target;
  } else if (card.cardType === 'MINION' && card.minionEffect) {
    // Get target from first battlecry effect that needs targeting
    const targetedEffect = card.minionEffect.effects.find((e) =>
      needsManualTarget(e.target)
    );
    targetType = targetedEffect?.target;
  }

  if (!targetType || !needsManualTarget(targetType)) {
    return [];
  }

  const friendlyOwner = casterOwner;
  const enemyOwner = casterOwner === 'player' ? 'opponent' : 'player';
  const friendlyBoard =
    friendlyOwner === 'player' ? state.player.board : state.opponent.board;
  const enemyBoard =
    enemyOwner === 'player' ? state.player.board : state.opponent.board;

  switch (targetType) {
    case 'FRIENDLY_MINION':
      return friendlyBoard.map((m) => m.instanceId);
    case 'ENEMY_MINION':
      return enemyBoard.map((m) => m.instanceId);
    case 'ANY_CHARACTER':
      return [
        ...friendlyBoard.map((m) => m.instanceId),
        ...enemyBoard.map((m) => m.instanceId),
        `hero_${friendlyOwner}`,
        `hero_${enemyOwner}`,
      ];
    case 'ENEMY_HERO':
      return [`hero_${enemyOwner}`];
    case 'FRIENDLY_HERO':
      return [`hero_${friendlyOwner}`];
    default:
      return [];
  }
}

/**
 * Validates if a target is valid for a card
 */
export function isValidTarget(
  state: GameState,
  card: Card,
  targetId: string,
  casterOwner: PlayerTurn
): boolean {
  const validTargets = getCardTargets(state, card, casterOwner);
  return validTargets.includes(targetId);
}
