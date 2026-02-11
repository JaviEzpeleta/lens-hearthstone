'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export type ToastType = 'error' | 'info' | 'success';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  message,
  type = 'info',
  duration = 2000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
    }, duration - 200);

    const closeTimer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-2 rounded-lg shadow-lg',
        'font-medium text-sm',
        'transition-all duration-200',
        leaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0',
        type === 'error' && 'bg-red-900/90 text-red-200 border border-red-500/50',
        type === 'info' && 'bg-gray-900/90 text-gray-200 border border-gray-600/50',
        type === 'success' && 'bg-green-900/90 text-green-200 border border-green-500/50'
      )}
    >
      {type === 'error' && <span className="mr-2">⚠️</span>}
      {type === 'success' && <span className="mr-2">✓</span>}
      {message}
    </div>
  );
}

// Toast manager for showing toasts programmatically
type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let currentToasts: ToastItem[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const id = `toast_${Date.now()}_${Math.random()}`;
  const toast: ToastItem = { id, message, type };

  currentToasts = [...currentToasts, toast];
  toastListeners.forEach((listener) => listener(currentToasts));

  // Auto remove after delay
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(currentToasts));
  }, 2500);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  return toasts;
}
