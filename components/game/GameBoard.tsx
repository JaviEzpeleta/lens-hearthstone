'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGame } from '@/lib/game/context';
import { Card, CardInstance, MinionInstance } from '@/lib/game/types';
import {
  canMinionAttack,
  getValidAttackTargets,
  needsManualTarget,
  canPlayCard,
} from '@/lib/game/utils';
import { MAX_BOARD_SIZE, WINDFURY_ATTACKS, NORMAL_ATTACKS } from '@/lib/game/constants';
import { OpponentArea } from './OpponentArea';
import { PlayerArea } from './PlayerArea';
import { TargetingOverlay } from './TargetingOverlay';
import { GameOverModal } from './GameOverModal';
import { CardDetailsModal } from './CardDetailsModal';
import { TutorialModal } from './TutorialModal';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { useTutorialToasts } from '@/hooks/useTutorialToasts';

interface GameBoardProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameBoard({ onPlayAgain, onBackToMenu }: GameBoardProps) {
  const {
    state,
    selectCard,
    deselectCard,
    playCard,
    selectMinion,
    deselectMinion,
    attack,
    heroAttack,
    endTurn,
    toggleTutorial,
  } = useGame();

  const { lightTap, mediumTap, heavyTap } = useHaptics();
  const { select, cardPlay, weaponEquip, attack: attackSound, summon } = useSounds();
  const { showTip } = useTutorialToasts(state.tutorialMode);

  // Show first turn tip when tutorial mode is on and it's the first turn
  useEffect(() => {
    if (state.tutorialMode && state.turnNumber === 1 && state.turn === 'player') {
      showTip('first_turn');
    }
  }, [state.tutorialMode, state.turnNumber, state.turn, showTip]);

  // Card preview state
  const [previewCard, setPreviewCard] = useState<{
    card: Card;
    minionInstance?: MinionInstance;
  } | null>(null);

  // Tutorial modal state
  const [showTutorial, setShowTutorial] = useState(false);

  const isMyTurn = state.turn === 'player' && state.phase === 'PLAYING';

  // Determine which minions can attack
  const canAttackMinionIds = state.player.board
    .filter((m) => canMinionAttack(m))
    .map((m) => m.instanceId);

  // Check if player can attack with hero (weapon)
  const canHeroAttack = (() => {
    if (!isMyTurn || !state.player.weapon) return false;
    const heroMaxAttacks = state.player.weapon.card.keywords.includes('Windfury')
      ? WINDFURY_ATTACKS
      : NORMAL_ATTACKS;
    return state.player.heroAttacksThisTurn < heroMaxAttacks;
  })();

  // Determine valid targets based on current selection
  const getTargetableMinionIds = (): { playerTargets: string[]; opponentTargets: string[] } => {
    const playerTargets: string[] = [];
    const opponentTargets: string[] = [];

    // If hero is selected for weapon attack
    if (state.selectedMinion === 'hero_player' && canHeroAttack) {
      const hasTaunts = state.opponent.board.some((m) => m.keywords.has('Taunt'));
      if (hasTaunts) {
        // Can only target taunt minions
        opponentTargets.push(
          ...state.opponent.board.filter((m) => m.keywords.has('Taunt')).map((m) => m.instanceId)
        );
      } else {
        // Can target all enemy minions
        opponentTargets.push(...state.opponent.board.map((m) => m.instanceId));
      }
    }

    // If we have a minion selected for attacking
    if (state.selectedMinion && state.selectedMinion !== 'hero_player') {
      const minion = state.player.board.find((m) => m.instanceId === state.selectedMinion);
      if (minion && canMinionAttack(minion)) {
        const targets = getValidAttackTargets(state, minion, 'player');
        targets.forEach((t) => {
          if (t.startsWith('hero_')) return; // Hero handled separately
          if (state.opponent.board.some((m) => m.instanceId === t)) {
            opponentTargets.push(t);
          }
        });
      }
    }

    // If we have a card selected that needs a target
    if (state.selectedCard) {
      const cardInstance = state.player.hand.find((c) => c.instanceId === state.selectedCard);
      if (cardInstance) {
        const effect = cardInstance.card.spellEffect;
        if (effect && needsManualTarget(effect.target)) {
          // Add appropriate targets based on effect target type
          switch (effect.target) {
            case 'FRIENDLY_MINION':
              playerTargets.push(...state.player.board.map((m) => m.instanceId));
              break;
            case 'ENEMY_MINION':
              opponentTargets.push(...state.opponent.board.map((m) => m.instanceId));
              break;
            case 'ANY_CHARACTER':
              playerTargets.push(...state.player.board.map((m) => m.instanceId));
              opponentTargets.push(...state.opponent.board.map((m) => m.instanceId));
              break;
          }
        }
      }
    }

    return { playerTargets, opponentTargets };
  };

