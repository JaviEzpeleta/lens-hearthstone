import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface Card {
  id: number;
  name: string;
  cardType: "MINION" | "SPELL" | "WEAPON";
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  keywords: string[];
  abilityText: string;
  flavorText: string;
  generatedImageUrl: string;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET() {
  try {
    const cardsDir = path.join(process.cwd(), "public", "cards");
    const files = await fs.readdir(cardsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const cards: Card[] = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(cardsDir, file), "utf-8");
        return JSON.parse(content) as Card;
      })
    );

    // Return shuffled cards
    const shuffledCards = shuffleArray(cards);

    return NextResponse.json(shuffledCards);
  } catch (error) {
    console.error("Error loading cards:", error);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}
