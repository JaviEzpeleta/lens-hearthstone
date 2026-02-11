'use client';

import { cn } from '@/lib/utils';
import { MinionInstance } from '@/lib/game/types';
import { MinionCard } from './MinionCard';
import { MAX_BOARD_SIZE } from '@/lib/game/constants';

interface BoardSlotsProps {
  minions: MinionInstance[];
  isPlayerBoard: boolean;
  selectedMinionId?: string | null;
  targetableMinionIds?: string[];
  canAttackMinionIds?: string[];
  onMinionClick?: (minion: MinionInstance) => void;
  onMinionLongPress?: (minion: MinionInstance) => void;
  onSlotClick?: (position: number) => void;
  showPlacementSlots?: boolean;
  className?: string;
}

// Decorative empty slot component
function EmptySlot({ index, isPlayerBoard }: { index: number; isPlayerBoard: boolean }) {
  return (
    <div
      className={cn(
        'w-12 h-16 rounded-lg',
        'border border-dashed',
        'flex items-center justify-center',
        'transition-all duration-300',
        isPlayerBoard
          ? 'border-amber-900/30 bg-amber-950/10'
          : 'border-purple-900/30 bg-purple-950/10'
      )}
    >
      {/* Subtle decorative icon */}
      <div
        className={cn(
          'w-6 h-6 rounded-full',
          'flex items-center justify-center',
          'opacity-20',
          isPlayerBoard ? 'text-amber-700' : 'text-purple-700'
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// Placement indicator slot
function PlacementSlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'w-5 h-16 rounded-md',
        'border-2 border-dashed border-green-500/60',
        'bg-green-500/15 cursor-pointer',
        'transition-all duration-200',
        'hover:border-green-400 hover:bg-green-500/25 hover:scale-105',
        'flex items-center justify-center',
        'shadow-[0_0_12px_rgba(34,197,94,0.2)]'
      )}
    >
      <span className="text-green-400 text-lg font-light">+</span>
    </div>
  );
}

export function BoardSlots({
  minions,
  isPlayerBoard,
  selectedMinionId,
  targetableMinionIds = [],
  canAttackMinionIds = [],
  onMinionClick,
  onMinionLongPress,
  onSlotClick,
  showPlacementSlots = false,
  className,
}: BoardSlotsProps) {
  // Calculate positions for placement slots
  const renderSlots = () => {
    const slots: React.ReactNode[] = [];

    if (showPlacementSlots && minions.length < MAX_BOARD_SIZE) {
      // Show placement indicators between and around minions
      for (let i = 0; i <= minions.length; i++) {
        // Placement slot
        slots.push(
          <PlacementSlot key={`slot-${i}`} onClick={() => onSlotClick?.(i)} />
        );

        // Minion at this position
        if (i < minions.length) {
          const minion = minions[i];
          slots.push(
            <MinionCard
              key={minion.instanceId}
              minion={minion}
              isSelected={selectedMinionId === minion.instanceId}
              isTargetable={targetableMinionIds.includes(minion.instanceId)}
              canAttack={canAttackMinionIds.includes(minion.instanceId)}
              onClick={() => onMinionClick?.(minion)}
              onLongPress={() => onMinionLongPress?.(minion)}
            />
          );
        }
      }
    } else {
      // Just show minions
      minions.forEach((minion) => {
        slots.push(
          <MinionCard
            key={minion.instanceId}
            minion={minion}
            isSelected={selectedMinionId === minion.instanceId}
            isTargetable={targetableMinionIds.includes(minion.instanceId)}
            canAttack={canAttackMinionIds.includes(minion.instanceId)}
            onClick={() => onMinionClick?.(minion)}
            onLongPress={() => onMinionLongPress?.(minion)}
          />
        );
      });
    }

    return slots;
  };

  // Show decorative empty slots when board is empty
  const renderEmptyBoard = () => {
    return (
      <div className="flex items-center justify-center gap-2 opacity-40">
        {Array.from({ length: 5 }).map((_, i) => (
          <EmptySlot key={i} index={i} isPlayerBoard={isPlayerBoard} />
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'w-full min-h-[88px] px-3 py-2',
        'flex items-center justify-center gap-1.5',
        // Subtle texture and gradient
        'relative overflow-hidden',
        className
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-b',
          isPlayerBoard
            ? 'from-amber-950/20 via-amber-900/10 to-transparent'
            : 'from-purple-950/20 via-purple-900/10 to-transparent'
        )}
      />

      {/* Subtle wood texture overlay */}
      <div className="absolute inset-0 bg-wood-texture opacity-30" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-1.5">
        {minions.length === 0 && !showPlacementSlots
          ? renderEmptyBoard()
          : renderSlots()}
      </div>

      {/* Decorative corner accents */}
      <div
        className={cn(
          'absolute top-0 left-0 w-8 h-8',
          'border-t border-l',
          isPlayerBoard ? 'border-amber-800/20' : 'border-purple-800/20'
        )}
      />
      <div
        className={cn(
          'absolute top-0 right-0 w-8 h-8',
          'border-t border-r',
          isPlayerBoard ? 'border-amber-800/20' : 'border-purple-800/20'
        )}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 w-8 h-8',
          'border-b border-l',
          isPlayerBoard ? 'border-amber-800/20' : 'border-purple-800/20'
        )}
      />
      <div
        className={cn(
          'absolute bottom-0 right-0 w-8 h-8',
          'border-b border-r',
          isPlayerBoard ? 'border-amber-800/20' : 'border-purple-800/20'
        )}
      />
    </div>
  );
}
