'use client';

import { AIDifficulty } from '@/lib/game/types';
import Link from 'next/link';

interface DifficultySelectorProps {
  onSelect: (difficulty: AIDifficulty) => void;
}

interface DifficultyOption {
  difficulty: AIDifficulty;
  label: string;
  description: string;
  icon: string;
  color: string;
  glowColor: string;
}

const difficulties: DifficultyOption[] = [
  {
    difficulty: 'EASY',
    label: 'Easy',
    description: 'Relaxed gameplay with slower AI decisions',
    icon: '🌱',
    color: 'from-green-600 to-green-800',
    glowColor: 'shadow-green-500/50',
  },
  {
    difficulty: 'MEDIUM',
    label: 'Medium',
    description: 'Balanced challenge for most players',
    icon: '⚔️',
    color: 'from-amber-600 to-amber-800',
    glowColor: 'shadow-amber-500/50',
  },
  {
    difficulty: 'HARD',
    label: 'Hard',
    description: 'Aggressive AI that prioritizes lethal',
    icon: '💀',
    color: 'from-red-600 to-red-800',
    glowColor: 'shadow-red-500/50',
  },
  {
    difficulty: 'NIGHTMARE',
    label: 'Nightmare',
    description: 'Merciless AI that calculates lethal and plays optimally',
    icon: '👹',
    color: 'from-purple-600 to-purple-900',
    glowColor: 'shadow-purple-500/50',
  },
  {
    difficulty: 'MAXIMUM_HELL',
    label: 'MAXIMUM HELL',
    description: 'INSTANT DECISIONS. NO MERCY. PURE DESTRUCTION.',
    icon: '🔥',
    color: 'from-red-900 via-orange-600 to-yellow-500',
    glowColor: 'shadow-orange-500/80',
  },
];

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        {/* Title */}
        <h1 className="text-3xl font-display font-bold text-gold mb-2">
          Lens Hearthstone
        </h1>
        <p className="text-gold/60 text-sm mb-8">Select Difficulty</p>

        {/* Difficulty buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {difficulties.map((option) => (
            <button
              key={option.difficulty}
              onClick={() => onSelect(option.difficulty)}
              className={`
                relative group w-full p-4 rounded-xl
                bg-gradient-to-br ${option.color}
                border-2 border-gold/30
                shadow-lg ${option.glowColor}
                hover:border-gold hover:scale-105
                active:scale-95
                transition-all duration-200
                min-h-[80px]
              `}
            >
              {/* Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl">
                {option.icon}
              </div>

              {/* Text content */}
              <div className="ml-12 text-left">
                <h3 className="text-xl font-display font-bold text-white">
                  {option.label}
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  {option.description}
                </p>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
            </button>
          ))}
        </div>

        {/* Multiplayer link */}
        <Link
          href="/play/multiplayer"
          className="mt-6 text-gold/70 py-4 active:opacity-40 hover:text-gold text-2xl underline underline-offset-2 transition-colors duration-200"
        >
          Play Multiplayer
        </Link>

        {/* Footer decoration */}
        <div className="mt-8 flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gold/30 rounded-full" />
          <div className="w-2 h-2 bg-gold/50 rounded-full" />
          <div className="w-8 h-0.5 bg-gold/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
