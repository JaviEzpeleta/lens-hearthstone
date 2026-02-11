'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TutorialCardExample } from './TutorialCardExample';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialTopic {
  id: string;
  emoji: string;
  title: string;
  content: React.ReactNode;
  tip: string;
}

// Card image URLs from /public/cards/
const CARD_IMAGES = {
  bullishBlessing: 'https://api.grove.storage/85a01d21acdff8fae47b13c54df432b8e962a51717e300ce0a5a02ed0d70f5b4',
  hakuFilterless: 'https://ik.imagekit.io/lens/825d5947d7ddd9b5928196e5b26dea5acb175d516df4481b2854e41854e1f5a7_sjmmmTKrU.jpeg',
  jeanAyala: 'https://ik.imagekit.io/lens/f785500ef2d7ad0edd01f1e83f9bf288a46037e0154f4a426aba64c0ca603269_JGo8gpJQn.webp',
  dailyGmer: 'https://api.grove.storage/f204656addde0f806915b34e0ad816d6c85fa703b43cd50ea5f096502cfdec60',
  antiDarkMode: 'https://api.grove.storage/4b69e44696807a19dac915b9715b373b2597ef5abc00c4d32a091a8c6fbe20f4',
  hypeMic: 'https://api.grove.storage/03178c6fc0ff55e26dd9be889ad689ba85a99cca0396ff9060219f094a566d0c',
  orbishShield: 'https://api.grove.storage/607b735e7419d976bb9e7357d374ccee1b199cd464af70e70ad18549db094d24',
  dankshard: 'https://api.grove.storage/584500c988d842ab37fcfab3c03e7a77c92debc1cf681cd6f1a931a82878305f',
  sttsm: 'https://ik.imagekit.io/lens/11f7f31a6f3aaa89b2a2518dff22905f2b4729a8afd6c3cb18292668d996443a_PqovVmTrc.jpeg',
};

