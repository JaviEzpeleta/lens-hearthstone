'use client';

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms to wait before triggering
  moveThreshold?: number; // px movement to cancel
}

interface UseLongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

export function useLongPress(
  onLongPress: (() => void) | undefined,
  onClick?: () => void,
  options: UseLongPressOptions = {}
): UseLongPressHandlers {
  const { threshold = 500, moveThreshold = 10 } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    longPressTriggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress?.();
    }, threshold);
  }, [clearTimer, onLongPress, threshold]);

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startTimer();
    },
    [startTimer]
  );

  const onMouseUp = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  const onMouseLeave = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      startTimer();
    },
    [startTimer]
  );

  const onTouchEnd = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimer();
        startPosRef.current = null;
      }
    },
    [clearTimer, moveThreshold]
  );

  // Right-click handler for desktop
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress?.();
    },
    [onLongPress]
  );

  // Click handler - prevent click if long-press was triggered
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (longPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
        longPressTriggeredRef.current = false;
        return;
      }
      onClick?.();
    },
    [onClick]
  );

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onContextMenu,
    onClick: handleClick,
  };
}
