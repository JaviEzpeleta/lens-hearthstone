'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface DamageNumberProps {
  value: number;
  type: 'damage' | 'heal' | 'buff';
  position: { x: number; y: number };
  onComplete?: () => void;
}

export function DamageNumber({
  value,
  type,
  position,
  onComplete,
}: DamageNumberProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const prefix = type === 'damage' ? '-' : '+';
  const displayValue = `${prefix}${value}`;

  return (
    <div
      className={cn(
        'fixed pointer-events-none z-50',
        'font-bold text-2xl',
        'animate-bounce-up-fade'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span
        className={cn(
          'text-stroke',
          type === 'damage' && 'text-red-500',
          type === 'heal' && 'text-green-500',
          type === 'buff' && 'text-yellow-500'
        )}
        style={{
          textShadow:
            '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
        }}
      >
        {displayValue}
      </span>
    </div>
  );
}
