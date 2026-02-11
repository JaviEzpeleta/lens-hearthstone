import {
  GameState,
  GameAction,
  CardInstance,
  MinionInstance,
  AIDecision,
  AIDifficulty,
} from './types';
import {
  canPlayCard,
  canMinionAttack,
  getValidAttackTargets,
  hasTauntMinions,
  getTauntMinions,
} from './utils';
import { requiresTarget } from './play-card';
import { MAX_BOARD_SIZE, AI_DIFFICULTY_CONFIG, THREAT_WEIGHTS, MANA_EFFICIENCY, WINDFURY_ATTACKS, NORMAL_ATTACKS } from './constants';

// ===========================================
// NIGHTMARE AI - Advanced Analysis Types
// ===========================================

type Playstyle = 'AGGRO' | 'CONTROL' | 'DEFENSIVE';

interface BoardAnalysis {
  advantage: number; // Positive = AI winning, negative = player winning
  threatLevel: number; // How threatening is the player's board
  aiPower: number; // AI's board power
  playerPower: number; // Player's board power
  playstyle: Playstyle;
}

interface LethalAnalysis {
  hasLethal: boolean;
  minionDamage: number;
  weaponDamage: number;
  spellDamage: number;
  totalDamage: number;
  tauntBlockers: MinionInstance[];
  canClearTaunts: boolean;
}

/**
 * AI decision-making for the opponent's turn
 */

/**
 * Get all possible AI decisions for the current state
 */
export function getAIDecisions(state: GameState, difficulty: AIDifficulty = 'MEDIUM'): AIDecision[] {
  const decisions: AIDecision[] = [];
  const config = AI_DIFFICULTY_CONFIG[difficulty];

  // 1. Evaluate card plays
  const playableCards = getPlayableCards(state);

  for (const cardInstance of playableCards) {
    const card = cardInstance.card;
    const basePriority = evaluateCardPlay(state, cardInstance, difficulty);
    const priority = basePriority * config.priorityMultiplier;

    // Skip cards that need manual targeting for now (simplified AI)
    if (requiresTarget(card)) {
      // Try to find a good target
      const target = findBestTarget(state, cardInstance, difficulty);
      if (target) {
        decisions.push({
          action: {
            type: 'PLAY_CARD',
            instanceId: cardInstance.instanceId,
            targetId: target,
          },
          priority,
          description: `Play ${card.name} targeting ${target}`,
        });
      }
    } else {
      decisions.push({
        action: {
          type: 'PLAY_CARD',
          instanceId: cardInstance.instanceId,
          position: state.opponent.board.length,
        },
        priority,
        description: `Play ${card.name}`,
      });
    }
  }

  // 2. Evaluate attacks
  const attackers = getAttackCapableMinions(state);

  for (const attacker of attackers) {
    const targets = getValidAttackTargets(state, attacker, 'opponent');

    for (const targetId of targets) {
      const basePriority = evaluateAttack(state, attacker, targetId, difficulty);
      const priority = basePriority * config.priorityMultiplier;
      decisions.push({
        action: {
          type: 'ATTACK',
          attackerId: attacker.instanceId,
          targetId,
        },
        priority,
        description: `Attack ${targetId} with ${attacker.card.name}`,
      });
    }
  }

  // 3. Hero attack with weapon
  const opponentWeapon = state.opponent.weapon;
  if (opponentWeapon) {
    const heroMaxAttacks = opponentWeapon.card.keywords.includes('Windfury')
      ? WINDFURY_ATTACKS
      : NORMAL_ATTACKS;
    if (state.opponent.heroAttacksThisTurn < heroMaxAttacks) {
    const heroTargets = getHeroAttackTargets(state);
    for (const targetId of heroTargets) {
      const basePriority = evaluateHeroAttack(state, targetId, difficulty);
      const priority = basePriority * config.priorityMultiplier;
      decisions.push({
        action: {
          type: 'HERO_ATTACK',
          targetId,
        },
        priority,
        description: `Hero attack ${targetId}`,
      });
    }
    }
  }

  return decisions;
}

/**
 * Get the best AI decision
 */
