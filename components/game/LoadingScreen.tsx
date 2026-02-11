'use client';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
}

export function LoadingScreen({
  message = 'Loading...',
  showSpinner = true,
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900">
      {/* Logo/Title */}
      <h1 className="text-3xl font-display font-bold text-gold mb-8">
        Lens Hearthstone
      </h1>

      {/* Spinner */}
      {showSpinner && (
        <div className="relative w-16 h-16 mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-gold rounded-full animate-spin" />
          {/* Inner glow */}
          <div className="absolute inset-2 bg-gold/10 rounded-full animate-pulse" />
        </div>
      )}

      {/* Message */}
      <p className="text-gold/80 font-medium animate-pulse">{message}</p>

      {/* Decorative elements */}
      <div className="absolute bottom-8 flex items-center gap-2">
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
