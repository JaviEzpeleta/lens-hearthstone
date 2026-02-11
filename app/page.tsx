import fs from "fs";
import path from "path";
import Link from "next/link";
import { Card } from "@/lib/game/types";
import { HeroCardCarousel } from "@/components/landing/HeroCardCarousel";

// Force dynamic rendering so cards are random on each request
export const dynamic = "force-dynamic";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function getAllCards(): Promise<Card[]> {
  const cardsDir = path.join(process.cwd(), "public", "cards");
  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));

  const cards: Card[] = [];
  for (const file of files) {
    const filePath = path.join(cardsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    cards.push(JSON.parse(content));
  }

  return shuffleArray(cards);
}

export default async function Home() {
  const cards = await getAllCards();

  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#1a0f08]">
      {/* Texture Overlay */}
      <div className="hero-texture-overlay pointer-events-none absolute inset-0" />

      {/* Decorative Border Glow */}
      <div className="hero-border-glow pointer-events-none absolute inset-0 border-4 border-[#c9a033]/30 sm:border-8" />

      {/* Inner Gold Border */}
      <div className="pointer-events-none absolute inset-2 rounded-sm border border-[#c9a033]/40 sm:inset-4 sm:border-2" />

      {/* Vignette Overlay */}
      <div className="hero-vignette pointer-events-none absolute inset-0" />

      {/* Floating Ember Particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`ember-${i}`}
            className="hero-ember"
            style={{
              left: `${[10, 25, 40, 55, 70, 85, 15, 60][i]}%`,
              bottom: `${[20, 15, 25, 10, 20, 15, 30, 30][i]}%`,
              animationDelay: `${[0, 0.5, 1, 1.5, 2, 2.5, 0.3, 1.8][i]}s`,
            }}
          />
        ))}
      </div>

      {/* Sparkle Particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="hero-sparkle"
            style={{
              top: `${[15, 25, 60, 70, 40, 50][i]}%`,
              left: `${[8, 92, 5, 95, 3, 97][i]}%`,
              animationDelay: `${[0, 0.4, 0.8, 1.2, 1.6, 0.2][i]}s`,
            }}
          />
        ))}
      </div>

      {/* Corner Decorations */}
      <div className="absolute left-3 top-3 text-lg text-[#c9a033]/50 sm:left-6 sm:top-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute right-3 top-3 text-lg text-[#c9a033]/50 sm:right-6 sm:top-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute bottom-3 left-3 text-lg text-[#c9a033]/50 sm:bottom-6 sm:left-6 sm:text-2xl">
        ⚜
      </div>
      <div className="absolute bottom-3 right-3 text-lg text-[#c9a033]/50 sm:bottom-6 sm:right-6 sm:text-2xl">
        ⚜
      </div>

      {/* Top Section: Title & Subtitle */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-12 sm:pt-16 lg:pt-20">
        {/* Top Flourish */}
        <div className="hero-flourish mb-2 font-display text-xl tracking-[0.3em] sm:text-2xl sm:tracking-[0.5em] lg:text-3xl">
          ═══ ❖ ═══
        </div>

        {/* Main Title */}
        <h1 className="hero-title-glow text-center text-balance bg-gradient-to-b from-[#e8c84a] via-[#c9a033] to-[#8b6914] bg-clip-text font-display text-4xl font-bold uppercase tracking-wider text-transparent sm:text-6xl lg:text-7xl">
          Lens Hearthstone
        </h1>

        {/* Subtitle */}
        <p className="mt-2 font-medieval text-base tracking-wide text-[#a08b6e] sm:mt-3 sm:text-xl lg:text-2xl">
          Community Card Battles on Lens
        </p>

        {/* Bottom Flourish */}
        <div className="hero-flourish mt-2 font-display text-lg tracking-[0.3em] sm:text-xl sm:tracking-[0.5em] lg:text-2xl">
          ═══ ⚔ ═══
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="relative z-10 mt-6 flex flex-col gap-3 px-4 sm:mt-8 sm:flex-row sm:gap-4">
        <Link href="/play">
          <button className="w-full min-w-[160px] rounded-lg border border-gold/40 bg-gradient-to-b from-gold to-gold-dark px-6 py-3 font-display text-sm font-bold tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40 sm:w-auto sm:px-8">
            PLAY NOW
          </button>
        </Link>
        <Link
          href="/the-cards"
          className="rounded-lg border border-[#c9a033]/30 bg-[#3d2b1a] px-6 py-3 text-center font-serif text-sm font-semibold tracking-wider text-[#f0e6d3] transition-all hover:bg-[#4a3222] sm:px-8"
        >
          THE CARDS
        </Link>
        <Link
          href="/how-to-play"
          className="rounded-lg border border-[#c9a033]/30 bg-[#3d2b1a] px-6 py-3 text-center font-serif text-sm font-semibold tracking-wider text-[#f0e6d3] transition-all hover:bg-[#4a3222] sm:px-8"
        >
          HOW TO PLAY
        </Link>
      </div>

      {/* Cards Fan Layout */}
      <HeroCardCarousel initialCards={cards} />

      {/* Bottom URL Badge */}
      <div className="relative z-10 mb-6 sm:mb-8">
        <div className="rounded-full border border-[#c9a033]/40 bg-gradient-to-br from-[rgba(201,160,51,0.2)] to-[rgba(139,105,20,0.3)] px-4 py-1.5 shadow-lg sm:px-6 sm:py-2">
          <span className="font-display text-sm tracking-widest text-[#e8c84a] sm:text-lg">
            hs.lensie.xyz
          </span>
        </div>
      </div>
    </div>
  );
}
