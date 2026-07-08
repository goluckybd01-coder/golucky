import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Crown, Gift } from "lucide-react";

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const d = Math.max(0, target - now);
  return {
    days: Math.floor(d / 86_400_000),
    hrs:  Math.floor((d / 3_600_000) % 24),
    min:  Math.floor((d / 60_000) % 60),
    sec:  Math.floor((d / 1000) % 60),
  };
}
const pad = (n: number) => String(n).padStart(2, "0");

export default function BottomPromoRow() {
  const navigate = useNavigate();
  const target = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 14 + 1000 * 60 * 32;
  const { days, hrs, min, sec } = useCountdown(target);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
      {/* Summer Splash Tournament */}
      <motion.div whileHover={{ y: -3 }}
        className="md:col-span-6 relative rounded-3xl overflow-hidden border border-cyan-300/20 min-h-[180px]"
        style={{ background: "linear-gradient(135deg, #0E2E4A 0%, #134E6E 50%, #0A1F33 100%)" }}>
        <div className="absolute inset-0 decorative pointer-events-none">
          <div className="absolute -top-10 right-10 w-56 h-56 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(251,191,36,0.25), transparent 70%)", filter: "blur(30px)" }} />
          <div className="absolute right-3 bottom-2 text-7xl select-none opacity-95"
            style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}>🏝️</div>
          <div className="absolute right-20 top-4 text-4xl select-none">🏖️</div>
        </div>
        <div className="relative z-10 p-4 md:p-5 flex flex-col h-full">
          <span className="self-start px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider text-cyan-100 bg-cyan-500/30 border border-cyan-300/40">
            EVENT
          </span>
          <div className="mt-2 text-xl md:text-2xl font-black tracking-tight"
            style={{ background: "linear-gradient(90deg,#67E8F9,#3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SUMMER SPLASH
          </div>
          <div className="text-[11px] font-bold text-cyan-200/80 uppercase tracking-[0.25em]">Tournament</div>

          <div className="mt-3 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] gl-text-dim uppercase tracking-wider">Prize Pool</div>
              <div className="text-2xl md:text-3xl font-black gl-gold-text gl-num">৳5,00,000</div>
              <button type="button" onClick={() => navigate("/tournaments")}
                className="clickable mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black text-[#04111F]"
                style={{ background: "var(--gl-grad-gold)", boxShadow: "0 10px 24px -10px rgba(212,175,55,0.6)" }}>
                Join Now <ArrowRight size={12} />
              </button>
            </div>

            <div className="flex gap-1.5">
              {[{ l: "Days", v: pad(days) }, { l: "Hours", v: pad(hrs) }, { l: "Min", v: pad(min) }, { l: "Sec", v: pad(sec) }].map(x => (
                <div key={x.l} className="min-w-[42px] rounded-lg bg-black/40 backdrop-blur border border-white/10 px-1.5 py-1 text-center">
                  <div className="text-sm font-black gl-text gl-num leading-none">{x.v}</div>
                  <div className="text-[8px] gl-text-dim mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Refer & Earn */}
      <motion.button type="button" onClick={() => navigate("/agent")} whileHover={{ y: -3 }}
        className="md:col-span-3 clickable relative rounded-3xl overflow-hidden border border-amber-400/25 text-left min-h-[180px]"
        style={{ background: "linear-gradient(135deg, #3A1A02 0%, #6B2E0E 60%, #1F0E04 100%)" }}>
        <div className="absolute -top-6 -right-4 w-40 h-40 rounded-full decorative pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(251,191,36,0.45), transparent 70%)", filter: "blur(24px)" }} />
        <div className="absolute right-3 bottom-2 text-6xl decorative pointer-events-none select-none">🎁</div>
        <div className="relative z-10 p-4 md:p-5">
          <Gift size={20} className="text-amber-200" />
          <div className="mt-2 text-base md:text-lg font-black gl-text">REFER & EARN</div>
          <div className="mt-1 text-[11px] gl-text-dim">Invite friends & get</div>
          <div className="text-sm font-bold gl-gold-text gl-num">up to ৳20,000</div>
          <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black text-[#04111F]"
            style={{ background: "var(--gl-grad-gold)" }}>
            Invite Now <ArrowRight size={12} />
          </span>
        </div>
      </motion.button>

      {/* VIP Club */}
      <motion.button type="button" onClick={() => navigate("/vip")} whileHover={{ y: -3 }}
        className="md:col-span-3 clickable relative rounded-3xl overflow-hidden border border-amber-400/25 text-left min-h-[180px]"
        style={{ background: "linear-gradient(135deg, #2A1A06 0%, #4A2D08 60%, #1A1004 100%)" }}>
        <div className="absolute -top-6 -right-4 w-44 h-44 rounded-full decorative pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(232,197,108,0.5), transparent 70%)", filter: "blur(28px)" }} />
        <div className="absolute right-2 bottom-1 text-6xl decorative pointer-events-none select-none drop-shadow">👑</div>
        <div className="relative z-10 p-4 md:p-5">
          <Crown size={20} className="text-amber-200" />
          <div className="mt-2 text-base md:text-lg font-black gl-gold-text">VIP CLUB</div>
          <div className="mt-1 text-[11px] gl-text-dim">Exclusive rewards</div>
          <div className="text-[11px] gl-text-dim">for VIP members</div>
          <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black text-[#04111F]"
            style={{ background: "var(--gl-grad-gold)" }}>
            View VIP <ArrowRight size={12} />
          </span>
        </div>
      </motion.button>
    </div>
  );
}
