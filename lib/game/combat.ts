import {
  GameState,
  MinionInstance,
  PlayerTurn,
} from './types';
import {
  canMinionAttack,
  getValidAttackTargets,
  hasTauntMinions,
  getMinionsByOwner,
} from './utils';

/**
 * Checks if a minion can attack
 */
export function canAttack(
  state: GameState,
  minion: MinionInstance
): { canAttack: boolean; reason?: string } {
  if (!minion.canAttack) {
    return { canAttack: false, reason: 'Cannot attack this turn (summoning sickness)' };
  }

  if (minion.currentAttack <= 0) {
    return { canAttack: false, reason: 'Has 0 attack' };
  }

  if (!canMinionAttack(minion)) {
    return { canAttack: false, reason: 'Already attacked this turn' };
  }

  return { canAttack: true };
}

/**
 * Checks if attacking a specific target is valid
 */
export function canAttackTarget(
  state: GameState,
  attacker: MinionInstance,
  targetId: string,
  attackerOwner: PlayerTurn
): { canAttack: boolean; reason?: string } {
  const attackCheck = canAttack(state, attacker);
  if (!attackCheck.canAttack) {
    return attackCheck;
  }

  const validTargets = getValidAttackTargets(state, attacker, attackerOwner);

  if (!validTargets.includes(targetId)) {
    const enemyOwner = attackerOwner === 'player' ? 'opponent' : 'player';
    const enemyBoard = getMinionsByOwner(state, enemyOwner);

    if (hasTauntMinions(enemyBoard)) {
      return { canAttack: false, reason: 'Must attack a minion with Taunt' };
    }

    // Check if Rush restriction
    if (attacker.keywords.has('Rush') && !attacker.canAttack) {
      if (targetId.startsWith('hero_')) {
        return { canAttack: false, reason: 'Rush minions can only attack minions on first turn' };
      }
    }

    return { canAttack: false, reason: 'Invalid target' };
  }

  return { canAttack: true };
}

/**
 * Checks if the hero can attack with weapon
 */
export function canHeroAttack(
  state: GameState,
  owner: PlayerTurn
): { canAttack: boolean; reason?: string } {
  const player = owner === 'player' ? state.player : state.opponent;

  if (!player.weapon) {
    return { canAttack: false, reason: 'No weapon equipped' };
  }

  const heroMaxAttacks = player.weapon.card.keywords.includes('Windfury') ? 2 : 1;
  if (player.heroAttacksThisTurn >= heroMaxAttacks) {
    return { canAttack: false, reason: 'Already used all attacks this turn' };
  }

  if (player.weapon.currentAttack <= 0) {
    return { canAttack: false, reason: 'Weapon has 0 attack' };
  }

  return { canAttack: true };
}

/**
 * Gets valid attack targets for the hero with weapon
 */
export function getHeroAttackTargets(
  state: GameState,
  owner: PlayerTurn
): string[] {
  const heroCheck = canHeroAttack(state, owner);
  if (!heroCheck.canAttack) {
    return [];
  }

  const enemyOwner = owner === 'player' ? 'opponent' : 'player';
  const enemyBoard = getMinionsByOwner(state, enemyOwner);

  // If enemy has taunt, must attack taunt minions
  if (hasTauntMinions(enemyBoard)) {
    return enemyBoard
      .filter((m) => m.keywords.has('Taunt'))
      .map((m) => m.instanceId);
  }

  // Can attack any enemy character
  return [
    ...enemyBoard.map((m) => m.instanceId),
    `hero_${enemyOwner}`,
  ];
}

/**
 * Calculate combat result between two minions
 */
export interface CombatResult {
  attackerDamage: number;
  defenderDamage: number;
  attackerShieldPopped: boolean;
  defenderShieldPopped: boolean;
  attackerDies: boolean;
  defenderDies: boolean;
  attackerHealing: number; // From lifesteal
}

export function calculateCombatResult(
  attacker: MinionInstance,
  defender: MinionInstance
): CombatResult {
  let attackerDamage = defender.currentAttack;
  let defenderDamage = attacker.currentAttack;
  let attackerShieldPopped = false;
  let defenderShieldPopped = false;

  // Divine Shield handling
  if (attacker.hasDivineShield && attackerDamage > 0) {
    attackerDamage = 0;
    attackerShieldPopped = true;
  }

  if (defender.hasDivineShield && defenderDamage > 0) {
    defenderDamage = 0;
    defenderShieldPopped = true;
  }

  const attackerNewHealth = attacker.currentHealth - attackerDamage;
  const defenderNewHealth = defender.currentHealth - defenderDamage;

  // Lifesteal healing (only if damage was dealt)
  let attackerHealing = 0;
  if (attacker.keywords.has('Lifesteal') && defenderDamage > 0) {
    attackerHealing = defenderDamage;
  }

  return {
    attackerDamage,
    defenderDamage,
    attackerShieldPopped,
    defenderShieldPopped,
    attackerDies: attackerNewHealth <= 0,
    defenderDies: defenderNewHealth <= 0,
    attackerHealing,
  };
}

/**
 * Calculate hero attack result against a minion
 */
export interface HeroAttackResult {
  heroTakesDamage: number;
  minionDamage: number;
  minionShieldPopped: boolean;
  minionDies: boolean;
  weaponBreaks: boolean;
  heroHealing: number;
}

export function calculateHeroAttackResult(
  state: GameState,
  owner: PlayerTurn,
  targetMinion: MinionInstance
): HeroAttackResult {
  const player = owner === 'player' ? state.player : state.opponent;
  const weapon = player.weapon!;

  let minionDamage = weapon.currentAttack;
  let minionShieldPopped = false;

  // Divine Shield on minion
  if (targetMinion.hasDivineShield && minionDamage > 0) {
    minionDamage = 0;
    minionShieldPopped = true;
  }

  const minionNewHealth = targetMinion.currentHealth - minionDamage;
  const newDurability = weapon.currentDurability - 1;

  // Hero takes damage from minion
  const heroTakesDamage = targetMinion.currentAttack;

  // Lifesteal healing
  let heroHealing = 0;
  if (weapon.card.keywords.includes('Lifesteal') && minionDamage > 0) {
    heroHealing = minionDamage;
  }

  return {
    heroTakesDamage,
    minionDamage,
    minionShieldPopped,
    minionDies: minionNewHealth <= 0,
    weaponBreaks: newDurability <= 0,
    heroHealing,
  };
}
