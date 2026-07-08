import { useCallback, useEffect, useRef } from 'react';

// Centralized Audio Manager - ensures proper cleanup on navigation
class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private activeBufferSources: Set<AudioBufferSourceNode> = new Set();
  private activeHtmlAudios: Set<HTMLAudioElement> = new Set();
  private loopingNodes: Map<string, { oscillators: OscillatorNode[]; gains: GainNode[]; sources?: AudioBufferSourceNode[] }> = new Map();
  private volume: number = 0.7;
  private enabled: boolean = true;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  getMasterGain(): GainNode {
    this.getContext(); // Ensure context exists
    return this.masterGain!;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  // Track oscillator for cleanup
  trackOscillator(osc: OscillatorNode) {
    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
    };
  }

  // Track buffer source for cleanup
  trackBufferSource(source: AudioBufferSourceNode) {
    this.activeBufferSources.add(source);
    source.onended = () => {
      this.activeBufferSources.delete(source);
    };
  }

  // Track HTMLAudioElement for cleanup (for new Audio() instances)
  trackHtmlAudio(audio: HTMLAudioElement) {
    this.activeHtmlAudios.add(audio);
    audio.onended = () => {
      this.activeHtmlAudios.delete(audio);
    };
    audio.onerror = () => {
      this.activeHtmlAudios.delete(audio);
    };
  }

  // Play and track an audio file (returns the element for manual control)
  playSound(src: string, volume: number = 0.5): HTMLAudioElement | null {
    if (!this.enabled) return null;
    try {
      const audio = new Audio(src);
      audio.volume = Math.min(1, volume * this.volume);
      this.trackHtmlAudio(audio);
      audio.play().catch(() => {
        this.activeHtmlAudios.delete(audio);
      });
      return audio;
    } catch {
      return null;
    }
  }

  // Register a looping sound (like engine hum)
  registerLoop(id: string, oscillators: OscillatorNode[], gains: GainNode[], sources?: AudioBufferSourceNode[]) {
    this.loopingNodes.set(id, { oscillators, gains, sources });
  }

  // Stop a specific loop
  stopLoop(id: string) {
    const loop = this.loopingNodes.get(id);
    if (loop) {
      const ctx = this.audioContext;
      if (ctx) {
        loop.gains.forEach(gain => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          } catch {}
        });
      }
      setTimeout(() => {
        loop.oscillators.forEach(osc => {
          try { osc.stop(); } catch {}
        });
        loop.sources?.forEach(src => {
          try { src.stop(); } catch {}
        });
        this.loopingNodes.delete(id);
      }, 150);
    }
  }

  // Stop all sounds immediately
  stopAllSounds() {
    // Stop all looping sounds
    this.loopingNodes.forEach((_, id) => {
      this.stopLoop(id);
    });
    
    // Stop all active oscillators
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.activeOscillators.clear();
    
    // Stop all buffer sources
    this.activeBufferSources.forEach(src => {
      try { src.stop(); } catch {}
    });
    this.activeBufferSources.clear();

    // Stop all HTML audio elements
    this.activeHtmlAudios.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      } catch {}
    });
    this.activeHtmlAudios.clear();
  }

  // Clean up for navigation
  cleanup() {
    this.stopAllSounds();
  }
}

// Hook that provides audio manager with automatic cleanup on unmount
export const useAudioManager = () => {
  const manager = AudioManager.getInstance();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      // Clean up all sounds when component unmounts
      manager.cleanup();
    };
  }, [manager]);

  const getContext = useCallback(() => manager.getContext(), [manager]);
  const getMasterGain = useCallback(() => manager.getMasterGain(), [manager]);
  const setVolume = useCallback((vol: number) => manager.setVolume(vol), [manager]);
  const setEnabled = useCallback((enabled: boolean) => manager.setEnabled(enabled), [manager]);
  const isEnabled = useCallback(() => manager.isEnabled(), [manager]);
  const getVolume = useCallback(() => manager.getVolume(), [manager]);
  const trackOscillator = useCallback((osc: OscillatorNode) => manager.trackOscillator(osc), [manager]);
  const trackBufferSource = useCallback((src: AudioBufferSourceNode) => manager.trackBufferSource(src), [manager]);
  const trackHtmlAudio = useCallback((audio: HTMLAudioElement) => manager.trackHtmlAudio(audio), [manager]);
  const playSound = useCallback((src: string, volume?: number) => manager.playSound(src, volume), [manager]);
  const registerLoop = useCallback((id: string, oscs: OscillatorNode[], gains: GainNode[], srcs?: AudioBufferSourceNode[]) => 
    manager.registerLoop(id, oscs, gains, srcs), [manager]);
  const stopLoop = useCallback((id: string) => manager.stopLoop(id), [manager]);
  const stopAllSounds = useCallback(() => manager.stopAllSounds(), [manager]);

  return {
    getContext,
    getMasterGain,
    setVolume,
    setEnabled,
    isEnabled,
    getVolume,
    trackOscillator,
    trackBufferSource,
    trackHtmlAudio,
    playSound,
    registerLoop,
    stopLoop,
    stopAllSounds,
  };
};

// Helper to trigger haptic feedback
export const triggerHaptic = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail if vibration not supported
    }
  }
};

export default AudioManager;
