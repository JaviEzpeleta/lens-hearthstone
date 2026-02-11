'use client';

import { cn } from '@/lib/utils';
import { PlayerState, MinionInstance } from '@/lib/game/types';
import { HeroPortrait } from './HeroPortrait';
import { BoardSlots } from './BoardSlots';

interface OpponentAreaProps {
  opponent: PlayerState;
  selectedMinionId?: string | null;
  targetableMinionIds?: string[];
  isHeroTargetable?: boolean;
  onHeroClick?: () => void;
  onMinionClick?: (minion: MinionInstance) => void;
  onMinionLongPress?: (minion: MinionInstance) => void;
  opponentHandCount?: number; // For multiplayer - shows card back count
  className?: string;
}

export function OpponentArea({
  opponent,
  selectedMinionId,
  targetableMinionIds = [],
  isHeroTargetable = false,
  onHeroClick,
  onMinionClick,
  onMinionLongPress,
  opponentHandCount,
  className,
}: OpponentAreaProps) {
  // Use provided hand count for multiplayer, otherwise use opponent.hand.length
  const handCount = opponentHandCount ?? opponent.hand.length;
  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Opponent hero area */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-purple-950/30 to-transparent">
        <HeroPortrait
          health={opponent.health}
          maxHealth={opponent.maxHealth}
          armor={opponent.armor}
          weapon={opponent.weapon}
          isPlayer={false}
          isTargetable={isHeroTargetable}
          onClick={onHeroClick}
        />

        {/* Opponent hand count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg px-2 py-1">
            <span className="text-xs text-gray-400">Hand:</span>
            <span className="text-sm font-bold text-gray-200">{handCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg px-2 py-1">
            <span className="text-xs text-gray-400">Deck:</span>
            <span className="text-sm font-bold text-gray-200">{opponent.deck.length}</span>
          </div>
        </div>
      </div>

      {/* Opponent board */}
      <BoardSlots
        minions={opponent.board}
        isPlayerBoard={false}
        selectedMinionId={selectedMinionId}
        targetableMinionIds={targetableMinionIds}
        onMinionClick={onMinionClick}
        onMinionLongPress={onMinionLongPress}
      />
    </div>
  );
}
