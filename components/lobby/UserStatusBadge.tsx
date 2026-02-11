'use client';

import { cn } from '@/lib/utils';
import { LobbyUserState } from '@/lib/game/lobby-types';

interface UserStatusBadgeProps {
  state: LobbyUserState;
  className?: string;
}

export function UserStatusBadge({ state, className }: UserStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        state === 'ONLINE' && 'bg-green-500/20 text-green-400',
        state === 'IN_GAME' && 'bg-red-500/20 text-red-400',
        state === 'BUSY' && 'bg-yellow-500/20 text-yellow-400',
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          state === 'ONLINE' && 'bg-green-400 animate-pulse',
          state === 'IN_GAME' && 'bg-red-400',
          state === 'BUSY' && 'bg-yellow-400 animate-pulse'
        )}
      />
      {state === 'ONLINE' && 'Online'}
      {state === 'IN_GAME' && 'In Game'}
      {state === 'BUSY' && 'Busy'}
    </span>
  );
}
