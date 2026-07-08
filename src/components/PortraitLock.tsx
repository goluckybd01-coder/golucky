import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

/**
 * PortraitLock
 * Shows a full-screen overlay when a small (mobile-sized) viewport is
 * rotated to landscape, asking the user to return to portrait. Also
 * attempts the Screen Orientation API lock as a best-effort hint.
 *
 * Only activates on small devices — tablets/desktops in landscape are
 * unaffected (min-device-width ≥ 900px is ignored).
 */
export default function PortraitLock() {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Trigger only on mobile-sized viewports in landscape (short height)
      const isSmall = Math.max(w, h) <= 932; // covers up to Pro Max
      const isLandscape = w > h;
      const isShort = h < 500;
      setLocked(isSmall && isLandscape && isShort);
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);

    // Best-effort orientation lock (works only in fullscreen on most browsers)
    const so = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
    so?.lock?.("portrait").catch(() => { /* noop — unsupported outside fullscreen */ });

    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  if (!locked) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Please rotate your device to portrait"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "#050505", color: "#FEC013" }}
    >
      <RotateCcw className="h-12 w-12 animate-none" aria-hidden />
      <div className="font-display font-black text-[18px] uppercase tracking-widest">
        Please Rotate
      </div>
      <div className="text-[13px] text-white/70 max-w-[280px] leading-snug">
        GoLucky is optimized for portrait mode on mobile. Please turn your device upright to continue.
      </div>
    </div>
  );
}
