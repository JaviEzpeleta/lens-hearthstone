'use client';

import { cn } from '@/lib/utils';

type CardType = 'MINION' | 'SPELL' | 'WEAPON';
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface TutorialCardExampleProps {
  name: string;
  manaCost: number;
  cardType: CardType;
  attack?: number;
  health?: number;
  durability?: number;
  keywords?: string[];
  description?: string;
  rarity: Rarity;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RARITY_GLOW: Record<Rarity, string> = {
  COMMON: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]',
  RARE: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  EPIC: 'shadow-[0_0_20px_rgba(147,51,234,0.5)]',
  LEGENDARY: 'shadow-[0_0_25px_rgba(245,158,11,0.6)]',
};

const RARITY_BORDER: Record<Rarity, string> = {
  COMMON: 'border-gray-400',
  RARE: 'border-blue-400',
  EPIC: 'border-purple-400',
  LEGENDARY: 'border-amber-400',
};

const RARITY_RING: Record<Rarity, string> = {
  COMMON: 'ring-gray-400/30',
  RARE: 'ring-blue-400/30',
  EPIC: 'ring-purple-400/30',
  LEGENDARY: 'ring-amber-400/30',
};

export function TutorialCardExample({
  name,
  manaCost,
  cardType,
  attack,
  health,
  durability,
  keywords = [],
  rarity,
  imageUrl,
  size = 'md',
}: TutorialCardExampleProps) {
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-32 sm:w-36',
    lg: 'w-40 sm:w-44',
  };

  const imageSizeClasses = {
    sm: 'h-20',
    md: 'h-28 sm:h-32',
    lg: 'h-36 sm:h-40',
  };

  const statSizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const manaSizeClasses = {
    sm: 'w-7 h-7 text-sm -top-2 -left-2',
    md: 'w-8 h-8 text-base -top-2 -left-2',
    lg: 'w-9 h-9 text-lg -top-3 -left-3',
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg overflow-hidden',
        'bg-gradient-to-b from-gray-800 to-gray-900',
        'border-2',
        'ring-2',
        RARITY_BORDER[rarity],
        RARITY_GLOW[rarity],
        RARITY_RING[rarity],
        sizeClasses[size]
      )}
    >
      {/* Mana cost crystal */}
      <div
        className={cn(
          'absolute z-20 rounded-full',
          'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800',
          'border-2 border-blue-300',
          'flex items-center justify-center',
          'font-display font-bold text-white',
          'shadow-lg shadow-blue-500/50',
          manaSizeClasses[size]
        )}
      >
        {manaCost}
      </div>

      {/* Card image */}
      <div className={cn('relative w-full', imageSizeClasses[size])}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800" />
        )}

        {/* Card name overlay at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-1 py-1.5">
          <p
            className={cn(
              'text-center font-display text-white truncate',
              size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
            )}
          >
            {name}
          </p>
        </div>
      </div>

      {/* Keywords row (if any) */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 px-1 py-1 bg-gray-800/80">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className={cn(
                'px-1.5 py-0.5 rounded-full',
                'bg-gold/20 border border-gold/40',
                'text-gold font-medieval',
                size === 'sm' ? 'text-[8px]' : 'text-[10px]'
              )}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Stats row at bottom */}
      {(cardType === 'MINION' || cardType === 'WEAPON') && (
        <div className="flex justify-between items-end px-1 py-1 bg-gray-900/90">
          {/* Attack stat */}
          <div
            className={cn(
              'rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-700',
              'border-2 border-yellow-400',
              'font-display font-bold text-white',
              'shadow-md shadow-orange-500/40',
              statSizeClasses[size]
            )}
          >
            {attack}
          </div>

          {/* Health or Durability stat */}
          {cardType === 'MINION' ? (
            <div
              className={cn(
                'rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-red-400 via-red-600 to-red-800',
                'border-2 border-red-300',
                'font-display font-bold text-white',
                'shadow-md shadow-red-500/40',
                statSizeClasses[size]
              )}
            >
              {health}
            </div>
          ) : (
            <div
              className={cn(
                'rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-700',
                'border-2 border-gray-300',
                'font-display font-bold text-white',
                'shadow-md shadow-gray-500/40',
                statSizeClasses[size]
              )}
            >
              {durability}
            </div>
          )}
        </div>
      )}

      {/* For spells - just show a subtle "SPELL" indicator */}
      {cardType === 'SPELL' && (
        <div className="flex justify-center items-center px-1 py-1.5 bg-gray-900/90">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full',
              'bg-purple-600/30 border border-purple-400/50',
              'text-purple-300 font-display uppercase',
              size === 'sm' ? 'text-[8px]' : 'text-[10px]'
            )}
          >
            Spell
          </span>
        </div>
      )}
    </div>
  );
}
