'use client';

import { cn } from '@/lib/utils';
import { CardInstance, Card } from '@/lib/game/types';
import { HandCard } from './HandCard';

interface PlayerHandProps {
  cards: CardInstance[];
  currentMana: number;
  selectedCardId?: string | null;
  onCardClick?: (cardInstance: CardInstance) => void;
  onCardLongPress?: (cardInstance: CardInstance) => void;
  className?: string;
}

function canAfford(card: Card, currentMana: number): boolean {
  return card.manaCost <= currentMana;
}

// Calculate fan rotation for a card based on its position
function getFanRotation(index: number, total: number): number {
  if (total <= 1) return 0;
  if (total === 2) return index === 0 ? -4 : 4;

  // Max spread angle depends on card count
  const maxSpread = Math.min(total * 4, 20); // Max 20 degrees total spread
  const step = maxSpread / (total - 1);
  return -maxSpread / 2 + index * step;
}

// Calculate vertical offset for arc effect
function getFanOffset(index: number, total: number): number {
  if (total <= 2) return 0;

  // Parabolic curve - cards at edges are higher
  const center = (total - 1) / 2;
  const distanceFromCenter = Math.abs(index - center);
  const maxOffset = Math.min(total * 2, 12);
  return distanceFromCenter * (maxOffset / center) * 0.8;
}

export function PlayerHand({
  cards,
  currentMana,
  selectedCardId,
  onCardClick,
  onCardLongPress,
  className,
}: PlayerHandProps) {
  return (
    <div
      className={cn(
        'w-full px-3 pt-6 pb-2',
        'flex items-end justify-center',
        'overflow-x-auto overflow-y-visible scrollbar-hide',
        className
      )}
    >
      {cards.length === 0 ? (
        <div className="text-gray-500/70 text-sm italic py-8">
          No cards in hand
        </div>
      ) : (
        <div
          className="flex items-end justify-center gap-0"
          style={{
            // Negative margin to overlap cards slightly for fan effect
            gap: cards.length > 5 ? '-12px' : cards.length > 3 ? '-8px' : '0px',
          }}
        >
          {cards.map((cardInstance, index) => {
            const isPlayable = canAfford(cardInstance.card, currentMana);
            const isSelected = selectedCardId === cardInstance.instanceId;
            const rotation = getFanRotation(index, cards.length);
            const offset = getFanOffset(index, cards.length);

            return (
              <HandCard
                key={cardInstance.instanceId}
                cardInstance={cardInstance}
                isSelected={isSelected}
                isPlayable={isPlayable}
                fanRotation={isSelected ? 0 : rotation}
                fanOffset={isSelected ? 0 : offset}
                onClick={() => onCardClick?.(cardInstance)}
                onLongPress={() => onCardLongPress?.(cardInstance)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
