import {
  GameState,
  GameAction,
  PlayerState,
  Card,
  MinionInstance,
  PlayerTurn,
  AIDifficulty,
} from './types';
import {
  MAX_MANA,
  STARTING_HEALTH,
  MAX_HEALTH,
  STARTING_HAND_SIZE,
  OPPONENT_STARTING_HAND_SIZE,
  MAX_BOARD_SIZE,
  MAX_HAND_SIZE,
  WINDFURY_ATTACKS,
  NORMAL_ATTACKS,
} from './constants';
import {
  createDeck,
  createMinionInstance,
  createWeaponInstance,
  generateInstanceId,
  canAddToHand,
  getOtherPlayer,
} from './utils';

// ===========================================
// Initial State
// ===========================================

function createInitialPlayerState(): PlayerState {
  return {
    health: STARTING_HEALTH,
    maxHealth: MAX_HEALTH,
    armor: 0,
    maxMana: 0,
    currentMana: 0,
    hand: [],
    deck: [],
    board: [],
    weapon: null,
    canAttackWithHero: false,
    heroAttacksThisTurn: 0,
  };
}

export function createInitialGameState(difficulty: AIDifficulty = 'MEDIUM'): GameState {
  return {
    phase: 'MULLIGAN',
    turn: 'player',
    turnNumber: 0,
    player: createInitialPlayerState(),
    opponent: createInitialPlayerState(),
    targeting: null,
    winner: null,
    selectedCard: null,
    selectedMinion: null,
    animationQueue: [],
    lastAction: null,
    difficulty,
    tutorialMode: false,
  };
}

// ===========================================
// Helper Functions
// ===========================================

function drawCards(state: PlayerState, count: number): PlayerState {
  const newHand = [...state.hand];
  const newDeck = [...state.deck];

  for (let i = 0; i < count && newDeck.length > 0; i++) {
    if (newHand.length < MAX_HAND_SIZE) {
      const card = newDeck.shift()!;
      newHand.push(card);
    } else {
      // Card burns (overdraw)
      newDeck.shift();
    }
  }

  return {
    ...state,
    hand: newHand,
    deck: newDeck,
  };
}

function resetMinionAttacks(board: MinionInstance[]): MinionInstance[] {
  return board.map((minion) => ({
    ...minion,
    hasAttacked: false,
    attacksThisTurn: 0,
    canAttack: true, // All minions can attack after first turn
  }));
}

function removeMinionFromBoard(
  board: MinionInstance[],
  instanceId: string
): MinionInstance[] {
  return board.filter((m) => m.instanceId !== instanceId);
}

// ===========================================
// Game Reducer
// ===========================================

