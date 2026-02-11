"use client";

import Link from "next/link";
import { TutorialCardExample } from "@/components/game/TutorialCardExample";

// Type definitions
type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

interface BattlecryMinion {
  name: string;
  manaCost: number;
  attack: number;
  health: number;
  rarity: Rarity;
  imageUrl: string;
  keywords: string[];
  battlecryEffect: string;
  strategyTip: string;
  effectEmoji: string;
  effectCategory: "summon" | "buff-targeted" | "buff-aoe" | "draw" | "mana";
  needsOtherMinions: boolean;
  buffsSelf: boolean | "N/A";
}

// All 10 Battlecry minions with their data
const BATTLECRY_MINIONS: BattlecryMinion[] = [
  {
    name: "Kipto, The Shipper",
    manaCost: 4,
    attack: 3,
    health: 5,
    rarity: "EPIC",
    imageUrl: "https://media.orbapi.xyz/thumbnailDimension768/https://ik.imagekit.io/lens/784d6126818597fc968bfd149684b811dfda4c759da4090b888696637ed5d039_E0TknnElc.webp",
    keywords: ["Battlecry"],
    battlecryEffect: "Summons a 1/1 minion with Rush",
    strategyTip: "The Rush token can trade immediately - great for clearing a small threat the same turn you play this.",
    effectEmoji: "🚀",
    effectCategory: "summon",
    needsOtherMinions: false,
    buffsSelf: "N/A",
  },
  {
    name: "Jean Ayala",
    manaCost: 4,
    attack: 4,
    health: 5,
    rarity: "COMMON",
    imageUrl: "https://ik.imagekit.io/lens/f785500ef2d7ad0edd01f1e83f9bf288a46037e0154f4a426aba64c0ca603269_JGo8gpJQn.webp",
    keywords: ["Battlecry"],
    battlecryEffect: "Give another friendly minion +2/+2",
    strategyTip: "Best played when you already have a minion on board. Target your most valuable minion to make trades even better.",
    effectEmoji: "💪",
    effectCategory: "buff-targeted",
    needsOtherMinions: true,
    buffsSelf: false,
  },
  {
    name: "STTSM, Beat Dropper",
    manaCost: 4,
    attack: 3,
    health: 5,
    rarity: "EPIC",
    imageUrl: "https://ik.imagekit.io/lens/11f7f31a6f3aaa89b2a2518dff22905f2b4729a8afd6c3cb18292668d996443a_PqovVmTrc.jpeg",
    keywords: ["Battlecry", "Lifesteal"],
    battlecryEffect: "+2 Attack to a random ally, +1 Health to all other allies",
    strategyTip: "The more minions you have, the more value! The Lifesteal keyword also makes this minion great for sustain.",
    effectEmoji: "🎵",
    effectCategory: "buff-aoe",
    needsOtherMinions: true,
    buffsSelf: false,
  },
  {
    name: "Artem, Wen Dark Mode",
    manaCost: 4,
    attack: 4,
    health: 6,
    rarity: "LEGENDARY",
    imageUrl: "https://ik.imagekit.io/lens/8eff836d13aebde68091bd14308fb0a30ed1c72bbd0580b4221e1cba5ad92878_fGuuHSH_4.webp",
    keywords: ["Battlecry", "Taunt"],
    battlecryEffect: "Give ALL friendly minions +2/+2 (including self!)",
    strategyTip: "The most powerful AoE buff in the game. Play with a wide board for maximum value - a 3-minion board becomes +6/+6 total stats!",
    effectEmoji: "👑",
    effectCategory: "buff-aoe",
    needsOtherMinions: false,
    buffsSelf: true,
  },
  {
    name: "Kaycee, Chart Enjoyer",
    manaCost: 3,
    attack: 3,
    health: 4,
    rarity: "COMMON",
    imageUrl: "https://ik.imagekit.io/lens/74b4f14979d1a02be27f5ba2a7cefeb857988d1668779e34b7bd3dd7495c837d_XFbfGPPX_.jpeg",
    keywords: ["Battlecry"],
    battlecryEffect: "Give another friendly minion +1 Attack",
    strategyTip: "Cheaper than Jean Ayala but smaller buff. Good for early tempo when you need that little extra push for a trade.",
    effectEmoji: "📈",
    effectCategory: "buff-targeted",
    needsOtherMinions: true,
    buffsSelf: false,
  },
  {
    name: "Xyori, Grind Lord",
    manaCost: 3,
    attack: 3,
    health: 5,
    rarity: "RARE",
    imageUrl: "https://api.grove.storage/e185e0ba8175b2f6d3383a33dc5a57a49f7ee8e59f3d970057302632741462c3",
    keywords: ["Battlecry"],
    battlecryEffect: "Refresh 1 Mana Crystal",
    strategyTip: "Effectively costs 2 mana! Great for squeezing in an extra card play on big turns.",
    effectEmoji: "💎",
    effectCategory: "mana",
    needsOtherMinions: false,
    buffsSelf: "N/A",
  },
  {
    name: "Haku, Filterless",
    manaCost: 5,
    attack: 5,
    health: 6,
    rarity: "LEGENDARY",
    imageUrl: "https://ik.imagekit.io/lens/825d5947d7ddd9b5928196e5b26dea5acb175d516df4481b2854e41854e1f5a7_sjmmmTKrU.jpeg",
    keywords: ["Battlecry", "Rush"],
    battlecryEffect: "Summons a 2/2 with Taunt",
    strategyTip: "Two bodies for one card! Rush lets you attack immediately while the 2/2 Taunt protects you next turn.",
    effectEmoji: "🛡️",
    effectCategory: "summon",
    needsOtherMinions: false,
    buffsSelf: "N/A",
  },
  {
    name: "Dankshard, Galaxy Brain",
    manaCost: 4,
    attack: 5,
    health: 7,
    rarity: "RARE",
    imageUrl: "https://api.grove.storage/584500c988d842ab37fcfab3c03e7a77c92debc1cf681cd6f1a931a82878305f",
    keywords: ["Battlecry", "Divine Shield"],
    battlecryEffect: "Draw 1 card",
    strategyTip: "Amazing stats for the cost AND replaces itself with a card draw. Divine Shield makes it sticky. Auto-include!",
    effectEmoji: "🃏",
    effectCategory: "draw",
    needsOtherMinions: false,
    buffsSelf: "N/A",
  },
  {
    name: "Orbbro says GM",
    manaCost: 4,
    attack: 4,
    health: 5,
    rarity: "EPIC",
    imageUrl: "https://api.grove.storage/f204656addde0f806915b34e0ad816d6c85fa703b43cd50ea5f096502cfdec60",
    keywords: ["Battlecry", "Taunt"],
    battlecryEffect: "Give all OTHER friendly minions +1/+1",
    strategyTip: "Unlike Artem, this doesn't buff itself - but Taunt makes it a great protector for your newly buffed army!",
    effectEmoji: "☀️",
    effectCategory: "buff-aoe",
    needsOtherMinions: true,
    buffsSelf: false,
  },
  {
    name: "Lady Banger",
    manaCost: 5,
    attack: 4,
    health: 6,
    rarity: "COMMON",
    imageUrl: "https://ik.imagekit.io/lens/44bea6754398daaa619bfa50ff527d004dae2515caa5814feb945cad828cab17_qFrIk9vja6.jpeg",
    keywords: ["Battlecry"],
    battlecryEffect: "Summon two 1/1 minions",
    strategyTip: "Three bodies for one card! Great board presence and sets up perfectly for AoE buffs like Artem or Orbbro.",
    effectEmoji: "💃",
    effectCategory: "summon",
    needsOtherMinions: false,
    buffsSelf: "N/A",
  },
];

