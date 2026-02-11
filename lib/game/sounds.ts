'use client';

// Sound effect types (16 total)
export type SoundType =
  | 'card_play'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'death'
  | 'buff'
  | 'summon'
  | 'draw'
  | 'turn_start'
  | 'victory'
  | 'defeat'
  | 'select'
  | 'error'
  | 'weapon_equip'
  | 'divine_shield_break'
  | 'battlecry';

// Layered oscillator configuration
interface OscillatorLayer {
  waveform: OscillatorType;
  frequency: number;
  endFrequency: number;
  detune?: number; // Cents for detuning (richness)
  volume: number;
  delay?: number; // Start delay in seconds
  duration: number;
}

// Sound definition with multiple layers
interface SoundDefinition {
  layers: OscillatorLayer[];
  useNoise?: boolean;
  noiseDuration?: number;
  noiseVolume?: number;
}

// Sound definitions with layered synthesis
const SOUND_DEFINITIONS: Record<SoundType, SoundDefinition> = {
  // Card play - Whoosh + magical sparkle
  card_play: {
    layers: [
      { waveform: 'sine', frequency: 400, endFrequency: 800, volume: 0.25, duration: 0.12 },
      { waveform: 'triangle', frequency: 600, endFrequency: 1200, volume: 0.15, detune: 5, duration: 0.1, delay: 0.02 },
      { waveform: 'sine', frequency: 1000, endFrequency: 1500, volume: 0.1, duration: 0.08, delay: 0.04 },
    ],
    useNoise: true,
    noiseDuration: 0.08,
    noiseVolume: 0.05,
  },

  // Attack - Aggressive impact with layered oscillators + noise
  attack: {
    layers: [
      { waveform: 'sawtooth', frequency: 180, endFrequency: 80, volume: 0.35, duration: 0.18 },
      { waveform: 'square', frequency: 120, endFrequency: 50, volume: 0.2, detune: -10, duration: 0.15, delay: 0.02 },
      { waveform: 'triangle', frequency: 300, endFrequency: 100, volume: 0.15, duration: 0.12, delay: 0.01 },
    ],
    useNoise: true,
    noiseDuration: 0.15,
    noiseVolume: 0.2,
  },

  // Damage - Crunchy hit (low thud + crunch + noise)
  damage: {
    layers: [
      { waveform: 'sine', frequency: 100, endFrequency: 40, volume: 0.4, duration: 0.12 },
      { waveform: 'square', frequency: 200, endFrequency: 60, volume: 0.2, detune: 15, duration: 0.1 },
      { waveform: 'sawtooth', frequency: 150, endFrequency: 30, volume: 0.15, detune: -8, duration: 0.08, delay: 0.02 },
    ],
    useNoise: true,
    noiseDuration: 0.1,
    noiseVolume: 0.25,
  },

  // Heal - Ascending C-E-G arpeggio shimmer
  heal: {
    layers: [
      // C5 (523 Hz)
      { waveform: 'sine', frequency: 523, endFrequency: 540, volume: 0.25, duration: 0.15 },
      // E5 (659 Hz) delayed
      { waveform: 'sine', frequency: 659, endFrequency: 680, volume: 0.25, duration: 0.15, delay: 0.08 },
      // G5 (784 Hz) delayed more
      { waveform: 'sine', frequency: 784, endFrequency: 820, volume: 0.25, duration: 0.15, delay: 0.16 },
      // Shimmer layer
      { waveform: 'triangle', frequency: 1047, endFrequency: 1100, volume: 0.1, detune: 3, duration: 0.2, delay: 0.2 },
    ],
  },

  // Death - Dramatic descent with detuned layers
  death: {
    layers: [
      { waveform: 'sawtooth', frequency: 350, endFrequency: 25, volume: 0.35, duration: 0.5 },
      { waveform: 'sawtooth', frequency: 355, endFrequency: 28, volume: 0.25, detune: 8, duration: 0.45, delay: 0.02 },
      { waveform: 'square', frequency: 200, endFrequency: 20, volume: 0.15, detune: -5, duration: 0.4, delay: 0.05 },
      { waveform: 'sine', frequency: 100, endFrequency: 15, volume: 0.2, duration: 0.5 },
    ],
    useNoise: true,
    noiseDuration: 0.3,
    noiseVolume: 0.15,
  },

  // Buff - Empowering rising shimmer
  buff: {
    layers: [
      { waveform: 'sine', frequency: 392, endFrequency: 587, volume: 0.25, duration: 0.2 },
      { waveform: 'triangle', frequency: 400, endFrequency: 600, volume: 0.2, detune: 4, duration: 0.18, delay: 0.02 },
      { waveform: 'sine', frequency: 784, endFrequency: 1175, volume: 0.15, duration: 0.15, delay: 0.05 },
    ],
  },

  // Summon - Magical materialization chime
  summon: {
    layers: [
      { waveform: 'triangle', frequency: 262, endFrequency: 523, volume: 0.3, duration: 0.2 },
      { waveform: 'sine', frequency: 330, endFrequency: 660, volume: 0.2, detune: 3, duration: 0.18, delay: 0.03 },
      { waveform: 'sine', frequency: 523, endFrequency: 1046, volume: 0.15, duration: 0.15, delay: 0.06 },
      { waveform: 'triangle', frequency: 800, endFrequency: 1200, volume: 0.1, duration: 0.12, delay: 0.1 },
    ],
  },

  // Draw - Quick card flip
  draw: {
    layers: [
      { waveform: 'sine', frequency: 600, endFrequency: 850, volume: 0.2, duration: 0.08 },
      { waveform: 'triangle', frequency: 700, endFrequency: 900, volume: 0.1, detune: 2, duration: 0.06, delay: 0.02 },
    ],
    useNoise: true,
    noiseDuration: 0.05,
    noiseVolume: 0.08,
  },

  // Turn start - Bell-like attention chime
  turn_start: {
    layers: [
      { waveform: 'sine', frequency: 440, endFrequency: 445, volume: 0.3, duration: 0.4 },
      { waveform: 'sine', frequency: 880, endFrequency: 882, volume: 0.15, duration: 0.35, delay: 0.02 },
      { waveform: 'sine', frequency: 1320, endFrequency: 1325, volume: 0.1, duration: 0.3, delay: 0.04 },
      { waveform: 'triangle', frequency: 660, endFrequency: 665, volume: 0.12, detune: 2, duration: 0.35, delay: 0.01 },
    ],
  },

  // Victory - C major fanfare arpeggio (C4-E4-G4-C5)
  victory: {
    layers: [
      // C4 (262 Hz)
      { waveform: 'sine', frequency: 262, endFrequency: 265, volume: 0.3, duration: 0.2 },
      { waveform: 'triangle', frequency: 262, endFrequency: 265, volume: 0.15, detune: 2, duration: 0.2 },
      // E4 (330 Hz)
      { waveform: 'sine', frequency: 330, endFrequency: 333, volume: 0.3, duration: 0.2, delay: 0.12 },
      { waveform: 'triangle', frequency: 330, endFrequency: 333, volume: 0.15, detune: 2, duration: 0.2, delay: 0.12 },
      // G4 (392 Hz)
      { waveform: 'sine', frequency: 392, endFrequency: 396, volume: 0.3, duration: 0.2, delay: 0.24 },
      { waveform: 'triangle', frequency: 392, endFrequency: 396, volume: 0.15, detune: 2, duration: 0.2, delay: 0.24 },
      // C5 (523 Hz) - sustained
      { waveform: 'sine', frequency: 523, endFrequency: 530, volume: 0.35, duration: 0.5, delay: 0.36 },
      { waveform: 'triangle', frequency: 523, endFrequency: 530, volume: 0.2, detune: 3, duration: 0.45, delay: 0.36 },
    ],
  },

  // Defeat - Sad descending minor (A3-F3-D3-A2)
  defeat: {
    layers: [
      // A3 (220 Hz)
      { waveform: 'sawtooth', frequency: 220, endFrequency: 215, volume: 0.25, duration: 0.25 },
      { waveform: 'sine', frequency: 220, endFrequency: 215, volume: 0.2, detune: -3, duration: 0.25 },
      // F3 (175 Hz)
      { waveform: 'sawtooth', frequency: 175, endFrequency: 170, volume: 0.25, duration: 0.25, delay: 0.2 },
      { waveform: 'sine', frequency: 175, endFrequency: 170, volume: 0.2, detune: -3, duration: 0.25, delay: 0.2 },
      // D3 (147 Hz)
      { waveform: 'sawtooth', frequency: 147, endFrequency: 140, volume: 0.25, duration: 0.25, delay: 0.4 },
      { waveform: 'sine', frequency: 147, endFrequency: 140, volume: 0.2, detune: -3, duration: 0.25, delay: 0.4 },
      // A2 (110 Hz) - sustained
      { waveform: 'sawtooth', frequency: 110, endFrequency: 55, volume: 0.3, duration: 0.6, delay: 0.6 },
      { waveform: 'sine', frequency: 110, endFrequency: 55, volume: 0.2, detune: -5, duration: 0.55, delay: 0.6 },
    ],
  },

  // Select - Subtle click
  select: {
    layers: [
      { waveform: 'sine', frequency: 500, endFrequency: 580, volume: 0.15, duration: 0.04 },
      { waveform: 'triangle', frequency: 600, endFrequency: 650, volume: 0.1, duration: 0.03, delay: 0.01 },
    ],
  },

  // Error - Negative buzzer
  error: {
    layers: [
      { waveform: 'square', frequency: 100, endFrequency: 80, volume: 0.25, duration: 0.15 },
      { waveform: 'square', frequency: 105, endFrequency: 82, volume: 0.2, detune: 10, duration: 0.12, delay: 0.02 },
      { waveform: 'sawtooth', frequency: 80, endFrequency: 60, volume: 0.15, duration: 0.1, delay: 0.03 },
    ],
  },

  // Weapon equip - Metallic "shing" draw
  weapon_equip: {
    layers: [
      { waveform: 'sawtooth', frequency: 800, endFrequency: 2000, volume: 0.2, duration: 0.1 },
      { waveform: 'triangle', frequency: 1200, endFrequency: 2500, volume: 0.15, detune: 5, duration: 0.08, delay: 0.02 },
      { waveform: 'sine', frequency: 1500, endFrequency: 3000, volume: 0.1, duration: 0.06, delay: 0.04 },
      { waveform: 'square', frequency: 600, endFrequency: 1000, volume: 0.08, duration: 0.12 },
    ],
    useNoise: true,
    noiseDuration: 0.12,
    noiseVolume: 0.15,
  },

  // Divine shield break - Magical glass shatter
  divine_shield_break: {
    layers: [
      { waveform: 'sine', frequency: 2000, endFrequency: 800, volume: 0.2, duration: 0.15 },
      { waveform: 'triangle', frequency: 2500, endFrequency: 1000, volume: 0.15, detune: 8, duration: 0.12, delay: 0.02 },
      { waveform: 'sine', frequency: 3000, endFrequency: 1200, volume: 0.1, duration: 0.1, delay: 0.04 },
      { waveform: 'square', frequency: 1500, endFrequency: 600, volume: 0.1, duration: 0.08, delay: 0.03 },
    ],
    useNoise: true,
    noiseDuration: 0.2,
    noiseVolume: 0.25,
  },

  // Battlecry - Horn-like dramatic announcement
  battlecry: {
    layers: [
      { waveform: 'sawtooth', frequency: 220, endFrequency: 330, volume: 0.3, duration: 0.25 },
      { waveform: 'sawtooth', frequency: 225, endFrequency: 335, volume: 0.2, detune: 5, duration: 0.23, delay: 0.01 },
      { waveform: 'square', frequency: 330, endFrequency: 440, volume: 0.15, duration: 0.2, delay: 0.08 },
      { waveform: 'triangle', frequency: 440, endFrequency: 550, volume: 0.12, duration: 0.15, delay: 0.12 },
    ],
  },
};

