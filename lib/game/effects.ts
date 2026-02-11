import {
  GameState,
  GameAction,
  Effect,
  SpellEffect,
  MinionEffect,
  WeaponEffect,
  MinionInstance,
  PlayerTurn,
  Card,
} from './types';
import {
  getMinionsByOwner,
  pickRandom,
  generateInstanceId,
} from './utils';

/**
 * Executes an effect and returns the resulting actions
 */
export function executeEffect(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn,
  targetId?: string,
  sourceMinionId?: string
): GameAction[] {
  const actions: GameAction[] = [];

  switch (effect.effectType) {
    case 'BUFF':
      actions.push(...executeBuff(state, effect, sourceOwner, targetId, sourceMinionId));
      break;
    case 'DAMAGE':
      actions.push(...executeDamage(state, effect, sourceOwner, targetId));
      break;
    case 'HEAL':
      actions.push(...executeHeal(state, effect, sourceOwner, targetId));
      break;
    case 'DRAW':
      actions.push(...executeDraw(effect, sourceOwner));
      break;
    case 'SUMMON':
      actions.push(...executeSummon(state, effect, sourceOwner));
      break;
    case 'DESTROY':
      actions.push(...executeDestroy(state, effect, sourceOwner, targetId));
      break;
    case 'REFRESH_MANA':
      actions.push(...executeRefreshMana(effect, sourceOwner));
      break;
  }

  return actions;
}

/**
 * Execute a BUFF effect
 */
function executeBuff(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn,
  targetId?: string,
  sourceMinionId?: string
): GameAction[] {
  const actions: GameAction[] = [];
  const attackBuff = effect.value ?? 0;
  const healthBuff = effect.secondaryValue ?? 0;

  const targetIds = resolveTargets(state, effect.target, sourceOwner, targetId, sourceMinionId);

  for (const id of targetIds) {
    if (!id.startsWith('hero_')) {
      actions.push({
        type: 'BUFF_MINION',
        instanceId: id,
        attack: attackBuff,
        health: healthBuff,
      });
    }
  }

  return actions;
}

/**
 * Execute a DAMAGE effect
 */
function executeDamage(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn,
  targetId?: string
): GameAction[] {
  const actions: GameAction[] = [];
  const damage = effect.value ?? 0;

  const targetIds = resolveTargets(state, effect.target, sourceOwner, targetId);

  for (const id of targetIds) {
    if (id.startsWith('hero_')) {
      const heroOwner = id === 'hero_player' ? 'player' : 'opponent';
      actions.push({
        type: 'DAMAGE_HERO',
        player: heroOwner as PlayerTurn,
        amount: damage,
      });
    } else {
      actions.push({
        type: 'DAMAGE_MINION',
        instanceId: id,
        amount: damage,
      });
    }
  }

  return actions;
}

/**
 * Execute a HEAL effect
 */
function executeHeal(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn,
  targetId?: string
): GameAction[] {
  const actions: GameAction[] = [];
  const healing = effect.value ?? 0;

  const targetIds = resolveTargets(state, effect.target, sourceOwner, targetId);

  for (const id of targetIds) {
    if (id.startsWith('hero_')) {
      const heroOwner = id === 'hero_player' ? 'player' : 'opponent';
      actions.push({
        type: 'HEAL_HERO',
        player: heroOwner as PlayerTurn,
        amount: healing,
      });
    } else {
      actions.push({
        type: 'HEAL_MINION',
        instanceId: id,
        amount: healing,
      });
    }
  }

  return actions;
}

/**
 * Execute a DRAW effect
 */
function executeDraw(effect: Effect, sourceOwner: PlayerTurn): GameAction[] {
  const actions: GameAction[] = [];
  const count = effect.value ?? 1;

  for (let i = 0; i < count; i++) {
    actions.push({
      type: 'DRAW_CARD',
      player: sourceOwner,
    });
  }

  return actions;
}

/**
 * Execute a SUMMON effect
 */
function executeSummon(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn
): GameAction[] {
  const actions: GameAction[] = [];
  const count = effect.summonCount ?? 1;
  const attack = effect.summonAttack ?? 1;
  const health = effect.summonHealth ?? 1;

  for (let i = 0; i < count; i++) {
    actions.push({
      type: 'SUMMON_MINION',
      owner: sourceOwner,
      attack,
      health,
    });
  }

  return actions;
}

/**
 * Execute a DESTROY effect
 */