  const { playerTargets, opponentTargets } = getTargetableMinionIds();

  // Check if opponent hero is targetable
  const isOpponentHeroTargetable = (): boolean => {
    if (state.selectedMinion) {
      const minion = state.player.board.find((m) => m.instanceId === state.selectedMinion);
      if (minion && canMinionAttack(minion)) {
        const targets = getValidAttackTargets(state, minion, 'player');
        return targets.includes('hero_opponent');
      }
    }

    // Hero weapon attack
    if (state.player.weapon && isMyTurn) {
      const heroMaxAttacks = state.player.weapon.card.keywords.includes('Windfury')
        ? WINDFURY_ATTACKS
        : NORMAL_ATTACKS;
      if (state.player.heroAttacksThisTurn < heroMaxAttacks) {
        // Check for taunts
        const hasTaunts = state.opponent.board.some((m) => m.keywords.has('Taunt'));
        return !hasTaunts;
      }
    }

    return false;
  };

  // Handle card selection
  const handleCardClick = (cardInstance: CardInstance) => {
    if (!isMyTurn) return;

    lightTap();
    select();

    // If same card, deselect
    if (state.selectedCard === cardInstance.instanceId) {
      deselectCard();
      return;
    }

    // Check if card is playable
    if (!canPlayCard(state.player, cardInstance.card)) {
      // Could show error toast
      return;
    }

    deselectMinion();
    selectCard(cardInstance.instanceId);

    // If minion and we can play it directly, check if it needs target
    const card = cardInstance.card;
    if (card.cardType === 'MINION') {
      // Minion - will need to select position if board has minions
      // For now, auto-play at end if no battlecry target needed
      if (state.player.board.length < MAX_BOARD_SIZE) {
        const hasBattlecryTarget =
          card.minionEffect?.trigger === 'BATTLECRY' &&
          card.minionEffect.effects.some((e) => needsManualTarget(e.target));

        if (!hasBattlecryTarget) {
          // Auto-play at end of board
          mediumTap();
          cardPlay();
          summon();
          playCard(cardInstance.instanceId, state.player.board.length);

          // Show tutorial tips based on keywords
          if (card.keywords.includes('Rush')) {
            showTip('minion_rush');
          } else if (card.keywords.includes('Taunt')) {
            showTip('minion_taunt');
          } else {
            showTip('minion_played');
          }
          if (card.keywords.includes('Divine Shield')) {
            showTip('divine_shield');
          }
          if (card.keywords.includes('Lifesteal')) {
            showTip('lifesteal');
          }
          if (card.keywords.includes('Windfury')) {
            showTip('windfury');
          }
          if (card.minionEffect?.trigger === 'BATTLECRY') {
            showTip('battlecry');
          }
        }
      }
    } else if (card.cardType === 'WEAPON') {
      // Equip weapon directly
      mediumTap();
      weaponEquip();
      playCard(cardInstance.instanceId);
      showTip('weapon_equipped');
    } else if (card.cardType === 'SPELL') {
      // Check if spell needs target
      if (card.spellEffect && !needsManualTarget(card.spellEffect.target)) {
        // No target needed, play immediately
        mediumTap();
        cardPlay();
        playCard(cardInstance.instanceId);
        showTip('spell_played');
      }
      // Otherwise, wait for target selection
    }
  };

  // Handle minion click on player board
  const handlePlayerMinionClick = (minion: MinionInstance) => {
    if (!isMyTurn) return;

    lightTap();
    select();

    // If we have a spell that targets friendly minions
    if (state.selectedCard) {
      const cardInstance = state.player.hand.find((c) => c.instanceId === state.selectedCard);
      if (cardInstance?.card.spellEffect) {
        const target = cardInstance.card.spellEffect.target;
        if (target === 'FRIENDLY_MINION' || target === 'ANY_CHARACTER') {
          mediumTap();
          cardPlay();
          playCard(state.selectedCard, undefined, minion.instanceId);
          showTip('spell_played');
          return;
        }
      }
    }

    // Select minion for attacking
    if (canMinionAttack(minion)) {
      if (state.selectedMinion === minion.instanceId) {
        deselectMinion();
      } else {
        selectMinion(minion.instanceId);
      }
    }
  };

