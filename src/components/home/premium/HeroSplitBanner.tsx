import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, Gift } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-welcome-luckyspin.jpg";

const SLIDE_DURATION = 6000;

type Slide = {
  id: "welcome" | "spin";
  badge: string;
  badgeIcon: typeof Sparkles;
  badgeAccent: "emerald" | "gold";
  title: React.ReactNode;
  subtitle: React.ReactNode;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "emerald" | "gold";
  align: "left" | "right";
  glowA: string;
  glowB: string;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    badge: "Welcome Bonus",
    badgeIcon: Gift,
    badgeAccent: "emerald",
    title: (
      <>
        100<span className="text-4xl md:text-6xl align-top">%</span>
      </>
    ),
    subtitle: (
      <>
        Up to <span className="gl-gold-text gl-num">৳5,000</span>
      </>
    ),
    bullets: ["Instant Bonus Credited", "No Wagering Limit"],
    ctaLabel: "Claim Now",
    ctaHref: "/deposit",
    ctaVariant: "emerald",
    align: "left",
    glowA: "rgba(16,185,129,0.45)",
    glowB: "rgba(212,175,55,0.30)",
  },
  {
    id: "spin",
    badge: "Daily Free Spin",
    badgeIcon: Sparkles,
    badgeAccent: "gold",
    title: (
      <span className="gl-gold-text drop-shadow-[0_10px_30px_rgba(212,175,55,0.7)]">
        LUCKY<br />SPIN
      </span>
    ),
    subtitle: <span className="tracking-[0.32em]">WIN BIG EVERYDAY</span>,
    bullets: ["Mega Jackpots", "Free Spins Daily"],
    ctaLabel: "Spin Now",
    ctaHref: "/lucky-spinner",
    ctaVariant: "gold",
    align: "right",
    glowA: "rgba(212,175,55,0.55)",
    glowB: "rgba(123,97,255,0.35)",
  },
];

export default function HeroSplitBanner() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setTick((t) => t + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(id);
  }, [index, paused, tick]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x, y });
  };

  const slide = SLIDES[index];
  const Badge = slide.badgeIcon;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setParallax({ x: 0, y: 0 });
      }}
      onMouseMove={onMove}
      className="relative rounded-[28px] overflow-hidden min-h-[300px] md:min-h-[400px] group"
      style={{
        background: "#04140A",
        boxShadow:
          "0 30px 90px -28px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px -30px rgba(16,185,129,0.55)",
      }}
    >
      <span className="pointer-events-none absolute inset-[3px] rounded-[25px] border border-amber-300/20" />
      <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      <span className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

      <motion.img
        src={heroBg}
        alt=""
        aria-hidden
        width={1536}
        height={768}
        className="absolute inset-0 w-full h-full object-cover decorative pointer-events-none select-none"
        style={{ filter: "saturate(1.2) contrast(1.08)" }}
        animate={{ x: parallax.x * -14, y: parallax.y * -10, scale: 1.06 }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
      />

      <div className="absolute inset-0 decorative pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(2,12,8,0.96) 0%, rgba(2,12,8,0.55) 28%, rgba(2,12,8,0.10) 50%, rgba(2,12,8,0.55) 72%, rgba(2,12,8,0.96) 100%)" }} />
      <div className="absolute inset-0 decorative pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(2,12,8,0.55) 0%, transparent 30%, transparent 70%, rgba(2,12,8,0.65) 100%)" }} />

      <AnimatePresence>
        <motion.div
          key={`glow-a-${slide.id}`}
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full decorative pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${slide.glowA}, transparent 70%)`, filter: "blur(40px)" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1, x: parallax.x * -30, y: parallax.y * -22 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.div
          key={`glow-b-${slide.id}`}
          className="absolute -bottom-24 -right-24 w-[460px] h-[460px] rounded-full decorative pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${slide.glowB}, transparent 70%)`, filter: "blur(44px)" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1, x: parallax.x * 36, y: parallax.y * 26 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none decorative"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.04) 100%)" }} />

      <div className="relative z-10 h-full min-h-[300px] md:min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: slide.align === "left" ? -24 : 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: slide.align === "left" ? 24 : -24, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: `translate3d(${parallax.x * 10}px, ${parallax.y * 6}px, 0)` }}
            className={`absolute inset-0 p-5 md:p-10 flex flex-col justify-center ${slide.align === "right" ? "items-end text-right" : "items-start text-left"}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-[0.28em] uppercase backdrop-blur-md ${
                slide.badgeAccent === "emerald" ? "text-emerald-100 border border-emerald-300/40" : "text-amber-100 border border-amber-300/40"
              }`}
              style={{
                background: slide.badgeAccent === "emerald"
                  ? "linear-gradient(135deg, rgba(4,40,28,0.65), rgba(2,20,14,0.65))"
                  : "linear-gradient(135deg, rgba(40,28,4,0.65), rgba(20,14,2,0.65))",
              }}
            >
              <Badge size={12} className="opacity-90" />
              {slide.badge}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-3 text-5xl md:text-[88px] font-black leading-[0.9] tracking-tight gl-gold-text drop-shadow-[0_10px_28px_rgba(212,175,55,0.7)]"
            >
              {slide.title}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5 }}
              className="mt-2 text-[12px] md:text-base gl-text font-bold uppercase tracking-wider"
            >
              {slide.subtitle}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.5 }}
              className={`mt-3 flex flex-col gap-1.5 text-[10px] md:text-[12px] ${slide.align === "right" ? "items-end" : "items-start"}`}
            >
              {slide.bullets.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  {b}
                </span>
              ))}
            </motion.div>

            <motion.button
              type="button"
              onClick={() => navigate(slide.ctaHref)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="clickable mt-5 md:mt-7 inline-flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full text-[13px] md:text-sm font-black border transition"
              style={
                slide.ctaVariant === "emerald"
                  ? {
                      color: "#fff",
                      borderColor: "rgba(110,231,183,0.5)",
                      background: "linear-gradient(135deg,#10B981 0%,#047857 100%)",
                      boxShadow: "0 18px 40px -12px rgba(16,185,129,0.75), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }
                  : {
                      color: "#1a0f00",
                      borderColor: "rgba(253,230,138,0.6)",
                      background: "linear-gradient(135deg,#FDE68A 0%,#D4AF37 50%,#B8860B 100%)",
                      boxShadow: "0 18px 40px -12px rgba(212,175,55,0.85), inset 0 1px 0 rgba(255,255,255,0.55)",
                    }
              }
            >
              {slide.ctaLabel} <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Show ${s.badge}`}
              onClick={() => { setIndex(i); setTick((t) => t + 1); }}
              className="clickable relative h-1.5 rounded-full overflow-hidden border border-white/10"
              style={{ width: active ? 40 : 10, background: "rgba(255,255,255,0.12)", transition: "width 500ms cubic-bezier(0.22,1,0.36,1)" }}
            >
              {active && (
                <motion.span
                  key={`fill-${tick}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: paused ? 0 : SLIDE_DURATION / 1000, ease: "linear" }}
                  className="absolute inset-y-0 left-0"
                  style={{ background: "linear-gradient(90deg,#10B981 0%, #FDE68A 60%, #D4AF37 100%)", boxShadow: "0 0 10px rgba(212,175,55,0.6)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
