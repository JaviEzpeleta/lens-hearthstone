'use client';

import { cn } from '@/lib/utils';
import { PlayerState, CardInstance, MinionInstance } from '@/lib/game/types';
import { HeroPortrait } from './HeroPortrait';
import { BoardSlots } from './BoardSlots';
import { PlayerHand } from './PlayerHand';
import { ManaDisplay } from './ManaDisplay';

interface PlayerAreaProps {
  player: PlayerState;
  selectedCardId?: string | null;
  selectedMinionId?: string | null;
  targetableMinionIds?: string[];
  canAttackMinionIds?: string[];
  isHeroTargetable?: boolean;
  canHeroAttack?: boolean;
  showPlacementSlots?: boolean;
  tutorialMode?: boolean;
  onHeroClick?: () => void;
  onMinionClick?: (minion: MinionInstance) => void;
  onMinionLongPress?: (minion: MinionInstance) => void;
  onCardClick?: (card: CardInstance) => void;
  onCardLongPress?: (card: CardInstance) => void;
  onWeaponLongPress?: () => void;
  onBoardSlotClick?: (position: number) => void;
  onEndTurnClick?: () => void;
  onHelpClick?: () => void;
  onToggleTutorial?: () => void;
  isMyTurn: boolean;
  className?: string;
}

export function PlayerArea({
  player,
  selectedCardId,
  selectedMinionId,
  targetableMinionIds = [],
  canAttackMinionIds = [],
  isHeroTargetable = false,
  canHeroAttack = false,
  showPlacementSlots = false,
  tutorialMode = false,
  onHeroClick,
  onMinionClick,
  onMinionLongPress,
  onCardClick,
  onCardLongPress,
  onWeaponLongPress,
  onBoardSlotClick,
  onEndTurnClick,
  onHelpClick,
  onToggleTutorial,
  isMyTurn,
  className,
}: PlayerAreaProps) {
  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Player board */}
      <BoardSlots
        minions={player.board}
        isPlayerBoard={true}
        selectedMinionId={selectedMinionId}
        targetableMinionIds={targetableMinionIds}
        canAttackMinionIds={canAttackMinionIds}
        onMinionClick={onMinionClick}
        onMinionLongPress={onMinionLongPress}
        onSlotClick={onBoardSlotClick}
        showPlacementSlots={showPlacementSlots}
      />

      {/* Player controls bar - Hero + Mana */}
      <div className="relative flex items-center justify-between gap-4 px-3 py-2 bg-gradient-to-t from-gray-900/90 via-amber-950/20 to-transparent">
        {/* Left zone: Hero portrait */}
        <HeroPortrait
          health={player.health}
          maxHealth={player.maxHealth}
          armor={player.armor}
          weapon={player.weapon}
          isPlayer={true}
          isTargetable={isHeroTargetable}
          canAttack={canHeroAttack}
          onClick={onHeroClick}
          onWeaponLongPress={onWeaponLongPress}
        />

        {/* Center zone: Mana display */}
        <ManaDisplay
          current={player.currentMana}
          max={player.maxMana}
          className="flex-shrink-0"
        />

      </div>

      {/* Player hand */}
      <div className="flex-1 z-40 pt-2 min-h-[130px] bg-gradient-to-t from-gray-950 via-gray-900/95 to-transparent">
        <PlayerHand
          cards={player.hand}
          currentMana={player.currentMana}
          selectedCardId={selectedCardId}
          onCardClick={onCardClick}
          onCardLongPress={onCardLongPress}
        />

        {/* Deck count and Tutorial toggle */}
        <div className="flex justify-center items-center gap-4 py-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-800/50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3 h-3 text-gray-500"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 2v4M16 2v4M8 18v4M16 18v4" />
            </svg>
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {player.deck.length}
            </span>
          </div>

          {/* Tutorial toggle */}
          {onToggleTutorial && (
            <button
              onClick={onToggleTutorial}
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                tutorialMode
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-600/50'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-400'
              )}
            >
              <span>Tips</span>
              <span className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                tutorialMode ? 'bg-amber-600 text-gray-900' : 'bg-gray-700 text-gray-400'
              )}>
                {tutorialMode ? '✓' : '○'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* End Turn button + Help - fixed at bottom */}
      <div className="flex justify-center items-center gap-3 py-6 bg-gradient-to-t from-stone-950 to-gray-950">
        <button
          onClick={onEndTurnClick}
          disabled={!isMyTurn}
          className={cn(
            'px-8 py-3 rounded-lg cursor-pointer hover:scale-105 active:scale-95 font-bold text-base transition-all duration-200',
            'min-w-[120px] min-h-[52px]',
            isMyTurn
              ? 'btn-fantasy text-gray-900 active:scale-95'
              : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
          )}
        >
          {isMyTurn ? 'End Turn' : 'Wait...'}
        </button>

        {/* Help button */}
        {onHelpClick && (
          <button
            onClick={onHelpClick}
            className={cn(
              'w-10 h-10 rounded-full',
              'bg-gray-800/80 border border-gray-700/50',
              'flex items-center justify-center',
              'text-gray-400 hover:text-gray-200',
              'transition-all duration-200',
              'hover:bg-gray-700/80',
              'active:scale-95'
            )}
          >
            <span className="text-base font-medium">?</span>
          </button>
        )}
      </div>
    </div>
  );
}