export function getBestDecision(state: GameState, difficulty: AIDifficulty = 'MEDIUM'): AIDecision | null {
  const decisions = getAIDecisions(state, difficulty);

  if (decisions.length === 0) {
    return null;
  }

  // Sort by priority (highest first)
  decisions.sort((a, b) => b.priority - a.priority);

  const config = AI_DIFFICULTY_CONFIG[difficulty];

  // For EASY difficulty, sometimes pick a suboptimal move
  if (config.suboptimalChance > 0 && Math.random() < config.suboptimalChance && decisions.length > 1) {
    // Pick a random decision from the top 3 (or however many exist)
    const topDecisions = decisions.slice(0, Math.min(3, decisions.length));
    const randomIndex = Math.floor(Math.random() * topDecisions.length);
    return topDecisions[randomIndex];
  }

  // Return the highest priority decision
  return decisions[0];
}

/**
 * Execute a full AI turn
 */
export async function executeAITurn(
  state: GameState,
  dispatch: (action: GameAction) => void,
  delayMs: number = 800
): Promise<void> {
  // Keep making decisions until there are none left
  const currentState = state;
  let safetyCounter = 0;
  const maxActions = 20;

  while (safetyCounter < maxActions) {
    safetyCounter++;

    const decision = getBestDecision(currentState);

    if (!decision || decision.priority <= 0) {
      break;
    }

    // Add delay for visual effect
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Dispatch the action
    dispatch(decision.action);

    // Check deaths
    dispatch({ type: 'CHECK_DEATHS' });

    // Small delay after action
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Note: In a real implementation, we'd need to get the updated state
    // For now, we'll break and let the next turn iteration handle it
    break;
  }
}

// ===========================================
// Helper Functions
// ===========================================

function getPlayableCards(state: GameState): CardInstance[] {
  return state.opponent.hand.filter((ci) => {
    if (!canPlayCard(state.opponent, ci.card)) return false;
    if (ci.card.cardType === 'MINION' && state.opponent.board.length >= MAX_BOARD_SIZE) {
      return false;
    }
    return true;
  });
}

function getAttackCapableMinions(state: GameState): MinionInstance[] {
  return state.opponent.board.filter((m) => canMinionAttack(m));
}

function getHeroAttackTargets(state: GameState): string[] {
  // Check for taunts
  if (hasTauntMinions(state.player.board)) {
    return getTauntMinions(state.player.board).map((m) => m.instanceId);
  }

  return [
    ...state.player.board.map((m) => m.instanceId),
    'hero_player',
  ];
}

function evaluateCardPlay(state: GameState, cardInstance: CardInstance, difficulty: AIDifficulty = 'MEDIUM'): number {
  // NIGHTMARE & MAXIMUM_HELL: Use advanced evaluation
  if (difficulty === 'NIGHTMARE' || difficulty === 'MAXIMUM_HELL') {
    const boardAnalysis = analyzeBoardState(state);
    const lethalAnalysis = analyzeLethal(state);
    return evaluateCardPlayNightmare(state, cardInstance, boardAnalysis, lethalAnalysis, difficulty);
  }

  const card = cardInstance.card;
  let priority = 0;

  // Base priority on mana cost (prefer playing higher cost cards)
  priority += card.manaCost * 10;

  // Prefer minions when board is empty
  if (card.cardType === 'MINION') {
    if (state.opponent.board.length === 0) {
      priority += 30;
    }

    // Value stats
    const attack = card.attack ?? 0;
    const health = card.health ?? 0;
    priority += attack * 3 + health * 2;

    // Value keywords
    if (card.keywords.includes('Taunt')) priority += 15;
    if (card.keywords.includes('Rush')) priority += 10;
    if (card.keywords.includes('Divine Shield')) priority += 10;
    if (card.keywords.includes('Lifesteal')) priority += 8;

    // HARD mode: additional value for high-tempo plays
    if (difficulty === 'HARD') {
      // Value Rush minions more for immediate board impact
      if (card.keywords.includes('Rush') && state.player.board.length > 0) {
        priority += 15;
      }
    }
  }

  // Spells - value based on effect
  if (card.cardType === 'SPELL') {
    if (card.spellEffect?.effectType === 'DAMAGE') {
      // Check if we can kill something
      const canKill = state.player.board.some(
        (m) => m.currentHealth <= (card.spellEffect?.value ?? 0)
      );
      if (canKill) priority += 25;

      // HARD mode: prioritize removal that enables lethal
      if (difficulty === 'HARD') {
        const totalBoardDamage = state.opponent.board.reduce((sum, m) => sum + m.currentAttack, 0);
        const potentialLethal = totalBoardDamage + (card.spellEffect?.value ?? 0) >= state.player.health;
        if (potentialLethal && card.spellEffect?.target === 'ENEMY_HERO') {
          priority += 50;
        }
      }
    }
    if (card.spellEffect?.effectType === 'SUMMON') {
      priority += 20;
    }
    if (card.spellEffect?.effectType === 'DRAW') {
      priority += 15;
    }
  }

  // Weapons
  if (card.cardType === 'WEAPON') {
    priority += 20;
    if (!state.opponent.weapon) {
      priority += 15; // Higher priority if no weapon
    }
  }

  return priority;
}

