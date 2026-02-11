'use client';

import { cn } from '@/lib/utils';
import { LobbyUser } from '@/lib/game/lobby-types';
import { UserStatusBadge } from './UserStatusBadge';
import { Swords, User } from 'lucide-react';

interface OnlineUserCardProps {
  user: LobbyUser;
  onChallenge: (lensAddress: string) => void;
  disabled?: boolean;
  isSelf?: boolean;
}

export function OnlineUserCard({
  user,
  onChallenge,
  disabled = false,
  isSelf = false,
}: OnlineUserCardProps) {
  const canChallenge = user.state === 'ONLINE' && !disabled && !isSelf;

  const displayName = user.lensHandle
    ? `@${user.lensHandle}`
    : `${user.lensAddress.slice(0, 6)}...${user.lensAddress.slice(-4)}`;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        'bg-gray-900/60',
        canChallenge
          ? 'border-gold/20 hover:border-gold/50 hover:bg-gray-800/60'
          : 'border-gray-700/50',
        isSelf && 'border-purple-500/30 bg-purple-500/5'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.lensAvatar ? (
          <img
            src={user.lensAvatar}
            alt={displayName}
            className="w-12 h-12 rounded-full border-2 border-gold/30 object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-gold/30 bg-gray-800 flex items-center justify-center">
            <User className="w-6 h-6 text-gold/50" />
          </div>
        )}
        {/* Online indicator dot */}
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900',
            user.state === 'ONLINE' && 'bg-green-500',
            user.state === 'IN_GAME' && 'bg-red-500',
            user.state === 'BUSY' && 'bg-yellow-500'
          )}
        />
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-white truncate">
            {displayName}
          </p>
          {isSelf && (
            <span className="text-xs text-purple-400 font-medium">(You)</span>
          )}
        </div>
        <UserStatusBadge state={user.state} className="mt-1" />
      </div>

      {/* Challenge button */}
      {!isSelf && (
        <button
          onClick={() => onChallenge(user.lensAddress)}
          disabled={!canChallenge}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg font-display text-sm transition-all',
            canChallenge
              ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 hover:border-gold'
              : 'bg-gray-800/50 text-gray-500 border border-gray-700 cursor-not-allowed'
          )}
        >
          <Swords className="w-4 h-4" />
          <span className="hidden sm:inline">Challenge</span>
        </button>
      )}
    </div>
  );
}
