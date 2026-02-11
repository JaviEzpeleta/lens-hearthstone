"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import "./og.css";

// Type for featured cards
interface FeaturedCard {
  name: string;
  rarity: string;
  cardType: string;
  imageUrl: string;
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
}

// Hardcoded cards for consistent OG image
// Using visually striking cards with mixed rarities
const FEATURED_CARDS: FeaturedCard[] = [
  {
    name: "FuckYou",
    rarity: "RARE",
    cardType: "SPELL",
    imageUrl:
      "https://api.grove.storage/c6ac1157cdd39aef517c8da9450c3d4013954e2bd0df97b8fa06a1ad592fafa6",
    manaCost: 4,
  },
  {
    name: "Prediction Stick",
    rarity: "RARE",
    cardType: "WEAPON",
    imageUrl:
      "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f",
    manaCost: 3,
    attack: 3,
    durability: 2,
  },
  {
    name: "Bot Blocker",
    rarity: "COMMON",
    cardType: "WEAPON",
    imageUrl:
      "https://api.grove.storage/40f0b73538774c9daefe3910e6819700911f5d3d6bb14a7bbe373df8de409bd7",
    manaCost: 4,
    attack: 3,
    durability: 3,
  },
  {
    name: "Art From Chaos",
    rarity: "EPIC",
    cardType: "SPELL",
    imageUrl:
      "https://api.grove.storage/3bd92c324dd204439425d5ed494dab3b6df5921a7c7a55d2f18ace19130f02ed",
    manaCost: 4,
  },
  {
    name: "Fire Bullish",
    rarity: "LEGENDARY",
    cardType: "SPELL",
    imageUrl:
      "https://api.grove.storage/cb1e4c77e7cb0dab9bc8664849ce6a34040f284ec117caa978e50d2d2a829dfb",
    manaCost: 4,
  },
];

function getRarityClass(rarity: string): string {
  switch (rarity) {
    case "LEGENDARY":
      return "og-card-legendary";
    case "EPIC":
      return "og-card-epic";
    case "RARE":
      return "og-card-rare";
    default:
      return "og-card-common";
  }
}

function getCardPositionClass(index: number): string {
  return `og-card-pos-${index + 1}`;
}

export default function OGImagePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!containerRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(containerRef.current, {
        pixelRatio: 2, // Higher quality (2400x1260)
        cacheBust: true,
        backgroundColor: "#1a0f08",
      });

      const link = document.createElement("a");
      link.download = "lens-hearthstone-og.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to capture OG image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 min-h-screen bg-[#0d0705]">
      <div
        ref={containerRef}
        className="og-container bg-[#1a0f08] dark relative flex flex-col items-center justify-between overflow-hidden"
      >
        {/* Texture Overlay */}
        <div className="og-texture-overlay absolute inset-0 pointer-events-none" />

        {/* Decorative Border Glow */}
        <div className="og-border-glow absolute inset-0 border-8 border-[#c9a033]/30 pointer-events-none" />

        {/* Inner Gold Border */}
        <div className="absolute inset-4 border-2 border-[#c9a033]/40 pointer-events-none rounded-sm" />

        {/* Vignette Overlay */}
        <div className="og-vignette absolute inset-0 pointer-events-none" />

        {/* Floating Ember Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`ember-${i}`} className="og-ember" />
          ))}
        </div>

        {/* Sparkle Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sparkle-${i}`} className="og-sparkle" />
          ))}
        </div>

        {/* Top Section: Title & Subtitle */}
        <div className="relative z-10 flex flex-col items-center pt-12">
          {/* Top Flourish */}
          <div className="og-flourish text-3xl tracking-[0.5em] mb-2 font-display">
            ═══ ❖ ═══
          </div>

          {/* Main Title */}
          <h1 className="og-title-glow font-display text-7xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#e8c84a] via-[#c9a033] to-[#8b6914] uppercase">
            Lens Hearthstone
          </h1>

          {/* Subtitle */}
          <p className="font-medieval text-2xl text-[#a08b6e] mt-3 tracking-wide">
            Community Card Battles on Lens
          </p>

          {/* Bottom Flourish */}
          <div className="og-flourish text-2xl tracking-[0.5em] mt-2 font-display">
            ═══ ⚔ ═══
          </div>
        </div>

        {/* Cards Fan Layout */}
        <div className="relative z-10 flex items-end justify-center gap-[-30px] mb-8">
          {FEATURED_CARDS.map((card, index) => (
            <div
              key={card.name}
              className={`og-card ${getRarityClass(card.rarity)} ${getCardPositionClass(index)} relative rounded-lg overflow-hidden`}
              style={{
                width: 140,
                height: 200,
                marginLeft: index === 0 ? 0 : -25,
              }}
            >
              {/* Card Image */}
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                unoptimized
              />

              {/* Card Overlay with Stats */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Mana Cost Crystal */}
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#4299e1] to-[#2b6cb0] flex items-center justify-center border-2 border-[#1a365d] shadow-lg">
                <span className="font-display text-white text-sm font-bold drop-shadow-md">
                  {card.manaCost}
                </span>
              </div>

              {/* Attack (for minions/weapons) */}
              {card.attack !== undefined && (
                <div className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#ed8936] to-[#c05621] flex items-center justify-center border-2 border-[#7b341e] shadow-lg">
                  <span className="font-display text-white text-xs font-bold drop-shadow-md">
                    {card.attack}
                  </span>
                </div>
              )}

              {/* Health (for minions) */}
              {card.health !== undefined && (
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#fc5c5c] to-[#c53030] flex items-center justify-center border-2 border-[#742a2a] shadow-lg">
                  <span className="font-display text-white text-xs font-bold drop-shadow-md">
                    {card.health}
                  </span>
                </div>
              )}

              {/* Durability (for weapons) */}
              {card.durability !== undefined && (
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#9ca3af] to-[#6b7280] flex items-center justify-center border-2 border-[#374151] shadow-lg">
                  <span className="font-display text-white text-xs font-bold drop-shadow-md">
                    {card.durability}
                  </span>
                </div>
              )}

              {/* Card Name Strip */}
              <div className="absolute bottom-10 left-0 right-0 px-1">
                <div className="bg-black/70 backdrop-blur-sm rounded px-1 py-0.5">
                  <p className="font-medieval text-[10px] text-[#f0e6d3] text-center truncate">
                    {card.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom URL Badge */}
        <div className="relative z-10 mb-8">
          <div className="og-url-badge px-6 py-2 rounded-full">
            <span className="font-display text-lg text-[#e8c84a] tracking-widest">
              hs.lensie.xyz
            </span>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-6 left-6 text-[#c9a033]/50 text-2xl">⚜</div>
        <div className="absolute top-6 right-6 text-[#c9a033]/50 text-2xl">⚜</div>
        <div className="absolute bottom-6 left-6 text-[#c9a033]/50 text-2xl">⚜</div>
        <div className="absolute bottom-6 right-6 text-[#c9a033]/50 text-2xl">⚜</div>
      </div>

      {/* Download Button - Outside container so it's not captured */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="px-6 py-3 bg-gradient-to-r from-[#c9a033] to-[#e8c84a] text-[#1a0f08] font-display font-bold text-lg rounded-lg shadow-lg hover:from-[#e8c84a] hover:to-[#c9a033] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? "Downloading..." : "Download OG Image"}
      </button>
    </div>
  );
}
