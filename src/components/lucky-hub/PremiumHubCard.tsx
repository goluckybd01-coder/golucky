import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: "gold" | "emerald";
  stats?: { label: string; value: string }[];
  countdown?: string;
  footer?: ReactNode;
  onView?: () => void;
  disabled?: boolean;
  featureKey?: string;
}

export default function PremiumHubCard({
  title, description, icon, accent = "emerald", stats, countdown, footer, onView, disabled, featureKey,
}: Props) {
  const glow = accent === "gold"
    ? "from-amber-400/40 via-yellow-500/10 to-emerald-500/30"
    : "from-emerald-400/40 via-teal-500/10 to-amber-500/30";

  return (
    <motion.div
      data-testid={featureKey ? `lucky-hub-card-${featureKey}` : undefined}
      data-feature-key={featureKey}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative group rounded-3xl overflow-hidden"
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${glow} opacity-70 blur-xl group-hover:opacity-100 transition-opacity pointer-events-none`} />
      <div className="absolute inset-0 rounded-3xl p-[1.5px] bg-gradient-to-br from-amber-300/60 via-white/10 to-emerald-400/60 pointer-events-none">
        <div className="w-full h-full rounded-3xl bg-[#0a0f0d]/95" />
      </div>

      <div className="relative z-10 p-5 md:p-6 flex flex-col gap-4 min-h-[280px]">
        <div className="flex items-start justify-between">
          <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent === "gold" ? "from-amber-400 to-yellow-700" : "from-emerald-400 to-emerald-800"} shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/25" />
            <div className="relative text-white text-3xl drop-shadow-lg">{icon}</div>
          </div>
          {countdown && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300/70">Ends in</div>
              <div className="font-mono text-sm font-bold text-amber-300 tabular-nums">{countdown}</div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="mt-1 text-xs md:text-sm text-white/60 leading-relaxed line-clamp-3">{description}</p>
        </div>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-white/40">{s.label}</div>
                <div className="text-sm font-bold text-white tabular-nums truncate">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {footer}

        <button
          type="button"
          disabled={disabled}
          onClick={onView}
          className="mt-auto inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_6px_20px_rgba(251,191,36,0.35)] hover:shadow-[0_8px_28px_rgba(251,191,36,0.5)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {disabled ? "Coming Soon" : "View Details"} <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
