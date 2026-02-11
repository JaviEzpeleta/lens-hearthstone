"use client";

import Link from "next/link";

// Card fragment component that floats toward the portal
function CardFragment({
  index,
  position,
}: {
  index: number;
  position: { x: number; y: number; rotation: number };
}) {
  const rarityColors = [
    "from-orange-500 to-orange-700", // Legendary
    "from-purple-500 to-purple-700", // Epic
    "from-blue-400 to-blue-600", // Rare
    "from-gray-400 to-gray-500", // Common
  ];
  const color = rarityColors[index % rarityColors.length];
  const duration = 5 + (index % 3) * 2;
  const delay = index * 0.8;

  return (
    <div
      className="animate-card-fragment-drift pointer-events-none absolute"
      style={
        {
          "--start-x": `${position.x}px`,
          "--start-y": `${position.y}px`,
          "--start-rot": `${position.rotation}deg`,
          "--drift-duration": `${duration}s`,
          "--drift-delay": `${delay}s`,
          left: "50%",
          top: "50%",
          marginLeft: position.x,
          marginTop: position.y,
        } as React.CSSProperties
      }
    >
      <div
        className={`h-16 w-12 rounded-lg bg-gradient-to-br ${color} opacity-70 shadow-lg sm:h-24 sm:w-16`}
        style={{
          clipPath: "polygon(10% 0%, 90% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)",
          boxShadow: `0 0 20px ${index % 2 === 0 ? "rgba(168, 85, 247, 0.5)" : "rgba(107, 33, 168, 0.5)"}`,
        }}
      >
        {/* Card pattern lines */}
        <div className="absolute inset-2 rounded border border-white/20" />
        <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

// Void wisp particle
function VoidWisp({ index }: { index: number }) {
  const angle = (index / 12) * Math.PI * 2;
  const radius = 120 + (index % 3) * 40;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const duration = 3 + (index % 4);
  const delay = index * 0.3;

  return (
    <div
      className="animate-void-wisp pointer-events-none absolute left-1/2 top-1/2"
      style={
        {
          "--wisp-x": `${x}px`,
          "--wisp-y": `${y}px`,
          "--wisp-duration": `${duration}s`,
          "--wisp-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      <div
        className="h-2 w-2 rounded-full bg-purple-400 sm:h-3 sm:w-3"
        style={{
          boxShadow: "0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.4)",
        }}
      />
    </div>
  );
}

export default function NotFound() {
  // Card fragment positions around the portal
  const cardPositions = [
    { x: -180, y: -120, rotation: -25 },
    { x: 160, y: -100, rotation: 15 },
    { x: -140, y: 100, rotation: -10 },
    { x: 170, y: 80, rotation: 20 },
    { x: -80, y: -160, rotation: -35 },
    { x: 90, y: 140, rotation: 30 },
  ];

  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#1a0f08]">
      {/* Texture Overlay */}
      <div className="hero-texture-overlay pointer-events-none absolute inset-0" />

      {/* Decorative Border Glow */}
      <div className="hero-border-glow pointer-events-none absolute inset-0 border-4 border-[#6b21a8]/30 sm:border-8" />

      {/* Inner Purple Border */}
      <div className="pointer-events-none absolute inset-2 rounded-sm border border-[#a855f7]/30 sm:inset-4 sm:border-2" />

      {/* Vignette Overlay */}
      <div className="hero-vignette pointer-events-none absolute inset-0" />

      {/* Corner Decorations */}
      <div className="absolute left-3 top-3 text-lg text-[#a855f7]/50 sm:left-6 sm:top-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute right-3 top-3 text-lg text-[#a855f7]/50 sm:right-6 sm:top-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute bottom-3 left-3 text-lg text-[#a855f7]/50 sm:bottom-6 sm:left-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute bottom-3 right-3 text-lg text-[#a855f7]/50 sm:bottom-6 sm:right-6 sm:text-2xl">
        ⚜
      </div>

      {/* Void Wisps */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <VoidWisp key={`wisp-${i}`} index={i} />
        ))}
      </div>

      {/* Floating Card Fragments */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {cardPositions.map((pos, i) => (
          <CardFragment key={`card-${i}`} index={i} position={pos} />
        ))}
      </div>

      {/* Main Portal Container */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Outer Portal Ring - Slow Rotation */}
        <div className="animate-void-swirl-slow absolute h-72 w-72 rounded-full opacity-30 sm:h-96 sm:w-96">
          <div
            className="void-portal-ring h-full w-full rounded-full"
            style={{ maskImage: "radial-gradient(transparent 60%, black 65%, black 75%, transparent 80%)" }}
          />
        </div>

        {/* Middle Portal Ring - Medium Rotation */}
        <div className="animate-void-swirl-reverse absolute h-56 w-56 rounded-full opacity-50 sm:h-72 sm:w-72">
          <div
            className="void-portal-ring h-full w-full rounded-full"
            style={{ maskImage: "radial-gradient(transparent 55%, black 60%, black 75%, transparent 80%)" }}
          />
        </div>

        {/* Inner Portal Ring - Fast Rotation */}
        <div className="animate-void-swirl absolute h-40 w-40 rounded-full opacity-70 sm:h-56 sm:w-56">
          <div
            className="void-portal-ring h-full w-full rounded-full"
            style={{ maskImage: "radial-gradient(transparent 50%, black 55%, black 80%, transparent 85%)" }}
          />
        </div>

        {/* Portal Core with Pulse */}
        <div className="animate-portal-pulse relative flex h-48 w-48 flex-col items-center justify-center rounded-full sm:h-64 sm:w-64">
          {/* Core gradient */}
          <div className="void-portal-gradient absolute inset-0 rounded-full" />

          {/* Void crackle effect */}
          <div className="animate-void-crackle absolute inset-8 rounded-full bg-gradient-to-br from-purple-900/50 to-purple-950/80" />

          {/* 404 Rune Text */}
          <div className="relative z-10 text-center">
            <h1 className="void-rune-text animate-rune-flicker font-display text-5xl font-bold tracking-widest sm:text-7xl">
              404
            </h1>
          </div>
        </div>

        {/* Message Text */}
        <div className="mt-8 text-center sm:mt-12">
          <p className="font-serif text-lg tracking-wide text-[#a855f7] sm:text-xl">
            — The Void Hungers —
          </p>
          <h2 className="mt-2 font-display text-xl text-[#f0e6d3] sm:mt-3 sm:text-2xl">
            This card was lost to the void...
          </h2>
          <p className="mt-2 max-w-md font-medieval text-sm text-[#a08b6e] sm:mt-3 sm:text-base">
            You have stumbled through a broken spell into the space between realms.
            The page you seek has been consumed by darkness.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <Link href="/">
            <button className="w-full min-w-[140px] rounded-lg border border-gold/40 bg-gradient-to-b from-gold to-gold-dark px-5 py-2.5 font-display text-sm font-bold tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40 sm:w-auto sm:px-6 sm:py-3">
              🏠 HOME
            </button>
          </Link>
          <Link href="/collection">
            <button className="w-full min-w-[140px] rounded-lg border border-[#a855f7]/40 bg-[#3d2b1a] px-5 py-2.5 font-serif text-sm font-semibold tracking-wider text-[#f0e6d3] transition-all hover:border-[#a855f7]/60 hover:bg-[#4a3222] sm:w-auto sm:px-6 sm:py-3">
              📚 COLLECTION
            </button>
          </Link>
          <Link href="/play">
            <button className="w-full min-w-[140px] rounded-lg border border-[#a855f7]/40 bg-[#3d2b1a] px-5 py-2.5 font-serif text-sm font-semibold tracking-wider text-[#f0e6d3] transition-all hover:border-[#a855f7]/60 hover:bg-[#4a3222] sm:w-auto sm:px-6 sm:py-3">
              ⚔️ PLAY
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom Flourish */}
      <div className="absolute bottom-16 text-center text-[#6b21a8]/50 sm:bottom-20">
        <span className="font-display text-lg tracking-[0.3em] sm:text-xl">
          ═══ ✧ ═══
        </span>
      </div>
    </div>
  );
}
