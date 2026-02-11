'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { GameProvider, useGame, Card, AIDifficulty } from '@/lib/game';
import { GameBoard, LoadingScreen, Toast, useToasts, DifficultySelector } from '@/components/game';
import { useOrientationLock } from '@/hooks/useOrientationLock';
import { useActiveAddress } from '@/hooks/useActiveAddress';

function OrientationWarning() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-2xl font-bold text-gold mb-2">Rotate Your Device</h2>
        <p className="text-gray-400">
          This game is best played in portrait mode.
          <br />
          Please rotate your device.
        </p>
      </div>
    </div>
  );
}

function ToastContainer() {
  const toasts = useToasts();

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </>
  );
}

function GameContainer({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const { startGame } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty | null>(null);

  const initGame = useCallback((difficulty: AIDifficulty) => {
    // Split cards between player and opponent
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const playerDeck = shuffled.slice(0, half);
    const opponentDeck = shuffled.slice(half);

    startGame(playerDeck, opponentDeck, difficulty);
    setGameStarted(true);
  }, [cards, startGame]);

  const handleDifficultySelect = useCallback((difficulty: AIDifficulty) => {
    setSelectedDifficulty(difficulty);
    initGame(difficulty);
  }, [initGame]);

  const handlePlayAgain = useCallback(() => {
    setGameStarted(false);
    // Keep the same difficulty for "Play Again"
    if (selectedDifficulty) {
      setTimeout(() => initGame(selectedDifficulty), 100);
    }
  }, [initGame, selectedDifficulty]);

  const handleBackToMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  // Show difficulty selector if game hasn't started and no difficulty selected
  if (!gameStarted && !selectedDifficulty) {
    return <DifficultySelector onSelect={handleDifficultySelect} />;
  }

  // Show loading while game initializes
  if (!gameStarted) {
    return <LoadingScreen message="Preparing the battlefield..." />;
  }

  return (
    <>
      <GameBoard
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
      <ToastContainer />
    </>
  );
}

export default function PlayPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLandscape } = useOrientationLock();
  const { activeAddress, lensAccountData } = useActiveAddress();

  useEffect(() => {
    // Load cards from public/cards directory
    async function loadCards() {
      try {
        // Fetch card files (we know they're 0-29 based on the glob)
        const cardPromises: Promise<Card>[] = [];
        for (let i = 0; i <= 29; i++) {
          cardPromises.push(
            fetch(`/cards/${i}.json`)
              .then((res) => res.json())
              .catch(() => null)
          );
        }

        const loadedCards = (await Promise.all(cardPromises)).filter(
          (c): c is Card => c !== null
        );
        setCards(loadedCards);
      } catch (error) {
        console.error('Failed to load cards:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCards();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading cards..." />;
  }

  if (cards.length === 0) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900">
        <p className="text-red-400 font-bold">No cards found!</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gold text-black rounded-lg font-bold min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="w-full h-screen overflow-hidden max-w-lg mx-auto">
      {isLandscape && <OrientationWarning />}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fbbf24',
            border: '1px solid #b45309',
            fontFamily: 'MedievalSharp, cursive',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />

      <GameProvider
          lensAddress={activeAddress || undefined}
          lensHandle={lensAccountData?.username?.localName}
          lensAvatar={lensAccountData?.metadata?.picture}
        >
        <GameContainer cards={cards} />
      </GameProvider>
    </main>
  );
}
