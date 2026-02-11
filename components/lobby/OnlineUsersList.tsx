'use client';

import { LobbyUser } from '@/lib/game/lobby-types';
import { OnlineUserCard } from './OnlineUserCard';
import { Users } from 'lucide-react';

interface OnlineUsersListProps {
  users: LobbyUser[];
  currentUserAddress: string;
  onChallenge: (lensAddress: string) => void;
  disabled?: boolean;
}

export function OnlineUsersList({
  users,
  currentUserAddress,
  onChallenge,
  disabled = false,
}: OnlineUsersListProps) {
  // Sort users: self first, then online users, then busy/in-game
  const sortedUsers = [...users].sort((a, b) => {
    // Self first
    if (a.lensAddress === currentUserAddress) return -1;
    if (b.lensAddress === currentUserAddress) return 1;
    // Then by state: ONLINE > BUSY > IN_GAME
    const stateOrder = { ONLINE: 0, BUSY: 1, IN_GAME: 2 };
    return stateOrder[a.state] - stateOrder[b.state];
  });

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400 font-display">No players online</p>
        <p className="text-gray-500 text-sm mt-1">
          Waiting for other players to join the lobby...
        </p>
      </div>
    );
  }

  // Count available players (online and not self)
  const availablePlayers = users.filter(
    (u) => u.state === 'ONLINE' && u.lensAddress !== currentUserAddress
  ).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-gold font-display text-sm">
          Players in Lobby
        </h3>
        <span className="text-gray-400 text-xs">
          {availablePlayers} available
        </span>
      </div>

      {/* User list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent">
        {sortedUsers.map((user) => (
          <OnlineUserCard
            key={user.lensAddress}
            user={user}
            onChallenge={onChallenge}
            disabled={disabled}
            isSelf={user.lensAddress === currentUserAddress}
          />
        ))}
      </div>
    </div>
  );
}