// Category info for summary
const EFFECT_CATEGORIES = {
  summon: { label: "Summon Tokens", emoji: "🎭", color: "text-green-400" },
  "buff-targeted": { label: "Targeted Buff", emoji: "🎯", color: "text-blue-400" },
  "buff-aoe": { label: "AoE Buff", emoji: "✨", color: "text-purple-400" },
  draw: { label: "Card Draw", emoji: "🃏", color: "text-amber-400" },
  mana: { label: "Mana Refresh", emoji: "💎", color: "text-mana" },
};

// Stat bubble component
function StatBubble({
  value,
  type,
}: {
  value: string | number;
  type: "mana" | "attack" | "health";
}) {
  const colors = {
    mana: "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 border-blue-300",
    attack: "bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-700 border-yellow-400",
    health: "bg-gradient-to-br from-red-400 via-red-600 to-red-800 border-red-300",
  };
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${colors[type]} border-2 font-display text-xs font-bold text-white shadow-lg`}
    >
      {value}
    </span>
  );
}

// Individual minion card section
function MinionSection({ minion, index }: { minion: BattlecryMinion; index: number }) {
  const categoryInfo = EFFECT_CATEGORIES[minion.effectCategory];

  return (
    <section className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-5 shadow-lg shadow-gold/10">
      {/* Header with number and name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 border border-gold/40 font-display text-gold text-sm font-bold">
          {index + 1}
        </div>
        <h3 className="font-display text-xl text-gold flex-1">{minion.name}</h3>
        <span className="text-2xl">{minion.effectEmoji}</span>
      </div>

      {/* Card visual + info layout */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Card visual */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <TutorialCardExample
            name={minion.name}
            manaCost={minion.manaCost}
            cardType="MINION"
            attack={minion.attack}
            health={minion.health}
            keywords={minion.keywords}
            rarity={minion.rarity}
            imageUrl={minion.imageUrl}
            size="md"
          />
        </div>

        {/* Info section */}
        <div className="flex-1 space-y-3">
          {/* Stats row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatBubble value={minion.manaCost} type="mana" />
            <StatBubble value={minion.attack} type="attack" />
            <StatBubble value={minion.health} type="health" />
            <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${categoryInfo.color} border border-gray-700`}>
              {categoryInfo.emoji} {categoryInfo.label}
            </span>
          </div>

          {/* Other keywords if any */}
          {minion.keywords.filter(k => k !== "Battlecry").length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {minion.keywords.filter(k => k !== "Battlecry").map(keyword => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded-full bg-gold/20 border border-gold/40 text-gold"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {/* Battlecry effect */}
          <div className="bg-secondary/40 rounded-lg p-3 border border-gold/20">
            <div className="text-xs text-gold font-bold mb-1 flex items-center gap-1">
              <span>📢</span> BATTLECRY
            </div>
            <p className="font-medieval text-card-foreground/90 leading-relaxed">
              {minion.battlecryEffect}
            </p>
          </div>

          {/* Strategy tip */}
          <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
            <div className="text-xs text-purple-300 font-bold mb-1 flex items-center gap-1">
              <span>💡</span> STRATEGY
            </div>
            <p className="font-medieval text-sm text-card-foreground/70 leading-relaxed">
              {minion.strategyTip}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BattlecryGuidePage() {
  // Group minions by category for summary
  const summonMinions = BATTLECRY_MINIONS.filter(m => m.effectCategory === "summon");
  const targetedBuffMinions = BATTLECRY_MINIONS.filter(m => m.effectCategory === "buff-targeted");
  const aoeBuffMinions = BATTLECRY_MINIONS.filter(m => m.effectCategory === "buff-aoe");
  const drawMinions = BATTLECRY_MINIONS.filter(m => m.effectCategory === "draw");
  const manaMinions = BATTLECRY_MINIONS.filter(m => m.effectCategory === "mana");

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-mana/10 blur-3xl" />
        <div className="absolute left-1/2 bottom-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
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

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wide text-gold mb-4">
          BATTLECRY GUIDE
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="text-2xl">📢</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
        </div>

        {/* Intro text */}
        <div className="max-w-xl mx-auto mb-6">
          <p className="font-medieval text-lg text-card-foreground/80 leading-relaxed">
            Master the <span className="text-gold font-bold">10 Battlecry Minions</span> and
            unleash their effects to dominate the battlefield!
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-28 space-y-6">
        {/* What is Battlecry section */}
        <section className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-6 shadow-lg shadow-gold/10">
          <h2 className="font-display text-2xl text-gold flex items-center gap-3 mb-4">
            <span className="text-3xl">❓</span>
            What is Battlecry?
          </h2>
          <div className="space-y-3">
            <p className="font-medieval text-card-foreground/90 leading-relaxed">
              <span className="text-gold font-bold">Battlecry</span> is a special effect that
              triggers <span className="text-attack font-bold">once</span> when you play a
              minion from your hand.
            </p>
            <div className="bg-secondary/40 rounded-lg p-4 border border-gold/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-medieval text-card-foreground/80 text-sm">
                    The effect happens <span className="text-gold">immediately</span> when the
                    card is played, before the minion can attack. If a Battlecry needs a target,
                    you&apos;ll select it after playing the card.
                  </p>
                </div>
              </div>
            </div>
            <p className="font-medieval text-card-foreground/70 text-sm">
              There are <span className="text-gold font-bold">10 minions</span> with Battlecry
              effects in the game. Let&apos;s learn them all!
            </p>
          </div>
        </section>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/40" />
          <span className="text-gold/60 font-medieval text-sm">THE MINIONS</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/40" />
        </div>

        {/* Individual minion sections */}
        {BATTLECRY_MINIONS.map((minion, index) => (
          <MinionSection key={minion.name} minion={minion} index={index} />
        ))}

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/40" />
          <span className="text-gold/60 font-medieval text-sm">QUICK REFERENCE</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/40" />
        </div>

        {/* Summary Table 1: Requirements */}
        <section className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-6 shadow-lg shadow-gold/10">
          <h2 className="font-display text-xl text-gold flex items-center gap-3 mb-4">
            <span className="text-2xl">📋</span>
            Requirements Table
          </h2>
          <p className="font-medieval text-card-foreground/70 text-sm mb-4">
            Some Battlecries need conditions to get value:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/30">
                  <th className="text-left py-2 px-2 font-display text-gold">Minion</th>
                  <th className="text-center py-2 px-2 font-display text-gold">Needs Others?</th>
                  <th className="text-center py-2 px-2 font-display text-gold">Buffs Self?</th>
                </tr>
              </thead>
              <tbody>
                {BATTLECRY_MINIONS.map((minion) => (
                  <tr key={minion.name} className="border-b border-gray-700/50">
                    <td className="py-2 px-2 font-medieval text-card-foreground/90 text-xs">
                      {minion.name}
                    </td>
                    <td className="text-center py-2 px-2">
                      {minion.needsOtherMinions ? (
                        <span className="text-amber-400">Yes</span>
                      ) : (
                        <span className="text-green-400">No</span>
                      )}
                    </td>
                    <td className="text-center py-2 px-2">
                      {minion.buffsSelf === "N/A" ? (
                        <span className="text-gray-500">—</span>
                      ) : minion.buffsSelf ? (
                        <span className="text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary Table 2: Effect Categories */}
        <section className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-6 shadow-lg shadow-gold/10">
          <h2 className="font-display text-xl text-gold flex items-center gap-3 mb-4">
            <span className="text-2xl">🏷️</span>
            Effect Categories
          </h2>
          <p className="font-medieval text-card-foreground/70 text-sm mb-4">
            Battlecries grouped by what they do:
          </p>
          <div className="space-y-3">
            {/* Summon tokens */}
            <div className="bg-secondary/30 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{EFFECT_CATEGORIES.summon.emoji}</span>
                <span className={`font-display text-sm ${EFFECT_CATEGORIES.summon.color}`}>
                  {EFFECT_CATEGORIES.summon.label}
                </span>
              </div>
              <p className="font-medieval text-xs text-card-foreground/70">
                {summonMinions.map(m => m.name).join(" • ")}
              </p>
            </div>

            {/* Targeted buff */}
            <div className="bg-secondary/30 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{EFFECT_CATEGORIES["buff-targeted"].emoji}</span>
                <span className={`font-display text-sm ${EFFECT_CATEGORIES["buff-targeted"].color}`}>
                  {EFFECT_CATEGORIES["buff-targeted"].label}
                </span>
              </div>
              <p className="font-medieval text-xs text-card-foreground/70">
                {targetedBuffMinions.map(m => m.name).join(" • ")}
              </p>
            </div>

            {/* AoE buff */}
            <div className="bg-secondary/30 rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{EFFECT_CATEGORIES["buff-aoe"].emoji}</span>
                <span className={`font-display text-sm ${EFFECT_CATEGORIES["buff-aoe"].color}`}>
                  {EFFECT_CATEGORIES["buff-aoe"].label}
                </span>
              </div>
              <p className="font-medieval text-xs text-card-foreground/70">
                {aoeBuffMinions.map(m => m.name).join(" • ")}
              </p>
            </div>

            {/* Card draw */}
            <div className="bg-secondary/30 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{EFFECT_CATEGORIES.draw.emoji}</span>
                <span className={`font-display text-sm ${EFFECT_CATEGORIES.draw.color}`}>
                  {EFFECT_CATEGORIES.draw.label}
                </span>
              </div>
              <p className="font-medieval text-xs text-card-foreground/70">
                {drawMinions.map(m => m.name).join(" • ")}
              </p>
            </div>

            {/* Mana refresh */}
            <div className="bg-secondary/30 rounded-lg p-3 border border-mana/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{EFFECT_CATEGORIES.mana.emoji}</span>
                <span className={`font-display text-sm ${EFFECT_CATEGORIES.mana.color}`}>
                  {EFFECT_CATEGORIES.mana.label}
                </span>
              </div>
              <p className="font-medieval text-xs text-card-foreground/70">
                {manaMinions.map(m => m.name).join(" • ")}
              </p>
            </div>
          </div>
        </section>

        {/* Pro Tips section */}
        <section className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-6 shadow-lg shadow-gold/10">
          <h2 className="font-display text-xl text-gold flex items-center gap-3 mb-4">
            <span className="text-2xl">🧠</span>
            Pro Battlecry Tips
          </h2>
          <div className="space-y-3">
            {[
              "Play Lady Banger BEFORE Artem or Orbbro - more minions = more buffs!",
              "Dankshard is always good - 5/7 with Divine Shield that draws a card? Yes please.",
              "Xyori effectively costs 2 mana. Use him to squeeze in extra plays.",
              "Jean Ayala + a minion with Rush = instant board control.",
              "Artem buffs himself. Orbbro doesn't. Plan accordingly!",
              "Haku gives you two bodies AND Rush. Elite tempo play.",
            ].map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-secondary/20 rounded-lg p-3"
              >
                <span className="text-gold">★</span>
                <span className="font-medieval text-card-foreground/90 text-sm">
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center pt-8 pb-4">
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/60" />
            <div className="h-3 w-3 rotate-45 border-2 border-gold/60 bg-gold/20" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          <h2 className="font-display text-3xl text-gold mb-4">
            READY TO BATTLE?
          </h2>

          <p className="font-medieval text-card-foreground/70 mb-8 max-w-md mx-auto">
            Now that you know all the Battlecry effects, put them to the test in the arena!
          </p>

          {/* CTA Button */}
          <Link href="/play">
            <button className="rounded-lg border border-gold/40 bg-gradient-to-b from-gold to-amber-700 px-12 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:scale-105 hover:shadow-gold/40">
              ENTER THE ARENA
            </button>
          </Link>

          {/* Back links */}
          <div className="mt-6 mb-20 flex flex-col gap-2">
            <Link
              href="/how-to-play"
              className="font-medieval text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              📖 Full How to Play Guide
            </Link>
            <Link
              href="/"
              className="font-medieval text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              ← Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