function evaluateAttack(
  state: GameState,
  attacker: MinionInstance,
  targetId: string,
  difficulty: AIDifficulty = 'MEDIUM'
): number {
  // NIGHTMARE & MAXIMUM_HELL: Use advanced evaluation
  if (difficulty === 'NIGHTMARE' || difficulty === 'MAXIMUM_HELL') {
    const boardAnalysis = analyzeBoardState(state);
    const lethalAnalysis = analyzeLethal(state);
    return evaluateAttackNightmare(state, attacker, targetId, boardAnalysis, lethalAnalysis, difficulty);
  }

  let priority = 0;

  // Attacking face (hero)
  if (targetId === 'hero_player') {
    // Go face if lethal
    if (attacker.currentAttack >= state.player.health) {
      return 1000; // Maximum priority for lethal
    }

    // HARD mode: Check for combined lethal with all attackers
    if (difficulty === 'HARD') {
      const totalPossibleDamage = state.opponent.board
        .filter(m => canMinionAttack(m))
        .reduce((sum, m) => sum + m.currentAttack, 0);
      if (totalPossibleDamage >= state.player.health) {
        // We have lethal on board - prioritize face
        return 800;
      }
    }

    // Otherwise, moderate priority
    priority = attacker.currentAttack * 5;

    // Lower priority if we should trade instead
    if (state.player.board.length > 0 && !hasTauntMinions(state.player.board)) {
      priority -= 20;
      // HARD mode: still go face more often if we're ahead on board
      if (difficulty === 'HARD' && state.opponent.board.length > state.player.board.length) {
        priority += 15;
      }
    }

    return priority;
  }

  // Attacking a minion
  const targetMinion = state.player.board.find((m) => m.instanceId === targetId);
  if (!targetMinion) return 0;

  // Favorable trade (we kill them, we survive)
  const weKillThem = attacker.currentAttack >= targetMinion.currentHealth;
  const weSurvive = targetMinion.currentAttack < attacker.currentHealth;

  if (weKillThem && weSurvive) {
    priority += 100; // Very favorable
    // HARD mode: extra value for efficient trades
    if (difficulty === 'HARD') {
      priority += 20;
    }
  } else if (weKillThem && !weSurvive) {
    // Trade - value based on mana cost comparison
    const ourValue = attacker.card.manaCost;
    const theirValue = targetMinion.card.manaCost;
    if (theirValue >= ourValue) {
      priority += 50;
    } else {
      priority += 20;
    }
  } else if (!weKillThem) {
    // We don't kill them - lower priority
    priority += 5;
    // EASY mode: Sometimes attack anyway (suboptimal)
    // (This is handled by the suboptimalChance in getBestDecision)
  }

  // Higher priority for killing taunt
  if (targetMinion.keywords.has('Taunt')) {
    priority += 30;
  }

  // Higher priority for killing high-attack minions
  priority += targetMinion.currentAttack * 2;

  return priority;
}

