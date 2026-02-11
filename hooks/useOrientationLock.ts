'use client';

import { useEffect, useState } from 'react';

export function useOrientationLock() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile) return;

    // Try to lock to portrait
    const lockOrientation = async () => {
      try {
        // @ts-expect-error - screen.orientation.lock is not in all TypeScript libs
        if (screen.orientation?.lock) {
          // @ts-expect-error
          await screen.orientation.lock('portrait');
        }
      } catch {
        // Orientation lock not supported or denied
        console.log('Orientation lock not available');
      }
    };

    lockOrientation();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      const isCurrentlyLandscape = window.matchMedia('(orientation: landscape)').matches;
      setIsLandscape(isCurrentlyLandscape);
    };

    // Initial check
    handleOrientationChange();

    // Listen for changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.matchMedia('(orientation: landscape)').addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.matchMedia('(orientation: landscape)').removeEventListener('change', handleOrientationChange);
    };
  }, []);

  return { isLandscape };
}