function executeDestroy(
  state: GameState,
  effect: Effect,
  sourceOwner: PlayerTurn,
  targetId?: string
): GameAction[] {
  const actions: GameAction[] = [];

  const targetIds = resolveTargets(state, effect.target, sourceOwner, targetId);

  for (const id of targetIds) {
    if (!id.startsWith('hero_')) {
      actions.push({
        type: 'DESTROY_MINION',
        instanceId: id,
      });
    }
  }

  return actions;
}

/**
 * Execute a REFRESH_MANA effect
 */
function executeRefreshMana(effect: Effect, sourceOwner: PlayerTurn): GameAction[] {
  const amount = effect.value ?? 1;
  return [{
    type: 'REFRESH_MANA',
    player: sourceOwner,
    amount,
  }];
}

/**
 * Resolve target IDs based on target type
 */
function resolveTargets(
  state: GameState,
  targetType: string,
  sourceOwner: PlayerTurn,
  manualTargetId?: string,
  sourceMinionId?: string
): string[] {
  const enemyOwner = sourceOwner === 'player' ? 'opponent' : 'player';
  const friendlyBoard = getMinionsByOwner(state, sourceOwner);
  const enemyBoard = getMinionsByOwner(state, enemyOwner);

  switch (targetType) {
    case 'ALL_FRIENDLY_MINIONS':
      return friendlyBoard.map((m) => m.instanceId);

    case 'ALL_OTHER_FRIENDLY_MINIONS':
      return friendlyBoard
        .filter((m) => m.instanceId !== sourceMinionId)
        .map((m) => m.instanceId);

    case 'ALL_ENEMY_MINIONS':
      return enemyBoard.map((m) => m.instanceId);

    case 'FRIENDLY_MINION':
    case 'ENEMY_MINION':
    case 'ANY_CHARACTER':
    case 'ENEMY_HERO':
    case 'FRIENDLY_HERO':
      // Manual target required
      return manualTargetId ? [manualTargetId] : [];

    case 'RANDOM_FRIENDLY_MINION':
      const randomFriendly = pickRandom(friendlyBoard);
      return randomFriendly ? [randomFriendly.instanceId] : [];

    case 'RANDOM_ENEMY_MINION':
      const randomEnemy = pickRandom(enemyBoard);
      return randomEnemy ? [randomEnemy.instanceId] : [];

    case 'RANDOM_ENEMY_CHARACTER':
      const allEnemies = [
        ...enemyBoard.map((m) => m.instanceId),
        `hero_${enemyOwner}`,
      ];
      const randomTarget = pickRandom(allEnemies);
      return randomTarget ? [randomTarget] : [];

    case 'NONE':
      return [];
    default:
      return [];
  }
}

/**
 * Execute spell effect
 */
export function executeSpellEffect(
  state: GameState,
  spellEffect: SpellEffect,
  casterOwner: PlayerTurn,
  targetId?: string
): GameAction[] {
  return executeEffect(state, spellEffect, casterOwner, targetId);
}

/**
 * Execute battlecry effects for a minion
 */
export function executeBattlecry(
  state: GameState,
  minionEffect: MinionEffect,
  minionOwner: PlayerTurn,
  minionInstanceId: string,
  targetId?: string
): GameAction[] {
  if (minionEffect.trigger !== 'BATTLECRY') {
    return [];
  }

  const allActions: GameAction[] = [];

  for (const effect of minionEffect.effects) {
    const actions = executeEffect(
      state,
      effect,
      minionOwner,
      targetId,
      minionInstanceId
    );
    allActions.push(...actions);
  }

  return allActions;
}

/**
 * Check if a card has any effects to execute
 */
export function hasEffect(card: Card): boolean {
  return !!(card.spellEffect || card.minionEffect || card.weaponEffect);
}

/**
 * Check if a card's effect needs a target
 */
export function effectNeedsTarget(card: Card): boolean {
  if (card.spellEffect) {
    return requiresManualTarget(card.spellEffect.target);
  }

  if (card.minionEffect?.trigger === 'BATTLECRY') {
    return card.minionEffect.effects.some((e) => requiresManualTarget(e.target));
  }

  return false;
}

function requiresManualTarget(target: string): boolean {
  return [
    'FRIENDLY_MINION',
    'ENEMY_MINION',
    'ANY_CHARACTER',
    'ENEMY_HERO',
    'FRIENDLY_HERO',
  ].includes(target);
}
