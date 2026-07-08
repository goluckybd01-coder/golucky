import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Premium subtle UI sound cues via WebAudio (no assets).
 * - hover(): soft high-frequency tick (~40ms)
 * - tap():   short two-tone confirmation
 * Persists mute preference in localStorage under "gl_ui_sound_muted".
 */
const STORAGE_KEY = "gl_ui_sound_muted";

export function useUiSound() {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const lastHoverRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {}
  }, [muted]);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const blip = useCallback(
    (freq: number, dur: number, type: OscillatorType = "sine", gain = 0.05) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    },
    [muted, getCtx],
  );

  const hover = useCallback(() => {
    const now = performance.now();
    if (now - lastHoverRef.current < 60) return; // throttle
    lastHoverRef.current = now;
    blip(1180, 0.045, "sine", 0.025);
  }, [blip]);

  const tap = useCallback(() => {
    blip(720, 0.055, "triangle", 0.06);
    setTimeout(() => blip(1080, 0.09, "sine", 0.045), 40);
  }, [blip]);

  const toggle = useCallback(() => setMuted((m) => !m), []);

  return { hover, tap, muted, toggle };
}
