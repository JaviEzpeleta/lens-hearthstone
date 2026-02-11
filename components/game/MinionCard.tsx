'use client';

import { cn } from '@/lib/utils';
import { MinionInstance } from '@/lib/game/types';
import { useLongPress } from '@/hooks/useLongPress';
import NumberFlow from '@number-flow/react';

interface MinionCardProps {
  minion: MinionInstance;
  isSelected?: boolean;
  isTargetable?: boolean;
  canAttack?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function MinionCard({
  minion,
  isSelected = false,
  isTargetable = false,
  canAttack = false,
  onClick,
  onLongPress,
  className,
}: MinionCardProps) {
  const hasTaunt = minion.keywords.has('Taunt');
  const hasDivineShield = minion.hasDivineShield;
  const isDamaged = minion.currentHealth < minion.maxHealth;
  const isBuffed = minion.currentAttack > (minion.card.attack ?? 0);
  const longPressHandlers = useLongPress(onLongPress, onClick);

  return (
    <div
      {...longPressHandlers}
      className={cn(
        'relative w-[52px] h-[68px] rounded-lg transition-all duration-200',
        'flex flex-col items-center justify-between p-1 select-none',
        'bg-gradient-to-b from-gray-800 to-gray-900',
        'border-2',

        // Border styling based on state
        hasTaunt
          ? 'border-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)]'
          : 'border-gray-600',

        // Selection states
        isSelected && 'ring-2 ring-gold ring-offset-2 ring-offset-background scale-105 z-10',
        isTargetable && cn(
          'spotlight-target animate-spotlight-pulse',
          'ring-2 ring-red-500 ring-offset-1 ring-offset-transparent',
          'cursor-targeting z-40'
        ),
        canAttack && !isSelected && 'animate-electric-pulse cursor-pointer',

        // Divine shield glow
        hasDivineShield && 'shadow-[0_0_10px_rgba(250,204,21,0.6)]',

        // Touch target size
        'min-w-[44px] min-h-[44px]',

        className
      )}
    >
      {/* Divine Shield indicator */}
      {hasDivineShield && (
        <div className="absolute inset-0 rounded-lg border-2 border-yellow-400/50 pointer-events-none" />
      )}

      {/* Taunt border indicator */}
      {hasTaunt && (
        <div className="absolute -inset-0.5 rounded-lg border-2 border-amber-600/30 pointer-events-none" />
      )}

      {/* Card image area */}
      <div className="w-full h-8 rounded-t overflow-hidden bg-gray-700">
        {minion.card.generatedImageUrl ? (
          <img
            src={minion.card.generatedImageUrl}
            alt={minion.card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            {minion.card.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Keywords indicators */}
      <div className="absolute top-0 left-0 flex gap-0.5 p-0.5">
        {minion.keywords.has('Windfury') && (
          <span className="text-[8px]" title="Windfury">💨</span>
        )}
        {minion.keywords.has('Lifesteal') && (
          <span className="text-[8px]" title="Lifesteal">💚</span>
        )}
        {minion.keywords.has('Rush') && !minion.canAttack && (
          <span className="text-[8px]" title="Rush">🏃</span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between w-full mt-auto">
        {/* Attack */}
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
            'bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400/50',
            isBuffed && 'text-green-300'
          )}
        >
          {minion.currentAttack}
        </div>

        {/* Health */}
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
            'bg-gradient-to-br from-red-500 to-red-700 border border-red-400/50',
            isDamaged && 'text-red-300'
          )}
        >
          <NumberFlow
            value={minion.currentHealth}
            transformTiming={{ duration: 250, easing: 'ease-out' }}
            spinTiming={{ duration: 250, easing: 'ease-out' }}
          />
        </div>
      </div>
    </div>
  );
}
