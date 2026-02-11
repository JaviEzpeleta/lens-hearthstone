'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import {
  ClientPlayerState,
  HiddenCard,
  SerializedMinionInstance,
  deserializeMinionInstance,
} from '@/lib/game/multiplayer-types';
import { CardInstance, MinionInstance, Card, Keyword, PlayerState } from '@/lib/game/types';
import { needsManualTarget } from '@/lib/game/utils';
import { WINDFURY_ATTACKS, NORMAL_ATTACKS, MAX_BOARD_SIZE } from '@/lib/game/constants';

// Helper for minions that works with both Set and Array keywords
type AnyMinionInstance = MinionInstance | SerializedMinionInstance;

function hasKeyword(minion: AnyMinionInstance, keyword: Keyword): boolean {
  return Array.isArray(minion.keywords)
    ? minion.keywords.includes(keyword)
    : minion.keywords.has(keyword);
}

function canMinionAttack(minion: AnyMinionInstance): boolean {
  if (!minion.canAttack) return false;
  if (minion.currentAttack <= 0) return false;
  const maxAttacks = hasKeyword(minion, 'Windfury') ? WINDFURY_ATTACKS : NORMAL_ATTACKS;
  return minion.attacksThisTurn < maxAttacks;
}
import { OpponentArea } from './OpponentArea';
import { PlayerArea } from './PlayerArea';
import { TargetingOverlay } from './TargetingOverlay';
import { GameOverModal } from './GameOverModal';
import { CardDetailsModal } from './CardDetailsModal';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { Wifi, WifiOff, Loader2, User } from 'lucide-react';

interface MultiplayerBoardProps {
  roomCode: string;
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
  onLeaveGame: () => void;
}

