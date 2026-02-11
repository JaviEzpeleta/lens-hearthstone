'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/lib/game/types';
import { useLongPress } from '@/hooks/useLongPress';
import { CardDetailsModal } from '@/components/game/CardDetailsModal';

interface HeroCardCarouselProps {
  initialCards: Card[];
}

function getRarityClass(rarity: string): string {
  switch (rarity) {
    case 'LEGENDARY':
      return 'hero-card-legendary';
    case 'EPIC':
      return 'hero-card-epic';
    case 'RARE':
      return 'hero-card-rare';
    default:
      return 'hero-card-common';
  }
}

function getCardPositionClass(index: number): string {
  return `hero-card-pos-${index + 1}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface CardItemProps {
  card: Card;
  index: number;
  onSwap: (index: number) => void;
  onShowDetails: (card: Card) => void;
}

function CardItem({ card, index, onSwap, onShowDetails }: CardItemProps) {
  const isMobileHidden = index === 0 || index === 4;

  const longPressHandlers = useLongPress(
    () => onShowDetails(card),
    () => onSwap(index)
  );

  return (
    <div
      {...longPressHandlers}
      className={`hero-card ${getRarityClass(card.rarity)} ${getCardPositionClass(index)} relative overflow-hidden rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105 ${
        isMobileHidden ? 'hidden sm:block' : ''
      }`}
      style={{
        width: 'clamp(90px, 12vw, 140px)',
        height: 'clamp(130px, 17vw, 200px)',
        marginLeft: index === 0 ? 0 : 'clamp(-15px, -2vw, -25px)',
      }}
    >
      {/* Card Image */}
      <Image
        src={card.generatedImageUrl}
        alt={card.name}
        fill
        className="object-cover pointer-events-none"
        sizes="(max-width: 640px) 90px, (max-width: 1024px) 110px, 140px"
      />

      {/* Card Overlay with Stats */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Mana Cost Crystal */}
      <div className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1a365d] bg-gradient-to-br from-[#4299e1] to-[#2b6cb0] shadow-lg sm:left-2 sm:top-2 sm:h-8 sm:w-8 pointer-events-none">
        <span className="font-display text-xs font-bold text-white drop-shadow-md sm:text-sm">
          {card.manaCost}
        </span>
      </div>

      {/* Attack (for minions/weapons) */}
      {card.attack !== undefined && (
        <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#7b341e] bg-gradient-to-br from-[#ed8936] to-[#c05621] shadow-lg sm:bottom-2 sm:left-2 sm:h-7 sm:w-7 pointer-events-none">
          <span className="font-display text-[10px] font-bold text-white drop-shadow-md sm:text-xs">
            {card.attack}
          </span>
        </div>
      )}

      {/* Health (for minions) */}
      {card.health !== undefined && (
        <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#742a2a] bg-gradient-to-br from-[#fc5c5c] to-[#c53030] shadow-lg sm:bottom-2 sm:right-2 sm:h-7 sm:w-7 pointer-events-none">
          <span className="font-display text-[10px] font-bold text-white drop-shadow-md sm:text-xs">
            {card.health}
          </span>
        </div>
      )}

      {/* Durability (for weapons) */}
      {card.durability !== undefined && (
        <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#374151] bg-gradient-to-br from-[#9ca3af] to-[#6b7280] shadow-lg sm:bottom-2 sm:right-2 sm:h-7 sm:w-7 pointer-events-none">
          <span className="font-display text-[10px] font-bold text-white drop-shadow-md sm:text-xs">
            {card.durability}
          </span>
        </div>
      )}

      {/* Card Name Strip */}
      <div className="absolute bottom-6 left-0 right-0 px-0.5 sm:bottom-10 sm:px-1 pointer-events-none">
        <div className="rounded bg-black/70 px-0.5 py-0.5 backdrop-blur-sm sm:px-1">
          <p className="truncate text-center font-medieval text-[8px] text-[#f0e6d3] sm:text-[10px]">
            {card.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroCardCarousel({ initialCards }: HeroCardCarouselProps) {
  const [displayedCards, setDisplayedCards] = useState<Card[]>(() =>
    initialCards.slice(0, 5)
  );
  const [availableCards, setAvailableCards] = useState<Card[]>(() =>
    initialCards.slice(5)
  );
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSwap = useCallback((index: number) => {
    if (availableCards.length === 0) return;

    setDisplayedCards((prev) => {
      const newDisplayed = [...prev];
      const cardToRemove = newDisplayed[index];

      // Pick random card from available pool
      const shuffled = shuffleArray(availableCards);
      const newCard = shuffled[0];
      const remainingAvailable = shuffled.slice(1);

      newDisplayed[index] = newCard;

      // Update available cards: remove picked card, add removed displayed card
      setAvailableCards([...remainingAvailable, cardToRemove]);

      return newDisplayed;
    });
  }, [availableCards]);

  const handleShowDetails = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCard(null);
  }, []);

  return (
    <>
      <div className="relative z-10 mb-8 mt-8 flex items-end justify-center sm:mb-12 sm:mt-12 lg:mb-16">
        {displayedCards.map((card, index) => (
          <CardItem
            key={`${card.id}-${index}`}
            card={card}
            index={index}
            onSwap={handleSwap}
            onShowDetails={handleShowDetails}
          />
        ))}
      </div>

      <CardDetailsModal
        isOpen={isModalOpen}
        card={selectedCard}
        onClose={handleCloseModal}
      />
    </>
  );
}
