'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Challenge, CHALLENGE_TIMEOUT_MS } from '@/lib/game/lobby-types';
import { X, Loader2, User } from 'lucide-react';

interface ChallengePendingModalProps {
  challenge: Challenge;
  onCancel: (challengeId: string) => void;
}

export function ChallengePendingModal({
  challenge,
  onCancel,
}: ChallengePendingModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000))
  );

  // Countdown timer
  useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    const interval = setInterval(() => {
      const remaining = updateTime();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  const { challenged } = challenge;
  const displayName = challenged.lensHandle
    ? `@${challenged.lensHandle}`
    : `${challenged.lensAddress.slice(0, 6)}...${challenged.lensAddress.slice(-4)}`;

  // Progress bar percentage
  const progress = (timeLeft / (CHALLENGE_TIMEOUT_MS / 1000)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-gray-900 border-2 border-purple-500/50 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Timer progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              timeLeft > 10 ? 'bg-purple-500' : 'bg-red-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <h2 className="text-xl font-display text-purple-300">Waiting for Response</h2>
          </div>

          {/* Challenged user info */}
          <div className="flex flex-col items-center mb-6">
            {challenged.lensAvatar ? (
              <img
                src={challenged.lensAvatar}
                alt={displayName}
                className="w-20 h-20 rounded-full border-3 border-purple-500/50 mb-3 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-3 border-purple-500/50 bg-gray-800 flex items-center justify-center mb-3">
                <User className="w-10 h-10 text-purple-500/50" />
              </div>
            )}
            <p className="text-white font-display text-lg">{displayName}</p>
            <p className="text-gray-400 text-sm">Deciding...</p>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <span
              className={cn(
                'text-2xl font-mono font-bold',
                timeLeft > 10 ? 'text-purple-400' : 'text-red-400 animate-pulse'
              )}
            >
              {timeLeft}s
            </span>
            <p className="text-gray-500 text-xs mt-1">until challenge expires</p>
          </div>

          {/* Cancel button */}
          <button
            onClick={() => onCancel(challenge.id)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg font-display transition-colors"
          >
            <X className="w-5 h-5" />
            Cancel Challenge
          </button>
        </div>
      </div>
    </div>
  );
}