function evaluateHeroAttack(state: GameState, targetId: string, difficulty: AIDifficulty = 'MEDIUM'): number {
  const weapon = state.opponent.weapon!;
  let priority = 0;

  // NIGHTMARE & MAXIMUM_HELL: Use advanced evaluation
  if (difficulty === 'NIGHTMARE' || difficulty === 'MAXIMUM_HELL') {
    const lethalAnalysis = analyzeLethal(state);
    const boardAnalysis = analyzeBoardState(state);

    if (targetId === 'hero_player') {
      if (lethalAnalysis.hasLethal) {
        return 1500; // Go for lethal!
      }
      // Playstyle-based
      if (boardAnalysis.playstyle === 'AGGRO') {
        return weapon.currentAttack * 8;
      }
      return weapon.currentAttack * 4;
    }

    // Attacking minion
    const targetMinion = state.player.board.find(m => m.instanceId === targetId);
    if (targetMinion) {
      const threat = calculateMinionThreat(targetMinion);
      const weKillThem = weapon.currentAttack >= targetMinion.currentHealth;

      if (weKillThem) {
        priority = 60 + threat;
        // Clear taunt for lethal
        if (targetMinion.keywords.has('Taunt') && lethalAnalysis.hasLethal) {
          priority += 100;
        }
      } else {
        priority = 10;
      }
    }
    return priority;
  }

  if (targetId === 'hero_player') {
    // Check for lethal
    if (weapon.currentAttack >= state.player.health) {
      return 1000;
    }

    // HARD mode: Check for combined lethal
    if (difficulty === 'HARD') {
      const totalBoardDamage = state.opponent.board
        .filter(m => canMinionAttack(m))
        .reduce((sum, m) => sum + m.currentAttack, 0);
      if (totalBoardDamage + weapon.currentAttack >= state.player.health) {
        return 900;
      }
    }

    priority = weapon.currentAttack * 5;
  } else {
    // Attacking minion
    const targetMinion = state.player.board.find((m) => m.instanceId === targetId);
    if (targetMinion) {
      const weKillThem = weapon.currentAttack >= targetMinion.currentHealth;
      if (weKillThem) {
        priority = 40 + targetMinion.currentAttack * 2;
        // HARD mode: value efficient removal more
        if (difficulty === 'HARD') {
          priority += 15;
        }
      } else {
        priority = 10;
      }
    }
  }

  return priority;
}

function findBestTarget(state: GameState, cardInstance: CardInstance, difficulty: AIDifficulty = 'MEDIUM'): string | null {
  const card = cardInstance.card;
  const effect = card.spellEffect || card.minionEffect?.effects?.[0];

  if (!effect) {
    return null;
  }

  // NIGHTMARE & MAXIMUM_HELL: Use advanced targeting
  if (difficulty === 'NIGHTMARE' || difficulty === 'MAXIMUM_HELL') {
    return findBestTargetNightmare(state, cardInstance, effect);
  }

  switch (effect.target) {
    case 'ENEMY_MINION':
      // Target the minion we can kill, or the highest attack minion
      const sortedEnemies = [...state.player.board].sort(
        (a, b) => b.currentAttack - a.currentAttack
      );

      // HARD mode: prioritize killing minions we can exactly kill
      if (difficulty === 'HARD' && effect.effectType === 'DAMAGE' && effect.value) {
        const exactKill = sortedEnemies.find(m => m.currentHealth === effect.value);
        if (exactKill) {
          return exactKill.instanceId;
        }
        // Otherwise target highest attack we can kill
        const canKill = sortedEnemies.find(m => m.currentHealth <= (effect.value ?? 0));
        if (canKill) {
          return canKill.instanceId;
        }
      }

      if (sortedEnemies.length > 0) {
        return sortedEnemies[0].instanceId;
      }
      break;

    case 'FRIENDLY_MINION':
      // Target our best minion for buffs
      const sortedFriendlies = [...state.opponent.board].sort(
        (a, b) => b.currentAttack - a.currentAttack
      );
      if (sortedFriendlies.length > 0) {
        return sortedFriendlies[0].instanceId;
      }
      break;

    case 'ENEMY_HERO':
      return 'hero_player';

    case 'ANY_CHARACTER':
      // For damage, target enemy hero or minion
      // For healing, target friendly
      if (effect.effectType === 'DAMAGE') {
        // HARD mode: check for lethal with damage spell
        if (difficulty === 'HARD' && (effect.value ?? 0) >= state.player.health) {
          return 'hero_player';
        }
        return 'hero_player';
      } else if (effect.effectType === 'HEAL') {
        return 'hero_opponent';
      }
      break;
  }

  return null;
}

// ===========================================
// NIGHTMARE AI - Advanced Functions
// ===========================================

/**
 * Calculate the threat value of a single minion
 */
