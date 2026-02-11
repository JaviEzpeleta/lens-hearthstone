'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Card {
  id: number;
  handle: string;
  cardType: string;
  name: string;
  imagePrompt: string;
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  keywords: string[];
  abilityText: string;
  flavorText: string;
  rarity: string;
  generatedImageUrl: string;
  spellEffect?: {
    value: number;
    target: string;
    effectType: string;
    description: string;
    summonCount?: number;
    summonAttack?: number;
    summonHealth?: number;
  };
  weaponEffect?: {
    trigger: "BATTLECRY" | "AFTER_ATTACK" | "ON_ATTACK";
    effectType: "DRAW" | "HEAL" | "BUFF" | "DESTROY" | "DAMAGE";
    value?: number;
    secondaryValue?: number;
    target?: "NONE" | "ENEMY_MINION" | "RANDOM_FRIENDLY_MINION" | "ATTACKED_TARGET";
    description?: string;
  };
  profileAddress: string;
  profileName: string;
  profilePicture: string;
  profileScore: number;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'ALL' | 'MINION' | 'SPELL' | 'WEAPON';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MINION', label: 'Minions' },
  { value: 'WEAPON', label: 'Weapons' },
  { value: 'SPELL', label: 'Spells' },
];

function getRarityBorderColor(rarity: string): string {
  switch (rarity) {
    case "LEGENDARY":
      return "border-orange-500";
    case "EPIC":
      return "border-purple-500";
    case "RARE":
      return "border-blue-500";
    case "COMMON":
    default:
      return "border-gray-400";
  }
}

function getRarityGlowColor(rarity: string): string {
  switch (rarity) {
    case "LEGENDARY":
      return "shadow-orange-500/40";
    case "EPIC":
      return "shadow-purple-500/40";
    case "RARE":
      return "shadow-blue-500/40";
    case "COMMON":
    default:
      return "shadow-gray-400/20";
  }
}

interface CollectionGridProps {
  cards: Card[];
}

export function CollectionGrid({ cards }: CollectionGridProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filteredCards = filter === 'ALL'
    ? cards
    : cards.filter(c => c.cardType === filter);

  return (
    <>
      {/* Filter buttons */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
            className="font-serif tracking-wider"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Card count */}
      <p className="mb-4 text-center font-medieval text-sm text-muted-foreground">
        Showing {filteredCards.length} of {cards.length} cards
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredCards.map((card) => (
          <div key={card.id} className="group relative">
            {/* Card glow */}
            <div
              className={`absolute -inset-1 rounded-xl bg-gradient-to-b from-gold/40 via-gold/20 to-gold/40 opacity-0 blur-sm transition-opacity group-hover:opacity-60 ${getRarityGlowColor(card.rarity)}`}
            />

            {/* Card */}
            <div
              className={`relative flex h-72 w-full flex-col overflow-hidden rounded-xl border-2 bg-card shadow-lg transition-transform group-hover:scale-105 sm:h-80 ${getRarityBorderColor(card.rarity)}`}
            >
              {/* Mana cost */}
              <div className="absolute left-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mana font-display text-sm font-bold text-white shadow-lg shadow-mana/40 sm:h-9 sm:w-9 sm:text-base">
                {card.manaCost}
              </div>

              {/* Card art area */}
              <div className="relative mx-2 mt-2 aspect-square overflow-hidden rounded-md bg-gradient-to-br from-secondary to-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.generatedImageUrl}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Card name */}
              <div className="mx-1.5 mt-1.5 rounded bg-gradient-to-r from-gold-dark via-gold to-gold-dark px-1.5 py-0.5 text-center sm:mx-2 sm:mt-2 sm:px-2 sm:py-1">
                <span className="font-display text-[10px] font-bold leading-tight tracking-wide text-primary-foreground sm:text-xs">
                  {card.name}
                </span>
              </div>

              {/* Card description */}
              <div className="flex flex-1 items-center px-2 py-1 sm:px-3 sm:py-2">
                <p className="line-clamp-3 font-medieval text-center text-[9px] leading-tight text-card-foreground/80 sm:text-[10px]">
                  {card.abilityText}
                </p>
              </div>

              {/* Stats */}
              {card.cardType === "MINION" ? (
                <div className="flex items-end justify-between px-1 pb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-attack font-display text-sm font-bold text-white shadow-lg shadow-attack/40 sm:h-8 sm:w-8">
                    {card.attack}
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-health font-display text-sm font-bold text-white shadow-lg shadow-health/40 sm:h-8 sm:w-8">
                    {card.health}
                  </div>
                </div>
              ) : card.cardType === "WEAPON" ? (
                <div className="flex items-end justify-between px-1 pb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-attack font-display text-sm font-bold text-white shadow-lg shadow-attack/40 sm:h-8 sm:w-8">
                    {card.attack}
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-500 font-display text-sm font-bold text-white shadow-lg shadow-gray-500/40 sm:h-8 sm:w-8">
                    {card.durability}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center px-1 pb-2">
                  <span className="font-medieval text-[10px] italic text-gold/60 sm:text-xs">
                    {card.cardType}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="py-12 text-center">
          <p className="font-medieval text-lg text-muted-foreground">
            No {filter.toLowerCase()}s in the collection yet.
          </p>
        </div>
      )}
    </>
  );
}
