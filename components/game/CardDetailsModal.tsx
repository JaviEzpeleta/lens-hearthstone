'use client';

import { cn } from '@/lib/utils';
import { Card, MinionInstance } from '@/lib/game/types';
import { KEYWORD_ICONS, KEYWORD_DESCRIPTIONS } from '@/lib/game/keywords';

interface CardDetailsModalProps {
  isOpen: boolean;
  card: Card | null;
  minionInstance?: MinionInstance | null;
  onClose: () => void;
}

export function CardDetailsModal({
  isOpen,
  card,
  minionInstance,
  onClose,
}: CardDetailsModalProps) {
  if (!isOpen || !card) return null;

  const getRarityColor = () => {
    switch (card.rarity) {
      case 'LEGENDARY':
        return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
      case 'EPIC':
        return 'border-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.4)]';
      case 'RARE':
        return 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
      default:
        return 'border-gray-500';
    }
  };

  const getRarityBadgeColor = () => {
    switch (card.rarity) {
      case 'LEGENDARY':
        return 'bg-amber-500 text-black';
      case 'EPIC':
        return 'bg-purple-500 text-white';
      case 'RARE':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeBadge = () => {
    switch (card.cardType) {
      case 'MINION':
        return { icon: '👤', label: 'Minion' };
      case 'SPELL':
        return { icon: '✨', label: 'Spell' };
      case 'WEAPON':
        return { icon: '⚔️', label: 'Weapon' };
    }
  };

  const typeBadge = getTypeBadge();

  // For minions, show current vs base stats if different
  const showMinionStats = card.cardType === 'MINION' && (card.attack !== undefined && card.health !== undefined);
  const showWeaponStats = card.cardType === 'WEAPON' && (card.attack !== undefined && card.durability !== undefined);

  const currentAttack = minionInstance?.currentAttack ?? card.attack;
  const currentHealth = minionInstance?.currentHealth ?? card.health;
  const maxHealth = minionInstance?.maxHealth ?? card.health;
  const baseAttack = card.attack;
  const baseHealth = card.health;

  const isAttackBuffed = minionInstance && currentAttack !== undefined && baseAttack !== undefined && currentAttack > baseAttack;
  const isDamaged = minionInstance && currentHealth !== undefined && maxHealth !== undefined && currentHealth < maxHealth;
  const isHealthBuffed = minionInstance && maxHealth !== undefined && baseHealth !== undefined && maxHealth > baseHealth;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-[280px] rounded-2xl overflow-hidden',
          'bg-gradient-to-b from-gray-800 to-gray-900',
          'border-2 select-none',
          getRarityColor(),
          'animate-modal-appear'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mana cost badge */}
        <div
          className={cn(
            'absolute top-2 left-2 w-10 h-10 rounded-full z-20',
            'bg-gradient-to-br from-blue-500 to-blue-700',
            'border-2 border-blue-300/50',
            'flex items-center justify-center',
            'text-white font-bold text-xl shadow-lg'
          )}
        >
          {card.manaCost}
        </div>

        {/* Card image */}
        <div className="w-full aspect-square overflow-hidden">
          {card.generatedImageUrl ? (
            <img
              src={card.generatedImageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-6xl">{typeBadge.icon}</span>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="p-4 space-y-3">
          {/* Name and type */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-display font-bold text-gold leading-tight">
              {card.name}
            </h2>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-bold',
                getRarityBadgeColor()
              )}>
                {card.rarity}
              </span>
              <span className="text-xs text-gray-400">
                {typeBadge.icon} {typeBadge.label}
              </span>
            </div>
          </div>

          {/* Stats for minions */}
          {showMinionStats && (
            <div className="flex items-center gap-4">
              {/* Attack */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    'bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400/50'
                  )}
                >
                  {currentAttack}
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Attack</span>
                  {isAttackBuffed && (
                    <span className="text-green-400 ml-1">(+{(currentAttack ?? 0) - (baseAttack ?? 0)})</span>
                  )}
                </div>
              </div>

              {/* Health */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    'bg-gradient-to-br from-red-500 to-red-700 border border-red-400/50',
                    isDamaged && 'text-red-300'
                  )}
                >
                  {currentHealth}
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Health</span>
                  {isHealthBuffed && (
                    <span className="text-green-400 ml-1">(+{(maxHealth ?? 0) - (baseHealth ?? 0)})</span>
                  )}
                  {isDamaged && (
                    <span className="text-red-400 ml-1">/{maxHealth}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats for weapons */}
          {showWeaponStats && (
            <div className="flex items-center gap-4">
              {/* Attack */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    'bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400/50'
                  )}
                >
                  {card.attack}
                </div>
                <span className="text-xs text-gray-400">Attack</span>
              </div>

              {/* Durability */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    'bg-gradient-to-br from-gray-500 to-gray-700 border border-gray-400/50'
                  )}
                >
                  {card.durability}
                </div>
                <span className="text-xs text-gray-400">Durability</span>
              </div>
            </div>
          )}

          {/* Keywords */}
          {card.keywords.length > 0 && (
            <div className="space-y-1">
              {card.keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-base shrink-0">{KEYWORD_ICONS[keyword]}</span>
                  <div>
                    <span className="font-bold text-gold">{keyword}</span>
                    <span className="text-gray-300 ml-1">- {KEYWORD_DESCRIPTIONS[keyword]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ability text */}
          {card.abilityText && (
            <p className="text-sm text-gray-200 leading-snug">
              {card.abilityText}
            </p>
          )}

          {/* Flavor text */}
          {card.flavorText && (
            <p className="text-xs text-gray-500 italic leading-snug border-t border-gray-700 pt-2">
              {card.flavorText}
            </p>
          )}
        </div>

        {/* Tap to close hint */}
        <div className="text-center py-2 text-xs text-gray-500 border-t border-gray-700">
          Tap anywhere to close
        </div>
      </div>
    </div>
  );
}
