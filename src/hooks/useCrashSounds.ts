import { useCallback, useRef, useEffect } from "react";
import AudioManager from "./useAudioManager";

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

// Web Audio API based sound effects for Crash Game
export const useCrashSounds = (soundEnabled: boolean = true, volume: number = 0.7) => {
  const audioManager = useRef(AudioManager.getInstance());
  const rocketLoopRef = useRef<OscillatorNode | null>(null);
  const rocketGainRef = useRef<GainNode | null>(null);
  const ignitionRoarRef = useRef<OscillatorNode[]>([]);
  const ignitionGainRef = useRef<GainNode | null>(null);
  const hapticEnabledRef = useRef(true);

  // Update settings
  useEffect(() => {
    audioManager.current.setEnabled(soundEnabled);
    audioManager.current.setVolume(volume);
  }, [soundEnabled, volume]);

  // Cleanup on unmount - CRITICAL for fixing the persistent sound issue
  useEffect(() => {
    return () => {
      // Stop rocket loop
      if (rocketLoopRef.current) {
        try { rocketLoopRef.current.stop(); } catch {}
        rocketLoopRef.current = null;
      }
      
      // Stop ignition roar
      ignitionRoarRef.current.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      ignitionRoarRef.current = [];
      ignitionGainRef.current = null;
      
      // Cleanup audio manager
      audioManager.current.cleanup();
    };
  }, []);

  const getAudioContext = useCallback(() => {
    return audioManager.current.getContext();
  }, []);

  const getMasterGain = useCallback(() => {
    return audioManager.current.getMasterGain();
  }, []);

  // Countdown tick - building tension
  const playCountdownTick = useCallback((secondsLeft: number, isLockingPhase: boolean = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Much more dramatic for locking phase
      if (isLockingPhase) {
        // Rising pitch based on time left (lower secondsLeft = higher pitch)
        const basePitch = 800 + (2 - Math.min(secondsLeft, 2)) * 600; // 800 -> 1400 -> 2000
        const volume = 0.25 + (2 - Math.min(secondsLeft, 2)) * 0.15; // Gets louder
        
        // Main tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(basePitch, ctx.currentTime);
        osc.type = "square";
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
        
        // Echo tick for urgency
        const echo = ctx.createOscillator();
        const echoGain = ctx.createGain();
        echo.connect(echoGain);
        echoGain.connect(masterGain);
        echo.frequency.setValueAtTime(basePitch * 1.25, ctx.currentTime + 0.06);
        echo.type = "sine";
        echoGain.gain.setValueAtTime(volume * 0.6, ctx.currentTime + 0.06);
        echoGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        echo.start(ctx.currentTime + 0.06);
        echo.stop(ctx.currentTime + 0.18);
        
        // Final second: rapid triple-tick burst
        if (secondsLeft <= 1) {
          for (let i = 0; i < 3; i++) {
            const rapidTick = ctx.createOscillator();
            const rapidGain = ctx.createGain();
            rapidTick.connect(rapidGain);
            rapidGain.connect(masterGain);
            rapidTick.frequency.setValueAtTime(1800 + i * 200, ctx.currentTime + 0.15 + i * 0.08);
            rapidTick.type = "square";
            rapidGain.gain.setValueAtTime(0.35, ctx.currentTime + 0.15 + i * 0.08);
            rapidGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15 + i * 0.08 + 0.06);
            rapidTick.start(ctx.currentTime + 0.15 + i * 0.08);
            rapidTick.stop(ctx.currentTime + 0.15 + i * 0.08 + 0.08);
          }
          
          // Warning alarm undertone
          const alarm = ctx.createOscillator();
          const alarmGain = ctx.createGain();
          alarm.connect(alarmGain);
          alarmGain.connect(masterGain);
          alarm.frequency.setValueAtTime(440, ctx.currentTime);
          alarm.frequency.setValueAtTime(520, ctx.currentTime + 0.15);
          alarm.frequency.setValueAtTime(440, ctx.currentTime + 0.3);
          alarm.type = "sawtooth";
          alarmGain.gain.setValueAtTime(0.08, ctx.currentTime);
          alarmGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          alarm.start(ctx.currentTime);
          alarm.stop(ctx.currentTime + 0.45);
        }
        
        return;
      }
      
      // Standard betting phase countdown (unchanged)
      const baseFreq = secondsLeft <= 2 ? 1400 : secondsLeft <= 3 ? 1100 : 800;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.type = secondsLeft <= 2 ? "square" : "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      
      // Extra urgency beep for last 2 seconds
      if (secondsLeft <= 2) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08);
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Bet placed - coin drop sound
  const playBetPlaced = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Coin drop
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(1400, ctx.currentTime);
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Confirmation ding
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.1);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Rocket launch - dramatic whoosh and engine ignition
  const playRocketLaunch = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Deep rumble start
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumble.frequency.setValueAtTime(60, ctx.currentTime);
      rumble.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
      rumble.type = "sawtooth";
      rumbleGain.gain.setValueAtTime(0.3, ctx.currentTime);
      rumbleGain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.3);
      rumble.start(ctx.currentTime);
      rumble.stop(ctx.currentTime + 0.4);

      // Rising whoosh
      const whoosh = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whoosh.connect(whooshGain);
      whooshGain.connect(masterGain);
      whoosh.frequency.setValueAtTime(200, ctx.currentTime);
      whoosh.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
      whoosh.type = "sawtooth";
      whooshGain.gain.setValueAtTime(0.2, ctx.currentTime);
      whooshGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      whoosh.start(ctx.currentTime);
      whoosh.stop(ctx.currentTime + 0.5);

      // Ignition burst
      const burst = ctx.createOscillator();
      const burstGain = ctx.createGain();
      burst.connect(burstGain);
      burstGain.connect(masterGain);
      burst.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      burst.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
      burst.type = "triangle";
      burstGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      burstGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      burst.start(ctx.currentTime + 0.1);
      burst.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Start continuous rocket engine loop
  const startRocketLoop = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Stop existing loop if any
      if (rocketLoopRef.current) {
        try { rocketLoopRef.current.stop(); } catch (e) {}
      }

      // Create engine hum
      const engine = ctx.createOscillator();
      const engineGain = ctx.createGain();
      engine.connect(engineGain);
      engineGain.connect(masterGain);
      engine.frequency.setValueAtTime(80, ctx.currentTime);
      engine.type = "sawtooth";
      engineGain.gain.setValueAtTime(0.08, ctx.currentTime);
      
      rocketLoopRef.current = engine;
      rocketGainRef.current = engineGain;
      engine.start(ctx.currentTime);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Start engine roar during ignition/locking phase - builds up intensity
  const startIgnitionRoar = useCallback(() => {
    // Rumble haptic pattern for ignition - intensifying vibration
    if (hapticEnabledRef.current) {
      triggerHaptic([50, 30, 60, 25, 70, 20, 80, 15, 90, 10, 100]);
    }

    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Stop existing ignition sounds
      stopIgnitionRoar();

      // Create master gain for ignition
      const ignitionMasterGain = ctx.createGain();
      ignitionMasterGain.connect(masterGain);
      ignitionMasterGain.gain.setValueAtTime(0.05, ctx.currentTime);
      // Build up over 2 seconds
      ignitionMasterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);
      ignitionGainRef.current = ignitionMasterGain;

      const oscillators: OscillatorNode[] = [];

      // Deep rumble base (low frequency)
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(ignitionMasterGain);
      rumble.frequency.setValueAtTime(35, ctx.currentTime);
      rumble.frequency.linearRampToValueAtTime(55, ctx.currentTime + 2);
      rumble.type = "sawtooth";
      rumbleGain.gain.setValueAtTime(0.6, ctx.currentTime);
      rumble.start(ctx.currentTime);
      oscillators.push(rumble);

      // Mid-range engine growl
      const growl = ctx.createOscillator();
      const growlGain = ctx.createGain();
      growl.connect(growlGain);
      growlGain.connect(ignitionMasterGain);
      growl.frequency.setValueAtTime(80, ctx.currentTime);
      growl.frequency.linearRampToValueAtTime(140, ctx.currentTime + 2);
      growl.type = "sawtooth";
      growlGain.gain.setValueAtTime(0.4, ctx.currentTime);
      growl.start(ctx.currentTime);
      oscillators.push(growl);

      // High-frequency hiss/roar
      const hiss = ctx.createOscillator();
      const hissGain = ctx.createGain();
      hiss.connect(hissGain);
      hissGain.connect(ignitionMasterGain);
      hiss.frequency.setValueAtTime(200, ctx.currentTime);
      hiss.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2);
      hiss.type = "sawtooth";
      hissGain.gain.setValueAtTime(0.15, ctx.currentTime);
      hissGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);
      hiss.start(ctx.currentTime);
      oscillators.push(hiss);

      // Crackling ignition sparks (intermittent high frequencies)
      const crackle = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      crackle.connect(crackleGain);
      crackleGain.connect(ignitionMasterGain);
      crackle.frequency.setValueAtTime(600, ctx.currentTime);
      crackle.type = "square";
      crackleGain.gain.setValueAtTime(0.08, ctx.currentTime);
      crackleGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
      crackle.start(ctx.currentTime);
      oscillators.push(crackle);

      // Turbine whine (builds up dramatically)
      const whine = ctx.createOscillator();
      const whineGain = ctx.createGain();
      whine.connect(whineGain);
      whineGain.connect(ignitionMasterGain);
      whine.frequency.setValueAtTime(300, ctx.currentTime);
      whine.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 2);
      whine.type = "sine";
      whineGain.gain.setValueAtTime(0.05, ctx.currentTime);
      whineGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2);
      whine.start(ctx.currentTime);
      oscillators.push(whine);

      ignitionRoarRef.current = oscillators;
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Stop engine ignition roar
  const stopIgnitionRoar = useCallback(() => {
    if (ignitionRoarRef.current.length > 0) {
      try {
        const ctx = getAudioContext();
        if (ignitionGainRef.current) {
          // Quick fade out
          ignitionGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        }
        setTimeout(() => {
          ignitionRoarRef.current.forEach(osc => {
            try { osc.stop(); } catch (e) {}
          });
          ignitionRoarRef.current = [];
          ignitionGainRef.current = null;
        }, 200);
      } catch (e) {}
    }
  }, [getAudioContext]);

  // Stop rocket engine loop
  const stopRocketLoop = useCallback(() => {
    if (rocketLoopRef.current) {
      try {
        if (rocketGainRef.current) {
          const ctx = getAudioContext();
          rocketGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        }
        setTimeout(() => {
          try { rocketLoopRef.current?.stop(); } catch (e) {}
          rocketLoopRef.current = null;
        }, 150);
      } catch (e) {}
    }
  }, [getAudioContext]);

  // Multiplier milestone - excitement ping
  const playMultiplierMilestone = useCallback((multiplier: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Higher pitch for higher multipliers
      const baseFreq = 600 + Math.min(multiplier * 100, 1000);
      
      // Excitement ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);

      // Harmonic sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.25);

      // Extra celebration for high multipliers
      if (multiplier >= 5) {
        for (let i = 0; i < 3; i++) {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.connect(sparkleGain);
          sparkleGain.connect(masterGain);
          sparkle.frequency.setValueAtTime(1800 + i * 400, ctx.currentTime + 0.1 + i * 0.04);
          sparkle.type = "sine";
          sparkleGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.1 + i * 0.04);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1 + i * 0.04 + 0.1);
          sparkle.start(ctx.currentTime + 0.1 + i * 0.04);
          sparkle.stop(ctx.currentTime + 0.1 + i * 0.04 + 0.15);
        }
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Cashout success - celebration sound
  const playCashout = useCallback((multiplier: number) => {
    // Celebratory pulse pattern for cashout win
    if (hapticEnabledRef.current) {
      triggerHaptic([30, 50, 30, 50, 30, 80, 50]);
    }

    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Stop rocket loop
      stopRocketLoop();

      // Coin sounds cascade
      for (let i = 0; i < 5; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coin.connect(coinGain);
        coinGain.connect(masterGain);
        coin.frequency.setValueAtTime(1400 + i * 200, ctx.currentTime + i * 0.06);
        coin.type = "sine";
        coinGain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.06);
        coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.15);
        coin.start(ctx.currentTime + i * 0.06);
        coin.stop(ctx.currentTime + i * 0.06 + 0.2);
      }

      // Victory fanfare
      const fanfareNotes = [523.25, 659.25, 783.99, 1046.50];
      fanfareNotes.forEach((freq, i) => {
        const note = ctx.createOscillator();
        const noteGain = ctx.createGain();
        note.connect(noteGain);
        noteGain.connect(masterGain);
        note.frequency.setValueAtTime(freq, ctx.currentTime + 0.3 + i * 0.08);
        note.type = "sine";
        noteGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3 + i * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.08 + 0.3);
        note.start(ctx.currentTime + 0.3 + i * 0.08);
        note.stop(ctx.currentTime + 0.3 + i * 0.08 + 0.35);
      });

      // Extra celebration for big multipliers
      if (multiplier >= 3) {
        // Sparkle cascade
        for (let i = 0; i < 6; i++) {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.connect(sparkleGain);
          sparkleGain.connect(masterGain);
          sparkle.frequency.setValueAtTime(2000 + i * 300, ctx.currentTime + 0.6 + i * 0.05);
          sparkle.type = "sine";
          sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.6 + i * 0.05);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6 + i * 0.05 + 0.12);
          sparkle.start(ctx.currentTime + 0.6 + i * 0.05);
          sparkle.stop(ctx.currentTime + 0.6 + i * 0.05 + 0.15);
        }
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, stopRocketLoop]);

  // Big win celebration - extra dramatic sound
  const playBigWin = useCallback((winAmount: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Epic rising chord
      const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C major
      chordFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.5);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.6);
      });

      // Coin shower
      for (let i = 0; i < 12; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coin.connect(coinGain);
        coinGain.connect(masterGain);
        coin.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime + 0.3 + i * 0.05);
        coin.type = "sine";
        coinGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.3 + i * 0.05);
        coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.05 + 0.1);
        coin.start(ctx.currentTime + 0.3 + i * 0.05);
        coin.stop(ctx.currentTime + 0.3 + i * 0.05 + 0.15);
      }

      // Victory fanfare finale
      const fanfare = [783.99, 987.77, 1174.66, 1567.98]; // G major high
      fanfare.forEach((freq, i) => {
        const note = ctx.createOscillator();
        const noteGain = ctx.createGain();
        note.connect(noteGain);
        noteGain.connect(masterGain);
        note.frequency.setValueAtTime(freq, ctx.currentTime + 0.8 + i * 0.1);
        note.type = "triangle";
        noteGain.gain.setValueAtTime(0.18, ctx.currentTime + 0.8 + i * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8 + i * 0.1 + 0.4);
        note.start(ctx.currentTime + 0.8 + i * 0.1);
        note.stop(ctx.currentTime + 0.8 + i * 0.1 + 0.5);
      });
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Jackpot sound - epic celebration
  const playJackpot = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Dramatic build-up
      const build = ctx.createOscillator();
      const buildGain = ctx.createGain();
      build.connect(buildGain);
      buildGain.connect(masterGain);
      build.frequency.setValueAtTime(200, ctx.currentTime);
      build.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      build.type = "sawtooth";
      buildGain.gain.setValueAtTime(0.2, ctx.currentTime);
      buildGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      build.start(ctx.currentTime);
      build.stop(ctx.currentTime + 0.4);

      // Explosion of sparkles
      for (let i = 0; i < 16; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(masterGain);
        sparkle.frequency.setValueAtTime(1500 + Math.random() * 1500, ctx.currentTime + 0.35 + i * 0.03);
        sparkle.type = "sine";
        sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.35 + i * 0.03);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35 + i * 0.03 + 0.08);
        sparkle.start(ctx.currentTime + 0.35 + i * 0.03);
        sparkle.stop(ctx.currentTime + 0.35 + i * 0.03 + 0.1);
      }

      // Epic chord progression
      const progression = [
        [523.25, 659.25, 783.99], // C major
        [587.33, 739.99, 880.00], // D major
        [659.25, 830.61, 987.77], // E major
        [783.99, 987.77, 1174.66], // G major
      ];
      
      progression.forEach((chord, chordIdx) => {
        chord.forEach((freq, noteIdx) => {
          const note = ctx.createOscillator();
          const noteGain = ctx.createGain();
          note.connect(noteGain);
          noteGain.connect(masterGain);
          note.frequency.setValueAtTime(freq, ctx.currentTime + 0.6 + chordIdx * 0.15 + noteIdx * 0.02);
          note.type = "sine";
          noteGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.6 + chordIdx * 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6 + chordIdx * 0.15 + 0.3);
          note.start(ctx.currentTime + 0.6 + chordIdx * 0.15 + noteIdx * 0.02);
          note.stop(ctx.currentTime + 0.6 + chordIdx * 0.15 + 0.35);
        });
      });

      // Final triumphant note
      const finale = ctx.createOscillator();
      const finaleGain = ctx.createGain();
      finale.connect(finaleGain);
      finaleGain.connect(masterGain);
      finale.frequency.setValueAtTime(1046.50, ctx.currentTime + 1.3); // High C
      finale.type = "sine";
      finaleGain.gain.setValueAtTime(0.25, ctx.currentTime + 1.3);
      finaleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);
      finale.start(ctx.currentTime + 1.3);
      finale.stop(ctx.currentTime + 2);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Custom milestone alert
  const playMilestoneAlert = useCallback((multiplier: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Alert ping
      const freq = 800 + Math.min(multiplier * 50, 400);
      
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.connect(pingGain);
      pingGain.connect(masterGain);
      ping.frequency.setValueAtTime(freq, ctx.currentTime);
      ping.type = "sine";
      pingGain.gain.setValueAtTime(0.3, ctx.currentTime);
      pingGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      ping.start(ctx.currentTime);
      ping.stop(ctx.currentTime + 0.2);

      // Echo
      const echo = ctx.createOscillator();
      const echoGain = ctx.createGain();
      echo.connect(echoGain);
      echoGain.connect(masterGain);
      echo.frequency.setValueAtTime(freq * 1.5, ctx.currentTime + 0.08);
      echo.type = "sine";
      echoGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
      echoGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      echo.start(ctx.currentTime + 0.08);
      echo.stop(ctx.currentTime + 0.25);

      // Triple sparkle for high milestones
      if (multiplier >= 5) {
        for (let i = 0; i < 3; i++) {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.connect(sparkleGain);
          sparkleGain.connect(masterGain);
          sparkle.frequency.setValueAtTime(1600 + i * 300, ctx.currentTime + 0.15 + i * 0.04);
          sparkle.type = "sine";
          sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.15 + i * 0.04);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15 + i * 0.04 + 0.08);
          sparkle.start(ctx.currentTime + 0.15 + i * 0.04);
          sparkle.stop(ctx.currentTime + 0.15 + i * 0.04 + 0.1);
        }
      }
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Crash explosion - dramatic impact sound
  const playCrashExplosion = useCallback(() => {
    // Strong vibration pattern for crash - heavy impact + rumble
    if (hapticEnabledRef.current) {
      triggerHaptic([150, 30, 100, 25, 80, 20, 60, 15, 40]);
    }

    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Stop rocket loop
      stopRocketLoop();

      // Deep impact boom
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.connect(boomGain);
      boomGain.connect(masterGain);
      boom.frequency.setValueAtTime(150, ctx.currentTime);
      boom.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      boom.type = "sawtooth";
      boomGain.gain.setValueAtTime(0.4, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      boom.start(ctx.currentTime);
      boom.stop(ctx.currentTime + 0.5);

      // Crash noise burst
      const noise = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.frequency.setValueAtTime(400, ctx.currentTime);
      noise.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      noise.type = "square";
      noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.3);

      // Descending debris sounds
      for (let i = 0; i < 4; i++) {
        const debris = ctx.createOscillator();
        const debrisGain = ctx.createGain();
        debris.connect(debrisGain);
        debrisGain.connect(masterGain);
        debris.frequency.setValueAtTime(800 - i * 150, ctx.currentTime + 0.1 + i * 0.08);
        debris.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1 + i * 0.08 + 0.2);
        debris.type = "triangle";
        debrisGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.1 + i * 0.08);
        debrisGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1 + i * 0.08 + 0.2);
        debris.start(ctx.currentTime + 0.1 + i * 0.08);
        debris.stop(ctx.currentTime + 0.1 + i * 0.08 + 0.25);
      }

      // Final rumble
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumble.frequency.setValueAtTime(40, ctx.currentTime + 0.3);
      rumble.type = "sawtooth";
      rumbleGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.3);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      rumble.start(ctx.currentTime + 0.3);
      rumble.stop(ctx.currentTime + 0.7);
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled, stopRocketLoop]);

  // Loss sound - sad trombone style
  const playLoss = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Descending sad tones
      const notes = [400, 350, 300, 250];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.25);
      });
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Time-warp sound effect for slow-motion activation at 10x+
  const playTimeWarp = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      
      // Create a dramatic time-warp sound with pitch shifting and whoosh
      
      // Descending whoosh - like time slowing down
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      const whooshFilter = ctx.createBiquadFilter();
      whooshOsc.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(masterGain);
      
      whooshOsc.type = "sawtooth";
      whooshOsc.frequency.setValueAtTime(800, ctx.currentTime);
      whooshOsc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
      
      whooshFilter.type = "lowpass";
      whooshFilter.frequency.setValueAtTime(2000, ctx.currentTime);
      whooshFilter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);
      
      whooshGain.gain.setValueAtTime(0.3, ctx.currentTime);
      whooshGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      whooshOsc.start(ctx.currentTime);
      whooshOsc.stop(ctx.currentTime + 0.8);
      
      // Deep bass drop
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(80, ctx.currentTime);
      bassOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1);
      
      bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 1);
      
      // Ethereal shimmer - high frequency sparkle
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      const shimmerFilter = ctx.createBiquadFilter();
      shimmerOsc.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(masterGain);
      
      shimmerOsc.type = "sine";
      shimmerOsc.frequency.setValueAtTime(2000, ctx.currentTime);
      shimmerOsc.frequency.setValueAtTime(2400, ctx.currentTime + 0.1);
      shimmerOsc.frequency.setValueAtTime(1800, ctx.currentTime + 0.2);
      shimmerOsc.frequency.setValueAtTime(2200, ctx.currentTime + 0.3);
      shimmerOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.8);
      
      shimmerFilter.type = "bandpass";
      shimmerFilter.frequency.setValueAtTime(2000, ctx.currentTime);
      shimmerFilter.Q.setValueAtTime(5, ctx.currentTime);
      
      shimmerGain.gain.setValueAtTime(0.15, ctx.currentTime);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      shimmerOsc.start(ctx.currentTime);
      shimmerOsc.stop(ctx.currentTime + 0.8);
      
      // Reverb-like tail using delayed oscillators
      [0.1, 0.2, 0.3].forEach((delay, i) => {
        const echoOsc = ctx.createOscillator();
        const echoGain = ctx.createGain();
        echoOsc.connect(echoGain);
        echoGain.connect(masterGain);
        
        echoOsc.type = "sine";
        echoOsc.frequency.setValueAtTime(400 - i * 80, ctx.currentTime + delay);
        echoOsc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + delay + 0.4);
        
        echoGain.gain.setValueAtTime(0.1 - i * 0.03, ctx.currentTime + delay);
        echoGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.4);
        
        echoOsc.start(ctx.currentTime + delay);
        echoOsc.stop(ctx.currentTime + delay + 0.5);
      });
      
    } catch (e) {}
  }, [getAudioContext, getMasterGain, soundEnabled]);

  // Set haptic feedback enabled/disabled
  const setHapticEnabled = useCallback((enabled: boolean) => {
    hapticEnabledRef.current = enabled;
  }, []);

  return {
    playCountdownTick,
    playBetPlaced,
    playRocketLaunch,
    startRocketLoop,
    stopRocketLoop,
    startIgnitionRoar,
    stopIgnitionRoar,
    playMultiplierMilestone,
    playCashout,
    playCrashExplosion,
    playLoss,
    playBigWin,
    playJackpot,
    playMilestoneAlert,
    playTimeWarp,
    setHapticEnabled,
  };
};
