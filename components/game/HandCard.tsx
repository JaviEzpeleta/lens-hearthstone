'use client';

import { cn } from '@/lib/utils';
import { CardInstance } from '@/lib/game/types';
import { useLongPress } from '@/hooks/useLongPress';

interface HandCardProps {
  cardInstance: CardInstance;
  isSelected?: boolean;
  isPlayable?: boolean;
  fanRotation?: number;
  fanOffset?: number;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function HandCard({
  cardInstance,
  isSelected = false,
  isPlayable = true,
  fanRotation = 0,
  fanOffset = 0,
  onClick,
  onLongPress,
  className,
}: HandCardProps) {
  const card = cardInstance.card;
  const longPressHandlers = useLongPress(onLongPress, onClick);

  const getRarityStyles = () => {
    switch (card.rarity) {
      case 'LEGENDARY':
        return {
          border: 'border-amber-400',
          glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
          hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.7)]',
        };
      case 'EPIC':
        return {
          border: 'border-purple-400',
          glow: 'shadow-[0_0_10px_rgba(192,132,252,0.4)]',
          hoverGlow: 'group-hover:shadow-[0_0_18px_rgba(192,132,252,0.6)]',
        };
      case 'RARE':
        return {
          border: 'border-blue-400',
          glow: 'shadow-[0_0_8px_rgba(96,165,250,0.4)]',
          hoverGlow: 'group-hover:shadow-[0_0_16px_rgba(96,165,250,0.6)]',
        };
      default:
        return {
          border: 'border-gray-500',
          glow: '',
          hoverGlow: 'group-hover:shadow-[0_0_12px_rgba(156,163,175,0.3)]',
        };
    }
  };

  const rarityStyles = getRarityStyles();

  const getTypeIcon = () => {
    switch (card.cardType) {
      case 'MINION':
        return '👤';
      case 'SPELL':
        return '🪄';
      case 'WEAPON':
        return '⚔️';
    }
  };

  return (
    <div
      className={cn('relative pb-6', className)}
      style={{
        transform: isSelected
          ? 'translateY(-12px) scale(1.24)'
          : `rotate(${fanRotation}deg) translateY(${fanOffset}px) scale(1.12)`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* Card type label - above card */}
      <div
        className={cn(
          'w-full text-center py-0.5 rounded-t-md mb-0.5 pb-4 translate-y-4',
          'text-[8px] font-bold uppercase tracking-wider',
          card.cardType === 'MINION' && 'bg-gradient-to-b from-green-600 to-green-700/10 text-green-100',
          card.cardType === 'SPELL' && 'bg-gradient-to-b from-purple-600 to-purple-700/10 text-purple-100',
          card.cardType === 'WEAPON' && 'bg-gradient-to-b from-orange-600 to-orange-700/10 text-orange-100'
        )}
      >
        {card.cardType}
      </div>

      {/* Card */}
      <div
        {...longPressHandlers}
        className={cn(
          'group relative w-[65px] h-[112px] rounded-xl transition-all duration-300 ease-out',
          'flex flex-col overflow-hidden cursor-pointer select-none',
          'bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900',
          'border-2',
          rarityStyles.border,
          rarityStyles.glow,

          // Playability
          !isPlayable && 'opacity-40 saturate-50 cursor-not-allowed',

          // Selection - dramatic lift
          isSelected && [
            'z-30',
            'ring-2 ring-gold ring-offset-2 ring-offset-gray-900',
            'shadow-[0_0_24px_rgba(201,160,51,0.6)]',
          ],

          // Hover (when playable and not selected)
          isPlayable && !isSelected && [
            'hover:-translate-y-4 hover:scale-105 hover:z-20',
            rarityStyles.hoverGlow,
          ],

          // Touch target
          'min-w-[44px] min-h-[44px]'
        )}
      >
        {/* Mana cost badge */}
        <div
          className={cn(
            'absolute -top-1 -left-1 w-7 h-7 rounded-full z-20',
            'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700',
            'border-2 border-blue-300/60',
            'flex items-center justify-center',
            'text-white font-bold text-sm',
            'shadow-[0_2px_8px_rgba(59,130,246,0.5)]'
          )}
        >
          {card.manaCost}
        </div>

        {/* Card image */}
        <div className="w-full h-16 overflow-hidden rounded-t-lg">
          {card.generatedImageUrl ? (
            <img
              src={card.generatedImageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <span className="text-2xl">{getTypeIcon()}</span>
            </div>
          )}
        </div>

        {/* Card info section */}
        <div className="flex-1 p-1.5 flex flex-col justify-between bg-gradient-to-b from-gray-800/50 to-gray-900">
          {/* Name */}
          <p className="text-[9px] font-semibold text-gray-100 truncate leading-tight text-center">
            {card.name}
          </p>

          {/* Stats for minions/weapons */}
          {(card.cardType === 'MINION' || card.cardType === 'WEAPON') && (
            <div className="flex items-center justify-between mt-auto px-0.5">
              {/* Attack */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400/50 flex items-center justify-center shadow-md">
                <span className="text-[11px] font-bold text-white">
                  {card.attack}
                </span>
              </div>
              {/* Health/Durability */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-red-400/50 flex items-center justify-center shadow-md">
                <span className="text-[11px] font-bold text-white">
                  {card.cardType === 'MINION' ? card.health : card.durability}
                </span>
              </div>
            </div>
          )}

          {/* Spell indicator */}
          {card.cardType === 'SPELL' && (
            <div className="text-center mt-auto">
              <span className="text-[10px] font-medium text-purple-300 tracking-wide">
                Spell
              </span>
            </div>
          )}
        </div>

        {/* Keywords indicators */}
        {card.keywords.length > 0 && (
          <div className="absolute top-7 right-0.5 flex flex-col gap-0.5 p-0.5 bg-black/30 rounded-l">
            {card.keywords.includes('Taunt') && <span className="text-[10px]">🛡️</span>}
            {card.keywords.includes('Rush') && <span className="text-[10px]">🏃</span>}
            {card.keywords.includes('Divine Shield') && <span className="text-[10px]">✨</span>}
            {card.keywords.includes('Lifesteal') && <span className="text-[10px]">💚</span>}
            {card.keywords.includes('Windfury') && <span className="text-[10px]">💨</span>}
            {card.keywords.includes('Battlecry') && <span className="text-[10px]">📢</span>}
          </div>
        )}

        {/* Playable indicator glow at bottom */}
        {isPlayable && !isSelected && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
        )}
      </div>

      {/* Info button - always visible below card */}
      {onLongPress && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLongPress();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2',
            'w-6 h-5 rounded-full',
            'bg-gray-700/95 border border-gray-500',
            'flex items-center justify-center',
            'text-[11px]',
            'active:scale-90 active:bg-gray-600',
            'transition-all duration-100',
            'z-40'
          )}
          aria-label="Ver detalles de la carta"
        >
          ℹ️
        </button>
      )}
    </div>
  );
}
