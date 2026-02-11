'use client';

interface TargetingOverlayProps {
  isActive: boolean;
  message?: string;
  onCancel?: () => void;
}

export function TargetingOverlay({
  isActive,
  message = 'Select a target',
  onCancel,
}: TargetingOverlayProps) {
  if (!isActive) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-gray-900/95 border-2 border-red-500/70 rounded-lg px-6 py-3 shadow-xl shadow-red-500/20">
        <p className="text-red-400 font-bold text-center">{message}</p>
        <p className="text-gray-400 text-sm text-center mt-1">
          Tap a valid target
        </p>
      </div>
    </div>
  );
}