function calculateMinionThreat(minion: MinionInstance): number {
  let threat = 0;

  // Base stats
  threat += minion.currentAttack * THREAT_WEIGHTS.BASE_ATTACK;
  threat += minion.currentHealth * THREAT_WEIGHTS.BASE_HEALTH;

  // Keywords
  if (minion.keywords.has('Taunt')) threat += THREAT_WEIGHTS.TAUNT;
  if (minion.keywords.has('Divine Shield')) threat += THREAT_WEIGHTS.DIVINE_SHIELD;
  if (minion.keywords.has('Windfury')) threat += THREAT_WEIGHTS.WINDFURY;
  if (minion.keywords.has('Lifesteal')) threat += THREAT_WEIGHTS.LIFESTEAL;
  if (minion.keywords.has('Rush')) threat += THREAT_WEIGHTS.RUSH;

  // High attack is extra threatening
  if (minion.currentAttack >= 4) threat += THREAT_WEIGHTS.HIGH_ATTACK_BONUS;

  // Low health means easy to remove (slightly less threatening)
  if (minion.currentHealth <= 2) threat -= THREAT_WEIGHTS.LOW_HEALTH_BONUS;

  return threat;
}

/**
 * Analyze the current board state
 */
function analyzeBoardState(state: GameState): BoardAnalysis {
  // Calculate total power for each side
  const aiPower = state.opponent.board.reduce((sum, m) => sum + calculateMinionThreat(m), 0);
  const playerPower = state.player.board.reduce((sum, m) => sum + calculateMinionThreat(m), 0);

  // Factor in health
  const healthDiff = state.opponent.health - state.player.health;
  const advantage = aiPower - playerPower + (healthDiff * 0.5);

  // Determine playstyle based on board state
  let playstyle: Playstyle;
  if (state.opponent.health <= 10 || playerPower > aiPower * 1.5) {
    // We're in danger - play defensively
    playstyle = 'DEFENSIVE';
  } else if (state.player.health <= 15 || aiPower > playerPower * 1.3) {
    // We're ahead or they're low - push damage
    playstyle = 'AGGRO';
  } else {
    // Otherwise, play for board control
    playstyle = 'CONTROL';
  }

  return {
    advantage,
    threatLevel: playerPower,
    aiPower,
    playerPower,
    playstyle,
  };
}

/**
 * Calculate total possible lethal damage including spells
 */
function analyzeLethal(state: GameState): LethalAnalysis {
  // Minion damage
  const minionDamage = state.opponent.board
    .filter(m => canMinionAttack(m))
    .reduce((sum, m) => {
      const attacks = m.keywords.has('Windfury') ? 2 : 1;
      return sum + (m.currentAttack * attacks);
    }, 0);

  // Weapon damage
  let weaponDamage = 0;
  if (state.opponent.weapon) {
    const heroMaxAttacks = state.opponent.weapon.card.keywords.includes('Windfury')
      ? WINDFURY_ATTACKS
      : NORMAL_ATTACKS;
    const remainingAttacks = heroMaxAttacks - state.opponent.heroAttacksThisTurn;
    if (remainingAttacks > 0) {
      weaponDamage = state.opponent.weapon.currentAttack * remainingAttacks;
    }
  }

  // Spell damage from hand
  let spellDamage = 0;
  let manaAvailable = state.opponent.currentMana;

  // Sort damage spells by efficiency (damage per mana)
  const damageSpells = state.opponent.hand
    .filter(ci => {
      const spell = ci.card.spellEffect;
      return spell?.effectType === 'DAMAGE' &&
             (spell.target === 'ENEMY_HERO' || spell.target === 'ANY_CHARACTER' || spell.target === 'RANDOM_ENEMY_CHARACTER');
    })
    .sort((a, b) => {
      const aEfficiency = (a.card.spellEffect?.value ?? 0) / a.card.manaCost;
      const bEfficiency = (b.card.spellEffect?.value ?? 0) / b.card.manaCost;
      return bEfficiency - aEfficiency;
    });

  for (const spell of damageSpells) {
    if (spell.card.manaCost <= manaAvailable) {
      spellDamage += spell.card.spellEffect?.value ?? 0;
      manaAvailable -= spell.card.manaCost;
    }
  }

  // Taunt blockers
  const tauntBlockers = getTauntMinions(state.player.board);

  // Can we clear taunts?
  let canClearTaunts = true;
  if (tauntBlockers.length > 0) {
    const totalTauntHealth = tauntBlockers.reduce((sum, t) => sum + t.currentHealth, 0);
    const availableDamage = minionDamage + weaponDamage;
    canClearTaunts = availableDamage >= totalTauntHealth;
  }

  const totalDamage = minionDamage + weaponDamage + spellDamage;
  const hasLethal = totalDamage >= state.player.health && (tauntBlockers.length === 0 || canClearTaunts);

  return {
    hasLethal,
    minionDamage,
    weaponDamage,
    spellDamage,
    totalDamage,
    tauntBlockers,
    canClearTaunts,
  };
}

