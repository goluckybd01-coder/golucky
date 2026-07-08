import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const d = Math.max(0, target - now);
  const days = Math.floor(d / 86_400_000);
  const hrs  = Math.floor((d / 3_600_000) % 24);
  const min  = Math.floor((d / 60_000) % 60);
  const sec  = Math.floor((d / 1000) % 60);
  return { days, hrs, min, sec };
}

export default function TournamentEventCard() {
  const navigate = useNavigate();
  const target = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 14;
  const { days, hrs, min, sec } = useCountdown(target);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-3xl overflow-hidden border border-fuchsia-400/20 h-full"
      style={{ background: "linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #831843 100%)" }}
    >
      <div className="absolute inset-0 decorative pointer-events-none opacity-60"
        style={{ background: "radial-gradient(120% 80% at 80% 20%, rgba(244,114,182,0.3), transparent 60%)" }} />
      <div className="absolute -bottom-10 -right-8 w-48 h-48 rounded-full decorative pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(251,191,36,0.35), transparent 70%)", filter: "blur(20px)" }} />

      <div className="relative z-10 p-4 md:p-5 flex flex-col h-full">
        <span className="self-start inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-fuchsia-500/30 text-fuchsia-100 border border-fuchsia-300/30">
          EVENT
        </span>
        <div className="mt-2 text-lg md:text-xl font-black gl-text leading-tight">Summer Splash</div>
        <div className="text-[11px] font-bold text-fuchsia-200/90 uppercase tracking-wider">Tournament</div>

        <div className="mt-3">
          <div className="text-[10px] gl-text-dim">Prize Pool</div>
          <div className="text-2xl md:text-3xl font-black gl-gold-text gl-num">৳5,00,000</div>
        </div>

        <div className="mt-3">
          <div className="text-[9px] gl-text-dim mb-1">Ends in</div>
          <div className="flex gap-1.5">
            {[
              { l: "Days", v: pad(days) }, { l: "Hours", v: pad(hrs) },
              { l: "Min", v: pad(min) },   { l: "Sec",   v: pad(sec) },
            ].map((x) => (
              <div key={x.l} className="flex-1 rounded-lg bg-black/30 backdrop-blur border border-white/10 px-1 py-1 text-center">
                <div className="text-sm font-black gl-text gl-num leading-none">{x.v}</div>
                <div className="text-[8px] gl-text-dim mt-0.5">{x.l}</div>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => navigate("/tournaments")}
          className="clickable mt-auto pt-3 self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black text-[#04111F]"
          style={{ background: "var(--gl-grad-gold)", boxShadow: "0 10px 24px -10px rgba(212,175,55,0.6)" }}>
          Join Now →
        </button>
      </div>
    </motion.div>
  );
}