  // Handle minion click on opponent board
  const handleOpponentMinionClick = (minion: MinionInstance) => {
    if (!isMyTurn) return;

    lightTap();

    // If hero is selected for weapon attack on minion
    if (state.selectedMinion === 'hero_player') {
      if (canHeroAttack) {
        // Check if this minion is a valid target (respects taunt)
        const hasTaunts = state.opponent.board.some((m) => m.keywords.has('Taunt'));
        const canTarget = !hasTaunts || minion.keywords.has('Taunt');
        if (canTarget) {
          heavyTap();
          attackSound();
          heroAttack(minion.instanceId);
          deselectMinion();
          return;
        }
      }
    }

    // If we have a minion selected, attack
    if (state.selectedMinion) {
      const attacker = state.player.board.find((m) => m.instanceId === state.selectedMinion);
      if (attacker && canMinionAttack(attacker)) {
        const targets = getValidAttackTargets(state, attacker, 'player');
        if (targets.includes(minion.instanceId)) {
          heavyTap();
          attackSound();
          attack(state.selectedMinion, minion.instanceId);
          showTip('minion_attacked');
          return;
        }
      }
    }

    // If we have a spell that targets enemy minions
    if (state.selectedCard) {
      const cardInstance = state.player.hand.find((c) => c.instanceId === state.selectedCard);
      if (cardInstance?.card.spellEffect) {
        const target = cardInstance.card.spellEffect.target;
        if (target === 'ENEMY_MINION' || target === 'ANY_CHARACTER') {
          mediumTap();
          cardPlay();
          playCard(state.selectedCard, undefined, minion.instanceId);
          showTip('spell_played');
          return;
        }
      }
    }
  };

  // Handle opponent hero click
  const handleOpponentHeroClick = () => {
    if (!isMyTurn) return;

    lightTap();

    // If hero is selected for weapon attack
    if (state.selectedMinion === 'hero_player') {
      if (canHeroAttack && isOpponentHeroTargetable()) {
        heavyTap();
        attackSound();
        heroAttack('hero_opponent');
        deselectMinion();
        return;
      }
    }

    // If we have a minion selected, attack hero
    if (state.selectedMinion) {
      const attacker = state.player.board.find((m) => m.instanceId === state.selectedMinion);
      if (attacker && canMinionAttack(attacker)) {
        const targets = getValidAttackTargets(state, attacker, 'player');
        if (targets.includes('hero_opponent')) {
          heavyTap();
          attackSound();
          attack(state.selectedMinion, 'hero_opponent');
          return;
        }
      }
    }

    // If we have a spell that targets enemy hero
    if (state.selectedCard) {
      const cardInstance = state.player.hand.find((c) => c.instanceId === state.selectedCard);
      if (cardInstance?.card.spellEffect?.target === 'ENEMY_HERO') {
        mediumTap();
        cardPlay();
        playCard(state.selectedCard, undefined, 'hero_opponent');
        return;
      }
    }
  };

  // Handle player hero click (for weapon attacks)
  const handlePlayerHeroClick = () => {
    if (!isMyTurn || !canHeroAttack) return;

    lightTap();
    select();

    // If no minion selected, select hero for weapon attack
    // Then user taps a target
    // For simplicity, we'll make hero attacks work with selectedMinion as 'hero_player'
    if (state.selectedMinion === 'hero_player') {
      deselectMinion();
    } else {
      selectMinion('hero_player');
    }
  };

  // Handle board slot click for minion placement
  const handleBoardSlotClick = (position: number) => {
    if (!isMyTurn || !state.selectedCard) return;

    const cardInstance = state.player.hand.find((c) => c.instanceId === state.selectedCard);
    if (cardInstance?.card.cardType === 'MINION') {
      mediumTap();
      cardPlay();
      summon();
      playCard(state.selectedCard, position);
    }
  };

  // Handle end turn
  const handleEndTurn = () => {
    if (!isMyTurn) return;
    mediumTap();
    endTurn();
  };

  // Handle card long-press (show details)
  const handleCardLongPress = (cardInstance: CardInstance) => {
    lightTap();
    setPreviewCard({ card: cardInstance.card });
  };

  // Handle minion long-press (show details with current stats)
  const handleMinionLongPress = (minion: MinionInstance) => {
    lightTap();
    setPreviewCard({ card: minion.card, minionInstance: minion });
  };