/**
 * NIGHTMARE/MAXIMUM_HELL mode card evaluation - much smarter
 */
function evaluateCardPlayNightmare(state: GameState, cardInstance: CardInstance, boardAnalysis: BoardAnalysis, lethalAnalysis: LethalAnalysis, difficulty: AIDifficulty = 'NIGHTMARE'): number {
  const card = cardInstance.card;
  let priority = 0;
  const isMaxHell = difficulty === 'MAXIMUM_HELL';
  const hellMultiplier = isMaxHell ? 1.5 : 1.0;

  // Mana efficiency bonus - reward using all mana
  const manaAfterPlay = state.opponent.currentMana - card.manaCost;
  if (manaAfterPlay === 0) {
    priority += MANA_EFFICIENCY.PERFECT_CURVE_BONUS;
  } else if (manaAfterPlay === 1) {
    priority += MANA_EFFICIENCY.NEAR_PERFECT_BONUS;
  } else {
    priority += manaAfterPlay * MANA_EFFICIENCY.WASTED_MANA_PENALTY;
  }

  if (card.cardType === 'MINION') {
    const attack = card.attack ?? 0;
    const health = card.health ?? 0;

    // Stat efficiency (stats per mana)
    const statEfficiency = (attack + health) / Math.max(card.manaCost, 1);
    priority += statEfficiency * 8 * hellMultiplier;

    // Keywords valued by playstyle - MAXIMUM_HELL values keywords even more
    if (card.keywords.includes('Taunt')) {
      priority += (boardAnalysis.playstyle === 'DEFENSIVE' ? 35 : 15) * hellMultiplier;
    }
    if (card.keywords.includes('Rush')) {
      // Rush is great when enemy has threatening minions
      const threatTarget = state.player.board.find(m => m.currentAttack >= 3);
      priority += (threatTarget ? 30 : 10) * hellMultiplier;
      // MAXIMUM_HELL: Rush minions can clear board and push damage
      if (isMaxHell && threatTarget) {
        priority += 25;
      }
    }
    if (card.keywords.includes('Divine Shield')) {
      priority += 15 * hellMultiplier;
    }
    if (card.keywords.includes('Windfury')) {
      // Windfury is amazing in AGGRO - MAXIMUM_HELL loves Windfury
      priority += (boardAnalysis.playstyle === 'AGGRO' ? 40 : 20) * hellMultiplier;
      if (isMaxHell) {
        priority += 30; // MAXIMUM_HELL knows Windfury = death
      }
    }
    if (card.keywords.includes('Lifesteal')) {
      priority += (boardAnalysis.playstyle === 'DEFENSIVE' ? 25 : 12) * hellMultiplier;
    }

    // Board presence bonus when our board is empty
    if (state.opponent.board.length === 0) {
      priority += 35 * hellMultiplier;
    }

    // MAXIMUM_HELL: Aggressive minion deployment
    if (isMaxHell && attack >= 4) {
      priority += 20; // Love high attack minions
    }
  }

  if (card.cardType === 'SPELL') {
    const spell = card.spellEffect;
    if (!spell) return priority;

    if (spell.effectType === 'DAMAGE') {
      // Lethal check - highest priority
      if ((spell.target === 'ENEMY_HERO' || spell.target === 'ANY_CHARACTER') &&
          (spell.value ?? 0) >= state.player.health) {
        return 2000; // Immediate lethal
      }

      // Combined lethal check
      if (lethalAnalysis.hasLethal && (spell.target === 'ENEMY_HERO' || spell.target === 'ANY_CHARACTER')) {
        priority += 500;
      }

      // SPELL CONSERVATION: Don't waste removal on small minions
      if (spell.target === 'ENEMY_MINION' || spell.target === 'ANY_CHARACTER') {
        const highThreatTarget = state.player.board.find(m =>
          calculateMinionThreat(m) >= 25 && m.currentHealth <= (spell.value ?? 0)
        );
        if (highThreatTarget) {
          priority += 60; // Good value removal
        } else {
          // Conserve spell for bigger threats
          priority -= 20;
        }
      }
    }

    if (spell.effectType === 'SUMMON') {
      priority += 25;
      if (state.opponent.board.length < 3) {
        priority += 15; // Bonus for building board
      }
    }

    if (spell.effectType === 'DRAW') {
      // Drawing is good when we have cards to play
      if (state.opponent.hand.length <= 4) {
        priority += 30;
      } else {
        priority += 10;
      }
    }

    if (spell.effectType === 'BUFF') {
      // Only buff if we have minions
      if (state.opponent.board.length > 0) {
        const bestTarget = state.opponent.board.find(m => m.keywords.has('Windfury'));
        priority += bestTarget ? 50 : 20;
      } else {
        priority -= 100; // Can't buff nothing
      }
    }
  }

  if (card.cardType === 'WEAPON') {
    if (!state.opponent.weapon) {
      priority += 35;
    } else {
      // Only replace if new weapon is better
      const currentWeaponDamage = state.opponent.weapon.currentAttack * state.opponent.weapon.currentDurability;
      const newWeaponDamage = (card.attack ?? 0) * (card.durability ?? 1);
      if (newWeaponDamage > currentWeaponDamage) {
        priority += 25;
      } else {
        priority -= 10;
      }
    }
  }

  return priority;
}

