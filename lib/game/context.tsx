'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  GameState,
  GameAction,
  Card,
  TargetingState,
  MinionInstance,
  AIDifficulty,
} from './types';
import { gameReducer, createInitialGameState } from './reducer';
import {
  canPlayCard,
  canMinionAttack,
  getValidAttackTargets,
} from './utils';
import { executeSpellEffect, executeBattlecry, effectNeedsTarget } from './effects';
import { getBestDecision } from './ai';
import { getAIDelays } from './constants';
import { playSound } from './sounds';

// ===========================================
// Context Types
// ===========================================

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;

  // Game lifecycle
  startGame: (playerDeck: Card[], opponentDeck: Card[], difficulty: AIDifficulty) => void;
  endTurn: () => void;

  // Card selection
  selectCard: (instanceId: string) => void;
  deselectCard: () => void;

  // Card playing
  playCard: (instanceId: string, position?: number, targetId?: string) => void;
  canPlaySelectedCard: () => boolean;

  // Minion selection
  selectMinion: (instanceId: string) => void;
  deselectMinion: () => void;

  // Attacks
  attack: (attackerId: string, targetId: string) => void;
  heroAttack: (targetId: string) => void;

  // Targeting
  setTargeting: (targeting: TargetingState | null) => void;
  getValidTargets: () => string[];
  cancelTargeting: () => void;

  // Queries
  isMyTurn: () => boolean;
  canAttackWith: (minion: MinionInstance) => boolean;
  getAttackTargets: (minion: MinionInstance) => string[];

  // Tutorial
  toggleTutorial: () => void;
}

// ===========================================
// Context
// ===========================================

const GameContext = createContext<GameContextValue | null>(null);

// ===========================================
// Provider
// ===========================================

interface GameProviderProps {
  children: ReactNode;
  lensAddress?: string;
  lensHandle?: string;
  lensAvatar?: string;
}

