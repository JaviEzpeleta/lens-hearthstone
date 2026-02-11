'use client';

import { cn } from '@/lib/utils';

interface ManaDisplayProps {
  current: number;
  max: number;
  className?: string;
}

export function ManaDisplay({ current, max, className }: ManaDisplayProps) {
  // Split crystals into two rows when max > 5
  const firstRowIndices = Array.from({ length: Math.min(max, 5) }).map((_, i) => i);
  const secondRowIndices = max > 5 ? Array.from({ length: max - 5 }).map((_, i) => i + 5) : [];

  // Helper to render a single mana gem
  const renderGem = (index: number) => {
    const isFilled = index < current;
    return (
      <div
        key={index}
        className={cn(
          'w-4 h-5 transition-all duration-300',
          // Gem shape using clip-path
          'clip-gem',
          isFilled
            ? [
                'bg-gradient-to-b from-blue-300 via-blue-500 to-blue-700',
                'shadow-[0_0_8px_rgba(59,130,246,0.6)]',
                'animate-mana-pulse',
              ]
            : [
                'bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800',
                'opacity-40',
              ]
        )}
        style={{
          // Stagger the animation for visual interest
          animationDelay: isFilled ? `${index * 0.1}s` : '0s',
        }}
      />
    );
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        'bg-gradient-to-b from-gray-800/80 to-gray-900/80',
        'border border-blue-500/30 rounded-lg',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
        className
      )}
    >
      {/* Mana gems */}
      <div className={cn('flex', max > 5 ? 'flex-col items-center gap-0.5' : 'gap-1')}>
        <div className="flex gap-1">
          {firstRowIndices.map(renderGem)}
        </div>
        {secondRowIndices.length > 0 && (
          <div className="flex gap-1">
            {secondRowIndices.map(renderGem)}
          </div>
        )}
      </div>

      {/* Numeric display */}
      <div className="flex items-baseline gap-0.5 ml-1">
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            current > 0 ? 'text-blue-400' : 'text-gray-500'
          )}
        >
          {current}
        </span>
        <span className="text-xs text-gray-500">/</span>
        <span className="text-sm font-medium text-gray-400 tabular-nums">
          {max}
        </span>
      </div>
    </div>
  );
}
