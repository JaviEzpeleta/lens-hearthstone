'use client';

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  selection: [10, 50, 10],
};

export function useHaptics() {
  const vibrate = useCallback((type: HapticType = 'light') => {
    // Check if vibration API is supported
    if (!navigator.vibrate) return;

    const pattern = HAPTIC_PATTERNS[type];
    navigator.vibrate(pattern);
  }, []);

  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const selectionTap = useCallback(() => vibrate('selection'), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    selectionTap,
  };
}
