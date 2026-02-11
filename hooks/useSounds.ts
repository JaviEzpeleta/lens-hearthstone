'use client';

import { useCallback } from 'react';
import { playSound, SoundType } from '@/lib/game/sounds';

export function useSounds() {
  const play = useCallback((type: SoundType) => {
    playSound(type);
  }, []);

  // Convenience methods for each sound type
  const cardPlay = useCallback(() => playSound('card_play'), []);
  const attack = useCallback(() => playSound('attack'), []);
  const damage = useCallback(() => playSound('damage'), []);
  const heal = useCallback(() => playSound('heal'), []);
  const death = useCallback(() => playSound('death'), []);
  const buff = useCallback(() => playSound('buff'), []);
  const summon = useCallback(() => playSound('summon'), []);
  const draw = useCallback(() => playSound('draw'), []);
  const turnStart = useCallback(() => playSound('turn_start'), []);
  const victory = useCallback(() => playSound('victory'), []);
  const defeat = useCallback(() => playSound('defeat'), []);
  const select = useCallback(() => playSound('select'), []);
  const error = useCallback(() => playSound('error'), []);
  const weaponEquip = useCallback(() => playSound('weapon_equip'), []);
  const divineShieldBreak = useCallback(() => playSound('divine_shield_break'), []);
  const battlecry = useCallback(() => playSound('battlecry'), []);

  return {
    play,
    cardPlay,
    attack,
    damage,
    heal,
    death,
    buff,
    summon,
    draw,
    turnStart,
    victory,
    defeat,
    select,
    error,
    weaponEquip,
    divineShieldBreak,
    battlecry,
  };
}
