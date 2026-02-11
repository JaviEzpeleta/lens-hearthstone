import fs from "fs";
import path from "path";
import Link from "next/link";
import { CollectionGrid } from "@/components/collection/CollectionGrid";

interface Card {
  id: number;
  handle: string;
  cardType: string;
  name: string;
  imagePrompt: string;
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  keywords: string[];
  abilityText: string;
  flavorText: string;
  rarity: string;
  generatedImageUrl: string;
  spellEffect?: {
    value: number;
    target: string;
    effectType: string;
    description: string;
    summonCount?: number;
    summonAttack?: number;
    summonHealth?: number;
  };
  weaponEffect?: {
    trigger: "BATTLECRY" | "AFTER_ATTACK" | "ON_ATTACK";
    effectType: "DRAW" | "HEAL" | "BUFF" | "DESTROY" | "DAMAGE";
    value?: number;
    secondaryValue?: number;
    target?: "NONE" | "ENEMY_MINION" | "RANDOM_FRIENDLY_MINION" | "ATTACKED_TARGET";
    description?: string;
  };
  profileAddress: string;
  profileName: string;
  profilePicture: string;
  profileScore: number;
  createdAt: string;
  updatedAt: string;
}

async function getCards(): Promise<Card[]> {
  const cardsDir = path.join(process.cwd(), "public", "cards");
  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));

  const cards: Card[] = [];
  for (const file of files) {
    const filePath = path.join(cardsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    cards.push(JSON.parse(content));
  }

  return cards.sort((a, b) => a.id - b.id);
}

export default async function TheCardsPage() {
  const cards = await getCards();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Header */}
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 font-serif text-sm font-semibold tracking-wider text-secondary-foreground transition-all hover:bg-accent"
        >
          <span>&larr;</span> Back
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-wide text-gold sm:text-4xl">
          THE CARDS
        </h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </header>

      {/* Cards Grid with Filters */}
      <main className="mx-auto max-w-7xl">
        <CollectionGrid cards={cards} />
      </main>
    </div>
  );
}
