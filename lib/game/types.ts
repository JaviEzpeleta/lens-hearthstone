// ===========================================
// Card Types (from JSON schema)
// ===========================================

export type CardType = 'MINION' | 'SPELL' | 'WEAPON';
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type Keyword =
  | 'Taunt'
  | 'Rush'
  | 'Divine Shield'
  | 'Lifesteal'
  | 'Windfury'
  | 'Battlecry';

export type EffectType =
  | 'BUFF'
  | 'SUMMON'
  | 'DRAW'
  | 'DAMAGE'
  | 'HEAL'
  | 'DESTROY'
  | 'REFRESH_MANA';

export type EffectTarget =
  | 'ALL_FRIENDLY_MINIONS'
  | 'ALL_OTHER_FRIENDLY_MINIONS'
  | 'ALL_ENEMY_MINIONS'
  | 'FRIENDLY_MINION'
  | 'ENEMY_MINION'
  | 'RANDOM_FRIENDLY_MINION'
  | 'RANDOM_ENEMY_MINION'
  | 'RANDOM_ENEMY_CHARACTER'
  | 'ANY_CHARACTER'
  | 'ENEMY_HERO'
  | 'FRIENDLY_HERO'
  | 'ATTACKED_TARGET'
  | 'NONE';

export type EffectTrigger = 'BATTLECRY' | 'AFTER_ATTACK' | 'ON_DAMAGE' | 'END_OF_TURN';

export interface Effect {
  effectType: EffectType;
  target: EffectTarget;
  value?: number;
  secondaryValue?: number; // For BUFF: attack/health values
  description?: string;
  summonCount?: number;
  summonAttack?: number;
  summonHealth?: number;
}

export interface MinionEffect {
  trigger: EffectTrigger;
  effects: Effect[];
}

export interface SpellEffect extends Effect {
  summonCount?: number;
  summonAttack?: number;
  summonHealth?: number;
}

export interface WeaponEffect {
  trigger: EffectTrigger;
  effectType: EffectType;
  value: number;
  target: EffectTarget;
  description?: string;
}

// Base card from JSON
export interface Card {
  id: number;
  handle: string;
  cardType: CardType;
  name: string;
  imagePrompt?: string;
  manaCost: number;
  attack?: number;      // MINION & WEAPON
  health?: number;      // MINION
  durability?: number;  // WEAPON
  keywords: Keyword[];
  abilityText: string;
  flavorText: string;
  rarity: Rarity;
  generatedImageUrl: string;
  profileAddress?: string;
  profileName?: string;
  profilePicture?: string;
  profileScore?: number;
  spellEffect?: SpellEffect;
  weaponEffect?: WeaponEffect;
  minionEffect?: MinionEffect;
}

// ===========================================
// Game Instance Types
// ===========================================

export interface CardInstance {
  instanceId: string;
  card: Card;
}

export interface MinionInstance {
  instanceId: string;
  card: Card;
  currentAttack: number;
  currentHealth: number;
  maxHealth: number;
  canAttack: boolean;
  hasAttacked: boolean;
  attacksThisTurn: number; // For Windfury tracking
  hasDivineShield: boolean;
  keywords: Set<Keyword>;
  owner: 'player' | 'opponent';
}

export interface WeaponInstance {
  instanceId: string;
  card: Card;
  currentAttack: number;
  currentDurability: number;
}

// ===========================================
// Player State
// ===========================================

export interface PlayerState {
  health: number;
  maxHealth: number;
  armor: number;
  maxMana: number;
  currentMana: number;
  hand: CardInstance[];
  deck: CardInstance[];
  board: MinionInstance[];
  weapon: WeaponInstance | null;
  canAttackWithHero: boolean;
  heroAttacksThisTurn: number;
}

// ===========================================
// Targeting State
// ===========================================

export interface TargetingState {
  sourceType: 'card' | 'minion' | 'hero';
  sourceId: string;
  validTargets: string[]; // Instance IDs
  targetType: EffectTarget;
  effect?: Effect;
  cardToPlay?: CardInstance;
}

// ===========================================
// Game State
// ===========================================

export type GamePhase = 'MULLIGAN' | 'PLAYING' | 'GAME_OVER';
export type PlayerTurn = 'player' | 'opponent';

export interface GameState {
  phase: GamePhase;
  turn: PlayerTurn;
  turnNumber: number;
  player: PlayerState;
  opponent: PlayerState;
  targeting: TargetingState | null;
  winner: PlayerTurn | null;
  selectedCard: string | null;  // Instance ID of selected card in hand
  selectedMinion: string | null; // Instance ID of selected minion on board
  animationQueue: GameAnimation[];
  lastAction: GameAction | null;
  difficulty: AIDifficulty;
  tutorialMode: boolean;
}

// ===========================================
// Game Actions
// ===========================================

export type GameAction =
  | { type: 'START_GAME'; playerDeck: Card[]; opponentDeck: Card[]; difficulty: AIDifficulty }
  | { type: 'MULLIGAN_DONE' }
  | { type: 'DRAW_CARD'; player: PlayerTurn }
  | { type: 'START_TURN' }
  | { type: 'END_TURN' }
  | { type: 'SELECT_CARD'; instanceId: string }
  | { type: 'DESELECT_CARD' }
  | { type: 'PLAY_CARD'; instanceId: string; position?: number; targetId?: string }
  | { type: 'SELECT_MINION'; instanceId: string }
  | { type: 'DESELECT_MINION' }
  | { type: 'ATTACK'; attackerId: string; targetId: string }
  | { type: 'HERO_ATTACK'; targetId: string }
  | { type: 'SET_TARGETING'; targeting: TargetingState | null }
  | { type: 'APPLY_EFFECT'; effect: Effect; targetIds: string[]; sourceOwner: PlayerTurn }
  | { type: 'DAMAGE_MINION'; instanceId: string; amount: number }
  | { type: 'DAMAGE_HERO'; player: PlayerTurn; amount: number }
  | { type: 'HEAL_MINION'; instanceId: string; amount: number }
  | { type: 'HEAL_HERO'; player: PlayerTurn; amount: number }
  | { type: 'BUFF_MINION'; instanceId: string; attack: number; health: number }
  | { type: 'DESTROY_MINION'; instanceId: string }
  | { type: 'SUMMON_MINION'; owner: PlayerTurn; attack: number; health: number; position?: number }
  | { type: 'EQUIP_WEAPON'; instanceId: string }
  | { type: 'CHECK_DEATHS' }
  | { type: 'GAME_OVER'; winner: PlayerTurn }
  | { type: 'TOGGLE_TUTORIAL' }
  | { type: 'REFRESH_MANA'; player: PlayerTurn; amount: number };

// ===========================================
// Animations
// ===========================================

export type AnimationType =
  | 'CARD_PLAY'
  | 'ATTACK'
  | 'DAMAGE'
  | 'HEAL'
  | 'DEATH'
  | 'BUFF'
  | 'SUMMON'
  | 'DRAW'
  | 'TURN_START';

export interface GameAnimation {
  id: string;
  type: AnimationType;
  sourceId?: string;
  targetId?: string;
  value?: number;
  duration: number;
}

// ===========================================
// AI Types
// ===========================================

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE' | 'MAXIMUM_HELL';

export interface AIDecision {
  action: GameAction;
  priority: number;
  description: string;
}
