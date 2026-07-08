import { motion } from "framer-motion";

interface Props {
  tagline?: string;
}

const LogoMark3D = ({ tagline = "PLAY • EARN • WIN" }: Props) => (
  <div className="flex flex-col items-center gap-2 relative">
    {/* Halo */}
    <div
      aria-hidden
      className="decorative absolute -inset-8 rounded-full"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(var(--luxe-emerald) / 0.35), transparent 60%), radial-gradient(ellipse at center, hsl(var(--luxe-gold) / 0.25), transparent 70%)",
        filter: "blur(24px)",
      }}
    />
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <h1
        className="luxe-text-gradient text-5xl sm:text-6xl font-black tracking-tight leading-none"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          textShadow:
            "0 6px 30px hsl(var(--luxe-emerald) / 0.35), 0 2px 12px hsl(var(--luxe-gold) / 0.35)",
        }}
      >
        GoLucky
      </h1>
      {/* Reflection */}
      <div
        aria-hidden
        className="decorative pointer-events-none mt-[-8px] text-5xl sm:text-6xl font-black tracking-tight leading-none luxe-text-gradient text-center"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          transform: "scaleY(-0.5)",
          opacity: 0.15,
          maskImage: "linear-gradient(to bottom, black, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
        }}
      >
        GoLucky
      </div>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="luxe-text-gradient text-xs sm:text-sm font-bold tracking-[0.42em] mt-1"
    >
      {tagline}
    </motion.p>
  </div>
);

export default LogoMark3D;