export function GameProvider({ children, lensAddress, lensHandle, lensAvatar }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, createInitialGameState());
  const aiTurnInProgress = useRef(false);
  const stateRef = useRef(state);
  // Keep stateRef synchronized with state to avoid stale closures
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // AI Turn Logic
  useEffect(() => {
    if (
      state.phase === 'PLAYING' &&
      state.turn === 'opponent' &&
      !aiTurnInProgress.current
    ) {
      aiTurnInProgress.current = true;

      const runAITurn = async () => {
        // Get difficulty-adjusted delays
        const { thinkDelay, actionDelay } = getAIDelays(stateRef.current.difficulty);
        // Initial delay before AI starts
        await new Promise((resolve) => setTimeout(resolve, thinkDelay));

        let actionsThisTurn = 0;
        const maxActions = 15;

        while (actionsThisTurn < maxActions) {
          // Use stateRef.current to get the FRESH state, avoiding stale closure
          const currentState = stateRef.current;

          // Check if still opponent's turn (game may have ended or turn changed)
          if (currentState.turn !== 'opponent' || currentState.phase !== 'PLAYING') {
            break;
          }

          // Get decision using fresh state and difficulty
          const decision = getBestDecision(currentState, currentState.difficulty);

          if (!decision || decision.priority <= 0) {
            break;
          }

          actionsThisTurn++;

          // Play sound based on action type
          if (decision.action.type === 'PLAY_CARD') {
            playSound('card_play');
          } else if (decision.action.type === 'ATTACK') {
            playSound('attack');
          }

          // Dispatch the action
          dispatch(decision.action);

          // Small delay between actions for visual feedback
          await new Promise((resolve) => setTimeout(resolve, actionDelay));

          // Check deaths
          dispatch({ type: 'CHECK_DEATHS' });

          // Wait for state to update before next iteration
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Continue loop - stateRef will have fresh state on next iteration
        }

        // End turn after all actions are done (or if no actions were possible)
        const finalState = stateRef.current;
        if (finalState.turn === 'opponent' && finalState.phase === 'PLAYING') {
          await new Promise((resolve) => setTimeout(resolve, 500));
          dispatch({ type: 'END_TURN' });
          await new Promise((resolve) => setTimeout(resolve, 100));
          dispatch({ type: 'START_TURN' });
          // Play turn start sound for player's turn
          playSound('turn_start');
        }

        aiTurnInProgress.current = false;
      };

      runAITurn();
    }
  }, [state]);

  // Game lifecycle
  const startGame = useCallback(
    (playerDeck: Card[], opponentDeck: Card[], difficulty: AIDifficulty) => {
      aiTurnInProgress.current = false;
      dispatch({ type: 'START_GAME', playerDeck, opponentDeck, difficulty });
      // Immediately start first turn
      setTimeout(() => {
        dispatch({ type: 'START_TURN' });
        playSound('turn_start');
      }, 100);
    },
    []
  );

  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
    // Next player's turn starts - opponent's turn begins (no sound for opponent)
    setTimeout(() => dispatch({ type: 'START_TURN' }), 100);
  }, []);

  // Card selection
  const selectCard = useCallback((instanceId: string) => {
    dispatch({ type: 'SELECT_CARD', instanceId });
  }, []);

  const deselectCard = useCallback(() => {
    dispatch({ type: 'DESELECT_CARD' });
  }, []);

  // Card playing with effects
  const playCard = useCallback(
    (instanceId: string, position?: number, targetId?: string) => {
      // First, play the card
      dispatch({ type: 'PLAY_CARD', instanceId, position, targetId });

      // Get the card to check for effects
      const cardInstance = state.player.hand.find(
        (c) => c.instanceId === instanceId
      );

      if (cardInstance) {
        const card = cardInstance.card;

        // Execute spell effect
        if (card.cardType === 'SPELL' && card.spellEffect) {
          const actions = executeSpellEffect(
            state,
            card.spellEffect,
            'player',
            targetId
          );
          actions.forEach((action) => {
            setTimeout(() => dispatch(action), 50);
          });
        }

        // Execute battlecry for minions
        if (card.cardType === 'MINION' && card.minionEffect) {
          // Note: The minion was just played, so we need to find it on the board
          // For simplicity, we'll execute with the targetId provided
          const actions = executeBattlecry(
            state,
            card.minionEffect,
            'player',
            instanceId, // This will be the old instance ID, but it's OK for effect resolution
            targetId
          );
          actions.forEach((action) => {
            setTimeout(() => dispatch(action), 50);
          });
        }
      }

      // Check for deaths after playing
      setTimeout(() => dispatch({ type: 'CHECK_DEATHS' }), 100);
    },
    [state]
  );

  const canPlaySelectedCard = useCallback(() => {
    if (!state.selectedCard) return false;
    const cardInstance = state.player.hand.find(
      (c) => c.instanceId === state.selectedCard
    );
    if (!cardInstance) return false;
    return canPlayCard(state.player, cardInstance.card);
  }, [state.selectedCard, state.player]);

  // Minion selection
  const selectMinion = useCallback((instanceId: string) => {
    dispatch({ type: 'SELECT_MINION', instanceId });
  }, []);

  const deselectMinion = useCallback(() => {
    dispatch({ type: 'DESELECT_MINION' });
  }, []);

  // Attacks
  const attack = useCallback(
    (attackerId: string, targetId: string) => {
      dispatch({ type: 'ATTACK', attackerId, targetId });
      // Check for deaths after attack
      setTimeout(() => dispatch({ type: 'CHECK_DEATHS' }), 50);
    },
    []
  );

  const heroAttack = useCallback(
    (targetId: string) => {
      dispatch({ type: 'HERO_ATTACK', targetId });
      // Check for deaths after attack
      setTimeout(() => dispatch({ type: 'CHECK_DEATHS' }), 50);
    },
    []
  );

  // Targeting
  const setTargeting = useCallback((targeting: TargetingState | null) => {
    dispatch({ type: 'SET_TARGETING', targeting });
  }, []);

  const getValidTargets = useCallback(() => {
    if (!state.targeting) return [];
    return state.targeting.validTargets;
  }, [state.targeting]);

  const cancelTargeting = useCallback(() => {
    dispatch({ type: 'SET_TARGETING', targeting: null });
    dispatch({ type: 'DESELECT_CARD' });
    dispatch({ type: 'DESELECT_MINION' });
  }, []);

  // Queries
  const isMyTurn = useCallback(() => {
    return state.turn === 'player' && state.phase === 'PLAYING';
  }, [state.turn, state.phase]);

  const canAttackWith = useCallback(
    (minion: MinionInstance) => {
      if (state.turn !== 'player' || state.phase !== 'PLAYING') return false;
      if (minion.owner !== 'player') return false;
      return canMinionAttack(minion);
    },
    [state.turn, state.phase]
  );

  const getAttackTargets = useCallback(
    (minion: MinionInstance) => {
      if (!canAttackWith(minion)) return [];
      return getValidAttackTargets(state, minion, 'player');
    },
    [state, canAttackWith]
  );

  // Tutorial
  const toggleTutorial = useCallback(() => {
    dispatch({ type: 'TOGGLE_TUTORIAL' });
  }, []);

  // Memoize context value
  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      startGame,
      endTurn,
      selectCard,
      deselectCard,
      playCard,
      canPlaySelectedCard,
      selectMinion,
      deselectMinion,
      attack,
      heroAttack,
      setTargeting,
      getValidTargets,
      cancelTargeting,
      isMyTurn,
      canAttackWith,
      getAttackTargets,
      toggleTutorial,
    }),
    [
      state,
      startGame,
      endTurn,
      selectCard,
      deselectCard,
      playCard,
      canPlaySelectedCard,
      selectMinion,
      deselectMinion,
      attack,
      heroAttack,
      setTargeting,
      getValidTargets,
      cancelTargeting,
      isMyTurn,
      canAttackWith,
      getAttackTargets,
      toggleTutorial,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ===========================================
// Hook
// ===========================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