/**
 * NIGHTMARE/MAXIMUM_HELL mode attack evaluation - considers trade quality
 */
function evaluateAttackNightmare(state: GameState, attacker: MinionInstance, targetId: string, boardAnalysis: BoardAnalysis, lethalAnalysis: LethalAnalysis, difficulty: AIDifficulty = 'NIGHTMARE'): number {
  let priority = 0;
  const isMaxHell = difficulty === 'MAXIMUM_HELL';
  const hellMultiplier = isMaxHell ? 1.5 : 1.0;

  // Face damage
  if (targetId === 'hero_player') {
    // Check for lethal
    if (lethalAnalysis.hasLethal) {
      return isMaxHell ? 2500 : 1500; // MAXIMUM_HELL is EVEN MORE eager for lethal
    }

    // Playstyle-based face priority - MAXIMUM_HELL is more aggressive
    if (boardAnalysis.playstyle === 'AGGRO' || isMaxHell) {
      priority = attacker.currentAttack * (isMaxHell ? 12 : 8); // MAXIMUM_HELL loves face damage
    } else if (boardAnalysis.playstyle === 'DEFENSIVE') {
      priority = attacker.currentAttack * 2; // Prefer trading
    } else {
      priority = attacker.currentAttack * 5;
    }

    // If we're ahead on board, more face
    if (boardAnalysis.advantage > 20) {
      priority += 30 * hellMultiplier;
    }

    // MAXIMUM_HELL: Always considers face damage highly
    if (isMaxHell && state.player.health <= 15) {
      priority += 50; // Smell blood, go for the kill
    }

    return priority;
  }

  // Minion combat
  const targetMinion = state.player.board.find(m => m.instanceId === targetId);
  if (!targetMinion) return 0;

  const targetThreat = calculateMinionThreat(targetMinion);
  const weKillThem = attacker.currentAttack >= targetMinion.currentHealth;
  const weSurvive = targetMinion.currentAttack < attacker.currentHealth;

  // Trade quality evaluation - MAXIMUM_HELL trades more efficiently
  if (weKillThem && weSurvive) {
    // Perfect trade - we kill them and survive
    priority = (150 + targetThreat) * hellMultiplier;
  } else if (weKillThem && !weSurvive) {
    // We trade 1-for-1
    const ourValue = calculateMinionThreat(attacker);
    if (targetThreat >= ourValue) {
      priority = (80 + (targetThreat - ourValue)) * hellMultiplier; // Good trade
    } else {
      priority = 30; // Bad trade, but sometimes necessary
    }
  } else {
    // We don't kill them - usually bad
    priority = 5;
  }

  // Priority targets by keyword - MAXIMUM_HELL is even more aggressive about threats
  if (targetMinion.keywords.has('Windfury')) {
    priority += 50 * hellMultiplier; // Kill Windfury ASAP
  }
  if (targetMinion.keywords.has('Lifesteal')) {
    priority += 30 * hellMultiplier;
  }
  if (targetMinion.keywords.has('Taunt') && lethalAnalysis.hasLethal) {
    priority += isMaxHell ? 200 : 100; // MAXIMUM_HELL WILL clear that taunt
  }
  if (targetMinion.currentAttack >= 4) {
    priority += 20 * hellMultiplier; // Kill high attack minions
  }

  // MAXIMUM_HELL: Eliminate Divine Shield minions before they become a problem
  if (isMaxHell && targetMinion.hasDivineShield) {
    priority += 40; // Pop that shield!
  }

  // Playstyle adjustment
  if (boardAnalysis.playstyle === 'CONTROL') {
    priority += 25; // Control wants to trade
  } else if (boardAnalysis.playstyle === 'AGGRO' && !weKillThem) {
    priority -= isMaxHell ? 15 : 30; // MAXIMUM_HELL is willing to chip damage through
  }

  return priority;
}