const TUTORIAL_TOPICS: TutorialTopic[] = [
  {
    id: 'goal',
    emoji: '🎯',
    title: 'Your Goal',
    content: (
      <>
        <p>Your mission is simple: reduce the enemy hero&apos;s health to 0 before they do the same to you.</p>
        <p>Both heroes start with 30 HP. Use your cards wisely to deal damage while protecting yourself.</p>
      </>
    ),
    tip: "Your mission: make big numbers go down. Their numbers, not yours. That's important.",
  },
  {
    id: 'mana',
    emoji: '💎',
    title: 'Mana & Playing Cards',
    content: (
      <>
        <p>Every card costs mana to play. The blue crystal in the top-left corner shows its cost.</p>
        <p>You start with 1 mana crystal and gain +1 each turn, up to a maximum of 10.</p>
        <p>Your mana fully refills at the start of each turn, so use it all!</p>
        <div className="mt-3 space-y-2">
          <TutorialCardExample
            name="Bullish Blessing"
            manaCost={3}
            cardType="SPELL"
            rarity="COMMON"
            description="Low cost, quick buff"
            imageUrl={CARD_IMAGES.bullishBlessing}
          />
          <TutorialCardExample
            name="Haku, Filterless"
            manaCost={5}
            cardType="MINION"
            attack={5}
            health={6}
            keywords={['Rush', 'Battlecry']}
            rarity="LEGENDARY"
            description="Higher cost, stronger card"
            imageUrl={CARD_IMAGES.hakuFilterless}
          />
        </div>
      </>
    ),
    tip: "Mana is like your energy drink for the turn. Except it's free and infinite. Dream job.",
  },
  {
    id: 'minions',
    emoji: '🐲',
    title: 'Minions',
    content: (
      <>
        <p>Minions are creatures that fight for you on the battlefield. Tap a minion card in your hand to play it.</p>
        <p>Each minion has Attack (orange, bottom-left) and Health (red, bottom-right).</p>
        <p>Freshly played minions can&apos;t attack right away—they have &quot;summoning sickness.&quot; Unless they have Rush!</p>
        <div className="mt-3 space-y-2">
          <TutorialCardExample
            name="Jean Ayala"
            manaCost={4}
            cardType="MINION"
            attack={4}
            health={5}
            keywords={['Battlecry']}
            rarity="COMMON"
            description="4 Attack deals damage, 5 Health survives hits"
            imageUrl={CARD_IMAGES.jeanAyala}
          />
          <TutorialCardExample
            name="Orbbro says GM"
            manaCost={4}
            cardType="MINION"
            attack={4}
            health={5}
            keywords={['Taunt', 'Battlecry']}
            rarity="EPIC"
            description="Has Taunt — enemies must attack it first"
            imageUrl={CARD_IMAGES.dailyGmer}
          />
        </div>
      </>
    ),
    tip: "They're like Pokémon but angrier and they don't need pokéballs.",
  },
  {
    id: 'spells',
    emoji: '✨',
    title: 'Spells',
    content: (
      <>
        <p>Spells are one-time magical effects. They can deal damage, heal, buff your minions, or summon creatures.</p>
        <p>Once cast, they&apos;re gone forever. No take-backs!</p>
        <p>Some spells need a target (tap what you want to hit), others affect the whole board automatically.</p>
        <div className="mt-3 space-y-2">
          <TutorialCardExample
            name="Bullish Blessing"
            manaCost={3}
            cardType="SPELL"
            rarity="COMMON"
            description="Tap a minion to buff it +3/+3"
            imageUrl={CARD_IMAGES.bullishBlessing}
          />
          <TutorialCardExample
            name="AntiDarkMode Spell"
            manaCost={4}
            cardType="SPELL"
            rarity="EPIC"
            description="Affects board automatically — summons 2x 2/2"
            imageUrl={CARD_IMAGES.antiDarkMode}
          />
        </div>
      </>
    ),
    tip: "Magic goes brrrr and then disappears. Very dramatic.",
  },
  {
    id: 'weapons',
    emoji: '⚔️',
    title: 'Weapons',
    content: (
      <>
        <p>Weapons let your hero attack directly! Equip one and your hero can deal damage each turn.</p>
        <p>Weapons have Attack and Durability. Each attack uses 1 durability until it breaks.</p>
        <p>Careful: when your hero attacks a minion, the minion hits back!</p>
        <div className="mt-3 space-y-2">
          <TutorialCardExample
            name="The Hype Mic"
            manaCost={3}
            cardType="WEAPON"
            attack={3}
            durability={3}
            rarity="RARE"
            description="3 swings, buffs minions when you attack"
            imageUrl={CARD_IMAGES.hypeMic}
          />
          <TutorialCardExample
            name="Orbish Shield"
            manaCost={2}
            cardType="WEAPON"
            attack={3}
            durability={2}
            keywords={['Windfury']}
            rarity="RARE"
            description="Can attack twice per turn!"
            imageUrl={CARD_IMAGES.orbishShield}
          />
        </div>
      </>
    ),
    tip: "Sword goes bonk. But minions bonk back. Choose wisely.",
  },
  {
    id: 'attacking',
    emoji: '👊',
    title: 'How to Attack',
    content: (
      <>
        <p><strong>To attack:</strong> Tap your minion (or hero with weapon), then tap the enemy target.</p>
        <p>Minions with a green glow can attack. Both fighters deal damage to each other simultaneously.</p>
        <p>If the enemy has a minion with <strong>Taunt</strong>, you must kill it first before attacking anything else.</p>
      </>
    ),
    tip: "Tap tap revenge. Ancient technique.",
  },
  {
    id: 'keywords',
    emoji: '🏷️',
    title: 'Keywords',
    content: (
      <div className="space-y-3">
        <div>
          <div><span className="text-gold font-bold">🛡️ Taunt</span> — Must be attacked first</div>
          <div className="mt-1">
            <TutorialCardExample
              name="Orbbro says GM"
              manaCost={4}
              cardType="MINION"
              attack={4}
              health={5}
              keywords={['Taunt', 'Battlecry']}
              rarity="EPIC"
              description="Enemies must attack this first"
              imageUrl={CARD_IMAGES.dailyGmer}
            />
          </div>
        </div>
        <div>
          <div><span className="text-gold font-bold">🏃 Rush</span> — Can attack minions immediately</div>
          <div className="mt-1">
            <TutorialCardExample
              name="Haku, Filterless"
              manaCost={5}
              cardType="MINION"
              attack={5}
              health={6}
              keywords={['Rush', 'Battlecry']}
              rarity="LEGENDARY"
              description="No summoning sickness vs minions"
              imageUrl={CARD_IMAGES.hakuFilterless}
            />
          </div>
        </div>
        <div>
          <div><span className="text-gold font-bold">✨ Divine Shield</span> — Blocks the first hit</div>
          <div className="mt-1">
            <TutorialCardExample
              name="Dankshard, Galaxy Brain"
              manaCost={4}
              cardType="MINION"
              attack={5}
              health={7}
              keywords={['Divine Shield', 'Battlecry']}
              rarity="RARE"
              description="Survives one hit for free"
              imageUrl={CARD_IMAGES.dankshard}
            />
          </div>
        </div>
        <div>
          <div><span className="text-gold font-bold">💚 Lifesteal</span> — Heals your hero when dealing damage</div>
          <div className="mt-1">
            <TutorialCardExample
              name="STTSM, Beat Dropper"
              manaCost={4}
              cardType="MINION"
              attack={3}
              health={5}
              keywords={['Lifesteal', 'Battlecry']}
              rarity="EPIC"
              description="Damage dealt = health restored"
              imageUrl={CARD_IMAGES.sttsm}
            />
          </div>
        </div>
        <div>
          <div><span className="text-gold font-bold">💨 Windfury</span> — Can attack twice per turn</div>
          <div className="mt-1">
            <TutorialCardExample
              name="Orbish Shield"
              manaCost={2}
              cardType="WEAPON"
              attack={3}
              durability={2}
              keywords={['Windfury']}
              rarity="RARE"
              description="Double the bonks!"
              imageUrl={CARD_IMAGES.orbishShield}
            />
          </div>
        </div>
        <div>
          <div><span className="text-gold font-bold">📢 Battlecry</span> — Effect triggers when played</div>
          <div className="mt-1">
            <TutorialCardExample
              name="Jean Ayala"
              manaCost={4}
              cardType="MINION"
              attack={4}
              health={5}
              keywords={['Battlecry']}
              rarity="COMMON"
              description="Buffs a friend when played"
              imageUrl={CARD_IMAGES.jeanAyala}
            />
          </div>
        </div>
      </div>
    ),
    tip: "Keywords are basically superpowers. Read them. Love them.",
  },
  {
    id: 'endturn',
    emoji: '⏭️',
    title: 'End Your Turn',
    content: (
      <>
        <p>When you&apos;re done playing cards and attacking, press the golden <strong>End Turn</strong> button.</p>
        <p>The enemy AI will then take their turn. Watch what they do—you might learn something!</p>
        <p>The game continues until one hero reaches 0 health.</p>
      </>
    ),
    tip: "Done clicking? Click the shiny button. AI's turn to suffer.",
  },
];

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTopic = currentTopicId
    ? TUTORIAL_TOPICS.find((t) => t.id === currentTopicId)
    : null;

  const handleClose = () => {
    setCurrentTopicId(null);
    onClose();
  };

  const handleBackToIndex = () => {
    setCurrentTopicId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-[320px] rounded-2xl overflow-hidden',
          'bg-gradient-to-b from-gray-800 to-gray-900',
          'border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]',
          'animate-modal-appear'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-display font-bold text-gold flex items-center gap-2">
            <span>📖</span>
            {currentTopic ? currentTopic.title : 'How to Play'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {currentTopic ? (
            // Topic detail view
            <div className="p-4 space-y-4">
              <div className="text-4xl text-center">{currentTopic.emoji}</div>

              <div className="text-sm text-gray-200 leading-relaxed space-y-3">
                {currentTopic.content}
              </div>

              {/* Fun tip */}
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gold font-bold mb-1">💡 Pro Tip</div>
                <p className="text-xs text-gray-300 italic">{currentTopic.tip}</p>
              </div>

              {/* Back button */}
              <button
                onClick={handleBackToIndex}
                className={cn(
                  'w-full py-2 rounded-lg font-bold text-sm transition-all',
                  'bg-gray-700 hover:bg-gray-600 text-gray-200'
                )}
              >
                ← Back to Index
              </button>
            </div>
          ) : (
            // Index view
            <div className="p-2">
              {TUTORIAL_TOPICS.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => setCurrentTopicId(topic.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg',
                    'text-left text-sm transition-colors',
                    'hover:bg-gray-700/50 active:bg-gray-700'
                  )}
                >
                  <span className="text-xl">{topic.emoji}</span>
                  <span className="text-gray-200">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    {topic.title}
                  </span>
                  <span className="ml-auto text-gray-500">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!currentTopic && (
          <div className="px-4 py-3 border-t border-gray-700">
            <button
              onClick={handleClose}
              className={cn(
                'w-full py-2 rounded-lg font-bold text-sm transition-all',
                'bg-gradient-to-br from-gold to-amber-600 text-black',
                'hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              Back to Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