export function gameReducer(state: GameState, action: GameAction): GameState {
  console.log('[ACTION] Reducer received:', action.type, {
    turn: state.turn,
    phase: state.phase,
    actionDetails: action,
  });

  switch (action.type) {
    case 'START_GAME': {
      const playerDeck = createDeck(action.playerDeck);
      const opponentDeck = createDeck(action.opponentDeck);

      let playerState = { ...createInitialPlayerState(), deck: playerDeck };
      let opponentState = { ...createInitialPlayerState(), deck: opponentDeck };

      // Draw starting hands
      playerState = drawCards(playerState, STARTING_HAND_SIZE);
      opponentState = drawCards(opponentState, OPPONENT_STARTING_HAND_SIZE);

      return {
        ...createInitialGameState(action.difficulty),
        phase: 'PLAYING',
        turn: 'player',
        turnNumber: 1,
        player: {
          ...playerState,
          maxMana: 1,
          currentMana: 1,
        },
        opponent: opponentState,
      };
    }

    case 'MULLIGAN_DONE': {
      return {
        ...state,
        phase: 'PLAYING',
      };
    }

    case 'DRAW_CARD': {
      const playerKey = action.player;
      const currentPlayer = state[playerKey];

      // Fatigue damage if deck empty
      if (currentPlayer.deck.length === 0) {
        // For now, just skip draw if empty
        return state;
      }

      const updatedPlayer = drawCards(currentPlayer, 1);

      return {
        ...state,
        [playerKey]: updatedPlayer,
      };
    }

    case 'START_TURN': {
      const playerKey = state.turn;
      const currentPlayer = state[playerKey];

      // Increase max mana (up to 10)
      const newMaxMana = Math.min(currentPlayer.maxMana + 1, MAX_MANA);

      // Refill mana
      const newCurrentMana = newMaxMana;

      // Reset minion attacks
      const newBoard = resetMinionAttacks(currentPlayer.board);

      // Draw a card
      let updatedPlayer = {
        ...currentPlayer,
        maxMana: newMaxMana,
        currentMana: newCurrentMana,
        board: newBoard,
        heroAttacksThisTurn: 0,
        canAttackWithHero: currentPlayer.weapon !== null,
      };

      updatedPlayer = drawCards(updatedPlayer, 1);

      return {
        ...state,
        [playerKey]: updatedPlayer,
        selectedCard: null,
        selectedMinion: null,
        targeting: null,
      };
    }

    case 'END_TURN': {
      const nextTurn = getOtherPlayer(state.turn);
      const newTurnNumber =
        nextTurn === 'player' ? state.turnNumber + 1 : state.turnNumber;

      return {
        ...state,
        turn: nextTurn,
        turnNumber: newTurnNumber,
        selectedCard: null,
        selectedMinion: null,
        targeting: null,
      };
    }

    case 'SELECT_CARD': {
      return {
        ...state,
        selectedCard: action.instanceId,
        selectedMinion: null,
        targeting: null,
      };
    }

    case 'DESELECT_CARD': {
      return {
        ...state,
        selectedCard: null,
        targeting: null,
      };
    }

    case 'PLAY_CARD': {
      const playerKey = state.turn;
      const currentPlayer = state[playerKey];
      const cardIndex = currentPlayer.hand.findIndex(
        (c) => c.instanceId === action.instanceId
      );

      if (cardIndex === -1) return state;

      const cardInstance = currentPlayer.hand[cardIndex];
      const card = cardInstance.card;

      // Check mana
      if (currentPlayer.currentMana < card.manaCost) return state;

      // Remove from hand and spend mana
      const newHand = [...currentPlayer.hand];
      newHand.splice(cardIndex, 1);
      const newMana = currentPlayer.currentMana - card.manaCost;

      let updatedPlayer: PlayerState = {
        ...currentPlayer,
        hand: newHand,
        currentMana: newMana,
      };

      // Handle card type
      if (card.cardType === 'MINION') {
        if (currentPlayer.board.length >= MAX_BOARD_SIZE) return state;

        const minion = createMinionInstance(card, playerKey);
        const position = action.position ?? currentPlayer.board.length;
        const newBoard = [...currentPlayer.board];
        newBoard.splice(position, 0, minion);

        updatedPlayer = {
          ...updatedPlayer,
          board: newBoard,
        };
      } else if (card.cardType === 'WEAPON') {
        const weapon = createWeaponInstance(card);
        updatedPlayer = {
          ...updatedPlayer,
          weapon,
          canAttackWithHero: true,
        };
      }
      // SPELL effects are handled separately via APPLY_EFFECT

      return {
        ...state,
        [playerKey]: updatedPlayer,
        selectedCard: null,
        targeting: null,
        lastAction: action,
      };
    }

    case 'SELECT_MINION': {
      return {
        ...state,
        selectedMinion: action.instanceId,
        selectedCard: null,
      };
    }

    case 'DESELECT_MINION': {
      return {
        ...state,
        selectedMinion: null,
        targeting: null,
      };
    }

    case 'SET_TARGETING': {
      return {
        ...state,
        targeting: action.targeting,
      };
    }

    case 'ATTACK': {
      const attackerOwner = state.player.board.some(
        (m) => m.instanceId === action.attackerId
      )
        ? 'player'
        : 'opponent';
      const attackerPlayer = state[attackerOwner];
      const defenderOwner = getOtherPlayer(attackerOwner);

      const attackerIndex = attackerPlayer.board.findIndex(
        (m) => m.instanceId === action.attackerId
      );
      if (attackerIndex === -1) return state;

      const attacker = attackerPlayer.board[attackerIndex];

      // Check if can attack
      const maxAttacks = attacker.keywords.has('Windfury')
        ? WINDFURY_ATTACKS
        : NORMAL_ATTACKS;
      if (attacker.attacksThisTurn >= maxAttacks || !attacker.canAttack) {
        return state;
      }

      // Check if target is hero
      if (action.targetId === `hero_${defenderOwner}`) {
        // Attack hero
        const defenderPlayer = state[defenderOwner];
        const newDefenderHealth = defenderPlayer.health - attacker.currentAttack;

        // Mark attacker as having attacked
        const newAttackerBoard = [...attackerPlayer.board];
        newAttackerBoard[attackerIndex] = {
          ...attacker,
          hasAttacked: true,
          attacksThisTurn: attacker.attacksThisTurn + 1,
        };

        // Lifesteal
        let attackerPlayerHealth = attackerPlayer.health;
        if (attacker.keywords.has('Lifesteal')) {
          attackerPlayerHealth = Math.min(
            attackerPlayer.maxHealth,
            attackerPlayerHealth + attacker.currentAttack
          );
        }

        return {
          ...state,
          [attackerOwner]: {
            ...attackerPlayer,
            board: newAttackerBoard,
            health: attackerPlayerHealth,
          },
          [defenderOwner]: {
            ...defenderPlayer,
            health: newDefenderHealth,
          },
          selectedMinion: null,
          targeting: null,
          lastAction: action,
        };
      }

      // Attack minion
      const defenderPlayer = state[defenderOwner];
      const defenderIndex = defenderPlayer.board.findIndex(
        (m) => m.instanceId === action.targetId
      );
      if (defenderIndex === -1) return state;

      const defender = defenderPlayer.board[defenderIndex];

      // Calculate damage
      let attackerDamage = defender.currentAttack;
      let defenderDamage = attacker.currentAttack;

      // Divine Shield handling
      let newAttackerShield = attacker.hasDivineShield;
      let newDefenderShield = defender.hasDivineShield;

      if (attacker.hasDivineShield && attackerDamage > 0) {
        attackerDamage = 0;
        newAttackerShield = false;
      }

      if (defender.hasDivineShield && defenderDamage > 0) {
        defenderDamage = 0;
        newDefenderShield = false;
      }

      const newAttackerHealth = attacker.currentHealth - attackerDamage;
      const newDefenderHealth = defender.currentHealth - defenderDamage;

      // Update attacker board
      const newAttackerBoard = [...attackerPlayer.board];
      newAttackerBoard[attackerIndex] = {
        ...attacker,
        currentHealth: newAttackerHealth,
        hasAttacked: true,
        attacksThisTurn: attacker.attacksThisTurn + 1,
        hasDivineShield: newAttackerShield,
      };

      // Update defender board
      const newDefenderBoard = [...defenderPlayer.board];
      newDefenderBoard[defenderIndex] = {
        ...defender,
        currentHealth: newDefenderHealth,
        hasDivineShield: newDefenderShield,
      };

      // Lifesteal for attacker
      let attackerPlayerHealth = attackerPlayer.health;
      if (attacker.keywords.has('Lifesteal') && defenderDamage > 0) {
        attackerPlayerHealth = Math.min(
          attackerPlayer.maxHealth,
          attackerPlayerHealth + defenderDamage
        );
      }

      return {
        ...state,
        [attackerOwner]: {
          ...attackerPlayer,
          board: newAttackerBoard,
          health: attackerPlayerHealth,
        },
        [defenderOwner]: {
          ...defenderPlayer,
          board: newDefenderBoard,
        },
        selectedMinion: null,
        targeting: null,
        lastAction: action,
      };
    }

    case 'HERO_ATTACK': {
      const attackerOwner = state.turn;
      const attackerPlayer = state[attackerOwner];
      const defenderOwner = getOtherPlayer(attackerOwner);
      const defenderPlayer = state[defenderOwner];

      const weapon = attackerPlayer.weapon;
      if (!weapon) {
        return state;
      }

      const heroMaxAttacks = weapon.card.keywords.includes('Windfury')
        ? WINDFURY_ATTACKS
        : NORMAL_ATTACKS;
      if (attackerPlayer.heroAttacksThisTurn >= heroMaxAttacks) {
        return state;
      }
      const damage = weapon.currentAttack;

      // Check if target is hero
      if (action.targetId === `hero_${defenderOwner}`) {
        const newDefenderHealth = defenderPlayer.health - damage;
        const newDurability = weapon.currentDurability - 1;

        // Lifesteal
        let newAttackerHealth = attackerPlayer.health;
        if (weapon.card.keywords.includes('Lifesteal')) {
          newAttackerHealth = Math.min(
            attackerPlayer.maxHealth,
            newAttackerHealth + damage
          );
        }

        return {
          ...state,
          [attackerOwner]: {
            ...attackerPlayer,
            heroAttacksThisTurn: attackerPlayer.heroAttacksThisTurn + 1,
            health: newAttackerHealth,
            weapon: newDurability > 0 ? { ...weapon, currentDurability: newDurability } : null,
            canAttackWithHero: newDurability > 0,
          },
          [defenderOwner]: {
            ...defenderPlayer,
            health: newDefenderHealth,
          },
          selectedMinion: null,
          targeting: null,
          lastAction: action,
        };
      }

      // Attack minion with hero
      const defenderIndex = defenderPlayer.board.findIndex(
        (m) => m.instanceId === action.targetId
      );
      if (defenderIndex === -1) return state;

      const defender = defenderPlayer.board[defenderIndex];
      let defenderDamage = damage;

      // Divine Shield
      let newDefenderShield = defender.hasDivineShield;
      if (defender.hasDivineShield && defenderDamage > 0) {
        defenderDamage = 0;
        newDefenderShield = false;
      }

      const newDefenderHealth = defender.currentHealth - defenderDamage;
      const newDurability = weapon.currentDurability - 1;

      // Hero takes damage from minion
      const heroTakesDamage = defender.currentAttack;
      let newAttackerHealth = attackerPlayer.health - heroTakesDamage;

      // Lifesteal
      if (weapon.card.keywords.includes('Lifesteal') && defenderDamage > 0) {
        newAttackerHealth = Math.min(
          attackerPlayer.maxHealth,
          newAttackerHealth + defenderDamage
        );
      }

      const newDefenderBoard = [...defenderPlayer.board];
      newDefenderBoard[defenderIndex] = {
        ...defender,
        currentHealth: newDefenderHealth,
        hasDivineShield: newDefenderShield,
      };

      return {
        ...state,
        [attackerOwner]: {
          ...attackerPlayer,
          heroAttacksThisTurn: attackerPlayer.heroAttacksThisTurn + 1,
          health: newAttackerHealth,
          weapon: newDurability > 0 ? { ...weapon, currentDurability: newDurability } : null,
          canAttackWithHero: newDurability > 0,
        },
        [defenderOwner]: {
          ...defenderPlayer,
          board: newDefenderBoard,
        },
        selectedMinion: null,
        targeting: null,
        lastAction: action,
      };
    }

    case 'DAMAGE_MINION': {
      // Find the minion
      let playerKey: PlayerTurn = 'player';
      let minionIndex = state.player.board.findIndex(
        (m) => m.instanceId === action.instanceId
      );

      if (minionIndex === -1) {
        playerKey = 'opponent';
        minionIndex = state.opponent.board.findIndex(
          (m) => m.instanceId === action.instanceId
        );
      }

      if (minionIndex === -1) return state;

      const player = state[playerKey];
      const minion = player.board[minionIndex];

      let damage = action.amount;
      let newShield = minion.hasDivineShield;

      // Divine Shield absorbs damage
      if (minion.hasDivineShield && damage > 0) {
        damage = 0;
        newShield = false;
      }

      const newBoard = [...player.board];
      newBoard[minionIndex] = {
        ...minion,
        currentHealth: minion.currentHealth - damage,
        hasDivineShield: newShield,
      };

      return {
        ...state,
        [playerKey]: {
          ...player,
          board: newBoard,
        },
        lastAction: action,
      };
    }

    case 'DAMAGE_HERO': {
      const player = state[action.player];
      return {
        ...state,
        [action.player]: {
          ...player,
          health: player.health - action.amount,
        },
        lastAction: action,
      };
    }

    case 'HEAL_MINION': {
      let playerKey: PlayerTurn = 'player';
      let minionIndex = state.player.board.findIndex(
        (m) => m.instanceId === action.instanceId
      );

      if (minionIndex === -1) {
        playerKey = 'opponent';
        minionIndex = state.opponent.board.findIndex(
          (m) => m.instanceId === action.instanceId
        );
      }

      if (minionIndex === -1) return state;

      const player = state[playerKey];
      const minion = player.board[minionIndex];
      const newHealth = Math.min(minion.maxHealth, minion.currentHealth + action.amount);

      const newBoard = [...player.board];
      newBoard[minionIndex] = {
        ...minion,
        currentHealth: newHealth,
      };

      return {
        ...state,
        [playerKey]: {
          ...player,
          board: newBoard,
        },
        lastAction: action,
      };
    }

    case 'HEAL_HERO': {
      const player = state[action.player];
      const newHealth = Math.min(player.maxHealth, player.health + action.amount);
      return {
        ...state,
        [action.player]: {
          ...player,
          health: newHealth,
        },
        lastAction: action,
      };
    }

    case 'BUFF_MINION': {
      let playerKey: PlayerTurn = 'player';
      let minionIndex = state.player.board.findIndex(
        (m) => m.instanceId === action.instanceId
      );

      if (minionIndex === -1) {
        playerKey = 'opponent';
        minionIndex = state.opponent.board.findIndex(
          (m) => m.instanceId === action.instanceId
        );
      }

      if (minionIndex === -1) return state;

      const player = state[playerKey];
      const minion = player.board[minionIndex];

      const newBoard = [...player.board];
      newBoard[minionIndex] = {
        ...minion,
        currentAttack: minion.currentAttack + action.attack,
        currentHealth: minion.currentHealth + action.health,
        maxHealth: minion.maxHealth + action.health,
      };

      return {
        ...state,
        [playerKey]: {
          ...player,
          board: newBoard,
        },
        lastAction: action,
      };
    }

    case 'DESTROY_MINION': {
      let playerKey: PlayerTurn = 'player';
      let minionIndex = state.player.board.findIndex(
        (m) => m.instanceId === action.instanceId
      );

      if (minionIndex === -1) {
        playerKey = 'opponent';
        minionIndex = state.opponent.board.findIndex(
          (m) => m.instanceId === action.instanceId
        );
      }

      if (minionIndex === -1) return state;

      const player = state[playerKey];
      const newBoard = removeMinionFromBoard(player.board, action.instanceId);

      return {
        ...state,
        [playerKey]: {
          ...player,
          board: newBoard,
        },
        lastAction: action,
      };
    }

    case 'SUMMON_MINION': {
      const playerKey = action.owner;
      const player = state[playerKey];

      if (player.board.length >= MAX_BOARD_SIZE) return state;

      // Create a token minion
      const tokenCard: Card = {
        id: -1,
        handle: 'token',
        cardType: 'MINION',
        name: 'Token',
        manaCost: 0,
        attack: action.attack,
        health: action.health,
        keywords: [],
        abilityText: '',
        flavorText: '',
        rarity: 'COMMON',
        generatedImageUrl: '',
      };

      const minion = createMinionInstance(tokenCard, playerKey);
      const position = action.position ?? player.board.length;
      const newBoard = [...player.board];
      newBoard.splice(position, 0, minion);

      return {
        ...state,
        [playerKey]: {
          ...player,
          board: newBoard,
        },
        lastAction: action,
      };
    }

    case 'EQUIP_WEAPON': {
      // Find the weapon card
      const playerKey = state.turn;
      const player = state[playerKey];
      const cardIndex = player.hand.findIndex(
        (c) => c.instanceId === action.instanceId
      );

      if (cardIndex === -1) return state;

      const cardInstance = player.hand[cardIndex];
      if (cardInstance.card.cardType !== 'WEAPON') return state;

      const weapon = createWeaponInstance(cardInstance.card);
      const newHand = [...player.hand];
      newHand.splice(cardIndex, 1);
      const newMana = player.currentMana - cardInstance.card.manaCost;

      return {
        ...state,
        [playerKey]: {
          ...player,
          hand: newHand,
          currentMana: newMana,
          weapon,
          canAttackWithHero: true,
        },
        selectedCard: null,
        targeting: null,
        lastAction: action,
      };
    }

    case 'CHECK_DEATHS': {
      // Remove dead minions from both boards
      const newPlayerBoard = state.player.board.filter(
        (m) => m.currentHealth > 0
      );
      const newOpponentBoard = state.opponent.board.filter(
        (m) => m.currentHealth > 0
      );

      // Check for game over
      let newPhase = state.phase;
      let winner = state.winner;

      if (state.player.health <= 0 || state.opponent.health <= 0) {
        newPhase = 'GAME_OVER';
        if (state.opponent.health <= 0 && state.player.health > 0) {
          winner = 'player';
        } else if (state.player.health <= 0 && state.opponent.health > 0) {
          winner = 'opponent';
        }
        // If both dead, no winner (draw)
      }

      return {
        ...state,
        player: {
          ...state.player,
          board: newPlayerBoard,
        },
        opponent: {
          ...state.opponent,
          board: newOpponentBoard,
        },
        phase: newPhase,
        winner,
      };
    }

    case 'GAME_OVER': {
      return {
        ...state,
        phase: 'GAME_OVER',
        winner: action.winner,
      };
    }

    case 'TOGGLE_TUTORIAL': {
      return {
        ...state,
        tutorialMode: !state.tutorialMode,
      };
    }

    case 'REFRESH_MANA': {
      const player = state[action.player];
      const newMana = Math.min(player.maxMana, player.currentMana + action.amount);
      return {
        ...state,
        [action.player]: {
          ...player,
          currentMana: newMana,
        },
        lastAction: action,
      };
    }

    default:
      return state;
  }
}
