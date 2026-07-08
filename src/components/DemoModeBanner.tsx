import { useEffect, useState } from "react";
import { DEMO_MODE_ALLOWED } from "@/lib/featureFlags";

const STORAGE_KEY = "section1_demo";

export function isDemoActive(): boolean {
  if (!DEMO_MODE_ALLOWED) return false;
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("demo") === "1") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setDemoActive(next: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  window.dispatchEvent(new CustomEvent("demo-mode-change", { detail: next }));
}

export default function DemoModeBanner() {
  const [active, setActive] = useState<boolean>(() => isDemoActive());

  useEffect(() => {
    if (!DEMO_MODE_ALLOWED) return;
    const sync = () => setActive(isDemoActive());
    window.addEventListener("storage", sync);
    window.addEventListener("demo-mode-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("demo-mode-change", sync as EventListener);
    };
  }, []);

  if (!DEMO_MODE_ALLOWED || !active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="demo-mode-banner"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[80] pointer-events-auto"
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md"
        style={{
          background: "rgba(20,10,0,0.85)",
          color: "#FEC013",
          border: "1px solid rgba(254,192,19,0.55)",
          boxShadow: "0 6px 24px -8px rgba(254,192,19,0.5)",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#FEC013" }} />
        Demo Mode · Staging
        <button
          type="button"
          data-testid="demo-mode-turn-off"
          onClick={() => setDemoActive(false)}
          className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] tracking-wide"
          style={{
            background: "rgba(254,192,19,0.15)",
            border: "1px solid rgba(254,192,19,0.4)",
            color: "#FEC013",
          }}
        >
          Turn Off
        </button>
      </div>
    </div>
  );
}
