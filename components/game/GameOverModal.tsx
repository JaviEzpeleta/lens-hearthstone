'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';
import { PlayerTurn } from '@/lib/game/types';
import { playSound } from '@/lib/game/sounds';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PlayerTurn | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  isMultiplayer?: boolean;
  opponentName?: string;
}

// Golden confetti particles for victory
function GoldenConfetti() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute confetti-particle"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            background: `linear-gradient(135deg, #ffd700 0%, #ffb300 50%, #c9a033 100%)`,
            borderRadius: particle.size > 8 ? '2px' : '50%',
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 1, 1, 0.5, 0],
            rotate: particle.rotation + 720,
          }}
          transition={{
            duration: particle.duration,
            delay: 0.2 + particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Ash/smoke particles for defeat
function AshParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    delay: Math.random() * 0.8,
    duration: 3 + Math.random() * 2,
    size: 3 + Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            bottom: 0,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(120,120,120,0.6) 0%, rgba(80,80,80,0.3) 100%)`,
          }}
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{
            y: '-100vh',
            opacity: [0, 0.6, 0.4, 0],
            scale: [0.5, 1, 1.2, 0.8],
            x: [0, 10, -10, 5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: 0.3 + particle.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Animation variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const victoryModalVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0, y: 50 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

const defeatModalVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.4,
    },
  },
};

const victoryIconVariants: Variants = {
  hidden: { scale: 0, rotate: -30 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      delay: 0.4,
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

const defeatIconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.4,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const messageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      duration: 0.3,
    },
  },
};

const buttonContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function GameOverModal({
  isOpen,
  winner,
  onPlayAgain,
  onBackToMenu,
  isMultiplayer = false,
  opponentName,
}: GameOverModalProps) {
  // Play victory or defeat sound when modal opens
  useEffect(() => {
    if (isOpen && winner) {
      if (winner === 'player') {
        playSound('victory');
      } else {
        playSound('defeat');
      }
    }
  }, [isOpen, winner]);

  const isVictory = winner === 'player';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className={cn(
              'absolute inset-0',
              isVictory ? 'bg-black/75' : 'bg-black/85'
            )}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: isVictory ? 0.3 : 0.5 }}
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Particles */}
          {isVictory ? <GoldenConfetti /> : <AshParticles />}

          {/* Modal */}
          <motion.div
            className={cn(
              'relative z-10 w-[90%] max-w-sm rounded-2xl p-6 text-center',
              'bg-gradient-to-b shadow-2xl',
              isVictory
                ? 'from-amber-900 to-amber-950 border-2 border-gold'
                : 'from-red-900 to-red-950 border-2 border-red-500'
            )}
            variants={isVictory ? victoryModalVariants : defeatModalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Victory/Defeat text */}
            <motion.h1
              className={cn(
                'text-4xl font-display font-bold mb-4',
                isVictory ? 'text-gold' : 'text-red-400'
              )}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              style={
                isVictory
                  ? {
                      textShadow:
                        '0 0 10px rgba(201, 160, 51, 0.5), 0 0 20px rgba(201, 160, 51, 0.3)',
                    }
                  : undefined
              }
            >
              {isVictory ? (
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(201, 160, 51, 0.5), 0 0 20px rgba(201, 160, 51, 0.3)',
                      '0 0 20px rgba(201, 160, 51, 0.8), 0 0 40px rgba(201, 160, 51, 0.5)',
                      '0 0 10px rgba(201, 160, 51, 0.5), 0 0 20px rgba(201, 160, 51, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  VICTORY
                </motion.span>
              ) : (
                <motion.span
                  animate={{ x: [0, -2, 2, -2, 0] }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  DEFEAT
                </motion.span>
              )}
            </motion.h1>

            {/* Decorative icon */}
            <motion.div
              className="text-6xl mb-6"
              variants={isVictory ? victoryIconVariants : defeatIconVariants}
              initial="hidden"
              animate="visible"
            >
              {isVictory ? (
                <motion.span
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ display: 'inline-block' }}
                >
                  🏆
                </motion.span>
              ) : (
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ display: 'inline-block' }}
                >
                  💀
                </motion.span>
              )}
            </motion.div>

            {/* Message */}
            <motion.p
              className="text-gray-300 mb-8"
              variants={messageVariants}
              initial="hidden"
              animate="visible"
            >
              {isVictory
                ? isMultiplayer && opponentName
                  ? `Congratulations! You have defeated ${opponentName}.`
                  : 'Congratulations! You have defeated your opponent.'
                : isMultiplayer && opponentName
                  ? `You have been defeated by ${opponentName}. Better luck next time!`
                  : 'You have been defeated. Better luck next time!'}
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="flex flex-col gap-3"
              variants={buttonContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                onClick={onPlayAgain}
                className={cn(
                  'w-full py-3 rounded-lg font-bold text-lg transition-all',
                  'min-h-[48px]', // Touch target
                  isVictory
                    ? 'bg-gradient-to-br from-gold to-amber-600 text-black hover:scale-105'
                    : 'bg-gradient-to-br from-red-500 to-red-700 text-white hover:scale-105'
                )}
                variants={buttonVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {isMultiplayer ? 'Back to Lobby' : 'Play Again'}
              </motion.button>

              <motion.button
                onClick={onBackToMenu}
                className={cn(
                  'w-full py-3 rounded-lg font-bold text-lg transition-all',
                  'min-h-[48px]', // Touch target
                  'bg-gray-700 text-gray-200 hover:bg-gray-600'
                )}
                variants={buttonVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Menu
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
