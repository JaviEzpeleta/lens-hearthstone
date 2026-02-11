'use client';

import { cn } from '@/lib/utils';
import { WeaponInstance } from '@/lib/game/types';
import NumberFlow from '@number-flow/react';
import { useLongPress } from '@/hooks/useLongPress';

interface HeroPortraitProps {
  health: number;
  maxHealth: number;
  armor?: number;
  weapon?: WeaponInstance | null;
  isPlayer: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  canAttack?: boolean;
  onClick?: () => void;
  onWeaponLongPress?: () => void;
  className?: string;
}

export function HeroPortrait({
  health,
  maxHealth,
  armor = 0,
  weapon,
  isPlayer,
  isTargetable = false,
  isSelected = false,
  canAttack = false,
  onClick,
  onWeaponLongPress,
  className,
}: HeroPortraitProps) {
  const isDamaged = health < maxHealth;
  const isCritical = health <= 10;

  const weaponLongPressHandlers = useLongPress(onWeaponLongPress);

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200',
        isTargetable && cn(
          'spotlight-target animate-spotlight-pulse',
          'ring-2 ring-red-500 ring-offset-2 ring-offset-transparent',
          'cursor-targeting z-40'
        ),
        isSelected && 'ring-2 ring-gold ring-offset-2 ring-offset-background',
        canAttack && !isSelected && 'animate-electric-pulse cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Weapon (if equipped, player only) */}
      {isPlayer && weapon && (
        <div
          className={cn(
            'relative w-10 h-13 rounded-lg overflow-hidden cursor-pointer',
            'border-2 transition-all duration-200',
            // Rarity border colors
            weapon.card.rarity === 'LEGENDARY' && 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
            weapon.card.rarity === 'EPIC' && 'border-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]',
            weapon.card.rarity === 'RARE' && 'border-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]',
            weapon.card.rarity === 'COMMON' && 'border-gray-500',
            // Attack indicator
            canAttack && 'animate-electric-pulse'
          )}
          {...weaponLongPressHandlers}
        >
          {/* Weapon image */}
          <img
            src={weapon.card.generatedImageUrl}
            alt={weapon.card.name}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Attack badge */}
          <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400/50 flex items-center justify-center shadow-md z-10">
            <span className="text-[10px] font-bold text-white">{weapon.currentAttack}</span>
          </div>

          {/* Durability badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-300/50 flex items-center justify-center shadow-md z-10">
            <span className="text-[10px] font-bold text-white">{weapon.currentDurability}</span>
          </div>
        </div>
      )}

      {/* Combined hero portrait + health */}
      <div
        className={cn(
          'relative h-12 rounded-lg flex items-center gap-1.5 px-2 border',
          'bg-gradient-to-br',
          isPlayer
            ? 'from-amber-900 to-amber-950 border-gold/40'
            : 'from-purple-900 to-purple-950 border-purple-500/40',
          isCritical && 'animate-pulse'
        )}
      >
        {/* Hero icon */}
        <span className="text-xl">{isPlayer ? '⚔️' : '👹'}</span>

        {/* Health value */}
        <div className="flex items-center">
          <NumberFlow
            value={health}
            className={cn(
              'font-bold text-lg tabular-nums',
              isDamaged ? 'text-red-400' : 'text-white',
              isCritical && 'text-red-300'
            )}
            transformTiming={{ duration: 300, easing: 'ease-out' }}
            spinTiming={{ duration: 300, easing: 'ease-out' }}
          />
          <span className="ml-0.5">❤️</span>
        </div>

        {/* Armor badge */}
        {armor > 0 && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-600 border border-gray-400 flex items-center justify-center">
            <span className="text-xs text-gray-200">{armor}</span>
          </div>
        )}
      </div>
    </div>
  );
}
