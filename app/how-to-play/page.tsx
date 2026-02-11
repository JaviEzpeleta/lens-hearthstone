"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import MusicPlayer from "@/components/game/MusicPlayer";
import { TutorialCardExample } from "@/components/game/TutorialCardExample";
import { TutorialVideoPlayer } from "@/components/game/TutorialVideoPlayer";
import { ENABLE_TUTORIAL_MUSIC } from "@/lib/game/constants";

// Types for card data
type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
type CardType = "MINION" | "SPELL" | "WEAPON";

interface CardData {
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  keywords?: string[];
  rarity: Rarity;
  imageUrl: string;
  cardType: CardType;
}

// Card pools for random selection
const MINION_POOL: CardData[] = [
  { name: "Artem, Wen Dark Mode", manaCost: 4, attack: 4, health: 6, rarity: "LEGENDARY", imageUrl: "https://ik.imagekit.io/lens/8eff836d13aebde68091bd14308fb0a30ed1c72bbd0580b4221e1cba5ad92878_fGuuHSH_4.webp", cardType: "MINION", keywords: ["Battlecry", "Taunt"] },
  { name: "Orbbro says GM", manaCost: 4, attack: 4, health: 5, rarity: "EPIC", imageUrl: "https://api.grove.storage/f204656addde0f806915b34e0ad816d6c85fa703b43cd50ea5f096502cfdec60", cardType: "MINION", keywords: ["Battlecry", "Taunt"] },
  { name: "Lady Banger", manaCost: 5, attack: 4, health: 6, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/44bea6754398daaa619bfa50ff527d004dae2515caa5814feb945cad828cab17_qFrIk9vja6.jpeg", cardType: "MINION", keywords: ["Battlecry"] },
  { name: "Kipto, The Shipper", manaCost: 4, attack: 3, health: 5, rarity: "EPIC", imageUrl: "https://media.orbapi.xyz/thumbnailDimension768/https://ik.imagekit.io/lens/784d6126818597fc968bfd149684b811dfda4c759da4090b888696637ed5d039_E0TknnElc.webp", cardType: "MINION", keywords: ["Battlecry"] },
  { name: "Jean Ayala", manaCost: 4, attack: 4, health: 5, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/f785500ef2d7ad0edd01f1e83f9bf288a46037e0154f4a426aba64c0ca603269_JGo8gpJQn.webp", cardType: "MINION", keywords: ["Battlecry"] },
  { name: "STTSM, Beat Dropper", manaCost: 4, attack: 3, health: 5, rarity: "EPIC", imageUrl: "https://ik.imagekit.io/lens/11f7f31a6f3aaa89b2a2518dff22905f2b4729a8afd6c3cb18292668d996443a_PqovVmTrc.jpeg", cardType: "MINION", keywords: ["Battlecry", "Lifesteal"] },
  { name: "Kaycee, Chart Enjoyer", manaCost: 3, attack: 3, health: 4, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/74b4f14979d1a02be27f5ba2a7cefeb857988d1668779e34b7bd3dd7495c837d_XFbfGPPX_.jpeg", cardType: "MINION", keywords: ["Battlecry"] },
  { name: "Xyori, Grind Lord", manaCost: 3, attack: 3, health: 5, rarity: "RARE", imageUrl: "https://api.grove.storage/e185e0ba8175b2f6d3383a33dc5a57a49f7ee8e59f3d970057302632741462c3", cardType: "MINION", keywords: ["Battlecry"] },
  { name: "Haku, Filterless", manaCost: 5, attack: 5, health: 6, rarity: "LEGENDARY", imageUrl: "https://ik.imagekit.io/lens/825d5947d7ddd9b5928196e5b26dea5acb175d516df4481b2854e41854e1f5a7_sjmmmTKrU.jpeg", cardType: "MINION", keywords: ["Battlecry", "Rush"] },
  { name: "Dankshard, Galaxy Brain", manaCost: 4, attack: 5, health: 7, rarity: "RARE", imageUrl: "https://api.grove.storage/584500c988d842ab37fcfab3c03e7a77c92debc1cf681cd6f1a931a82878305f", cardType: "MINION", keywords: ["Battlecry", "Divine Shield"] },
];

const SPELL_POOL: CardData[] = [
  { name: "AntiDarkMode Spell", manaCost: 4, rarity: "EPIC", imageUrl: "https://api.grove.storage/4b69e44696807a19dac915b9715b373b2597ef5abc00c4d32a091a8c6fbe20f4", cardType: "SPELL" },
  { name: "The Bag Securer", manaCost: 4, rarity: "EPIC", imageUrl: "https://api.grove.storage/2b8311792ae6fa0f7439c59040abafd6086f9aceb38f764b2afde81c58fe20e5", cardType: "SPELL" },
  { name: "Vocal Mural", manaCost: 5, rarity: "RARE", imageUrl: "https://api.grove.storage/bff57d5d7a15f3fb13ddb69dad59aef17cd3db7d67aa0ffecb9ea342eb57f845", cardType: "SPELL" },
  { name: "Fire Bullish", manaCost: 4, rarity: "LEGENDARY", imageUrl: "https://api.grove.storage/cb1e4c77e7cb0dab9bc8664849ce6a34040f284ec117caa978e50d2d2a829dfb", cardType: "SPELL" },
  { name: "Milenny <3", manaCost: 5, rarity: "EPIC", imageUrl: "https://api.grove.storage/b6500f13bd155183b8b26a7cd6d9b1630bc86ef6834ceff995a3a2313d606ca2", cardType: "SPELL" },
  { name: "LFG of Optimism", manaCost: 4, rarity: "LEGENDARY", imageUrl: "https://api.grove.storage/8e5821d43604b7deb8abbfd447c3c7a92a9941788111af70df454d5708e1ca4a", cardType: "SPELL" },
  { name: "Bullish Blessing", manaCost: 3, rarity: "COMMON", imageUrl: "https://api.grove.storage/85a01d21acdff8fae47b13c54df432b8e962a51717e300ce0a5a02ed0d70f5b4", cardType: "SPELL" },
  { name: "FuckYou", manaCost: 4, rarity: "RARE", imageUrl: "https://api.grove.storage/c6ac1157cdd39aef517c8da9450c3d4013954e2bd0df97b8fa06a1ad592fafa6", cardType: "SPELL" },
  { name: "Art From Chaos", manaCost: 4, rarity: "EPIC", imageUrl: "https://api.grove.storage/3bd92c324dd204439425d5ed494dab3b6df5921a7c7a55d2f18ace19130f02ed", cardType: "SPELL" },
  { name: "Wall of Text", manaCost: 4, rarity: "EPIC", imageUrl: "https://api.grove.storage/8945a2bdc26484564589f25ebdc63831be065f0f41f0de64fc624c49867932f2", cardType: "SPELL" },
];

const WEAPON_POOL: CardData[] = [
  { name: "Prediction Stick", manaCost: 3, attack: 3, durability: 2, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Lifesteal"] },
  { name: "Bot Blocker", manaCost: 4, attack: 3, durability: 3, rarity: "COMMON", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Battlecry"] },
  { name: "The Hype Mic", manaCost: 3, attack: 3, durability: 3, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON" },
  { name: "The v0.69 Hotfix Blade", manaCost: 3, attack: 3, durability: 2, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON" },
  { name: "Ghoking Scepter", manaCost: 3, attack: 3, durability: 3, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON" },
  { name: "Synesthetic Synth", manaCost: 3, attack: 2, durability: 3, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON" },
  { name: "The Bug Squasher", manaCost: 4, attack: 2, durability: 3, rarity: "COMMON", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Lifesteal"] },
  { name: "Orbish Shield", manaCost: 2, attack: 3, durability: 2, rarity: "RARE", imageUrl: "https://api.grove.storage/607b735e7419d976bb9e7357d374ccee1b199cd464af70e70ad18549db094d24", cardType: "WEAPON", keywords: ["Windfury"] },
  { name: "iPad Pencil of Destruction", manaCost: 3, attack: 3, durability: 3, rarity: "RARE", imageUrl: "https://api.grove.storage/f0d7b9e28fa1b86615d4992e828e9e829d5ea48cd9a4177623f0f0e5ae6a19cc", cardType: "WEAPON", keywords: ["Lifesteal"] },
  { name: "Bullish Chart", manaCost: 3, attack: 3, durability: 3, rarity: "LEGENDARY", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Rush", "Battlecry"] },
];

// Keyword-specific card pools
const KEYWORD_POOLS: Record<string, CardData[]> = {
  "Taunt": [
    { name: "Artem, Wen Dark Mode", manaCost: 4, attack: 4, health: 6, rarity: "LEGENDARY", imageUrl: "https://ik.imagekit.io/lens/8eff836d13aebde68091bd14308fb0a30ed1c72bbd0580b4221e1cba5ad92878_fGuuHSH_4.webp", cardType: "MINION", keywords: ["Battlecry", "Taunt"] },
    { name: "Orbbro says GM", manaCost: 4, attack: 4, health: 5, rarity: "EPIC", imageUrl: "https://api.grove.storage/f204656addde0f806915b34e0ad816d6c85fa703b43cd50ea5f096502cfdec60", cardType: "MINION", keywords: ["Battlecry", "Taunt"] },
  ],
  "Rush": [
    { name: "Haku, Filterless", manaCost: 5, attack: 5, health: 6, rarity: "LEGENDARY", imageUrl: "https://ik.imagekit.io/lens/825d5947d7ddd9b5928196e5b26dea5acb175d516df4481b2854e41854e1f5a7_sjmmmTKrU.jpeg", cardType: "MINION", keywords: ["Battlecry", "Rush"] },
    { name: "Bullish Chart", manaCost: 3, attack: 3, durability: 3, rarity: "LEGENDARY", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Rush", "Battlecry"] },
  ],
  "Divine Shield": [
    { name: "Dankshard, Galaxy Brain", manaCost: 4, attack: 5, health: 7, rarity: "RARE", imageUrl: "https://api.grove.storage/584500c988d842ab37fcfab3c03e7a77c92debc1cf681cd6f1a931a82878305f", cardType: "MINION", keywords: ["Battlecry", "Divine Shield"] },
  ],
  "Lifesteal": [
    { name: "Prediction Stick", manaCost: 3, attack: 3, durability: 2, rarity: "RARE", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Lifesteal"] },
    { name: "STTSM, Beat Dropper", manaCost: 4, attack: 3, health: 5, rarity: "EPIC", imageUrl: "https://ik.imagekit.io/lens/11f7f31a6f3aaa89b2a2518dff22905f2b4729a8afd6c3cb18292668d996443a_PqovVmTrc.jpeg", cardType: "MINION", keywords: ["Battlecry", "Lifesteal"] },
    { name: "The Bug Squasher", manaCost: 4, attack: 2, durability: 3, rarity: "COMMON", imageUrl: "https://api.grove.storage/d7a8bd7a9b14ac967270c0de9eedcf5282023622e7c8b189f248669d95c8e67f", cardType: "WEAPON", keywords: ["Lifesteal"] },
    { name: "iPad Pencil of Destruction", manaCost: 3, attack: 3, durability: 3, rarity: "RARE", imageUrl: "https://api.grove.storage/f0d7b9e28fa1b86615d4992e828e9e829d5ea48cd9a4177623f0f0e5ae6a19cc", cardType: "WEAPON", keywords: ["Lifesteal"] },
  ],
  "Windfury": [
    { name: "Orbish Shield", manaCost: 2, attack: 3, durability: 2, rarity: "RARE", imageUrl: "https://api.grove.storage/607b735e7419d976bb9e7357d374ccee1b199cd464af70e70ad18549db094d24", cardType: "WEAPON", keywords: ["Windfury"] },
  ],
  "Battlecry": [
    { name: "Lady Banger", manaCost: 5, attack: 4, health: 6, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/44bea6754398daaa619bfa50ff527d004dae2515caa5814feb945cad828cab17_qFrIk9vja6.jpeg", cardType: "MINION", keywords: ["Battlecry"] },
    { name: "Kipto, The Shipper", manaCost: 4, attack: 3, health: 5, rarity: "EPIC", imageUrl: "https://media.orbapi.xyz/thumbnailDimension768/https://ik.imagekit.io/lens/784d6126818597fc968bfd149684b811dfda4c759da4090b888696637ed5d039_E0TknnElc.webp", cardType: "MINION", keywords: ["Battlecry"] },
    { name: "Jean Ayala", manaCost: 4, attack: 4, health: 5, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/f785500ef2d7ad0edd01f1e83f9bf288a46037e0154f4a426aba64c0ca603269_JGo8gpJQn.webp", cardType: "MINION", keywords: ["Battlecry"] },
    { name: "Kaycee, Chart Enjoyer", manaCost: 3, attack: 3, health: 4, rarity: "COMMON", imageUrl: "https://ik.imagekit.io/lens/74b4f14979d1a02be27f5ba2a7cefeb857988d1668779e34b7bd3dd7495c837d_XFbfGPPX_.jpeg", cardType: "MINION", keywords: ["Battlecry"] },
    { name: "Xyori, Grind Lord", manaCost: 3, attack: 3, health: 5, rarity: "RARE", imageUrl: "https://api.grove.storage/e185e0ba8175b2f6d3383a33dc5a57a49f7ee8e59f3d970057302632741462c3", cardType: "MINION", keywords: ["Battlecry"] },
  ],
};

// Helper to pick a random item from an array
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Tutorial section card component
function TutorialSection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-6 shadow-lg shadow-gold/10"
    >
      <h2 className="font-display text-2xl text-gold flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Keyword accordion item
function KeywordItem({
  keyword,
  description,
  isOpen,
  onToggle,
  cardExample,
}: {
  keyword: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  cardExample?: CardData;
}) {
  return (
    <div className="border border-gold/20 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-secondary/50 flex items-center justify-between text-left hover:bg-secondary/70 transition-colors"
      >
        <span className="font-display text-lg text-gold">{keyword}</span>
        <span
          className={`text-gold/60 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-background/50">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {cardExample && (
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <TutorialCardExample
                  name={cardExample.name}
                  manaCost={cardExample.manaCost}
                  cardType={cardExample.cardType}
                  attack={cardExample.attack}
                  health={cardExample.health}
                  durability={cardExample.durability}
                  keywords={cardExample.keywords}
                  rarity={cardExample.rarity}
                  imageUrl={cardExample.imageUrl}
                  size="sm"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medieval text-xl text-card-foreground/90">{description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat bubble component
function StatBubble({
  value,
  type,
}: {
  value: string | number;
  type: "mana" | "attack" | "health" | "durability";
}) {
  const colors = {
    mana: "bg-mana",
    attack: "bg-attack",
    health: "bg-health",
    durability: "bg-zinc-600",
  };
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${colors[type]} font-display text-sm font-bold text-white shadow-lg`}
    >
      {value}
    </span>
  );
}

export default function TutorialPage() {
  const [openKeyword, setOpenKeyword] = useState<string | null>("Taunt");

  const [cardIndices, setCardIndices] = useState(() => ({
    minion: Math.floor(Math.random() * MINION_POOL.length),
    spell: Math.floor(Math.random() * SPELL_POOL.length),
    weapon: Math.floor(Math.random() * WEAPON_POOL.length),
  }));

  const [keywordCards] = useState<Record<string, CardData>>(() => {
    const cards: Record<string, CardData> = {};
    for (const [keyword, pool] of Object.entries(KEYWORD_POOLS)) {
      cards[keyword] = pickRandom(pool);
    }
    return cards;
  });

  // Derived state: current cards based on indices
  const currentCards = useMemo(() => ({
    minion: MINION_POOL[cardIndices.minion],
    spell: SPELL_POOL[cardIndices.spell],
    weapon: WEAPON_POOL[cardIndices.weapon],
  }), [cardIndices]);

  // Click handler to cycle to next card
  const handleCardClick = (cardType: 'minion' | 'spell' | 'weapon') => {
    const pools = { minion: MINION_POOL, spell: SPELL_POOL, weapon: WEAPON_POOL };
    setCardIndices(prev => ({
      ...prev,
      [cardType]: (prev[cardType] + 1) % pools[cardType].length,
    }));
  };

  const keywords = [
    {
      keyword: "Taunt",
      description:
        "Enemies MUST attack this minion first. They cannot attack your hero or other minions until the Taunt is destroyed. Stack up Taunt minions to build yourself a wall!",
      cardType: "MINION" as const,
    },
    {
      keyword: "Rush",
      description:
        "This minion can attack other minions on the same turn it's played. However, it CANNOT attack the enemy hero on its first turn - only minions.",
      cardType: "MINION" as const,
    },
    {
      keyword: "Divine Shield",
      description:
        "The first time this minion takes damage, the shield absorbs ALL of it and pops. The minion takes no damage that first hit!",
      cardType: "MINION" as const,
    },
    {
      keyword: "Lifesteal",
      description:
        "When this card deals damage, your hero heals for the same amount. Attack something big and watch your health go up!",
      cardType: "WEAPON" as const,
    },
    {
      keyword: "Windfury",
      description:
        "This card can attack TWICE per turn instead of once. A 4-attack card with Windfury can deal 8 damage in one turn!",
      cardType: "WEAPON" as const,
    },
    {
      keyword: "Battlecry",
      description:
        "A special effect that triggers ONCE when you play this card from your hand. The effect is described on the card.",
      cardType: "MINION" as const,
    },
  ];

  const scrollToContent = () => {
    document.getElementById("the-goal")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-mana/10 blur-3xl" />
      </div>

      {/* Hero Section */}
      <header className="relative z-10 flex flex-col items-center justify-center px-4 pt-12 pb-8 text-center">
        {/* Back link */}
        <Link
          href="/"
          className="absolute left-4 top-4 font-medieval text-sm text-gold/70 hover:text-gold transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-wide text-gold mb-4">
          HOW TO PLAY
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
          <div className="h-2 w-2 rotate-45 border border-gold/60 bg-gold/20" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
        </div>

        {/* CTA button */}
        <button
          onClick={scrollToContent}
          className="rounded-lg border border-gold/40 bg-gradient-to-b from-gold to-gold-dark px-8 py-3 font-display text-sm font-bold tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40"
        >
          START LEARNING
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-28 space-y-6">
        {/* Tutorial Video */}
        <section className="mb-2">
          <h2 className="font-display text-xl text-gold flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            WATCH THE TUTORIAL
          </h2>
          <TutorialVideoPlayer src="/videos/tutorial.mp4" />
          <p className="font-medieval text-sm text-muted-foreground text-center mt-3">
            Watch the video or scroll down to read the full guide
          </p>
        </section>

        {/* The Goal */}
        <TutorialSection id="the-goal" title="THE GOAL" icon="🎯">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Both you and your opponent start with{" "}
              <span className="text-health font-bold">30 health</span>. Your
              mission is simple: reduce your opponent&apos;s health to{" "}
              <span className="text-health font-bold">zero</span> before they do
              the same to you!
            </p>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-4xl font-display text-health">30</div>
                <div className="text-sm text-muted-foreground font-medieval">
                  Starting Health
                </div>
              </div>
              <div className="text-4xl text-gold/60">→</div>
              <div className="text-center">
                <div className="text-4xl font-display text-health/50">0</div>
                <div className="text-sm text-muted-foreground font-medieval">
                  Victory!
                </div>
              </div>
            </div>
          </div>
        </TutorialSection>

        {/* Mana System */}
        <TutorialSection id="mana" title="MANA CRYSTALS" icon="💎">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Mana is your currency for playing cards. You start with{" "}
              <span className="text-mana font-bold">1 mana crystal</span> on
              turn one, and gain one more each turn up to a maximum of{" "}
              <span className="text-mana font-bold">10</span>.
            </p>
            <div className="flex items-center justify-center gap-1 py-4 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div
                  key={num}
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-display text-sm font-bold ${
                    num <= 3 ? "bg-mana text-white" : "bg-mana/20 text-mana/40"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="font-medieval text-sm text-muted-foreground text-center">
              Turn 3: You have 3 mana crystals to spend
            </p>
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Each card has a <span className="text-mana font-bold">cost</span>{" "}
              shown in the top-left corner. You can only play cards if you have
              enough mana!
            </p>
          </div>
        </TutorialSection>

        {/* Minions */}
        <TutorialSection id="minions" title="MINIONS" icon="⚔️">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Minions are your soldiers! They have two key stats:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
              {/* Card Example */}
              <div
                onClick={() => handleCardClick('minion')}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <TutorialCardExample
                  name={currentCards.minion.name}
                  manaCost={currentCards.minion.manaCost}
                  cardType="MINION"
                  attack={currentCards.minion.attack}
                  health={currentCards.minion.health}
                  rarity={currentCards.minion.rarity}
                  imageUrl={currentCards.minion.imageUrl}
                  keywords={currentCards.minion.keywords}
                  size="md"
                />
              </div>
              {/* Stats explanation */}
              <div className="flex gap-8">
                <div className="text-center">
                  <StatBubble value={currentCards.minion.attack ?? 4} type="attack" />
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Attack
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Damage dealt
                  </div>
                </div>
                <div className="text-center">
                  <StatBubble value={currentCards.minion.health ?? 6} type="health" />
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Health
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Damage taken before death
                  </div>
                </div>
              </div>
            </div>
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Minions <span className="text-gold font-bold">cannot attack</span>{" "}
              on the turn they&apos;re played (unless they have Rush). The next
              turn, they&apos;re ready to fight!
            </p>
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              You can have a maximum of{" "}
              <span className="text-gold font-bold">7 minions</span> on your
              side of the board.
            </p>
          </div>
        </TutorialSection>

        {/* Combat */}
        <TutorialSection id="combat" title="COMBAT" icon="💥">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              When minions fight, they{" "}
              <span className="text-attack font-bold">
                both deal damage to each other
              </span>{" "}
              equal to their attack values. If a minion&apos;s health drops to
              0, it dies!
            </p>
            <div className="bg-secondary/30 rounded-lg p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="flex gap-2 justify-center">
                    <StatBubble value={3} type="attack" />
                    <StatBubble value={2} type="health" />
                  </div>
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Your Minion
                  </div>
                </div>
                <div className="text-2xl text-gold/60">⚔️</div>
                <div className="text-center">
                  <div className="flex gap-2 justify-center">
                    <StatBubble value={2} type="attack" />
                    <StatBubble value={3} type="health" />
                  </div>
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Enemy Minion
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4 font-medieval">
                Your 3-attack kills their 3-health minion.
                <br />
                Their 2-attack kills your 2-health minion.
                <br />
                <span className="text-gold">Both die!</span>
              </p>
            </div>
          </div>
        </TutorialSection>

        {/* Spells */}
        <TutorialSection id="spells" title="SPELLS" icon="✨">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Spells are{" "}
              <span className="text-purple-400 font-bold">
                one-time magical effects
              </span>
              . When you play a spell, its effect happens immediately, and then
              the card disappears.
            </p>
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Some spells need you to{" "}
              <span className="text-gold font-bold">pick a target</span> - read
              the card text to know what to do!
            </p>
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                onClick={() => handleCardClick('spell')}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <TutorialCardExample
                  name={currentCards.spell.name}
                  manaCost={currentCards.spell.manaCost}
                  cardType="SPELL"
                  rarity={currentCards.spell.rarity}
                  imageUrl={currentCards.spell.imageUrl}
                  size="md"
                />
              </div>
              <p className="text-sm text-muted-foreground font-medieval text-center">
                Spells have no attack or health - they&apos;re pure magic!
              </p>
            </div>
          </div>
        </TutorialSection>

        {/* Weapons */}
        <TutorialSection id="weapons" title="WEAPONS" icon="🗡️">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Weapons let your{" "}
              <span className="text-gold font-bold">hero attack directly</span>!
              They have Attack (damage per swing) and Durability (number of
              uses).
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
              {/* Card Example */}
              <div
                onClick={() => handleCardClick('weapon')}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <TutorialCardExample
                  name={currentCards.weapon.name}
                  manaCost={currentCards.weapon.manaCost}
                  cardType="WEAPON"
                  attack={currentCards.weapon.attack}
                  durability={currentCards.weapon.durability}
                  rarity={currentCards.weapon.rarity}
                  imageUrl={currentCards.weapon.imageUrl}
                  keywords={currentCards.weapon.keywords}
                  size="md"
                />
              </div>
              {/* Stats explanation */}
              <div className="flex gap-8">
                <div className="text-center">
                  <StatBubble value={currentCards.weapon.attack ?? 3} type="attack" />
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Attack
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Damage per swing
                  </div>
                </div>
                <div className="text-center">
                  <StatBubble value={currentCards.weapon.durability ?? 2} type="durability" />
                  <div className="text-sm text-muted-foreground font-medieval mt-2">
                    Durability
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Number of uses
                  </div>
                </div>
              </div>
            </div>
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Each time your hero attacks,{" "}
              <span className="text-gold font-bold">
                durability goes down by 1
              </span>
              . When it hits 0, the weapon breaks!
            </p>
          </div>
        </TutorialSection>

        {/* Keywords */}
        <TutorialSection id="keywords" title="KEYWORDS" icon="📜">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed mb-4">
              Keywords are{" "}
              <span className="text-gold font-bold">special abilities</span>{" "}
              that change how cards work. Learn them all to master the game!
            </p>
            <div className="space-y-2">
              {keywords.map((kw) => {
                const card = keywordCards?.[kw.keyword];
                return (
                  <KeywordItem
                    key={kw.keyword}
                    keyword={kw.keyword}
                    description={kw.description}
                    isOpen={openKeyword === kw.keyword}
                    onToggle={() =>
                      setOpenKeyword(
                        openKeyword === kw.keyword ? null : kw.keyword
                      )
                    }
                    cardExample={card}
                  />
                );
              })}
            </div>
          </div>
        </TutorialSection>

        {/* Board Limits */}
        <TutorialSection id="board" title="THE BATTLEFIELD" icon="🏟️">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              The board has{" "}
              <span className="text-gold font-bold">7 slots per side</span> for
              minions. Once you have 7 minions, you cannot play more until one
              dies!
            </p>
            <div className="flex items-center justify-center gap-1 py-4">
              {[1, 2, 3, 4, 5, 6, 7].map((slot) => (
                <div
                  key={slot}
                  className="h-12 w-12 rounded-lg border-2 border-dashed border-gold/30 flex items-center justify-center"
                >
                  <span className="text-gold/40 font-display text-sm">
                    {slot}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-medieval text-sm text-muted-foreground text-center">
              Seven slots - plan your summons wisely!
            </p>
          </div>
        </TutorialSection>

        {/* Turn Flow */}
        <TutorialSection id="turns" title="TURN FLOW" icon="🔄">
          <div className="space-y-4">
            <p className="font-medieval text-xl text-card-foreground/90 leading-relaxed">
              Each turn follows a simple pattern:
            </p>
            <div className="space-y-3">
              {[
                { num: 1, text: "Draw a card from your deck", icon: "📤" },
                { num: 2, text: "Gain a mana crystal (max 10)", icon: "💎" },
                {
                  num: 3,
                  text: "Play cards, attack with minions, use your weapon",
                  icon: "⚔️",
                },
                { num: 4, text: "End your turn", icon: "✅" },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex items-center gap-4 bg-secondary/30 rounded-lg p-3"
                >
                  <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center font-display text-gold font-bold">
                    {step.num}
                  </div>
                  <span className="text-xl">{step.icon}</span>
                  <span className="font-medieval text-xl text-card-foreground/90">
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TutorialSection>

        {/* Pro Tips */}
        <TutorialSection id="tips" title="PRO TIPS" icon="💡">
          <div className="space-y-3">
            {[
              "Face is the place... unless there's taunt!",
              "The only health that matters is the last one.",
              "Mana doesn't grow on trees. It grows on turns.",
              "A taunt a day keeps the lethal away.",
              "Trading is caring... for your win rate.",
              "7 slots max. No exceptions. Stop trying.",
              "Turn 10 is when the fun begins.",
            ].map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-secondary/20 rounded-lg p-3"
              >
                <span className="text-gold">★</span>
                <span className="font-medieval text-xl text-card-foreground/90 italic">
                  &ldquo;{tip}&rdquo;
                </span>
              </div>
            ))}
          </div>
        </TutorialSection>

        {/* Call to Action */}
        <section className="text-center pt-8 pb-4">
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/60" />
            <div className="h-3 w-3 rotate-45 border-2 border-gold/60 bg-gold/20" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          <h2 className="font-display text-3xl text-gold mb-8">
            READY TO PLAY?
          </h2>

          {/* CTA Button */}
          <Link href="/play">
            <button className="rounded-lg border border-gold/40 bg-gradient-to-b from-gold to-gold-dark px-12 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40">
              ENTER THE ARENA
            </button>
          </Link>

          {/* Back to home link */}
          <div className="mt-6 mb-20">
            <Link
              href="/"
              className="font-medieval text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              ← Return to Home
            </Link>
          </div>
        </section>
      </main>

      {/* Fixed Music Player */}
      {ENABLE_TUTORIAL_MUSIC && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <MusicPlayer />
        </div>
      )}
    </div>
  );
}
