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

      {/* Footer */}
      <div className="relative z-10 mb-6 flex flex-col items-center gap-3 sm:mb-8 sm:gap-4">
        {/* GitHub Link */}
        <a
          href="https://github.com/JaviEzpeleta/lens-hearthstone"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-[#c9a033]/40 bg-gradient-to-br from-[rgba(201,160,51,0.2)] to-[rgba(139,105,20,0.3)] px-4 py-1.5 shadow-lg transition-all hover:scale-105 hover:border-[#c9a033]/60 hover:shadow-[#c9a033]/20 sm:px-6 sm:py-2"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 text-[#e8c84a] sm:h-5 sm:w-5"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="font-display text-sm tracking-widest text-[#e8c84a] sm:text-lg">
            GitHub
          </span>
        </a>

        {/* Other Projects */}
        <div className="flex items-center gap-2 text-xs tracking-wide text-[#a08b6e] sm:gap-3 sm:text-sm">
          <span className="font-medieval">More projects:</span>
          <a
            href="https://lensie.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[#c9a033]/70 transition-colors hover:text-[#e8c84a]"
          >
            lensie.xyz
          </a>
          <span className="text-[#c9a033]/30">·</span>
          <a
            href="https://0xfm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[#c9a033]/70 transition-colors hover:text-[#e8c84a]"
          >
            0xfm.com
          </a>
          <span className="text-[#c9a033]/30">·</span>
          <a
            href="https://lctips.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[#c9a033]/70 transition-colors hover:text-[#e8c84a]"
          >
            lctips.xyz
          </a>
        </div>
      </div>
    </div>
  );
}
