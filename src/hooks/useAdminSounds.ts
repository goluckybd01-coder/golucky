import { useCallback, useRef } from "react";

export interface AdminSoundPreferences {
  approval: boolean;
  rejection: boolean;
  queueCleared: boolean;
  newRequest: boolean;
}

export const DEFAULT_SOUND_PREFERENCES: AdminSoundPreferences = {
  approval: true,
  rejection: true,
  queueCleared: true,
  newRequest: true,
};

export const useAdminSounds = (
  soundEnabled: boolean = true, 
  volume: number = 0.7,
  preferences: AdminSoundPreferences = DEFAULT_SOUND_PREFERENCES
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
    return audioContextRef.current;
  }, [volume]);

  const getMasterGain = useCallback(() => {
    getAudioContext();
    return masterGainRef.current!;
  }, [getAudioContext]);

  const playApprovalSound = useCallback(() => {
    if (!soundEnabled || !preferences.approval) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.25);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.3);
      });
      setTimeout(() => {
        try {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.connect(sparkleGain);
          sparkleGain.connect(masterGain);
          sparkle.frequency.setValueAtTime(2093, ctx.currentTime);
          sparkle.type = "sine";
          sparkleGain.gain.setValueAtTime(0.15, ctx.currentTime);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          sparkle.start(ctx.currentTime);
          sparkle.stop(ctx.currentTime + 0.25);
        } catch (e) {}
      }, 350);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, preferences.approval]);

  const playRejectionSound = useCallback(() => {
    if (!soundEnabled || !preferences.rejection) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12);
      osc1.type = "triangle";
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.frequency.setValueAtTime(174.61, ctx.currentTime + 0.05);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, preferences.rejection]);

  const playQueueClearedSound = useCallback(() => {
    if (!soundEnabled || !preferences.queueCleared) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const notes = [
        { freq: 523.25, delay: 0 },
        { freq: 659.25, delay: 0.08 },
        { freq: 783.99, delay: 0.16 },
        { freq: 1046.50, delay: 0.24 },
        { freq: 1318.51, delay: 0.35 },
      ];
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.35);
      });
      for (let i = 0; i < 5; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        const baseFreq = 2000 + i * 200 + Math.random() * 100;
        sparkle.frequency.setValueAtTime(baseFreq, ctx.currentTime + 0.5 + i * 0.06);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.5 + i * 0.06);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.06 + 0.1);
        sparkle.start(ctx.currentTime + 0.5 + i * 0.06);
        sparkle.stop(ctx.currentTime + 0.5 + i * 0.06 + 0.12);
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, preferences.queueCleared]);

  const playNewRequestSound = useCallback(() => {
    if (!soundEnabled || !preferences.newRequest) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, preferences.newRequest]);

  const testApprovalSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.25);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.3);
      });
      setTimeout(() => {
        try {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.connect(sparkleGain);
          sparkleGain.connect(masterGain);
          sparkle.frequency.setValueAtTime(2093, ctx.currentTime);
          sparkle.type = "sine";
          sparkleGain.gain.setValueAtTime(0.15, ctx.currentTime);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          sparkle.start(ctx.currentTime);
          sparkle.stop(ctx.currentTime + 0.25);
        } catch (e) {}
      }, 350);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const testRejectionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12);
      osc1.type = "triangle";
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.frequency.setValueAtTime(174.61, ctx.currentTime + 0.05);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const testQueueClearedSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const notes = [
        { freq: 523.25, delay: 0 },
        { freq: 659.25, delay: 0.08 },
        { freq: 783.99, delay: 0.16 },
        { freq: 1046.50, delay: 0.24 },
        { freq: 1318.51, delay: 0.35 },
      ];
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.35);
      });
      for (let i = 0; i < 5; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        const baseFreq = 2000 + i * 200 + Math.random() * 100;
        sparkle.frequency.setValueAtTime(baseFreq, ctx.currentTime + 0.5 + i * 0.06);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.5 + i * 0.06);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.06 + 0.1);
        sparkle.start(ctx.currentTime + 0.5 + i * 0.06);
        sparkle.stop(ctx.currentTime + 0.5 + i * 0.06 + 0.12);
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const testNewRequestSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  return {
    playApprovalSound,
    playRejectionSound,
    playQueueClearedSound,
    playNewRequestSound,
    testApprovalSound,
    testRejectionSound,
    testQueueClearedSound,
    testNewRequestSound,
  };
};
