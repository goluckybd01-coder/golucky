import { useCallback, useEffect, useRef } from 'react';
import { useAudioManager, triggerHaptic } from './useAudioManager';

// Premium Game Sounds - High quality Web Audio sounds with proper cleanup
export const usePremiumGameSounds = (soundEnabled: boolean = true, volume: number = 0.7) => {
  const audioManager = useAudioManager();
  const lastSoundTradeIdRef = useRef<string | null>(null);

  // Update settings when props change
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
    audioManager.setVolume(volume);
  }, [soundEnabled, volume, audioManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManager.stopAllSounds();
    };
  }, [audioManager]);

  // ================== COUNTDOWN SOUNDS ==================
  
  // Premium countdown tick - musical and satisfying
  const playCountdownTick = useCallback((secondsLeft: number) => {
    if (!audioManager.isEnabled()) return;
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Musical notes based on countdown (pentatonic scale for pleasant sound)
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880]; // C5, D5, E5, G5, A5
      const noteIndex = Math.min(Math.max(5 - secondsLeft, 0), 4);
      const baseFreq = pentatonic[noteIndex];
      
      // Increase urgency and volume as countdown progresses
      const urgencyMultiplier = 1 + (5 - secondsLeft) * 0.15;
      
      // Main tone - pure sine for clean sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25 * urgencyMultiplier, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.2);
      audioManager.trackOscillator(osc);
      
      // Harmonic overlay for richness (octave + fifth)
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonic.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(baseFreq * 2, now);
      
      harmonicGain.gain.setValueAtTime(0.08 * urgencyMultiplier, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      harmonic.start(now);
      harmonic.stop(now + 0.12);
      audioManager.trackOscillator(harmonic);
      
      // Last 2 seconds - add tension
      if (secondsLeft <= 2) {
        const tension = ctx.createOscillator();
        const tensionGain = ctx.createGain();
        tension.connect(tensionGain);
        tensionGain.connect(masterGain);
        
        tension.type = 'triangle';
        tension.frequency.setValueAtTime(baseFreq * 1.5, now + 0.05);
        
        tensionGain.gain.setValueAtTime(0.12, now + 0.05);
        tensionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        
        tension.start(now + 0.05);
        tension.stop(now + 0.2);
        audioManager.trackOscillator(tension);
        
        // Haptic feedback on urgent countdown
        triggerHaptic(20);
      }
    } catch {}
  }, [audioManager]);

  // ================== BET SOUNDS ==================
  
  // Premium bet placed - satisfying coin drop with confirmation
  const playBetPlaced = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic(15);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Coin drop - metallic ping
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.connect(pingGain);
      pingGain.connect(masterGain);
      
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1400, now);
      ping.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      
      pingGain.gain.setValueAtTime(0.25, now);
      pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      ping.start(now);
      ping.stop(now + 0.2);
      audioManager.trackOscillator(ping);
      
      // Confirmation chime - ascending
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.connect(chimeGain);
      chimeGain.connect(masterGain);
      
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1200, now + 0.08);
      chime.frequency.setValueAtTime(1600, now + 0.12);
      
      chimeGain.gain.setValueAtTime(0.18, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      chime.start(now + 0.08);
      chime.stop(now + 0.28);
      audioManager.trackOscillator(chime);
      
      // Subtle sparkle
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.connect(sparkleGain);
      sparkleGain.connect(masterGain);
      
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(2400, now + 0.15);
      
      sparkleGain.gain.setValueAtTime(0.08, now + 0.15);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      
      sparkle.start(now + 0.15);
      sparkle.stop(now + 0.25);
      audioManager.trackOscillator(sparkle);
    } catch {}
  }, [audioManager]);

  // ================== WIN SOUNDS ==================
  
  // Small win - cheerful ding
  const playSmallWin = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic([20, 40, 20]);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Victory notes C-E (major third)
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
        audioManager.trackOscillator(osc);
      });
      
      // Sparkle
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.connect(sparkleGain);
      sparkleGain.connect(masterGain);
      
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(2200, now + 0.2);
      
      sparkleGain.gain.setValueAtTime(0.12, now + 0.2);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      sparkle.start(now + 0.2);
      sparkle.stop(now + 0.4);
      audioManager.trackOscillator(sparkle);
    } catch {}
  }, [audioManager]);

  // Medium win - celebratory arpeggio
  const playMediumWin = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic([30, 50, 30, 50, 30]);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // C major arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        
        gain.gain.setValueAtTime(0, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.35);
        
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.4);
        audioManager.trackOscillator(osc);
      });
      
      // Coin sounds
      for (let i = 0; i < 4; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coin.connect(coinGain);
        coinGain.connect(masterGain);
        
        coin.type = 'sine';
        coin.frequency.setValueAtTime(1800 + Math.random() * 600, now + 0.35 + i * 0.06);
        
        coinGain.gain.setValueAtTime(0.1, now + 0.35 + i * 0.06);
        coinGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35 + i * 0.06 + 0.08);
        
        coin.start(now + 0.35 + i * 0.06);
        coin.stop(now + 0.35 + i * 0.06 + 0.1);
        audioManager.trackOscillator(coin);
      }
    } catch {}
  }, [audioManager]);

  // Big win - epic fanfare
  const playBigWin = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic([50, 40, 50, 40, 100, 30, 50]);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Rising sweep
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(masterGain);
      
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(200, now);
      sweep.frequency.exponentialRampToValueAtTime(1000, now + 0.25);
      
      sweepGain.gain.setValueAtTime(0.15, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      sweep.start(now);
      sweep.stop(now + 0.3);
      audioManager.trackOscillator(sweep);
      
      // Sparkle cascade
      for (let i = 0; i < 6; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        
        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(2000 + i * 350, now + 0.2 + i * 0.04);
        
        sparkleGain.gain.setValueAtTime(0.1, now + 0.2 + i * 0.04);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2 + i * 0.04 + 0.1);
        
        sparkle.start(now + 0.2 + i * 0.04);
        sparkle.stop(now + 0.2 + i * 0.04 + 0.12);
        audioManager.trackOscillator(sparkle);
      }
      
      // Victory chord
      const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major with extensions
      chordNotes.forEach((freq, i) => {
        const note = ctx.createOscillator();
        const noteGain = ctx.createGain();
        note.connect(noteGain);
        noteGain.connect(masterGain);
        
        note.type = i === 0 ? 'triangle' : 'sine';
        note.frequency.setValueAtTime(freq, now + 0.4 + i * 0.04);
        
        noteGain.gain.setValueAtTime(0, now + 0.4 + i * 0.04);
        noteGain.gain.linearRampToValueAtTime(0.18 - i * 0.02, now + 0.4 + i * 0.04 + 0.02);
        noteGain.gain.setValueAtTime(0.18 - i * 0.02, now + 0.6);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        
        note.start(now + 0.4 + i * 0.04);
        note.stop(now + 1.3);
        audioManager.trackOscillator(note);
      });
      
      // Coin shower
      for (let i = 0; i < 8; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coin.connect(coinGain);
        coinGain.connect(masterGain);
        
        coin.type = 'sine';
        coin.frequency.setValueAtTime(1500 + Math.random() * 1000, now + 0.8 + i * 0.07);
        
        coinGain.gain.setValueAtTime(0.08, now + 0.8 + i * 0.07);
        coinGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8 + i * 0.07 + 0.1);
        
        coin.start(now + 0.8 + i * 0.07);
        coin.stop(now + 0.8 + i * 0.07 + 0.12);
        audioManager.trackOscillator(coin);
      }
    } catch {}
  }, [audioManager]);

  // Epic Jackpot - grand celebration
  const playEpicJackpot = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic([100, 50, 100, 50, 100, 50, 150, 30, 80, 30, 80]);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Epic rising sweep
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.connect(sweepGain);
      sweepGain.connect(masterGain);
      
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(100, now);
      sweep.frequency.exponentialRampToValueAtTime(1500, now + 0.4);
      
      sweepGain.gain.setValueAtTime(0.2, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      sweep.start(now);
      sweep.stop(now + 0.45);
      audioManager.trackOscillator(sweep);
      
      // Fanfare horns
      const hornNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      hornNotes.forEach((freq, i) => {
        const horn = ctx.createOscillator();
        const hornGain = ctx.createGain();
        horn.connect(hornGain);
        hornGain.connect(masterGain);
        
        horn.type = 'sine';
        horn.frequency.setValueAtTime(freq, now + 0.3 + i * 0.12);
        
        hornGain.gain.setValueAtTime(0, now + 0.3 + i * 0.12);
        hornGain.gain.linearRampToValueAtTime(0.22, now + 0.3 + i * 0.12 + 0.03);
        hornGain.gain.setValueAtTime(0.22, now + 0.3 + i * 0.12 + 0.15);
        hornGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + i * 0.12 + 0.4);
        
        horn.start(now + 0.3 + i * 0.12);
        horn.stop(now + 0.3 + i * 0.12 + 0.45);
        audioManager.trackOscillator(horn);
      });
      
      // Sparkle cascade
      for (let i = 0; i < 10; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        
        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(2000 + i * 250 + Math.random() * 200, now + 0.6 + i * 0.06);
        
        sparkleGain.gain.setValueAtTime(0.08, now + 0.6 + i * 0.06);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6 + i * 0.06 + 0.1);
        
        sparkle.start(now + 0.6 + i * 0.06);
        sparkle.stop(now + 0.6 + i * 0.06 + 0.12);
        audioManager.trackOscillator(sparkle);
      }
      
      // Coin rain
      for (let i = 0; i < 15; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coin.connect(coinGain);
        coinGain.connect(masterGain);
        
        coin.type = 'sine';
        coin.frequency.setValueAtTime(1400 + Math.random() * 1000, now + 1.2 + i * 0.05);
        
        coinGain.gain.setValueAtTime(0.06, now + 1.2 + i * 0.05);
        coinGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2 + i * 0.05 + 0.08);
        
        coin.start(now + 1.2 + i * 0.05);
        coin.stop(now + 1.2 + i * 0.05 + 0.1);
        audioManager.trackOscillator(coin);
      }
      
      // Grand finale chord
      const finaleNotes = [261.63, 329.63, 392, 493.88, 523.25, 659.25];
      finaleNotes.forEach((freq, i) => {
        const note = ctx.createOscillator();
        const noteGain = ctx.createGain();
        note.connect(noteGain);
        noteGain.connect(masterGain);
        
        note.type = i === 0 ? 'triangle' : 'sine';
        note.frequency.setValueAtTime(freq, now + 1.8);
        
        noteGain.gain.setValueAtTime(0, now + 1.8);
        noteGain.gain.linearRampToValueAtTime(0.12 - i * 0.015, now + 1.85);
        noteGain.gain.setValueAtTime(0.12 - i * 0.015, now + 2.3);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
        
        note.start(now + 1.8);
        note.stop(now + 3.1);
        audioManager.trackOscillator(note);
      });
    } catch {}
  }, [audioManager]);

  // ================== LOSE SOUNDS ==================
  
  const playLose = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic([100, 50, 100]);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Descending sad tones
      const notes = [392, 329.63, 261.63]; // G4, E4, C4
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
        
        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.2 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
        
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.45);
        audioManager.trackOscillator(osc);
      });
      
      // Low rumble
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(80, now + 0.5);
      rumble.frequency.exponentialRampToValueAtTime(40, now + 0.9);
      
      rumbleGain.gain.setValueAtTime(0.15, now + 0.5);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      
      rumble.start(now + 0.5);
      rumble.stop(now + 1.0);
      audioManager.trackOscillator(rumble);
    } catch {}
  }, [audioManager]);

  // ================== RESULT SOUND ==================
  
  const playResultSound = useCallback((isWin: boolean, tradeId: string, winAmount?: number) => {
    // Prevent double-play for same trade
    if (tradeId === lastSoundTradeIdRef.current) return;
    lastSoundTradeIdRef.current = tradeId;
    
    if (isWin) {
      if (winAmount && winAmount >= 5000) {
        playBigWin();
      } else if (winAmount && winAmount >= 500) {
        playMediumWin();
      } else {
        playSmallWin();
      }
    } else {
      playLose();
    }
  }, [playBigWin, playMediumWin, playSmallWin, playLose]);

  const resetSoundGuard = useCallback(() => {
    lastSoundTradeIdRef.current = null;
  }, []);

  // ================== SPECIAL SOUNDS ==================
  
  // Drum roll for suspense
  const playDrumRoll = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Create drum hits with increasing tempo
      for (let i = 0; i < 20; i++) {
        const interval = 0.08 - (i * 0.003); // Accelerating
        const time = now + i * interval;
        
        const drum = ctx.createOscillator();
        const drumGain = ctx.createGain();
        drum.connect(drumGain);
        drumGain.connect(masterGain);
        
        drum.type = 'sine';
        drum.frequency.setValueAtTime(100, time);
        drum.frequency.exponentialRampToValueAtTime(60, time + 0.05);
        
        drumGain.gain.setValueAtTime(0.15 + i * 0.008, time);
        drumGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        drum.start(time);
        drum.stop(time + 0.06);
        audioManager.trackOscillator(drum);
      }
    } catch {}
  }, [audioManager]);

  // Round end sound
  const playRoundEnd = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Bell chime
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.connect(bellGain);
      bellGain.connect(masterGain);
      
      bell.type = 'sine';
      bell.frequency.setValueAtTime(880, now);
      
      bellGain.gain.setValueAtTime(0.3, now);
      bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      bell.start(now);
      bell.stop(now + 0.55);
      audioManager.trackOscillator(bell);
      
      // Harmonic
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonic.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(1760, now);
      
      harmonicGain.gain.setValueAtTime(0.15, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      harmonic.start(now);
      harmonic.stop(now + 0.35);
      audioManager.trackOscillator(harmonic);
    } catch {}
  }, [audioManager]);

  // Confetti burst
  const playConfettiBurst = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Pop sound
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.connect(popGain);
      popGain.connect(masterGain);
      
      pop.type = 'sine';
      pop.frequency.setValueAtTime(400, now);
      pop.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      
      popGain.gain.setValueAtTime(0.25, now);
      popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      pop.start(now);
      pop.stop(now + 0.12);
      audioManager.trackOscillator(pop);
      
      // Sparkle shower
      for (let i = 0; i < 8; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        
        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(2000 + Math.random() * 2000, now + 0.1 + i * 0.03);
        
        sparkleGain.gain.setValueAtTime(0.06, now + 0.1 + i * 0.03);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 + i * 0.03 + 0.08);
        
        sparkle.start(now + 0.1 + i * 0.03);
        sparkle.stop(now + 0.1 + i * 0.03 + 0.1);
        audioManager.trackOscillator(sparkle);
      }
    } catch {}
  }, [audioManager]);

  // Reveal climax
  const playRevealClimax = useCallback(() => {
    if (!audioManager.isEnabled()) return;
    triggerHaptic(50);
    
    try {
      const ctx = audioManager.getContext();
      const masterGain = audioManager.getMasterGain();
      const now = ctx.currentTime;
      
      // Impact
      const impact = ctx.createOscillator();
      const impactGain = ctx.createGain();
      impact.connect(impactGain);
      impactGain.connect(masterGain);
      
      impact.type = 'sine';
      impact.frequency.setValueAtTime(150, now);
      impact.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      
      impactGain.gain.setValueAtTime(0.3, now);
      impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      impact.start(now);
      impact.stop(now + 0.25);
      audioManager.trackOscillator(impact);
      
      // Reveal shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.connect(shimmerGain);
      shimmerGain.connect(masterGain);
      
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(1200, now + 0.1);
      shimmer.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
      
      shimmerGain.gain.setValueAtTime(0.15, now + 0.1);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      shimmer.start(now + 0.1);
      shimmer.stop(now + 0.45);
      audioManager.trackOscillator(shimmer);
    } catch {}
  }, [audioManager]);

  return {
    // Countdown
    playCountdownTick,
    playTick: playCountdownTick, // Alias
    playWarningTick: () => playCountdownTick(2),
    playCountdownBeep: playCountdownTick,
    
    // Bets
    playBetPlaced,
    
    // Wins
    playSmallWin,
    playMediumWin,
    playBigWin,
    playEpicJackpot,
    playWin: playSmallWin,
    playWinFanfare: playMediumWin,
    
    // Lose
    playLose,
    
    // Result
    playResultSound,
    resetSoundGuard,
    
    // Special
    playDrumRoll,
    playRoundEnd,
    playConfettiBurst,
    playRevealClimax,
    
    // Control
    stopAllSounds: audioManager.stopAllSounds,
  };
};

export default usePremiumGameSounds;
