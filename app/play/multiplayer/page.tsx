'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MultiplayerBoard } from '@/components/game/MultiplayerBoard';
import { useActiveAddress } from '@/hooks/useActiveAddress';
import { useLensAuth } from '@/hooks/useLensAuth';
import { generateRoomCode } from '@/lib/game/multiplayer-types';
import { useOrientationLock } from '@/hooks/useOrientationLock';
import { ConnectKitButton } from 'connectkit';
import { LoginOptions } from '@/components/LoginOptions';
import { useLogout } from '@lens-protocol/react';
import {
  Swords,
  Users,
  ArrowLeft,
  Loader2,
  LogIn,
  User,
  KeyRound,
  RefreshCw,
  LogOut,
  Search,
} from 'lucide-react';
import { LobbyContainer } from '@/components/lobby';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LobbyState = 'menu' | 'create' | 'join' | 'lobby' | 'playing';

export default function MultiplayerPage() {
  const router = useRouter();
  const { activeAddress, lensAccountData, isLoading: addressLoading, evmAddress } = useActiveAddress();
  const { isWalletConnected, isAuthenticated, isLoading: authLoading, needsLensLogin, walletAddress } = useLensAuth();

  const [lobbyState, setLobbyState] = useState<LobbyState>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { execute: logout } = useLogout();

  // Lock orientation to portrait on mobile
  useOrientationLock();

  // Handle logout
  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  // Generate a room code when creating
  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setLobbyState('playing');
  };

  // Join an existing room
  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    const normalizedCode = inputRoomCode.toUpperCase().trim();
    if (normalizedCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    setRoomCode(normalizedCode);
    setLobbyState('playing');
  };

  // Leave game and return to menu
  const handleLeaveGame = () => {
    setLobbyState('menu');
    setRoomCode('');
    setInputRoomCode('');
    setError(null);
  };

  // Handle game ready from lobby (challenge accepted)
  const handleLobbyGameReady = (code: string) => {
    setRoomCode(code);
    setLobbyState('playing');
  };

  // Get user display info
  const getUserDisplayName = (): string => {
    if (lensAccountData?.username?.localName) {
      return lensAccountData.username.localName;
    }
    if (evmAddress) {
      return `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`;
    }
    return 'Anonymous';
  };

  // Use wallet address as the identifier
  const playerAddress = evmAddress || activeAddress || '';

  // If playing, show the game board
  if (lobbyState === 'playing' && roomCode && playerAddress) {
    return (
      <div className="w-screen h-[100dvh] overflow-hidden">
        <MultiplayerBoard
          roomCode={roomCode}
          lensAddress={playerAddress}
          lensHandle={lensAccountData?.username?.localName}
          lensAvatar={lensAccountData?.metadata?.picture}
          onLeaveGame={handleLeaveGame}
        />
      </div>
    );
  }

  // Loading state
  const isLoading = addressLoading || authLoading;

  // Can play when authenticated with Lens (not just wallet connected)
  const canPlay = isAuthenticated && !!playerAddress;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-950 via-[#1a1015] to-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gold/20">
        <button
          onClick={() => router.push('/play')}
          className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-display text-sm">Back</span>
        </button>

        <h1 className="font-display text-gold text-xl tracking-wide">1v1 Battle</h1>

        {/* User info in header when authenticated */}
        {isAuthenticated && !isLoading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 px-6 rounded-xl cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-gray-400 text-sm font-display hidden sm:block">{getUserDisplayName()}</span>
                {lensAccountData?.metadata?.picture ? (
                  <img
                    src={lensAccountData.metadata.picture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-gold/50"
                  />
                ) : (
                  <User className="w-8 h-8 text-gold p-1.5 bg-gold/10 rounded-full" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gold/20">
              <DropdownMenuItem
                onClick={() => setShowLoginModal(true)}
                className="text-gray-300 focus:text-white focus:bg-gold/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-16" /> /* Spacer for centering */
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Auth Section - only show when not authenticated */}
        {!isAuthenticated && (
          <div className="w-full max-w-md mb-8">
            <div className="bg-gray-900/60 border border-gold/20 rounded-lg p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : !isWalletConnected ? (
                // Step 1: Connect wallet
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm text-center">
                    Connect your wallet to play multiplayer
                  </p>
                  <ConnectKitButton.Custom>
                    {({ show }) => (
                      <button
                        onClick={show}
                        className="w-full py-3 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 rounded-lg font-display transition-colors flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                        Connect Wallet
                      </button>
                    )}
                  </ConnectKitButton.Custom>
                </div>
              ) : needsLensLogin ? (
                // Step 2: Sign in with Lens
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-10 h-10 text-gold/50 p-2 bg-gold/10 rounded-full" />
                    <div>
                      <p className="text-gray-400 font-display">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Wallet Connected'}
                      </p>
                      <p className="text-gray-500 text-xs">Wallet connected, sign in required</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-lg font-display transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-5 h-5" />
                    Sign in with Lens
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Menu */}
        {lobbyState === 'menu' && (
          <div className="w-full max-w-md space-y-4">
            {/* Find Opponent - Main CTA */}
            <button
              onClick={() => setLobbyState('lobby')}
              disabled={!canPlay}
              className={cn(
                "w-full py-6 rounded-lg font-display text-xl transition-all",
                "border-2 flex items-center justify-center gap-4",
                canPlay
                  ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/50 hover:border-green-500"
                  : "bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed"
              )}
            >
              <Search className="w-8 h-8" />
              Find Opponent
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <button
              onClick={() => setLobbyState('create')}
              disabled={!canPlay}
              className={cn(
                "w-full py-5 rounded-lg font-display text-lg transition-all",
                "border-2 flex items-center justify-center gap-4",
                canPlay
                  ? "bg-gold/10 hover:bg-gold/20 text-gold border-gold/50 hover:border-gold"
                  : "bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed"
              )}
            >
              <Swords className="w-6 h-6" />
              Create Room
            </button>

            <button
              onClick={() => setLobbyState('join')}
              disabled={!canPlay}
              className={cn(
                "w-full py-5 rounded-lg font-display text-lg transition-all",
                "border-2 flex items-center justify-center gap-4",
                canPlay
                  ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/50 hover:border-purple-500"
                  : "bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed"
              )}
            >
              <Users className="w-6 h-6" />
              Join Room
            </button>

            {!canPlay && (
              <p className="text-center text-gray-500 text-sm mt-4">
                {!isWalletConnected
                  ? 'Connect your wallet to play'
                  : needsLensLogin
                    ? 'Sign in with Lens to play'
                    : 'Loading...'
                }
              </p>
            )}
          </div>
        )}

        {/* Create Room */}
        {lobbyState === 'create' && (
          <div className="w-full max-w-md">
            <div className="bg-gray-900/60 border border-gold/30 rounded-lg p-6 text-center">
              <h2 className="text-gold font-display text-2xl mb-2">Create a Room</h2>
              <p className="text-gray-400 text-sm mb-6">
                A room code will be generated for your friend to join
              </p>

              <button
                onClick={handleCreateRoom}
                className="w-full py-4 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/50 rounded-lg font-display text-lg transition-colors flex items-center justify-center gap-3"
              >
                <Swords className="w-6 h-6" />
                Start Room
              </button>

              <button
                onClick={() => setLobbyState('menu')}
                className="mt-4 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Join Room */}
        {lobbyState === 'join' && (
          <div className="w-full max-w-md">
            <div className="bg-gray-900/60 border border-purple-500/30 rounded-lg p-6 text-center">
              <h2 className="text-purple-300 font-display text-2xl mb-2">Join a Room</h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter the 6-character room code from your friend
              </p>

              <input
                type="text"
                value={inputRoomCode}
                onChange={(e) => {
                  setInputRoomCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                maxLength={6}
                placeholder="ABCD12"
                className="w-full py-4 px-6 bg-gray-800 border border-purple-500/30 rounded-lg text-center font-display text-3xl tracking-[0.3em] text-purple-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />

              {error && (
                <p className="mt-2 text-red-400 text-sm">{error}</p>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={inputRoomCode.length !== 6}
                className={cn(
                  "w-full mt-4 py-4 rounded-lg font-display text-lg transition-colors flex items-center justify-center gap-3",
                  inputRoomCode.length === 6
                    ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    : "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                )}
              >
                <Users className="w-6 h-6" />
                Join Battle
              </button>

              <button
                onClick={() => setLobbyState('menu')}
                className="mt-4 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Lobby - Find Opponent */}
        {lobbyState === 'lobby' && canPlay && (
          <div className="w-full max-w-md">
            <LobbyContainer
              lensAddress={playerAddress}
              lensHandle={lensAccountData?.username?.localName}
              lensAvatar={lensAccountData?.metadata?.picture}
              onGameReady={handleLobbyGameReady}
            />

            <button
              onClick={() => setLobbyState('menu')}
              className="mt-4 w-full text-center text-gray-400 hover:text-white transition-colors py-2"
            >
              Back to Menu
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-gray-600 text-xs border-t border-gold/10">
        Real-time 1v1 card battles powered by Lens Protocol
      </footer>

      {/* Login Modal */}
      {showLoginModal && walletAddress && (
        <LoginOptions
          walletAddress={walletAddress}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