/**
 * NIGHTMARE mode targeting for spells and battlecries
 */
function findBestTargetNightmare(state: GameState, cardInstance: CardInstance, effect: { effectType: string; target: string; value?: number }): string | null {
  switch (effect.target) {
    case 'ENEMY_MINION': {
      if (state.player.board.length === 0) return null;

      // For damage: find best value kill
      if (effect.effectType === 'DAMAGE' && effect.value) {
        // Sort by threat level
        const sorted = [...state.player.board].sort(
          (a, b) => calculateMinionThreat(b) - calculateMinionThreat(a)
        );

        // First try to find exact kill on high threat target
        const exactKill = sorted.find(m =>
          m.currentHealth === effect.value && calculateMinionThreat(m) >= 20
        );
        if (exactKill) {
          return exactKill.instanceId;
        }

        // Then find any kill on high threat
        const highThreatKill = sorted.find(m =>
          m.currentHealth <= (effect.value ?? 0) && calculateMinionThreat(m) >= 20
        );
        if (highThreatKill) {
          return highThreatKill.instanceId;
        }

        // Otherwise just kill the highest threat we can
        const anyKill = sorted.find(m => m.currentHealth <= (effect.value ?? 0));
        if (anyKill) {
          return anyKill.instanceId;
        }

        // Can't kill anything, target highest threat anyway
        return sorted[0].instanceId;
      }

      // For destroy effects: target highest value
      if (effect.effectType === 'DESTROY') {
        const highest = [...state.player.board].sort(
          (a, b) => calculateMinionThreat(b) - calculateMinionThreat(a)
        )[0];
        return highest.instanceId;
      }

      // Default: target highest attack
      return [...state.player.board].sort(
        (a, b) => b.currentAttack - a.currentAttack
      )[0].instanceId;
    }

    case 'FRIENDLY_MINION': {
      if (state.opponent.board.length === 0) return null;

      // For buffs: prioritize Windfury minions, then highest attack
      if (effect.effectType === 'BUFF') {
        const windfury = state.opponent.board.find(m => m.keywords.has('Windfury'));
        if (windfury) {
          return windfury.instanceId;
        }

        // Then divine shield (survives longer)
        const divineShield = state.opponent.board.find(m => m.hasDivineShield);
        if (divineShield) {
          return divineShield.instanceId;
        }
      }

      // Default: highest attack
      return [...state.opponent.board].sort(
        (a, b) => b.currentAttack - a.currentAttack
      )[0].instanceId;
    }

    case 'ENEMY_HERO': {
      return 'hero_player';
    }

    case 'ANY_CHARACTER': {
      if (effect.effectType === 'DAMAGE') {
        // Check for lethal first
        if ((effect.value ?? 0) >= state.player.health) {
          return 'hero_player';
        }

        // Check if we have lethal on board
        const lethal = analyzeLethal(state);
        if (lethal.hasLethal) {
          return 'hero_player';
        }

        // Otherwise, kill high value minion if possible
        const highThreat = state.player.board.find(m =>
          calculateMinionThreat(m) >= 25 && m.currentHealth <= (effect.value ?? 0)
        );
        if (highThreat) {
          return highThreat.instanceId;
        }

        // If no good target, go face
        return 'hero_player';
      }

      if (effect.effectType === 'HEAL') {
        // Heal ourselves if low
        if (state.opponent.health <= 15) {
          return 'hero_opponent';
        }
        // Otherwise heal a damaged minion
        const damaged = state.opponent.board.find(m => m.currentHealth < m.maxHealth);
        if (damaged) {
          return damaged.instanceId;
        }
        return 'hero_opponent';
      }

      return null;
    }

    default:
      return null;
  }
}
