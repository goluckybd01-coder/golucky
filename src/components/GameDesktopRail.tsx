import { Rocket, Plane, TrendingUp, Users, Trophy, Sparkles } from "lucide-react";

interface GameDesktopRailProps {
  game: "crash" | "aviator";
}

/**
 * Desktop-only side rail shown next to the 430px mobile shell on
 * /game/crash and /game/aviator. Hidden on tablet/mobile so the
 * mobile 430px shell rule stays intact.
 */
const GameDesktopRail = ({ game }: GameDesktopRailProps) => {
  const theme = game === "aviator"
    ? {
        title: "Aviator",
        Icon: Plane,
        tagline: "Cash out before the plane flies away",
        accent: "from-emerald-500/30 via-amber-400/20 to-transparent",
      }
    : {
        title: "Crash",
        Icon: Rocket,
        tagline: "Ride the rocket. Cash out before it crashes.",
        accent: "from-emerald-500/30 via-amber-400/20 to-transparent",
      };

  const Icon = theme.Icon;

  return (
    <div className="h-full w-full flex flex-col gap-5 p-6 text-white">
      <div className={`rounded-2xl p-6 bg-gradient-to-br ${theme.accent} border border-white/10 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <Icon className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">GoLucky</div>
            <div className="text-2xl font-bold">{theme.title}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/70">{theme.tagline}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Players online", value: "12.4K", Icon: Users },
          { label: "Top win today", value: "৳18.2L", Icon: Trophy },
          { label: "Avg multiplier", value: "2.41×", Icon: TrendingUp },
          { label: "Lucky streak", value: "7 in a row", Icon: Sparkles },
        ].map(({ label, value, Icon: I }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <I className="h-3.5 w-3.5" />
              {label}
            </div>
            <div className="mt-1 text-lg font-semibold text-amber-200">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex-1 min-h-0">
        <div className="text-sm font-semibold text-white/80 mb-3">How to play</div>
        <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
          <li>Place your bet before the round starts.</li>
          <li>Watch the multiplier climb in real time.</li>
          <li>Tap <span className="text-amber-300 font-semibold">Cash Out</span> before it crashes to lock your win.</li>
        </ol>
        <div className="mt-4 text-xs text-white/50">
          Provably fair · Atomic settlement · BDT payouts
        </div>
      </div>

      <div className="text-[11px] text-white/40 text-center">
        Desktop companion view · Mobile shell preserved at 430px
      </div>
    </div>
  );
};

export default GameDesktopRail;
