import { useCallback, useRef } from "react";

// Web Audio API based sound effects for AI Predictions
export const usePredictionSounds = (soundEnabled: boolean = true, volume: number = 0.7) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

  const playHighAccuracy = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const sparkleNotes = [1200, 1600, 2000, 2400];
      sparkleNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.2);
      });
      const chordFreqs = [523.25, 659.25, 783.99];
      chordFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.25);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2 - i * 0.03, ctx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.65);
      });
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const playPerfectPrediction = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(masterGain);
      sweep.frequency.setValueAtTime(300, ctx.currentTime);
      sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      sweep.type = "sawtooth";
      sweepGain.gain.setValueAtTime(0.15, ctx.currentTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      sweep.start(ctx.currentTime);
      sweep.stop(ctx.currentTime + 0.35);
      for (let i = 0; i < 6; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        sparkle.frequency.setValueAtTime(2000 + i * 350, ctx.currentTime + 0.2 + i * 0.04);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.2 + i * 0.04);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2 + i * 0.04 + 0.1);
        sparkle.start(ctx.currentTime + 0.2 + i * 0.04);
        sparkle.stop(ctx.currentTime + 0.2 + i * 0.04 + 0.12);
      }
      const fanfareNotes = [523.25, 659.25, 783.99, 1046.50];
      fanfareNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.5 + i * 0.08);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.5 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.08 + 0.3);
        osc.start(ctx.currentTime + 0.5 + i * 0.08);
        osc.stop(ctx.currentTime + 0.5 + i * 0.08 + 0.35);
      });
      setTimeout(() => {
        try {
          const stinger = ctx.createOscillator();
          const stingerGain = ctx.createGain();
          stinger.connect(stingerGain);
          stingerGain.connect(masterGain);
          stinger.frequency.setValueAtTime(1568, ctx.currentTime);
          stinger.type = "sine";
          stingerGain.gain.setValueAtTime(0.25, ctx.currentTime);
          stingerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          stinger.start(ctx.currentTime);
          stinger.stop(ctx.currentTime + 0.45);
        } catch (e) {}
      }, 900);
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const playGoalAchieved = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const hornNotes = [
        { freq: 392, delay: 0 },
        { freq: 523.25, delay: 0.12 },
        { freq: 659.25, delay: 0.24 },
        { freq: 783.99, delay: 0.36 },
      ];
      hornNotes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.25);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      });
      for (let i = 0; i < 5; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        sparkle.frequency.setValueAtTime(1800 + i * 300, ctx.currentTime + 0.5 + i * 0.03);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.5 + i * 0.03);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.03 + 0.08);
        sparkle.start(ctx.currentTime + 0.5 + i * 0.03);
        sparkle.stop(ctx.currentTime + 0.5 + i * 0.03 + 0.1);
      }
      const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
      chordFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.7);
        osc.type = i === 0 ? "triangle" : "sine";
        gain.gain.setValueAtTime(0.15 - i * 0.02, ctx.currentTime + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime + 0.7);
        osc.stop(ctx.currentTime + 1.25);
      });
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const playAllGoalsCompleted = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(masterGain);
      sweep.frequency.setValueAtTime(150, ctx.currentTime);
      sweep.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
      sweep.type = "sawtooth";
      sweepGain.gain.setValueAtTime(0.15, ctx.currentTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      sweep.start(ctx.currentTime);
      sweep.stop(ctx.currentTime + 0.45);
      const fanfare = [
        { freq: 392, delay: 0.3, dur: 0.2 },
        { freq: 523.25, delay: 0.5, dur: 0.2 },
        { freq: 659.25, delay: 0.7, dur: 0.2 },
        { freq: 783.99, delay: 0.9, dur: 0.3 },
        { freq: 1046.50, delay: 1.1, dur: 0.5 },
      ];
      fanfare.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.03);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
      for (let i = 0; i < 10; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        sparkle.frequency.setValueAtTime(1800 + i * 200 + Math.random() * 200, ctx.currentTime + 0.8 + i * 0.06);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.06, ctx.currentTime + 0.8 + i * 0.06);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8 + i * 0.06 + 0.1);
        sparkle.start(ctx.currentTime + 0.8 + i * 0.06);
        sparkle.stop(ctx.currentTime + 0.8 + i * 0.06 + 0.12);
      }
      setTimeout(() => {
        try {
          const finalChord = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
          finalChord.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = i < 2 ? "triangle" : "sine";
            gain.gain.setValueAtTime(0.12 - i * 0.015, ctx.currentTime);
            gain.gain.setValueAtTime(0.12 - i * 0.015, ctx.currentTime + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.85);
          });
        } catch (e) {}
      }, 1500);
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const playStreak = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.15);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.2);
      });
      for (let i = 0; i < 4; i++) {
        const crackle = ctx.createOscillator();
        const crackleGain = ctx.createGain();
        crackle.connect(crackleGain);
        crackleGain.connect(masterGain);
        crackle.frequency.setValueAtTime(2500 + Math.random() * 500, ctx.currentTime + 0.3 + i * 0.04);
        crackle.type = "sawtooth";
        crackleGain.gain.setValueAtTime(0.05, ctx.currentTime + 0.3 + i * 0.04);
        crackleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.04 + 0.05);
        crackle.start(ctx.currentTime + 0.3 + i * 0.04);
        crackle.stop(ctx.currentTime + 0.3 + i * 0.04 + 0.06);
      }
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  const playNotificationDing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.frequency.setValueAtTime(1175, ctx.currentTime + 0.1);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio not supported");
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  return {
    playHighAccuracy,
    playPerfectPrediction,
    playGoalAchieved,
    playAllGoalsCompleted,
    playStreak,
    playNotificationDing,
  };
};
