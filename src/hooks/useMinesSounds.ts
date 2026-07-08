import { useCallback, useRef, useEffect } from 'react';
import AudioManager from './useAudioManager';

// Helper to trigger haptic feedback
const triggerHaptic = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }
};

export const useMinesSounds = () => {
  const audioManager = useRef(AudioManager.getInstance());
  const volumeRef = useRef(0.5); // Master volume
  const hapticEnabledRef = useRef(true); // Haptic feedback toggle

  // Cleanup on unmount - CRITICAL for fixing the persistent sound issue
  useEffect(() => {
    return () => {
      audioManager.current.cleanup();
    };
  }, []);

  const getAudioContext = useCallback(() => {
    return audioManager.current.getContext();
  }, []);

  const setVolume = useCallback((vol: number) => {
    volumeRef.current = Math.max(0, Math.min(1, vol));
    audioManager.current.setVolume(vol);
  }, []);

  const setHapticEnabled = useCallback((enabled: boolean) => {
    hapticEnabledRef.current = enabled;
  }, []);


  // Play a pleasant chime for gem reveal - sparkly crystal sound
  const playGemReveal = useCallback(() => {
    // Light haptic tap for gem reveal
    if (hapticEnabledRef.current) {
      triggerHaptic(15);
    }

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      // Main crystal chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6

      gain.gain.setValueAtTime(0.35 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Sparkle harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain2.gain.setValueAtTime(0.25 * vol, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.03);
      osc2.stop(now + 0.2);

      // High shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();

      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(2640, now + 0.05);

      gain3.gain.setValueAtTime(0.1 * vol, now + 0.05);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.05);
      osc3.stop(now + 0.15);
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  // Play explosion sound for mine hit - deep rumble with debris
  const playMineExplosion = useCallback(() => {
    // Strong vibration pattern for explosion - impact + rumble
    if (hapticEnabledRef.current) {
      triggerHaptic([100, 30, 80, 20, 60, 15, 40]);
    }

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      // White noise for explosion debris
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Low pass filter for bass rumble
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6 * vol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.6);

      // Deep bass thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

      oscGain.gain.setValueAtTime(0.5 * vol, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      // Impact crack
      const crack = ctx.createOscillator();
      const crackGain = ctx.createGain();

      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(400, now);
      crack.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      crackGain.gain.setValueAtTime(0.3 * vol, now);
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      crack.connect(crackGain);
      crackGain.connect(ctx.destination);

      crack.start(now);
      crack.stop(now + 0.1);
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  // Play success fanfare for cashout - triumphant coins
  const playCashout = useCallback(() => {
    // Celebratory pulse pattern for cashout win
    if (hapticEnabledRef.current) {
      triggerHaptic([30, 50, 30, 50, 30, 80, 50]);
    }

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      // Victory arpeggio C-E-G-C
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3 * vol, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });

      // Coin jingle effect
      for (let i = 0; i < 5; i++) {
        const coinOsc = ctx.createOscillator();
        const coinGain = ctx.createGain();
        const delay = 0.35 + i * 0.06;
        const freq = 2000 + Math.random() * 1000;

        coinOsc.type = 'sine';
        coinOsc.frequency.setValueAtTime(freq, now + delay);

        coinGain.gain.setValueAtTime(0.15 * vol, now + delay);
        coinGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

        coinOsc.connect(coinGain);
        coinGain.connect(ctx.destination);

        coinOsc.start(now + delay);
        coinOsc.stop(now + delay + 0.1);
      }

      // Final triumphant chord
      const chordNotes = [523.25, 659.25, 783.99, 1046.50];
      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.5);

        gain.gain.setValueAtTime(0, now + 0.5);
        gain.gain.linearRampToValueAtTime(0.12 * vol, now + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.5);
        osc.stop(now + 1.3);
      });
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  // Play game start sound - energetic power-up
  const playGameStart = useCallback(() => {
    // Double tap for game start
    if (hapticEnabledRef.current) {
      triggerHaptic([25, 40, 25]);
    }

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      // Power-up sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);

      gain.gain.setValueAtTime(0.2 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

      // Confirmation beeps
      [0.12, 0.18].forEach((delay, i) => {
        const beep = ctx.createOscillator();
        const beepGain = ctx.createGain();

        beep.type = 'sine';
        beep.frequency.setValueAtTime(i === 0 ? 880 : 1100, now + delay);

        beepGain.gain.setValueAtTime(0.25 * vol, now + delay);
        beepGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

        beep.connect(beepGain);
        beepGain.connect(ctx.destination);

        beep.start(now + delay);
        beep.stop(now + delay + 0.1);
      });

      // Energy charge shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();

      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1760, now + 0.2);

      shimmerGain.gain.setValueAtTime(0.1 * vol, now + 0.2);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmer.start(now + 0.2);
      shimmer.stop(now + 0.35);
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  // Play click/tap sound - subtle feedback
  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.03);

      gain.gain.setValueAtTime(0.15 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  // Play tile hover sound - very subtle
  const playHover = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.05 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext]);

  // Play multiplier increase sound - rising tone
  const playMultiplierUp = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = volumeRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

      gain.gain.setValueAtTime(0.12 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.log('Sound not supported');
    }
  }, [getAudioContext]);

  return {
    playGemReveal,
    playMineExplosion,
    playCashout,
    playGameStart,
    playClick,
    playHover,
    playMultiplierUp,
    setVolume,
    setHapticEnabled,
    // Add cleanup method
    cleanup: () => audioManager.current.cleanup(),
  };
};