// Sound manager with multi-layer synthesis
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Create white noise for impact sounds
   */
  private createNoise(
    ctx: AudioContext,
    duration: number,
    volume: number,
    startTime: number
  ) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter for less harsh noise
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  /**
   * Play a layered synthesized sound effect
   */
  play(type: SoundType) {
    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const definition = SOUND_DEFINITIONS[type];
    const now = ctx.currentTime;

    // Play each oscillator layer
    for (const layer of definition.layers) {
      const startTime = now + (layer.delay || 0);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = layer.waveform;
      oscillator.frequency.setValueAtTime(layer.frequency, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        layer.endFrequency,
        startTime + layer.duration
      );

      if (layer.detune) {
        oscillator.detune.setValueAtTime(layer.detune, startTime);
      }

      gainNode.gain.setValueAtTime(this.volume * layer.volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        startTime + layer.duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + layer.duration);
    }

    // Add noise if specified
    if (definition.useNoise && definition.noiseDuration && definition.noiseVolume) {
      this.createNoise(ctx, definition.noiseDuration, definition.noiseVolume, now);
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export function playSound(type: SoundType) {
  soundManager.play(type);
}

export function setSoundEnabled(enabled: boolean) {
  soundManager.setEnabled(enabled);
}

export function setSoundVolume(volume: number) {
  soundManager.setVolume(volume);
}
