import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import AudioManager from "./useAudioManager";

export interface AviatorSoundSettings {
  enabled: boolean;
  volume: number;
  // Individual category volumes (0-1 scale, multiplied with master volume)
  betVolume: number;      // Bet placed, cancel
  cashoutVolume: number;  // Cashout success, win sounds
  crashVolume: number;    // Crash, lose sounds
  ambientVolume: number;  // Engine, waiting, countdown
}

const DEFAULT_SETTINGS: AviatorSoundSettings = {
  enabled: true,
  volume: 0.5,
  betVolume: 1.0,
  cashoutVolume: 1.0,
  crashVolume: 1.0,
  ambientVolume: 0.7,
};

export const useAviatorSounds = () => {
  const audioManager = useRef(AudioManager.getInstance());
  const [settings, setSettings] = useState<AviatorSoundSettings>(() => {
    try {
      const saved = localStorage.getItem('aviator_sound_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.enabled === 'boolean' && typeof parsed.volume === 'number') {
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('aviator_sound_settings_v2', JSON.stringify(settings));
  }, [settings]);

  // Cleanup on unmount - CRITICAL for fixing persistent sound issue
  useEffect(() => {
    return () => {
      // Stop all looping sounds
      audioManager.current.stopLoop('engine');
      audioManager.current.stopLoop('waiting');
      audioManager.current.cleanup();
    };
  }, []);
  
  // Get or create audio context
  const getAudioContext = useCallback(() => {
    return audioManager.current.getContext();
  }, []);
  
  // Create gain node with volume for specific category
  const createGain = useCallback((ctx: AudioContext, categoryVolume: number = 1.0) => {
    const gain = ctx.createGain();
    gain.gain.value = settings.volume * categoryVolume;
    gain.connect(ctx.destination);
    return gain;
  }, [settings.volume]);
  
  // Create category-specific gain helpers
  const createBetGain = useCallback((ctx: AudioContext) => createGain(ctx, settings.betVolume), [createGain, settings.betVolume]);
  const createCashoutGain = useCallback((ctx: AudioContext) => createGain(ctx, settings.cashoutVolume), [createGain, settings.cashoutVolume]);
  const createCrashGain = useCallback((ctx: AudioContext) => createGain(ctx, settings.crashVolume), [createGain, settings.crashVolume]);
  const createAmbientGain = useCallback((ctx: AudioContext) => createGain(ctx, settings.ambientVolume), [createGain, settings.ambientVolume]);
  
  // Bet placed sound - positive confirmation beep
  const playBetSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createBetGain(ctx);
    const now = ctx.currentTime;
    
    // Two-tone ascending beep
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.setValueAtTime(800, now + 0.05);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc1.connect(oscGain);
    oscGain.connect(gain);
    
    osc1.start(now);
    osc1.stop(now + 0.15);
  }, [settings.enabled, getAudioContext, createBetGain]);
  
  // Cancel bet sound - descending tone
  const playCancelSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createBetGain(ctx);
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.15);
    
    osc.connect(oscGain);
    oscGain.connect(gain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }, [settings.enabled, getAudioContext, createBetGain]);
  
  // Multiplier tick sound - subtle tick as multiplier increases
  const playTickSound = useCallback((multiplier: number) => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createAmbientGain(ctx);
    const now = ctx.currentTime;
    
    // Higher pitch as multiplier increases
    const baseFreq = 200 + Math.min(multiplier * 50, 800);
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(oscGain);
    oscGain.connect(gain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }, [settings.enabled, getAudioContext, createAmbientGain]);
  
  // Engine sound reference - continuous during flight
  const engineSoundRef = useRef<{ 
    oscillators: OscillatorNode[]; 
    gains: GainNode[];
    noiseSource: AudioBufferSourceNode | null;
  } | null>(null);
  
  // Airplane takeoff and engine sound
  const startRisingTension = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const masterGain = createAmbientGain(ctx);
    const now = ctx.currentTime;
    
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    // Engine rumble - low frequency base
    const engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(60, now);
    
    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0, now);
    engineGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(150, now);
    
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(masterGain);
    engineOsc.start();
    oscillators.push(engineOsc);
    gains.push(engineGain);
    
    // Propeller sound - mid frequency buzz
    const propOsc = ctx.createOscillator();
    propOsc.type = 'square';
    propOsc.frequency.setValueAtTime(120, now);
    
    const propGain = ctx.createGain();
    propGain.gain.setValueAtTime(0, now);
    propGain.gain.linearRampToValueAtTime(0.03, now + 0.3);
    
    const propFilter = ctx.createBiquadFilter();
    propFilter.type = 'bandpass';
    propFilter.frequency.setValueAtTime(200, now);
    propFilter.Q.setValueAtTime(2, now);
    
    propOsc.connect(propFilter);
    propFilter.connect(propGain);
    propGain.connect(masterGain);
    propOsc.start();
    oscillators.push(propOsc);
    gains.push(propGain);
    
    // Wind/air rushing sound - noise with filter
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(0.5, now);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.04, now + 1);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();
    gains.push(noiseGain);
    
    // Rising tension tone
    const tensionOsc = ctx.createOscillator();
    tensionOsc.type = 'sine';
    tensionOsc.frequency.setValueAtTime(100, now);
    
    const tensionGain = ctx.createGain();
    tensionGain.gain.setValueAtTime(0, now);
    tensionGain.gain.linearRampToValueAtTime(0.02, now + 0.5);
    
    tensionOsc.connect(tensionGain);
    tensionGain.connect(masterGain);
    tensionOsc.start();
    oscillators.push(tensionOsc);
    gains.push(tensionGain);
    
    engineSoundRef.current = { oscillators, gains, noiseSource };
  }, [settings.enabled, getAudioContext, createAmbientGain]);
  
  const updateRisingTension = useCallback((multiplier: number) => {
    if (!engineSoundRef.current) return;
    
    const { oscillators, gains } = engineSoundRef.current;
    if (oscillators.length < 3) return;
    
    const ctx = oscillators[0].context;
    const now = ctx.currentTime;
    
    // Engine pitch increases with speed
    const engineFreq = 60 + Math.min(multiplier * 15, 120);
    oscillators[0].frequency.setValueAtTime(engineFreq, now);
    
    // Propeller speed increases
    const propFreq = 120 + Math.min(multiplier * 30, 200);
    oscillators[1].frequency.setValueAtTime(propFreq, now);
    
    // Tension tone rises
    const tensionFreq = 100 + Math.min(multiplier * 40, 400);
    oscillators[2].frequency.setValueAtTime(tensionFreq, now);
    
    // Volume increases slightly with speed
    const vol = Math.min(0.08 + multiplier * 0.01, 0.15) * settings.volume * settings.ambientVolume;
    gains[0].gain.setValueAtTime(vol, now);
    gains[1].gain.setValueAtTime(vol * 0.4, now);
    gains[2].gain.setValueAtTime(Math.min(0.04 + multiplier * 0.01, 0.1) * settings.volume * settings.ambientVolume, now);
    gains[3].gain.setValueAtTime(Math.min(0.02 + multiplier * 0.005, 0.06) * settings.volume * settings.ambientVolume, now);
  }, [settings.volume, settings.ambientVolume]);
  
  const stopRisingTension = useCallback(() => {
    if (engineSoundRef.current) {
      const { oscillators, gains, noiseSource } = engineSoundRef.current;
      const now = oscillators[0]?.context.currentTime || 0;
      
      // Fade out all sounds
      gains.forEach(gain => {
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
      });
      
      setTimeout(() => {
        oscillators.forEach(osc => {
          try { osc.stop(); } catch {}
        });
        if (noiseSource) {
          try { noiseSource.stop(); } catch {}
        }
        engineSoundRef.current = null;
      }, 150);
    }
  }, []);
  
  // Cashout sound - celebratory chime
  const playCashoutSound = useCallback((multiplier: number) => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCashoutGain(ctx);
    const now = ctx.currentTime;
    
    // Higher multiplier = more elaborate sound
    const baseNotes = [523.25, 659.25, 783.99]; // C5, E5, G5
    if (multiplier >= 2) baseNotes.push(1046.50); // C6
    if (multiplier >= 5) baseNotes.push(1318.51); // E6
    
    baseNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const oscGain = ctx.createGain();
      const startTime = now + i * 0.08;
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }, [settings.enabled, getAudioContext, createCashoutGain]);
  
  // Crash sound - dramatic explosion/impact
  const playCrashSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCrashGain(ctx);
    const now = ctx.currentTime;
    
    // Initial sharp impact - high frequency crack
    const crack = ctx.createOscillator();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(2000, now);
    crack.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.4, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    crack.connect(crackGain);
    crackGain.connect(gain);
    crack.start(now);
    crack.stop(now + 0.1);
    
    // White noise burst for explosion debris
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Shaped explosion envelope
      const envelope = Math.exp(-i / (ctx.sampleRate * 0.15));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Band-pass filter for mid-range explosion
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    filter.Q.setValueAtTime(0.5, now);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start(now);
    
    // Deep bass thump - earthquake rumble
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(100, now);
    thump.frequency.exponentialRampToValueAtTime(25, now + 0.4);
    
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.6, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    thump.connect(thumpGain);
    thumpGain.connect(gain);
    thump.start(now);
    thump.stop(now + 0.4);
    
    // Secondary rumble - lower sub bass
    const subBass = ctx.createOscillator();
    subBass.type = 'sine';
    subBass.frequency.setValueAtTime(50, now + 0.05);
    subBass.frequency.exponentialRampToValueAtTime(20, now + 0.5);
    
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    subBass.connect(subGain);
    subGain.connect(gain);
    subBass.start(now);
    subBass.stop(now + 0.5);
    
    // Metallic debris sound
    const debris = ctx.createOscillator();
    debris.type = 'triangle';
    debris.frequency.setValueAtTime(1500, now + 0.1);
    debris.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    
    const debrisGain = ctx.createGain();
    debrisGain.gain.setValueAtTime(0, now);
    debrisGain.gain.linearRampToValueAtTime(0.15, now + 0.12);
    debrisGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    debris.connect(debrisGain);
    debrisGain.connect(gain);
    debris.start(now + 0.1);
    debris.stop(now + 0.4);
  }, [settings.enabled, getAudioContext, createCrashGain]);
  
  // Countdown tick sound
  const playCountdownTick = useCallback((secondsLeft: number) => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createAmbientGain(ctx);
    const now = ctx.currentTime;
    
    // More urgent sound as countdown approaches zero
    const freq = secondsLeft <= 3 ? 880 : 440;
    const duration = secondsLeft <= 3 ? 0.1 : 0.05;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(secondsLeft <= 3 ? 0.15 : 0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(oscGain);
    oscGain.connect(gain);
    
    osc.start(now);
    osc.stop(now + duration);
  }, [settings.enabled, getAudioContext, createAmbientGain]);
  
  // Win notification sound
  const playWinSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCashoutGain(ctx);
    const now = ctx.currentTime;
    
    // Triumphant fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const oscGain = ctx.createGain();
      const startTime = now + i * 0.1;
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }, [settings.enabled, getAudioContext, createCashoutGain]);
  
  // Lose notification sound
  const playLoseSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCrashGain(ctx);
    const now = ctx.currentTime;
    
    // Sad descending tones
    const notes = [400, 350, 300];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      const oscGain = ctx.createGain();
      const startTime = now + i * 0.15;
      oscGain.gain.setValueAtTime(0.15, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }, [settings.enabled, getAudioContext, createCrashGain]);
  
  // Waiting phase anticipation sound - pulsing ambient drone
  const waitingLoopRef = useRef<{
    oscillators: OscillatorNode[];
    gains: GainNode[];
    lfo: OscillatorNode | null;
  } | null>(null);
  
  const startWaitingSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const masterGain = createAmbientGain(ctx);
    const now = ctx.currentTime;
    
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    // Deep ambient drone - base layer
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(80, now);
    
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.06, now + 0.5);
    
    droneOsc.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
    oscillators.push(droneOsc);
    gains.push(droneGain);
    
    // Higher harmonic for shimmer
    const shimmerOsc = ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(240, now);
    
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.02, now + 0.8);
    
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerOsc.start();
    oscillators.push(shimmerOsc);
    gains.push(shimmerGain);
    
    // Pulsing effect via LFO modulating the gain
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.8, now); // ~1.2s per pulse cycle
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.03, now); // Modulation depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start();
    
    // Soft tick sound every ~1.2 seconds for anticipation
    const tickOsc = ctx.createOscillator();
    tickOsc.type = 'triangle';
    tickOsc.frequency.setValueAtTime(600, now);
    
    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0, now);
    
    // Create pulsing tick effect using another LFO
    const tickLfo = ctx.createOscillator();
    tickLfo.type = 'square';
    tickLfo.frequency.setValueAtTime(0.83, now); // Matches visual spin ~1.2s
    
    const tickLfoGain = ctx.createGain();
    tickLfoGain.gain.setValueAtTime(0.04, now);
    
    tickLfo.connect(tickLfoGain);
    tickLfoGain.connect(tickGain.gain);
    tickLfo.start();
    
    tickOsc.connect(tickGain);
    tickGain.connect(masterGain);
    tickOsc.start();
    oscillators.push(tickOsc);
    oscillators.push(tickLfo);
    gains.push(tickGain);
    
    waitingLoopRef.current = { oscillators, gains, lfo };
  }, [settings.enabled, getAudioContext, createAmbientGain]);
  
  const stopWaitingSound = useCallback(() => {
    if (waitingLoopRef.current) {
      const { oscillators, gains, lfo } = waitingLoopRef.current;
      const now = oscillators[0]?.context.currentTime || 0;
      
      // Fade out
      gains.forEach(gain => {
        try {
          gain.gain.linearRampToValueAtTime(0, now + 0.3);
        } catch {}
      });
      
      setTimeout(() => {
        oscillators.forEach(osc => {
          try { osc.stop(); } catch {}
        });
        if (lfo) {
          try { lfo.stop(); } catch {}
        }
        waitingLoopRef.current = null;
      }, 350);
    }
  }, []);
  
  // Martingale stake doubled sound - warning escalation tone
  const playMartingaleDoubleSound = useCallback((lossCount: number) => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createBetGain(ctx);
    const now = ctx.currentTime;
    
    // Escalating warning sound - higher pitch with each loss
    const baseFreq = 200 + lossCount * 80;
    
    // Two-tone alert
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(baseFreq, now);
    
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.15, now);
    osc1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc1.connect(osc1Gain);
    osc1Gain.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.1);
    
    // Second beep
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(baseFreq * 1.2, now + 0.12);
    
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0, now);
    osc2Gain.gain.setValueAtTime(0.18, now + 0.12);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.22);
    
    // Add low rumble for high loss counts (danger indication)
    if (lossCount >= 3) {
      const rumble = ctx.createOscillator();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(60, now);
      
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.1, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      rumble.connect(rumbleGain);
      rumbleGain.connect(gain);
      rumble.start(now);
      rumble.stop(now + 0.3);
    }
  }, [settings.enabled, getAudioContext, createBetGain]);
  
  // Martingale recovery sound - triumphant relief
  const playMartingaleRecoverySound = useCallback((previousLossCount: number) => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCashoutGain(ctx);
    const now = ctx.currentTime;
    
    // Ascending triumphant notes - more elaborate if recovered from many losses
    const baseNotes = [392, 493.88, 587.33]; // G4, B4, D5
    if (previousLossCount >= 2) baseNotes.push(783.99); // G5
    if (previousLossCount >= 4) baseNotes.push(987.77); // B5
    
    baseNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const oscGain = ctx.createGain();
      const startTime = now + i * 0.06;
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
    
    // Add shimmer effect for big recoveries
    if (previousLossCount >= 3) {
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(1200, now + 0.2);
      shimmer.frequency.exponentialRampToValueAtTime(2400, now + 0.4);
      
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, now);
      shimmerGain.gain.setValueAtTime(0.08, now + 0.2);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(gain);
      shimmer.start(now + 0.2);
      shimmer.stop(now + 0.5);
    }
  }, [settings.enabled, getAudioContext, createCashoutGain]);
  
  // Session milestone sound - achievement unlocked feel
  const playSessionMilestoneSound = useCallback((type: 'profit' | 'bets' | 'streak' | 'winrate') => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCashoutGain(ctx);
    const now = ctx.currentTime;
    
    // Different sound profiles for different milestone types
    const profiles: Record<string, number[]> = {
      profit: [523.25, 659.25, 783.99, 1046.50, 1318.51], // C major arpeggio up
      bets: [440, 523.25, 659.25, 880], // A ascending
      streak: [392, 493.88, 587.33, 783.99, 987.77], // G major fanfare
      winrate: [349.23, 440, 523.25, 698.46], // F major
    };
    
    const notes = profiles[type] || profiles.profit;
    
    // Play achievement sound
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const oscGain = ctx.createGain();
      const startTime = now + i * 0.08;
      const duration = i === notes.length - 1 ? 0.5 : 0.15;
      
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
    // Add sparkle overlay for extra celebration
    const sparkle1 = ctx.createOscillator();
    sparkle1.type = 'sine';
    sparkle1.frequency.setValueAtTime(2000, now + 0.3);
    sparkle1.frequency.setValueAtTime(2500, now + 0.35);
    sparkle1.frequency.setValueAtTime(3000, now + 0.4);
    
    const sparkleGain = ctx.createGain();
    sparkleGain.gain.setValueAtTime(0, now);
    sparkleGain.gain.setValueAtTime(0.06, now + 0.3);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    sparkle1.connect(sparkleGain);
    sparkleGain.connect(gain);
    sparkle1.start(now + 0.3);
    sparkle1.stop(now + 0.5);
  }, [settings.enabled, getAudioContext, createCashoutGain]);
  
  // Max martingale reached sound - warning/reset
  const playMartingaleMaxSound = useCallback(() => {
    if (!settings.enabled) return;
    
    const ctx = getAudioContext();
    const gain = createCrashGain(ctx);
    const now = ctx.currentTime;
    
    // Descending warning tones
    const notes = [600, 500, 400, 300];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.15, now + i * 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
      
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(gain);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
    
    // Deep buzz for finality
    const buzz = ctx.createOscillator();
    buzz.type = 'square';
    buzz.frequency.setValueAtTime(80, now + 0.4);
    
    const buzzGain = ctx.createGain();
    buzzGain.gain.setValueAtTime(0, now);
    buzzGain.gain.setValueAtTime(0.2, now + 0.4);
    buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    
    buzz.connect(buzzGain);
    buzzGain.connect(gain);
    buzz.start(now + 0.4);
    buzz.stop(now + 0.7);
  }, [settings.enabled, getAudioContext, createCrashGain]);
  
  // Toggle sounds
  const toggleSounds = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);
  
  // Set sound enabled
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
  }, []);
  
  // Set master volume
  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);
  
  // Set category volumes
  const setBetVolume = useCallback((betVolume: number) => {
    setSettings(prev => ({ ...prev, betVolume: Math.max(0, Math.min(1, betVolume)) }));
  }, []);
  
  const setCashoutVolume = useCallback((cashoutVolume: number) => {
    setSettings(prev => ({ ...prev, cashoutVolume: Math.max(0, Math.min(1, cashoutVolume)) }));
  }, []);
  
  const setCrashVolume = useCallback((crashVolume: number) => {
    setSettings(prev => ({ ...prev, crashVolume: Math.max(0, Math.min(1, crashVolume)) }));
  }, []);
  
  const setAmbientVolume = useCallback((ambientVolume: number) => {
    setSettings(prev => ({ ...prev, ambientVolume: Math.max(0, Math.min(1, ambientVolume)) }));
  }, []);
  
  // Cleanup - handled in initial useEffect now
  // Removed duplicate cleanup that referenced old audioContextRef
  
  // Memoize the returned object to prevent re-renders causing infinite loops
  return useMemo(() => ({
    settings,
    toggleSounds,
    setSoundEnabled,
    setVolume,
    setBetVolume,
    setCashoutVolume,
    setCrashVolume,
    setAmbientVolume,
    playBetSound,
    playCancelSound,
    playTickSound,
    playCashoutSound,
    playCrashSound,
    playCountdownTick,
    playWinSound,
    playLoseSound,
    startRisingTension,
    updateRisingTension,
    stopRisingTension,
    startWaitingSound,
    stopWaitingSound,
    // Martingale sounds
    playMartingaleDoubleSound,
    playMartingaleRecoverySound,
    playMartingaleMaxSound,
    // Session milestone sound
    playSessionMilestoneSound,
  }), [
    settings,
    toggleSounds,
    setSoundEnabled,
    setVolume,
    setBetVolume,
    setCashoutVolume,
    setCrashVolume,
    setAmbientVolume,
    playBetSound,
    playCancelSound,
    playTickSound,
    playCashoutSound,
    playCrashSound,
    playCountdownTick,
    playWinSound,
    playLoseSound,
    startRisingTension,
    updateRisingTension,
    stopRisingTension,
    startWaitingSound,
    stopWaitingSound,
    playMartingaleDoubleSound,
    playMartingaleRecoverySound,
    playMartingaleMaxSound,
    playSessionMilestoneSound,
  ]);
};
