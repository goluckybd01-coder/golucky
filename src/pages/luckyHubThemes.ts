/**
 * Centralized theme token map for LuckyHub feature cards.
 *
 * Single source of truth for card colors. Edit `hex` to retint a theme; the
 * matching Tailwind class literals sit next to it so Tailwind's JIT can see
 * them (arbitrary values like `border-[#05f395]/70` MUST appear as full string
 * literals — never built via template concatenation, or the class is purged).
 */

export type Theme = "green" | "gold" | "purple" | "blue" | "red";

export interface ThemeTokens {
  /** Raw hex tokens for inline styles / rgba glows. */
  hex: {
    accent: string;
    accentSoft: string;
    btnFrom: string;
    btnTo: string;
    bgFrom: string;
    bgVia: string;
    bgTo: string;
  };
  /** Tailwind class literals (kept as static strings for JIT). */
  border: string;
  bg: string;
  title: string;
  dot: string;
  btn: string;
  /** rgba() string for inline box-shadow / radial glows. */
  glow: string;
}

/* ---------- Palette: edit here to retint the whole hub ---------- */
export const THEMES: Record<Theme, ThemeTokens> = {
  green: {
    hex: { accent: "#05f395", accentSoft: "#5df3a8", btnFrom: "#22e58a", btnTo: "#059b4d",
           bgFrom: "#031c12", bgVia: "#04120c", bgTo: "#000000" },
    border: "border-[#05f395]/70",
    bg:     "from-[#031c12] via-[#04120c] to-black",
    title:  "text-[#5df3a8]",
    dot:    "bg-[#05f395]",
    btn:    "from-[#22e58a] to-[#059b4d] shadow-[0_6px_18px_rgba(5,243,149,0.55)]",
    glow:   "rgba(5,243,149,0.40)",
  },
  gold: {
    hex: { accent: "#ffcb37", accentSoft: "#ffd76a", btnFrom: "#ffdf6b", btnTo: "#c78100",
           bgFrom: "#1c1200", bgVia: "#120a00", bgTo: "#000000" },
    border: "border-[#ffcb37]/80",
    bg:     "from-[#1c1200] via-[#120a00] to-black",
    title:  "text-[#ffd76a]",
    dot:    "bg-[#ffcb37]",
    btn:    "from-[#ffdf6b] to-[#c78100] shadow-[0_6px_18px_rgba(255,203,55,0.55)]",
    glow:   "rgba(255,203,55,0.42)",
  },
  purple: {
    hex: { accent: "#c084fc", accentSoft: "#d4b3ff", btnFrom: "#c084fc", btnTo: "#7c1ed1",
           bgFrom: "#180a2a", bgVia: "#0d0518", bgTo: "#000000" },
    border: "border-[#c084fc]/70",
    bg:     "from-[#180a2a] via-[#0d0518] to-black",
    title:  "text-[#d4b3ff]",
    dot:    "bg-[#c084fc]",
    btn:    "from-[#c084fc] to-[#7c1ed1] shadow-[0_6px_18px_rgba(192,132,252,0.55)]",
    glow:   "rgba(192,132,252,0.40)",
  },
  blue: {
    hex: { accent: "#38bdf8", accentSoft: "#7dd3fc", btnFrom: "#38bdf8", btnTo: "#1d4ed8",
           bgFrom: "#031627", bgVia: "#020c16", bgTo: "#000000" },
    border: "border-[#38bdf8]/70",
    bg:     "from-[#031627] via-[#020c16] to-black",
    title:  "text-[#7dd3fc]",
    dot:    "bg-[#38bdf8]",
    btn:    "from-[#38bdf8] to-[#1d4ed8] shadow-[0_6px_18px_rgba(56,189,248,0.55)]",
    glow:   "rgba(56,189,248,0.40)",
  },
  red: {
    hex: { accent: "#ef4444", accentSoft: "#fca5a5", btnFrom: "#f87171", btnTo: "#b91c1c",
           bgFrom: "#280606", bgVia: "#150303", bgTo: "#000000" },
    border: "border-[#ef4444]/75",
    bg:     "from-[#280606] via-[#150303] to-black",
    title:  "text-[#fca5a5]",
    dot:    "bg-[#ef4444]",
    btn:    "from-[#f87171] to-[#b91c1c] shadow-[0_6px_18px_rgba(239,68,68,0.55)]",
    glow:   "rgba(239,68,68,0.42)",
  },
};

export const getTheme = (name: Theme): ThemeTokens => THEMES[name];