  // Handle weapon long-press (show details)
  const handleWeaponLongPress = () => {
    if (state.player.weapon) {
      lightTap();
      setPreviewCard({ card: state.player.weapon.card });
    }
  };

  // Close card preview
  const handleClosePreview = () => {
    setPreviewCard(null);
  };

  // Show placement slots when minion card is selected
  const showPlacementSlots =
    isMyTurn &&
    state.selectedCard !== null &&
    state.player.hand.some(
      (c) =>
        c.instanceId === state.selectedCard && c.card.cardType === 'MINION'
    );

  // Targeting state
  const isTargeting = state.selectedMinion !== null || (state.selectedCard !== null && state.player.hand.some(
    (c) => c.instanceId === state.selectedCard && c.card.spellEffect && needsManualTarget(c.card.spellEffect.target)
  ));

  const getTargetingMessage = (): string => {
    if (state.selectedMinion) {
      return 'Select a target to attack';
    }
    if (state.selectedCard) {
      return 'Select a target for the spell';
    }
    return 'Select a target';
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950" />
      <div className="absolute inset-0 bg-leather-texture" />
      <div className="absolute inset-0 bg-vignette pointer-events-none" />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Epic turn indicator */}
        <div className="w-full py-1.5 px-4 flex items-center justify-center">
          <div
            className={cn(
              'px-6 py-1.5 rounded-sm',
              'bg-parchment',
              'border-x-4',
              isMyTurn ? 'border-amber-600' : 'border-purple-700',
              'animate-scroll-unfurl'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Decorative icon */}
              <span className="text-base">
                {isMyTurn ? '⚔️' : '👁️'}
              </span>

              {/* Turn text */}
              <span
                className={cn(
                  'font-display text-sm tracking-wide',
                  isMyTurn ? 'text-amber-200' : 'text-purple-200'
                )}
              >
                {isMyTurn ? 'Your Turn' : "Enemy's Turn"}
              </span>

              {/* Turn number */}
              <span className="text-xs text-gray-400 font-medium">
                #{state.turnNumber}
              </span>

              {/* Decorative icon */}
              <span className="text-base">
                {isMyTurn ? '⚔️' : '👁️'}
              </span>
            </div>
          </div>
        </div>

        {/* Opponent area */}
        <OpponentArea
          opponent={state.opponent}
          selectedMinionId={state.selectedMinion}
          targetableMinionIds={opponentTargets}
          isHeroTargetable={isOpponentHeroTargetable()}
          onHeroClick={handleOpponentHeroClick}
          onMinionClick={handleOpponentMinionClick}
          onMinionLongPress={handleMinionLongPress}
        />

        {/* Battlefield divider - ornate golden line */}
        <div className="w-full h-px relative my-1">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {/* Center ornament */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border border-gold/40 bg-gray-900" />
        </div>

        {/* Player area */}
        <PlayerArea
          player={state.player}
          selectedCardId={state.selectedCard}
          selectedMinionId={state.selectedMinion}
          targetableMinionIds={playerTargets}
          canAttackMinionIds={canAttackMinionIds}
          isHeroTargetable={false}
          canHeroAttack={canHeroAttack}
          showPlacementSlots={showPlacementSlots}
          tutorialMode={state.tutorialMode}
          onHeroClick={handlePlayerHeroClick}
          onMinionClick={handlePlayerMinionClick}
          onMinionLongPress={handleMinionLongPress}
          onCardClick={handleCardClick}
          onCardLongPress={handleCardLongPress}
          onWeaponLongPress={handleWeaponLongPress}
          onBoardSlotClick={handleBoardSlotClick}
          onEndTurnClick={handleEndTurn}
          onHelpClick={() => setShowTutorial(true)}
          onToggleTutorial={toggleTutorial}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Targeting overlay */}
      <TargetingOverlay
        isActive={isTargeting}
        message={getTargetingMessage()}
        onCancel={() => {
          deselectCard();
          deselectMinion();
        }}
      />

      {/* Game over modal */}
      <GameOverModal
        isOpen={state.phase === 'GAME_OVER'}
        winner={state.winner}
        onPlayAgain={onPlayAgain}
        onBackToMenu={onBackToMenu}
      />

      {/* Card details preview modal */}
      <CardDetailsModal
        isOpen={previewCard !== null}
        card={previewCard?.card ?? null}
        minionInstance={previewCard?.minionInstance}
        onClose={handleClosePreview}
      />

      {/* Tutorial modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
