'use client';

import { cn } from '@/lib/utils';

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-gray-800 to-gray-900',
        'border-2 border-gold',
        'text-gold font-bold text-lg',
        'shadow-[0_0_8px_rgba(212,175,55,0.3)]',
        'hover:scale-105 active:scale-95 transition-transform',
        'min-w-[36px] min-h-[36px]', // Touch target
        className
      )}
      aria-label="Help"
    >
      ?
    </button>
  );
}
