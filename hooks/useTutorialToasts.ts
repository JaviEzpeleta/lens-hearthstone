'use client';

import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

type TutorialTip =
  | 'minion_played'
  | 'minion_rush'
  | 'minion_taunt'
  | 'spell_played'
  | 'weapon_equipped'
  | 'minion_attacked'
  | 'minion_died'
  | 'mana_gained'
  | 'first_turn'
  | 'divine_shield'
  | 'lifesteal'
  | 'windfury'
  | 'battlecry';

const TUTORIAL_MESSAGES: Record<TutorialTip, string> = {
  minion_played: '🛡️ Minions can attack next turn unless they have Rush',
  minion_rush: '⚡ Rush: This minion can attack other minions immediately!',
  minion_taunt: '🏰 Taunt: Enemies must attack this minion first',
  spell_played: '✨ Spells have instant effects and are discarded after use',
  weapon_equipped: '⚔️ Your hero can now attack! Weapons lose durability each swing',
  minion_attacked: '💥 Minions deal damage equal to their attack power',
  minion_died: '💀 Minions die when their health reaches 0',
  mana_gained: '💎 You gain 1 mana crystal each turn (max 10)',
  first_turn: '📜 Draw a card, play cards, and attack to defeat your enemy!',
  divine_shield: '🔰 Divine Shield blocks the first damage taken',
  lifesteal: '💚 Lifesteal: Damage dealt heals your hero',
  windfury: '🌪️ Windfury: This minion can attack twice per turn',
  battlecry: '📣 Battlecry: Effect triggers when played from hand',
};

export function useTutorialToasts(tutorialMode: boolean) {
  const shownTips = useRef<Set<TutorialTip>>(new Set());

  const showTip = useCallback(
    (tip: TutorialTip) => {
      if (!tutorialMode) return;
      if (shownTips.current.has(tip)) return;

      shownTips.current.add(tip);
      toast(TUTORIAL_MESSAGES[tip], {
        icon: null,
        duration: 4000,
      });
    },
    [tutorialMode]
  );

  const resetTips = useCallback(() => {
    shownTips.current.clear();
  }, []);

  return { showTip, resetTips };
}
