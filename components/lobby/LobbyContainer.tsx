'use client';

import { useEffect, useRef } from 'react';
import { useLobbyPresence } from '@/hooks/useLobbyPresence';
import { OnlineUsersList } from './OnlineUsersList';
import { ChallengeNotification } from './ChallengeNotification';
import { ChallengePendingModal } from './ChallengePendingModal';
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';

interface LobbyContainerProps {
  lensAddress: string;
  lensHandle?: string;
  lensAvatar?: string;
  onGameReady: (roomCode: string) => void;
}

export function LobbyContainer({
  lensAddress,
  lensHandle,
  lensAvatar,
  onGameReady,
}: LobbyContainerProps) {
  const {
    status,
    error,
    onlineUsers,
    incomingChallenge,
    outgoingChallenge,
    gameReady,
    connect,
    disconnect,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    clearGameReady,
  } = useLobbyPresence({
    lensAddress,
    lensHandle,
    lensAvatar,
    autoConnect: true,
  });

  // When game is ready, navigate to the game
  useEffect(() => {
    if (gameReady) {
      onGameReady(gameReady.roomCode);
      clearGameReady();
    }
  }, [gameReady, onGameReady, clearGameReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // useEffect(() => {
  //   if (loadedRef.current) return;
  //   loadedRef.current = true;
  //   setTimeout(() => {
  //   connect();
  // }, 150);
  //   // toast('hello my frend')
  // }, []);


  // const loadedRef = useRef(false);
  // const showToast = () => {
  //   toast('hello my frend')
  // }

  // Render connection status indicator
  const renderConnectionStatus = () => {
    switch (status) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Connecting to lobby...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <Wifi className="w-4 h-4" />
            <span className="text-sm">Connected</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Disconnected</span>
            <button
              onClick={connect}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors"
              title="Reconnect"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Connection error</span>
            <button
              onClick={connect}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  // Show loading while connecting
  if (status === 'connecting') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-gray-900/60 border border-gold/20 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
            <p className="text-gold font-display">Connecting to lobby...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900/60 border border-gold/20 rounded-lg overflow-hidden">
        {/* Header with connection status */}
        <div className="flex items-center justify-between p-4 border-b border-gold/10">
          <h2 className="text-lg font-display text-gold">Find Opponent</h2>
          {renderConnectionStatus()}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-900/20 border-b border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* User list */}
        <div className="p-4">
          {status === 'connected' ? (
            <OnlineUsersList
              users={onlineUsers}
              currentUserAddress={lensAddress}
              onChallenge={sendChallenge}
              disabled={!!outgoingChallenge || !!incomingChallenge}
            />
          ) : status === 'error' || status === 'disconnected' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <WifiOff className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-400 font-display">Not connected</p>
              <p className="text-gray-500 text-sm mt-1 mb-4">
                {status === 'error' ? 'Failed to connect to lobby' : 'Connection lost'}
              </p>
              <div>STATUS: {status}</div>
              {/* <Button onClick={showToast}>Show Toast</Button> */}
              <button
                onClick={connect}
                className="flex items-center gap-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 rounded-lg font-display transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-3 bg-gray-800/30 border-t border-gold/10">
          <p className="text-gray-500 text-xs text-center">
            Click on an available player to send a challenge
          </p>
        </div>
      </div>

      {/* Challenge notification (incoming) */}
      {incomingChallenge && (
        <ChallengeNotification
          challenge={incomingChallenge}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
        />
      )}

      {/* Challenge pending modal (outgoing) */}
      {outgoingChallenge && (
        <ChallengePendingModal
          challenge={outgoingChallenge}
          onCancel={cancelChallenge}
        />
      )}
    </div>
  );
}