export function MultiplayerBoard({
  roomCode,
  lensAddress,
  lensHandle,
  lensAvatar,
  onLeaveGame,
}: MultiplayerBoardProps) {
  const {
    status,
    error,
    gameState,
    opponentInfo,
    isMyTurn,
    connect,
    disconnect,
    playCard,
    selectCard,
    deselectCard,
    selectMinion,
    deselectMinion,
    attack,
    heroAttack,
    endTurn,
  } = useMultiplayerGame({
    roomCode,
    lensAddress,
    lensHandle,
    lensAvatar,
  });

  const { lightTap, mediumTap, heavyTap } = useHaptics();
  const { select, cardPlay, weaponEquip, attack: attackSound, summon } = useSounds();

  // Local state for UI
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedMinion, setSelectedMinion] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<{
    card: Card;
    minionInstance?: MinionInstance;
  } | null>(null);

  // Connect on mount only (empty deps to prevent reconnection loops)
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only connect on mount

  // Helper to check if hand card is CardInstance or HiddenCard
  const isCardInstance = (card: CardInstance | HiddenCard): card is CardInstance => {
    return 'card' in card;
  };

  // Convert ClientPlayerState to PlayerState for existing components
  // Note: board contains SerializedMinionInstance (keywords as array) but we cast to PlayerState
  // since the components handle both types via hasKeyword helper
  const toPlayerState = (clientState: ClientPlayerState, isOpponent: boolean): PlayerState => {
    // For opponent, hand contains HiddenCards
    const hand = clientState.hand.map((h) => {
      if (isCardInstance(h)) {
        return h;
      }
      // Create a placeholder card for display
      return {
        instanceId: h.instanceId,
        card: {
          id: -1,
          handle: 'hidden',
          cardType: 'MINION' as const,
          name: 'Hidden',
          manaCost: 0,
          keywords: [],
          abilityText: '',
          flavorText: '',
          rarity: 'COMMON' as const,
          generatedImageUrl: '',
        },
      };
    });

    return {
      health: clientState.health,
      maxHealth: clientState.maxHealth,
      armor: clientState.armor,
      maxMana: clientState.maxMana,
      currentMana: clientState.currentMana,
      hand: isOpponent ? [] : hand, // Don't show opponent's hand cards
      deck: [], // Deck is always hidden
      board: clientState.board.map(deserializeMinionInstance),
      weapon: clientState.weapon,
      canAttackWithHero: clientState.canAttackWithHero,
      heroAttacksThisTurn: clientState.heroAttacksThisTurn,
    };
  };

  // Check if we can play a card
  const canPlayCardCheck = (card: Card, playerState: ClientPlayerState): boolean => {
    if (playerState.currentMana < card.manaCost) return false;
    if (card.cardType === 'MINION' && playerState.board.length >= MAX_BOARD_SIZE) return false;
    return true;
  };

  // Get targetable minions
  const getTargetableMinionIds = (): { playerTargets: string[]; opponentTargets: string[] } => {
    if (!gameState) return { playerTargets: [], opponentTargets: [] };

    const playerTargets: string[] = [];
    const opponentTargets: string[] = [];

    // If hero is selected for weapon attack
    if (selectedMinion === 'hero_player' && gameState.you.weapon) {
      const heroMaxAttacks = gameState.you.weapon.card.keywords.includes('Windfury')
        ? WINDFURY_ATTACKS
        : NORMAL_ATTACKS;
      if (gameState.you.heroAttacksThisTurn < heroMaxAttacks) {
        const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
        if (hasTaunts) {
          opponentTargets.push(
            ...gameState.opponent.board.filter((m) => hasKeyword(m, 'Taunt')).map((m) => m.instanceId)
          );
        } else {
          opponentTargets.push(...gameState.opponent.board.map((m) => m.instanceId));
        }
      }
    }

    // If we have a minion selected for attacking
    if (selectedMinion && selectedMinion !== 'hero_player') {
      const minion = gameState.you.board.find((m) => m.instanceId === selectedMinion);
      if (minion && canMinionAttack(minion)) {
        const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
        if (hasTaunts) {
          opponentTargets.push(
            ...gameState.opponent.board.filter((m) => hasKeyword(m, 'Taunt')).map((m) => m.instanceId)
          );
        } else {
          opponentTargets.push(...gameState.opponent.board.map((m) => m.instanceId));
        }
      }
    }

    // If we have a card selected that needs a target
    if (selectedCard && gameState.you.hand) {
      const cardInstance = gameState.you.hand.find((c) =>
        isCardInstance(c) && c.instanceId === selectedCard
      );
      if (cardInstance && isCardInstance(cardInstance)) {
        const effect = cardInstance.card.spellEffect;
        if (effect && needsManualTarget(effect.target)) {
          switch (effect.target) {
            case 'FRIENDLY_MINION':
              playerTargets.push(...gameState.you.board.map((m) => m.instanceId));
              break;
            case 'ENEMY_MINION':
              opponentTargets.push(...gameState.opponent.board.map((m) => m.instanceId));
              break;
            case 'ANY_CHARACTER':
              playerTargets.push(...gameState.you.board.map((m) => m.instanceId));
              opponentTargets.push(...gameState.opponent.board.map((m) => m.instanceId));
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
    if (!gameState || !isMyTurn) return false;

    if (selectedMinion) {
      if (selectedMinion === 'hero_player') {
        // Weapon attack
        if (gameState.you.weapon) {
          const heroMaxAttacks = gameState.you.weapon.card.keywords.includes('Windfury')
            ? WINDFURY_ATTACKS
            : NORMAL_ATTACKS;
          if (gameState.you.heroAttacksThisTurn < heroMaxAttacks) {
            const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
            return !hasTaunts;
          }
        }
      } else {
        // Minion attack
        const minion = gameState.you.board.find((m) => m.instanceId === selectedMinion);
        if (minion && canMinionAttack(minion)) {
          const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
          return !hasTaunts;
        }
      }
    }

    return false;
  };

  // Can attack minions that can attack
  const canAttackMinionIds = gameState?.you.board
    .filter((m) => canMinionAttack(m))
    .map((m) => m.instanceId) || [];

  // Can hero attack
  const canHeroAttack = (() => {
    if (!isMyTurn || !gameState?.you.weapon) return false;
    const heroMaxAttacks = gameState.you.weapon.card.keywords.includes('Windfury')
      ? WINDFURY_ATTACKS
      : NORMAL_ATTACKS;
    return gameState.you.heroAttacksThisTurn < heroMaxAttacks;
  })();

  // Handle card click
  const handleCardClick = (cardInstance: CardInstance) => {
    if (!isMyTurn || !gameState) return;

    lightTap();
    select();

    // If same card, deselect
    if (selectedCard === cardInstance.instanceId) {
      setSelectedCard(null);
      return;
    }

    // Check if card is playable
    if (!canPlayCardCheck(cardInstance.card, gameState.you)) {
      return;
    }

    setSelectedMinion(null);
    setSelectedCard(cardInstance.instanceId);

    const card = cardInstance.card;
    if (card.cardType === 'MINION') {
      if (gameState.you.board.length < MAX_BOARD_SIZE) {
        const hasBattlecryTarget =
          card.minionEffect?.trigger === 'BATTLECRY' &&
          card.minionEffect.effects.some((e) => needsManualTarget(e.target));

        if (!hasBattlecryTarget) {
          mediumTap();
          cardPlay();
          summon();
          playCard(cardInstance.instanceId, gameState.you.board.length);
          setSelectedCard(null);
        }
      }
    } else if (card.cardType === 'WEAPON') {
      mediumTap();
      weaponEquip();
      playCard(cardInstance.instanceId);
      setSelectedCard(null);
    } else if (card.cardType === 'SPELL') {
      if (card.spellEffect && !needsManualTarget(card.spellEffect.target)) {
        mediumTap();
        cardPlay();
        playCard(cardInstance.instanceId);
        setSelectedCard(null);
      }
    }
  };

  // Handle player minion click
  const handlePlayerMinionClick = (minion: MinionInstance) => {
    if (!isMyTurn || !gameState) return;

    lightTap();
    select();

    // If we have a spell that targets friendly minions
    if (selectedCard) {
      const cardInstance = gameState.you.hand.find((c) =>
        isCardInstance(c) && c.instanceId === selectedCard
      );
      if (cardInstance && isCardInstance(cardInstance) && cardInstance.card.spellEffect) {
        const target = cardInstance.card.spellEffect.target;
        if (target === 'FRIENDLY_MINION' || target === 'ANY_CHARACTER') {
          mediumTap();
          cardPlay();
          playCard(selectedCard, undefined, minion.instanceId);
          setSelectedCard(null);
          return;
        }
      }
    }

    // Select minion for attacking
    if (canMinionAttack(minion)) {
      if (selectedMinion === minion.instanceId) {
        setSelectedMinion(null);
      } else {
        setSelectedMinion(minion.instanceId);
      }
    }
  };

  // Handle opponent minion click
  const handleOpponentMinionClick = (minion: MinionInstance) => {
    if (!isMyTurn || !gameState) return;

    lightTap();

    // If hero is selected for weapon attack
    if (selectedMinion === 'hero_player') {
      if (canHeroAttack) {
        const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
        const canTarget = !hasTaunts || hasKeyword(minion, 'Taunt');
        if (canTarget) {
          heavyTap();
          attackSound();
          heroAttack(minion.instanceId);
          setSelectedMinion(null);
          return;
        }
      }
    }

    // If we have a minion selected, attack
    if (selectedMinion) {
      const attacker = gameState.you.board.find((m) => m.instanceId === selectedMinion);
      if (attacker && canMinionAttack(attacker)) {
        const hasTaunts = gameState.opponent.board.some((m) => hasKeyword(m, 'Taunt'));
        const canTarget = !hasTaunts || hasKeyword(minion, 'Taunt');
        if (canTarget) {
          heavyTap();
          attackSound();
          attack(selectedMinion, minion.instanceId);
          setSelectedMinion(null);
          return;
        }
      }
    }

    // If we have a spell that targets enemy minions
    if (selectedCard) {
      const cardInstance = gameState.you.hand.find((c) =>
        isCardInstance(c) && c.instanceId === selectedCard
      );
      if (cardInstance && isCardInstance(cardInstance) && cardInstance.card.spellEffect) {
        const target = cardInstance.card.spellEffect.target;
        if (target === 'ENEMY_MINION' || target === 'ANY_CHARACTER') {
          mediumTap();
          cardPlay();
          playCard(selectedCard, undefined, minion.instanceId);
          setSelectedCard(null);
          return;
        }
      }
    }
  };

  // Handle opponent hero click
  const handleOpponentHeroClick = () => {
    if (!isMyTurn || !gameState) return;

    lightTap();

    // If hero is selected for weapon attack
    if (selectedMinion === 'hero_player') {
      if (canHeroAttack && isOpponentHeroTargetable()) {
        heavyTap();
        attackSound();
        heroAttack('hero_opponent');
        setSelectedMinion(null);
        return;
      }
    }

    // If we have a minion selected, attack hero
    if (selectedMinion) {
      const attacker = gameState.you.board.find((m) => m.instanceId === selectedMinion);
      if (attacker && canMinionAttack(attacker) && isOpponentHeroTargetable()) {
        heavyTap();
        attackSound();
        attack(selectedMinion, 'hero_opponent');
        setSelectedMinion(null);
        return;
      }
    }

    // If we have a spell that targets enemy hero
    if (selectedCard) {
      const cardInstance = gameState.you.hand.find((c) =>
        isCardInstance(c) && c.instanceId === selectedCard
      );
      if (cardInstance && isCardInstance(cardInstance) && cardInstance.card.spellEffect?.target === 'ENEMY_HERO') {
        mediumTap();
        cardPlay();
        playCard(selectedCard, undefined, 'hero_opponent');
        setSelectedCard(null);
        return;
      }
    }
  };

  // Handle player hero click
  const handlePlayerHeroClick = () => {
    if (!isMyTurn || !canHeroAttack) return;

    lightTap();
    select();

    if (selectedMinion === 'hero_player') {
      setSelectedMinion(null);
    } else {
      setSelectedMinion('hero_player');
    }
  };

  // Handle board slot click
  const handleBoardSlotClick = (position: number) => {
    if (!isMyTurn || !selectedCard || !gameState) return;

    const cardInstance = gameState.you.hand.find((c) =>
      isCardInstance(c) && c.instanceId === selectedCard
    );
    if (cardInstance && isCardInstance(cardInstance) && cardInstance.card.cardType === 'MINION') {
      mediumTap();
      cardPlay();
      summon();
      playCard(selectedCard, position);
      setSelectedCard(null);
    }
  };

  // Handle end turn
  const handleEndTurn = () => {
    if (!isMyTurn) return;
    mediumTap();
    endTurn();
  };

  // Handle card long-press
  const handleCardLongPress = (cardInstance: CardInstance) => {
    lightTap();
    setPreviewCard({ card: cardInstance.card });
  };

  // Handle minion long-press
  const handleMinionLongPress = (minion: MinionInstance) => {
    lightTap();
    setPreviewCard({ card: minion.card, minionInstance: minion });
  };

  // Close card preview
  const handleClosePreview = () => {
    setPreviewCard(null);
  };

  // Show placement slots when minion card is selected
  const showPlacementSlots =
    isMyTurn &&
    selectedCard !== null &&
    gameState?.you.hand.some(
      (c) =>
        isCardInstance(c) &&
        c.instanceId === selectedCard &&
        c.card.cardType === 'MINION'
    );

  // Targeting state
  const isTargeting = selectedMinion !== null || (selectedCard !== null && (gameState?.you.hand.some(
    (c) => isCardInstance(c) && c.instanceId === selectedCard && c.card.spellEffect && needsManualTarget(c.card.spellEffect.target)
  ) ?? false));

  const getTargetingMessage = (): string => {
    if (selectedMinion) {
      return 'Select a target to attack';
    }
    if (selectedCard) {
      return 'Select a target for the spell';
    }
    return 'Select a target';
  };

  // Render loading/waiting states
  if (status === 'connecting') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <p className="text-gold font-display text-lg">Connecting to room...</p>
        <p className="text-gray-400 text-sm mt-2">Room Code: {roomCode}</p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950 p-6">
        <div className="bg-gray-900/80 border border-gold/30 rounded-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <h2 className="text-gold font-display text-2xl mb-2">Waiting for Opponent</h2>
          <p className="text-gray-400 mb-6">Share this room code with your friend:</p>

          <div className="bg-gray-800 border border-gold/50 rounded-lg p-4 mb-6">
            <p className="text-gold font-display text-4xl tracking-widest">{roomCode}</p>
          </div>

          <p className="text-gray-500 text-sm mb-6">
            Your opponent needs to join with this code to start the battle!
          </p>

          <button
            onClick={onLeaveGame}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950 p-6">
        <div className="bg-gray-900/80 border border-red-500/30 rounded-lg p-8 max-w-md w-full text-center">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-400 font-display text-2xl mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error || 'Failed to connect to the game server.'}</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={connect}
              className="px-6 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onLeaveGame}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState || status === 'disconnected') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950">
        <WifiOff className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-400 font-display text-lg">Disconnected</p>
        <button
          onClick={connect}
          className="mt-4 px-6 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 rounded-lg transition-colors"
        >
          Reconnect
        </button>
      </div>
    );
  }

  // Convert state for components
  const playerState = toPlayerState(gameState.you, false);
  const opponentState = toPlayerState(gameState.opponent, true);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950" />
      <div className="absolute inset-0 bg-leather-texture" />
      <div className="absolute inset-0 bg-vignette pointer-events-none" />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Connection status & opponent info */}
        <div className="w-full py-1.5 px-4 flex items-center justify-between">
          {/* Opponent info */}
          <div className="flex items-center gap-2">
            {opponentInfo ? (
              <>
                {opponentInfo.lensAvatar ? (
                  <img
                    src={opponentInfo.lensAvatar}
                    alt={opponentInfo.lensHandle || 'Opponent'}
                    className="w-6 h-6 rounded-full border border-purple-500/50"
                  />
                ) : (
                  <User className="w-6 h-6 text-purple-400" />
                )}
                <span className="text-purple-300 text-sm font-medium">
                  {opponentInfo.lensHandle || `${opponentInfo.lensAddress.slice(0, 6)}...`}
                </span>
                {!opponentInfo.isConnected && (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
              </>
            ) : (
              <span className="text-gray-400 text-sm">Unknown Opponent</span>
            )}
          </div>

          {/* Turn indicator */}
          <div
            className={cn(
              'px-4 py-1 rounded-sm',
              'bg-parchment',
              'border-x-4',
              isMyTurn ? 'border-amber-600' : 'border-purple-700'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {isMyTurn ? '⚔️' : '👁️'}
              </span>
              <span
                className={cn(
                  'font-display text-xs tracking-wide',
                  isMyTurn ? 'text-amber-200' : 'text-purple-200'
                )}
              >
                {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
              </span>
              <span className="text-xs text-gray-400">
                #{gameState.turnNumber}
              </span>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1">
            {status === 'playing' ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Opponent area */}
        <OpponentArea
          opponent={opponentState}
          selectedMinionId={selectedMinion}
          targetableMinionIds={opponentTargets}
          isHeroTargetable={isOpponentHeroTargetable()}
          onHeroClick={handleOpponentHeroClick}
          onMinionClick={handleOpponentMinionClick}
          onMinionLongPress={handleMinionLongPress}
          opponentHandCount={(gameState.opponent.hand as HiddenCard[]).length}
        />

        {/* Battlefield divider */}
        <div className="w-full h-px relative my-1">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border border-gold/40 bg-gray-900" />
        </div>

        {/* Player area */}
        <PlayerArea
          player={playerState}
          selectedCardId={selectedCard}
          selectedMinionId={selectedMinion}
          targetableMinionIds={playerTargets}
          canAttackMinionIds={canAttackMinionIds}
          isHeroTargetable={false}
          canHeroAttack={canHeroAttack}
          showPlacementSlots={showPlacementSlots || false}
          tutorialMode={false}
          onHeroClick={handlePlayerHeroClick}
          onMinionClick={handlePlayerMinionClick}
          onMinionLongPress={handleMinionLongPress}
          onCardClick={handleCardClick}
          onCardLongPress={handleCardLongPress}
          onBoardSlotClick={handleBoardSlotClick}
          onEndTurnClick={handleEndTurn}
          onHelpClick={() => {}}
          onToggleTutorial={() => {}}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Targeting overlay */}
      <TargetingOverlay
        isActive={isTargeting}
        message={getTargetingMessage()}
        onCancel={() => {
          setSelectedCard(null);
          setSelectedMinion(null);
        }}
      />

      {/* Game over modal */}
      <GameOverModal
        isOpen={gameState.phase === 'GAME_OVER'}
        winner={gameState.winner === gameState.yourRole ? 'player' : 'opponent'}
        onPlayAgain={onLeaveGame}
        onBackToMenu={onLeaveGame}
        isMultiplayer={true}
        opponentName={opponentInfo?.lensHandle || opponentInfo?.lensAddress?.slice(0, 10) || 'Opponent'}
      />

      {/* Card details preview modal */}
      <CardDetailsModal
        isOpen={previewCard !== null}
        card={previewCard?.card ?? null}
        minionInstance={previewCard?.minionInstance}
        onClose={handleClosePreview}
      />

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
