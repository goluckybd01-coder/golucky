/**
 * Premium Wallet — shared primitives.
 * Dark gaming/financial-grade tokens. All colors use HSL-derived rgba for
 * pixel-consistent glow across cards, buttons, and glass surfaces.
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------- Formatters ---------- */
export const fmtBDT = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtCompact = (n: number) =>
  n >= 1e7 ? `${(n / 1e7).toFixed(2)}Cr`
  : n >= 1e5 ? `${(n / 1e5).toFixed(2)}L`
  : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K`
  : `${n}`;

/* ---------- Canvas ---------- */
export function WalletCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#05070d] text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/* ---------- Sub-page top bar with back button ---------- */
export function SubHeader({ title, right }: { title: string; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/60 border-b border-white/[0.06]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => nav(-1)}
          className="h-9 w-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center hover:bg-white/5 transition"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-white/80" />
        </button>
        <h1 className="flex-1 text-center text-[15px] font-black tracking-wide text-white">
          {title}
        </h1>
        <div className="min-w-9 flex justify-end">{right}</div>
      </div>
    </div>
  );
}

/* ---------- Glass card ---------- */
export function GlassCard({
  children,
  className = "",
  glow = "emerald",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  glow?: "emerald" | "amber" | "violet" | "sky" | "rose" | "none";
  as?: any;
} & Record<string, any>) {
  const g: Record<string, string> = {
    emerald: "shadow-[0_20px_60px_-30px_rgba(16,185,129,0.5)]",
    amber:   "shadow-[0_20px_60px_-30px_rgba(245,158,11,0.55)]",
    violet:  "shadow-[0_20px_60px_-30px_rgba(139,92,246,0.55)]",
    sky:     "shadow-[0_20px_60px_-30px_rgba(14,165,233,0.55)]",
    rose:    "shadow-[0_20px_60px_-30px_rgba(244,63,94,0.55)]",
    none:    "",
  };
  return (
    <Tag
      className={`relative rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl ${g[glow]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------- Premium button ---------- */
export function GoldButton({
  children,
  onClick,
  className = "",
  variant = "emerald",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "emerald" | "amber";
}) {
  const styles = variant === "amber"
    ? "from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_10px_40px_-10px_rgba(245,158,11,0.7)]"
    : "from-emerald-500 via-emerald-400 to-emerald-600 text-black shadow-[0_10px_40px_-10px_rgba(16,185,129,0.7)]";
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`relative w-full rounded-2xl bg-gradient-to-r ${styles} font-black tracking-widest text-[13px] py-3.5 ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/40 via-transparent to-white/20 opacity-40 mix-blend-overlay" />
    </motion.button>
  );
}

/* ---------- Motion helpers ---------- */
import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
  },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
