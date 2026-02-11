import {
  Card,
  CardInstance,
  MinionInstance,
  WeaponInstance,
  PlayerState,
  GameState,
  Keyword,
  EffectTarget,
  PlayerTurn,
} from './types';
import {
  MAX_BOARD_SIZE,
  MAX_HAND_SIZE,
  WINDFURY_ATTACKS,
  NORMAL_ATTACKS,
} from './constants';

// ===========================================
// ID Generation
// ===========================================

let instanceCounter = 0;

export function generateInstanceId(): string {
  return `inst_${Date.now()}_${++instanceCounter}`;
}

export function resetInstanceCounter(): void {
  instanceCounter = 0;
}

// ===========================================
// Card Instance Creation
// ===========================================

export function createCardInstance(card: Card): CardInstance {
  return {
    instanceId: generateInstanceId(),
    card,
  };
}

export function createMinionInstance(
  card: Card,
  owner: PlayerTurn
): MinionInstance {
  const keywords = new Set<Keyword>(card.keywords);
  const hasRush = keywords.has('Rush');
  const hasDivineShield = keywords.has('Divine Shield');

  return {
    instanceId: generateInstanceId(),
    card,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 1,
    maxHealth: card.health ?? 1,
    canAttack: hasRush, // Rush allows attacking minions on first turn
    hasAttacked: false,
    attacksThisTurn: 0,
    hasDivineShield,
    keywords,
    owner,
  };
}

export function createWeaponInstance(card: Card): WeaponInstance {
  return {
    instanceId: generateInstanceId(),
    card,
    currentAttack: card.attack ?? 0,
    currentDurability: card.durability ?? 1,
  };
}

// ===========================================
// Deck Utilities
// ===========================================

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createDeck(cards: Card[]): CardInstance[] {
  const shuffled = shuffleArray(cards);
  return shuffled.map(createCardInstance);
}

// ===========================================
// Player State Queries
// ===========================================

export function canPlayCard(player: PlayerState, card: Card): boolean {
  if (player.currentMana < card.manaCost) return false;
  if (card.cardType === 'MINION' && player.board.length >= MAX_BOARD_SIZE) return false;
  return true;
}

export function canAddToHand(player: PlayerState): boolean {
  return player.hand.length < MAX_HAND_SIZE;
}

export function getPlayableCards(player: PlayerState): CardInstance[] {
  return player.hand.filter((ci) => canPlayCard(player, ci.card));
}

// ===========================================
// Minion Queries
// ===========================================

export function canMinionAttack(minion: MinionInstance): boolean {
  if (!minion.canAttack) return false;
  if (minion.currentAttack <= 0) return false;

  const maxAttacks = minion.keywords.has('Windfury')
    ? WINDFURY_ATTACKS
    : NORMAL_ATTACKS;

  return minion.attacksThisTurn < maxAttacks;
}

export function hasKeyword(minion: MinionInstance, keyword: Keyword): boolean {
  return minion.keywords.has(keyword);
}

export function hasTaunt(minion: MinionInstance): boolean {
  return hasKeyword(minion, 'Taunt');
}

export function getMinionsByOwner(
  state: GameState,
  owner: PlayerTurn
): MinionInstance[] {
  return owner === 'player' ? state.player.board : state.opponent.board;
}

export function findMinionById(
  state: GameState,
  instanceId: string
): MinionInstance | undefined {
  return (
    state.player.board.find((m) => m.instanceId === instanceId) ||
    state.opponent.board.find((m) => m.instanceId === instanceId)
  );
}

export function getMinionOwner(
  state: GameState,
  instanceId: string
): PlayerTurn | undefined {
  if (state.player.board.some((m) => m.instanceId === instanceId)) return 'player';
  if (state.opponent.board.some((m) => m.instanceId === instanceId)) return 'opponent';
  return undefined;
}

// ===========================================
// Targeting Utilities
// ===========================================

export function hasTauntMinions(board: MinionInstance[]): boolean {
  return board.some(hasTaunt);
}

export function getTauntMinions(board: MinionInstance[]): MinionInstance[] {
  return board.filter(hasTaunt);
}

export function getValidAttackTargets(
  state: GameState,
  attacker: MinionInstance | 'hero',
  attackerOwner: PlayerTurn
): string[] {
  const enemyOwner = attackerOwner === 'player' ? 'opponent' : 'player';
  const enemyBoard = getMinionsByOwner(state, enemyOwner);
  const enemyPlayer = enemyOwner === 'player' ? state.player : state.opponent;

  // Check for Rush restriction (can only attack minions on first turn)
  const isRushRestricted =
    attacker !== 'hero' &&
    attacker.keywords.has('Rush') &&
    !attacker.canAttack; // If canAttack is false but Rush exists, it's first turn

  // If enemy has taunt, must attack taunt minions only
  if (hasTauntMinions(enemyBoard)) {
    return getTauntMinions(enemyBoard).map((m) => m.instanceId);
  }

  const targets: string[] = [];

  // Add enemy minions as targets
  enemyBoard.forEach((m) => targets.push(m.instanceId));

  // Add enemy hero as target (unless Rush restricted)
  if (!isRushRestricted && enemyPlayer.health > 0) {
    targets.push(`hero_${enemyOwner}`);
  }

  return targets;
}

export function getValidSpellTargets(
  state: GameState,
  targetType: EffectTarget,
  casterOwner: PlayerTurn
): string[] {
  const friendlyOwner = casterOwner;
  const enemyOwner = casterOwner === 'player' ? 'opponent' : 'player';

  const friendlyBoard = getMinionsByOwner(state, friendlyOwner);
  const enemyBoard = getMinionsByOwner(state, enemyOwner);

  switch (targetType) {
    case 'FRIENDLY_MINION':
      return friendlyBoard.map((m) => m.instanceId);
    case 'ENEMY_MINION':
      return enemyBoard.map((m) => m.instanceId);
    case 'ALL_FRIENDLY_MINIONS':
    case 'ALL_OTHER_FRIENDLY_MINIONS':
      return friendlyBoard.map((m) => m.instanceId);
    case 'ALL_ENEMY_MINIONS':
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
    case 'RANDOM_FRIENDLY_MINION':
    case 'RANDOM_ENEMY_MINION':
    case 'RANDOM_ENEMY_CHARACTER':
    case 'ATTACKED_TARGET':
    case 'NONE':
      return []; // Auto-targeted, no selection needed
    default:
      return [];
  }
}

export function needsManualTarget(targetType: EffectTarget): boolean {
  return [
    'FRIENDLY_MINION',
    'ENEMY_MINION',
    'ANY_CHARACTER',
    'ENEMY_HERO',
    'FRIENDLY_HERO',
  ].includes(targetType);
}

// ===========================================
// Board State Utilities
// ===========================================

export function getOtherPlayer(player: PlayerTurn): PlayerTurn {
  return player === 'player' ? 'opponent' : 'player';
}

export function isGameOver(state: GameState): boolean {
  return state.player.health <= 0 || state.opponent.health <= 0;
}

export function getWinner(state: GameState): PlayerTurn | null {
  if (state.player.health <= 0 && state.opponent.health <= 0) {
    return null; // Draw (both dead)
  }
  if (state.opponent.health <= 0) return 'player';
  if (state.player.health <= 0) return 'opponent';
  return null;
}

// ===========================================
// Random Selection
// ===========================================

export function pickRandom<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function pickRandomMinion(board: MinionInstance[]): MinionInstance | undefined {
  return pickRandom(board);
}
