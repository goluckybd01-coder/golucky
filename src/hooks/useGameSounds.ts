import { useCallback, useRef, useEffect } from "react";
import AudioManager from "./useAudioManager";

// Web Audio API based sound effects with proper win/lose separation
export const useGameSounds = (soundEnabled: boolean = true, volume: number = 0.7) => {
  const audioManager = useRef(AudioManager.getInstance());
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());
  
  // Track last played sound to prevent double-play
  const lastSoundTradeIdRef = useRef<string | null>(null);

  // Update settings and cleanup on unmount
  useEffect(() => {
    audioManager.current.setEnabled(soundEnabled);
    audioManager.current.setVolume(volume);
  }, [soundEnabled, volume]);

  // Cleanup all sounds when component unmounts
  useEffect(() => {
    return () => {
      // Stop all tracked oscillators
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      activeOscillatorsRef.current.clear();
      
      // Cleanup audio manager
      audioManager.current.cleanup();
    };
  }, []);

  const getAudioContext = useCallback(() => {
    return audioManager.current.getContext();
  }, []);

  // Get master gain node for volume control
  const getMasterGain = useCallback(() => {
    return audioManager.current.getMasterGain();
  }, []);

  // Track oscillator for cleanup
  const trackOscillator = useCallback((osc: OscillatorNode) => {
    activeOscillatorsRef.current.add(osc);
    osc.onended = () => {
      activeOscillatorsRef.current.delete(osc);
    };
  }, []);

  // Stop all currently playing oscillators
  const stopAllSounds = useCallback(() => {
    activeOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    activeOscillatorsRef.current.clear();
    audioManager.current.cleanup();
  }, []);

  // Countdown tick sound
  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Warning tick (last 5 seconds) - higher pitch, more urgent
  const playWarningTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.05);
      oscillator.type = "square";

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, soundEnabled]);

  // Countdown beep - dramatic countdown sound for last 5 seconds
  const playCountdownBeep = useCallback((secondsLeft: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Higher pitch as we get closer to 0
      const baseFreq = secondsLeft <= 2 ? 1500 : secondsLeft <= 3 ? 1200 : 900;
      const duration = secondsLeft <= 2 ? 0.3 : 0.2;
      
      // Main beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.type = secondsLeft <= 2 ? "square" : "sine";
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + duration);
      
      // Second beep (harmonic) for urgency
      if (secondsLeft <= 3) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.05);
        osc2.start(ctx.currentTime + 0.05);
        osc2.stop(ctx.currentTime + duration + 0.1);
      }
      
      // Final dramatic beep at 1 second
      if (secondsLeft === 1) {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.frequency.setValueAtTime(2000, ctx.currentTime + 0.1);
        osc3.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
        osc3.type = "sawtooth";
        gain3.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc3.start(ctx.currentTime + 0.1);
        osc3.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Bet placed sound - coin drop / ding
  const playBetPlaced = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(1400, ctx.currentTime);
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);

      // Second tone (higher, delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.1);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, soundEnabled]);

  // Small Win sound - simple cheerful ding (for wins < 500)
  const playSmallWin = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Simple cheerful two-tone ding
      const notes = [880, 1175]; // A5, D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
      
      // Light sparkle
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.frequency.setValueAtTime(2400, ctx.currentTime + 0.25);
      sparkle.type = "sine";
      sparkleGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.25);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      sparkle.start(ctx.currentTime + 0.25);
      sparkle.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, [getAudioContext, soundEnabled]);

  // Medium Win sound - quick celebration (for wins 500-5000) - MAX 1s
  const playMediumWin = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Quick sparkle shimmer
      for (let i = 0; i < 3; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkle.frequency.setValueAtTime(1800 + i * 350, ctx.currentTime + i * 0.03);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.03);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.03 + 0.08);
        sparkle.start(ctx.currentTime + i * 0.03);
        sparkle.stop(ctx.currentTime + i * 0.03 + 0.08);
      }

      // Quick rising arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.1 + i * 0.06);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.1 + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1 + i * 0.06 + 0.2);
        osc.start(ctx.currentTime + 0.1 + i * 0.06);
        osc.stop(ctx.currentTime + 0.1 + i * 0.06 + 0.25);
      });

      // Quick coin cha-ching
      setTimeout(() => {
        try {
          const coinFreqs = [1600, 2000];
          coinFreqs.forEach((freq, i) => {
            const coin = ctx.createOscillator();
            const coinGain = ctx.createGain();
            coin.connect(coinGain);
            coinGain.connect(ctx.destination);
            coin.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
            coin.type = "sine";
            coinGain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05);
            coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.08);
            coin.start(ctx.currentTime + i * 0.05);
            coin.stop(ctx.currentTime + i * 0.05 + 0.08);
          });
        } catch (e) {}
      }, 400);
    } catch (e) {}
  }, [getAudioContext, soundEnabled]);

  // BIG Win / Jackpot sound - Quick celebration (for wins > 5000) - MAX 1.5s
  const playBigWin = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Quick rising sweep
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweep.frequency.setValueAtTime(400, ctx.currentTime);
      sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      sweep.type = "sawtooth";
      sweepGain.gain.setValueAtTime(0.15, ctx.currentTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      sweep.start(ctx.currentTime);
      sweep.stop(ctx.currentTime + 0.2);

      // Quick sparkle burst
      for (let i = 0; i < 4; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkle.frequency.setValueAtTime(2000 + i * 400, ctx.currentTime + 0.15 + i * 0.03);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.15 + i * 0.03);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15 + i * 0.03 + 0.08);
        sparkle.start(ctx.currentTime + 0.15 + i * 0.03);
        sparkle.stop(ctx.currentTime + 0.15 + i * 0.03 + 0.08);
      }

      // Quick fanfare - major chord
      const fanfareNotes = [523.25, 659.25, 783.99, 1046.50]; // C major
      fanfareNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.3 + i * 0.05);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3 + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.05 + 0.25);
        osc.start(ctx.currentTime + 0.3 + i * 0.05);
        osc.stop(ctx.currentTime + 0.3 + i * 0.05 + 0.3);
      });

      // Quick coin sounds
      setTimeout(() => {
        try {
          for (let i = 0; i < 4; i++) {
            const coin = ctx.createOscillator();
            const coinGain = ctx.createGain();
            coin.connect(coinGain);
            coinGain.connect(ctx.destination);
            coin.frequency.setValueAtTime(1500 + Math.random() * 800, ctx.currentTime + i * 0.05);
            coin.type = "sine";
            coinGain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
            coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.08);
            coin.start(ctx.currentTime + i * 0.05);
            coin.stop(ctx.currentTime + i * 0.05 + 0.08);
          }
        } catch (e) {}
      }, 600);

    } catch (e) {}
  }, [getAudioContext, soundEnabled]);

  // EPIC Jackpot sound - Grand celebration for Big Win Modal (~2.5s)
  const playEpicJackpot = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // ===== PHASE 1: Epic rising sweep (0-0.4s) =====
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(masterGain);
      sweep.frequency.setValueAtTime(200, ctx.currentTime);
      sweep.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.4);
      sweep.type = "sawtooth";
      sweepGain.gain.setValueAtTime(0.2, ctx.currentTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      sweep.start(ctx.currentTime);
      sweep.stop(ctx.currentTime + 0.4);

      // ===== PHASE 2: Victory horns fanfare (0.3-1.2s) =====
      const hornNotes = [
        { freq: 523.25, delay: 0.3 },   // C5
        { freq: 659.25, delay: 0.45 },  // E5
        { freq: 783.99, delay: 0.6 },   // G5
        { freq: 1046.50, delay: 0.75 }, // C6
        { freq: 1318.51, delay: 0.9 },  // E6
      ];
      
      hornNotes.forEach(({ freq, delay }) => {
        const horn = ctx.createOscillator();
        const hornGain = ctx.createGain();
        horn.connect(hornGain);
        hornGain.connect(masterGain);
        horn.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        horn.type = "sine";
        hornGain.gain.setValueAtTime(0, ctx.currentTime + delay);
        hornGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.05);
        hornGain.gain.setValueAtTime(0.25, ctx.currentTime + delay + 0.15);
        hornGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.35);
        horn.start(ctx.currentTime + delay);
        horn.stop(ctx.currentTime + delay + 0.4);
      });

      // ===== PHASE 3: Sparkle cascade (0.5-1.5s) =====
      for (let i = 0; i < 8; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        const baseFreq = 2000 + i * 300 + Math.random() * 200;
        sparkle.frequency.setValueAtTime(baseFreq, ctx.currentTime + 0.5 + i * 0.08);
        sparkle.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + 0.5 + i * 0.08 + 0.12);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.5 + i * 0.08);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.08 + 0.12);
        sparkle.start(ctx.currentTime + 0.5 + i * 0.08);
        sparkle.stop(ctx.currentTime + 0.5 + i * 0.08 + 0.15);
      }

      // ===== PHASE 4: Coin shower (1.0-2.0s) =====
      setTimeout(() => {
        try {
          for (let i = 0; i < 10; i++) {
            const coin = ctx.createOscillator();
            const coinGain = ctx.createGain();
            coin.connect(coinGain);
            coinGain.connect(masterGain);
            const coinFreq = 1400 + Math.random() * 1000;
            coin.frequency.setValueAtTime(coinFreq, ctx.currentTime + i * 0.08);
            coin.type = "sine";
            coinGain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
            coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.1);
            coin.start(ctx.currentTime + i * 0.08);
            coin.stop(ctx.currentTime + i * 0.08 + 0.12);
          }
        } catch (e) {}
      }, 1000);

      // ===== PHASE 5: Grand finale chord (1.5-2.5s) =====
      setTimeout(() => {
        try {
          // Major 7th chord - rich and triumphant
          const chordFreqs = [261.63, 329.63, 392, 493.88, 523.25]; // C4, E4, G4, B4, C5
          chordFreqs.forEach((freq, i) => {
            const note = ctx.createOscillator();
            const noteGain = ctx.createGain();
            note.connect(noteGain);
            noteGain.connect(masterGain);
            note.frequency.setValueAtTime(freq, ctx.currentTime);
            note.type = i === 0 ? "triangle" : "sine";
            noteGain.gain.setValueAtTime(0.15 - i * 0.02, ctx.currentTime);
            noteGain.gain.setValueAtTime(0.15 - i * 0.02, ctx.currentTime + 0.5);
            noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
            note.start(ctx.currentTime);
            note.stop(ctx.currentTime + 1.0);
          });

          // Final shimmer
          for (let i = 0; i < 5; i++) {
            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            shimmer.connect(shimmerGain);
            shimmerGain.connect(masterGain);
            shimmer.frequency.setValueAtTime(2500 + i * 200, ctx.currentTime + 0.3 + i * 0.05);
            shimmer.type = "sine";
            shimmerGain.gain.setValueAtTime(0.06, ctx.currentTime + 0.3 + i * 0.05);
            shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.05 + 0.15);
            shimmer.start(ctx.currentTime + 0.3 + i * 0.05);
            shimmer.stop(ctx.currentTime + 0.3 + i * 0.05 + 0.2);
          }
        } catch (e) {}
      }, 1500);

    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Win sound - plays appropriate sound based on amount (fallback for generic win)
  const playWin = useCallback((amount?: number) => {
    if (!soundEnabled) return;
    
    if (amount !== undefined) {
      if (amount >= 5000) {
        playBigWin();
      } else if (amount >= 500) {
        playMediumWin();
      } else {
        playSmallWin();
      }
    } else {
      // Default to medium win if no amount specified
      playMediumWin();
    }
  }, [soundEnabled, playSmallWin, playMediumWin, playBigWin]);

  // Lose sound - descending sad tones (plays ONLY for lose)
  const playLose = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const notes = [392, 349.23, 329.63, 293.66]; // G4, F4, E4, D4 - descending
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
        osc.type = "triangle";
        
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.35);
        
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.35);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, soundEnabled]);

  // Play result sound with anti-double-play guard
  const playResultSound = useCallback((isWin: boolean, tradeId: string, winAmount?: number) => {
    if (!soundEnabled) return;
    
    // Anti-double-play: check if already played for this trade
    if (tradeId === lastSoundTradeIdRef.current) {
      return; // Already played sound for this trade
    }
    
    // Mark as played
    lastSoundTradeIdRef.current = tradeId;
    
    // Play appropriate sound (only one, never both)
    if (isWin) {
      playWin(winAmount);
    } else {
      playLose();
    }
  }, [soundEnabled, playWin, playLose]);

  // Reset sound guard (call when switching game types)
  const resetSoundGuard = useCallback(() => {
    lastSoundTradeIdRef.current = null;
  }, []);

  // Round end gong/bell
  const playRoundEnd = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Main bell tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.type = "sine";
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);

      // Harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.type = "sine";
      
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, soundEnabled]);

  // Confetti burst celebration - firework pop + sparkle shower
  const playConfettiBurst = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Initial "pop" burst - white noise burst
      const bufferSize = ctx.sampleRate * 0.15;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(3000, ctx.currentTime);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      
      // Sparkle shower - cascading high-pitched tones
      const sparkleDelays = [0.1, 0.15, 0.22, 0.3, 0.4, 0.5, 0.65, 0.8, 1.0, 1.2];
      const sparkleFreqs = [3000, 3500, 2800, 3200, 2600, 3800, 2900, 3400, 2700, 3100];
      
      sparkleDelays.forEach((delay, i) => {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        sparkle.frequency.setValueAtTime(sparkleFreqs[i], ctx.currentTime + delay);
        sparkle.type = "sine";
        
        sparkleGain.gain.setValueAtTime(0, ctx.currentTime + delay);
        sparkleGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.02);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        
        sparkle.start(ctx.currentTime + delay);
        sparkle.stop(ctx.currentTime + delay + 0.15);
      });
      
      // Celebration chime cascade
      const chimeNotes = [1047, 1175, 1319, 1397, 1568]; // C6, D6, E6, F6, G6
      chimeNotes.forEach((freq, i) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        
        const startTime = ctx.currentTime + 0.05 + i * 0.08;
        chime.frequency.setValueAtTime(freq, startTime);
        chime.type = "sine";
        
        chimeGain.gain.setValueAtTime(0.2, startTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        chime.start(startTime);
        chime.stop(startTime + 0.35);
      });
      
      // Final shimmer wave
      setTimeout(() => {
        try {
          const shimmerFreqs = [2000, 2500, 3000, 3500, 4000];
          shimmerFreqs.forEach((freq, i) => {
            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            
            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);
            
            shimmer.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.03);
            shimmer.type = "sine";
            
            shimmerGain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.03);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.03 + 0.4);
            
            shimmer.start(ctx.currentTime + i * 0.03);
            shimmer.stop(ctx.currentTime + i * 0.03 + 0.45);
          });
        } catch (e) {}
      }, 600);
      
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, soundEnabled]);

  // Drum Roll - suspenseful build-up sound for result reveal
  const playDrumRoll = useCallback((duration: number = 1800) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      const durationSec = duration / 1000;
      
      // Create noise buffer for snare-like drum sound
      const bufferSize = ctx.sampleRate * durationSec;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Generate drum roll pattern with increasing intensity
      const rollSpeed = 40; // Hits per second
      const hitDuration = 0.015; // Duration of each hit in seconds
      
      for (let i = 0; i < bufferSize; i++) {
        const time = i / ctx.sampleRate;
        const progress = time / durationSec;
        
        // Increase speed and intensity as we progress
        const currentRollSpeed = rollSpeed + progress * 60;
        const hitPosition = (time * currentRollSpeed) % 1;
        
        // Create drum hit envelope
        if (hitPosition < hitDuration * currentRollSpeed) {
          const envelope = 1 - (hitPosition / (hitDuration * currentRollSpeed));
          const intensity = 0.3 + progress * 0.5;
          output[i] = (Math.random() * 2 - 1) * envelope * intensity;
        } else {
          output[i] = 0;
        }
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // Low-pass filter for more drum-like sound
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + durationSec);
      
      // Gain envelope - crescendo effect
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.45, ctx.currentTime + durationSec * 0.8);
      gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + durationSec);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + durationSec);
      
      // Add timpani-like low hits for drama
      const timpaniHits = [0, 0.3, 0.5, 0.65, 0.78, 0.88, 0.95];
      timpaniHits.forEach((hitProgress) => {
        const hitTime = ctx.currentTime + hitProgress * durationSec;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        // Lower frequency as we build tension
        const baseFreq = 80 + hitProgress * 40;
        osc.frequency.setValueAtTime(baseFreq, hitTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, hitTime + 0.15);
        osc.type = "sine";
        
        const hitIntensity = 0.15 + hitProgress * 0.2;
        oscGain.gain.setValueAtTime(hitIntensity, hitTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, hitTime + 0.2);
        
        osc.start(hitTime);
        osc.stop(hitTime + 0.25);
      });
      
      // Rising tension synth
      const tensionOsc = ctx.createOscillator();
      const tensionGain = ctx.createGain();
      tensionOsc.connect(tensionGain);
      tensionGain.connect(masterGain);
      
      tensionOsc.frequency.setValueAtTime(150, ctx.currentTime);
      tensionOsc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + durationSec);
      tensionOsc.type = "sawtooth";
      
      tensionGain.gain.setValueAtTime(0, ctx.currentTime);
      tensionGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + durationSec * 0.5);
      tensionGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + durationSec);
      
      tensionOsc.start(ctx.currentTime);
      tensionOsc.stop(ctx.currentTime + durationSec);
      
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Reveal Climax - dramatic reveal moment sound
  const playRevealClimax = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Big impact hit
      const impactBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const impactOutput = impactBuffer.getChannelData(0);
      for (let i = 0; i < impactOutput.length; i++) {
        const t = i / ctx.sampleRate;
        impactOutput[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15);
      }
      
      const impact = ctx.createBufferSource();
      impact.buffer = impactBuffer;
      
      const impactFilter = ctx.createBiquadFilter();
      impactFilter.type = "lowpass";
      impactFilter.frequency.setValueAtTime(500, ctx.currentTime);
      
      const impactGain = ctx.createGain();
      impactGain.gain.setValueAtTime(0.6, ctx.currentTime);
      
      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(masterGain);
      impact.start(ctx.currentTime);
      
      // Cymbal crash
      const crashBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const crashOutput = crashBuffer.getChannelData(0);
      for (let i = 0; i < crashOutput.length; i++) {
        const t = i / ctx.sampleRate;
        crashOutput[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4);
      }
      
      const crash = ctx.createBufferSource();
      crash.buffer = crashBuffer;
      
      const crashFilter = ctx.createBiquadFilter();
      crashFilter.type = "highpass";
      crashFilter.frequency.setValueAtTime(4000, ctx.currentTime);
      
      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.35, ctx.currentTime);
      crashGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      crash.connect(crashFilter);
      crashFilter.connect(crashGain);
      crashGain.connect(masterGain);
      crash.start(ctx.currentTime);
      
      // Dramatic chord burst
      const chordNotes = [261.63, 329.63, 392, 523.25]; // C major chord
      chordNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = "sine";
        
        oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
      });
      
      // Sparkle flourish
      for (let i = 0; i < 6; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        
        const startTime = ctx.currentTime + 0.05 + i * 0.04;
        sparkle.frequency.setValueAtTime(2000 + i * 400, startTime);
        sparkle.type = "sine";
        
        sparkleGain.gain.setValueAtTime(0.12, startTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        sparkle.start(startTime);
        sparkle.stop(startTime + 0.2);
      }
      
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Win Fanfare - triumphant victory sound
  const playWinFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Triumphant brass-like fanfare
      const fanfarePattern = [
        { freq: 523.25, time: 0, duration: 0.15 },      // C5
        { freq: 659.25, time: 0.12, duration: 0.15 },   // E5
        { freq: 783.99, time: 0.24, duration: 0.15 },   // G5
        { freq: 1046.50, time: 0.36, duration: 0.4 },   // C6 (hold)
        { freq: 1318.51, time: 0.5, duration: 0.5 },    // E6 (climax)
      ];
      
      fanfarePattern.forEach(({ freq, time, duration }) => {
        // Main tone
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        const startTime = ctx.currentTime + time;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = "sawtooth";
        
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        oscGain.gain.setValueAtTime(0.2, startTime + duration - 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        
        // Harmonic
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        
        harm.connect(harmGain);
        harmGain.connect(masterGain);
        
        harm.frequency.setValueAtTime(freq * 2, startTime);
        harm.type = "sine";
        
        harmGain.gain.setValueAtTime(0, startTime);
        harmGain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        harmGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        harm.start(startTime);
        harm.stop(startTime + duration + 0.05);
      });
      
      // Victory sparkles
      for (let i = 0; i < 10; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        
        const startTime = ctx.currentTime + 0.7 + i * 0.06;
        sparkle.frequency.setValueAtTime(2500 + Math.random() * 1500, startTime);
        sparkle.type = "sine";
        
        sparkleGain.gain.setValueAtTime(0.1, startTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        sparkle.start(startTime);
        sparkle.stop(startTime + 0.15);
      }
      
      // Coin shower
      setTimeout(() => {
        try {
          for (let i = 0; i < 8; i++) {
            const coin = ctx.createOscillator();
            const coinGain = ctx.createGain();
            
            coin.connect(coinGain);
            coinGain.connect(masterGain);
            
            coin.frequency.setValueAtTime(1800 + Math.random() * 1200, ctx.currentTime + i * 0.08);
            coin.type = "sine";
            
            coinGain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
            coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.1);
            
            coin.start(ctx.currentTime + i * 0.08);
            coin.stop(ctx.currentTime + i * 0.08 + 0.12);
          }
        } catch (e) {}
      }, 1000);
      
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Slot machine spin start sound - mechanical whirring
  const playSlotSpinStart = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Rising whir/whoosh sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
      osc.type = "sawtooth";
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      
      // Mechanical click sounds
      for (let i = 0; i < 5; i++) {
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.connect(clickGain);
        clickGain.connect(masterGain);
        
        click.frequency.setValueAtTime(1200 + i * 100, ctx.currentTime + i * 0.05);
        click.type = "square";
        
        clickGain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
        clickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.03);
        
        click.start(ctx.currentTime + i * 0.05);
        click.stop(ctx.currentTime + i * 0.05 + 0.03);
      }
      
      // Lever pull sound
      const lever = ctx.createOscillator();
      const leverGain = ctx.createGain();
      lever.connect(leverGain);
      leverGain.connect(masterGain);
      
      lever.frequency.setValueAtTime(600, ctx.currentTime);
      lever.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
      lever.type = "triangle";
      
      leverGain.gain.setValueAtTime(0.2, ctx.currentTime);
      leverGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      lever.start(ctx.currentTime);
      lever.stop(ctx.currentTime + 0.2);
      
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Slot machine spin tick - continuous clicking while spinning
  const playSlotTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      const tick = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tick.connect(tickGain);
      tickGain.connect(masterGain);
      
      tick.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      tick.type = "square";
      
      tickGain.gain.setValueAtTime(0.06, ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);
      
      tick.start(ctx.currentTime);
      tick.stop(ctx.currentTime + 0.02);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Slot machine reel stop sound - satisfying lock-in click
  const playSlotReelStop = useCallback((reelIndex: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Heavy click/clunk
      const clunk = ctx.createOscillator();
      const clunkGain = ctx.createGain();
      clunk.connect(clunkGain);
      clunkGain.connect(masterGain);
      
      clunk.frequency.setValueAtTime(200 - reelIndex * 15, ctx.currentTime);
      clunk.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      clunk.type = "triangle";
      
      clunkGain.gain.setValueAtTime(0.3, ctx.currentTime);
      clunkGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      clunk.start(ctx.currentTime);
      clunk.stop(ctx.currentTime + 0.12);
      
      // Metallic ding
      const ding = ctx.createOscillator();
      const dingGain = ctx.createGain();
      ding.connect(dingGain);
      dingGain.connect(masterGain);
      
      ding.frequency.setValueAtTime(1000 + reelIndex * 150, ctx.currentTime + 0.02);
      ding.type = "sine";
      
      dingGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.02);
      dingGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      ding.start(ctx.currentTime + 0.02);
      ding.stop(ctx.currentTime + 0.15);
      
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // All reels stopped - final flourish
  const playSlotSpinComplete = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Final lock sound
      const lock = ctx.createOscillator();
      const lockGain = ctx.createGain();
      lock.connect(lockGain);
      lockGain.connect(masterGain);
      
      lock.frequency.setValueAtTime(150, ctx.currentTime);
      lock.type = "triangle";
      
      lockGain.gain.setValueAtTime(0.25, ctx.currentTime);
      lockGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      lock.start(ctx.currentTime);
      lock.stop(ctx.currentTime + 0.2);
      
      // Subtle chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.connect(chimeGain);
      chimeGain.connect(masterGain);
      
      chime.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      chime.type = "sine";
      
      chimeGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      chime.start(ctx.currentTime + 0.1);
      chime.stop(ctx.currentTime + 0.3);
      
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  return {
    playTick,
    playWarningTick,
    playCountdownBeep,
    playBetPlaced,
    playSmallWin,
    playMediumWin,
    playBigWin,
    playEpicJackpot,
    playWin,
    playLose,
    playResultSound,
    resetSoundGuard,
    playRoundEnd,
    playConfettiBurst,
    playDrumRoll,
    playRevealClimax,
    playWinFanfare,
    playSlotSpinStart,
    playSlotTick,
    playSlotReelStop,
    playSlotSpinComplete,
  };
};
