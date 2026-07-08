import { useNavigate } from "react-router-dom";
import PageScaffold from "@/components/templates/PageScaffold";

const GAMES = [
  {
    name: "Win Go",
    subtitle: "Guess Number",
    desc: "Green/Red/Violet to win",
    emoji: "🎰",
    route: "/game/win-go",
    modes: ["1Min", "3Min", "5Min", "10Min"],
    gradient: "from-rose-500/90 to-red-600/90",
    accent: "shadow-rose-500/20",
  },
  {
    name: "K3",
    subtitle: "Guess Number",
    desc: "Big/Small/Odd/Even",
    emoji: "🎲",
    route: "/game/k3",
    modes: ["1Min", "3Min", "5Min", "10Min"],
    gradient: "from-amber-500/90 to-orange-600/90",
    accent: "shadow-amber-500/20",
  },
  {
    name: "5D",
    subtitle: "Guess Number",
    desc: "Big/Small/Odd/Even",
    emoji: "🟢",
    route: "/game/5d",
    modes: ["1Min", "3Min", "5Min", "10Min"],
    gradient: "from-emerald-500/90 to-teal-600/90",
    accent: "shadow-emerald-500/20",
  },
  {
    name: "Trx Win",
    subtitle: "Guess Number",
    desc: "Green/Red/Violet to win",
    emoji: "💎",
    route: "/game/trx-win",
    modes: ["1Min", "3Min", "5Min", "10Min"],
    gradient: "from-violet-500/90 to-purple-600/90",
    accent: "shadow-violet-500/20",
  },
  {
    name: "MotoRace",
    subtitle: "In the competition",
    desc: "Bet on the top three",
    emoji: "🏍️",
    route: "/game/motorace",
    modes: ["1Min", "3Min", "5Min"],
    gradient: "from-sky-500/90 to-blue-600/90",
    accent: "shadow-sky-500/20",
  },
  {
    name: "VideoWinGo",
    subtitle: "Live Number Result",
    desc: "Guess Number, Colour, Odd/Even or Size",
    emoji: "🎡",
    route: "/game/video-wingo",
    modes: ["1Min", "3Min", "5Min", "10Min"],
    gradient: "from-fuchsia-500/90 to-pink-600/90",
    accent: "shadow-fuchsia-500/20",
  },
];

export default function Lottery() {
  const navigate = useNavigate();
  return (
    <PageScaffold
      title="Lottery Games | GoLucky"
      description="Play Win Go, K3, 5D, Trx Win and more premium lottery games on GoLucky."
      canonicalPath="/lottery"
    >
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl">
          <h1 className="text-base font-extrabold tracking-wide">
            <span className="text-amber-400">|</span> Lottery
          </h1>
        </header>

        <div className="flex flex-col gap-3 px-4 py-4">
          {GAMES.map((game) => (
            <div
              key={game.name}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${game.gradient} p-4 shadow-lg ${game.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-extrabold text-white">
                    {game.name}
                  </div>
                  <div className="text-xs font-medium text-white/80">
                    {game.subtitle}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/70">
                    {game.desc}
                  </div>
                </div>
                <div className="text-4xl leading-none opacity-90">
                  {game.emoji}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {game.modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      navigate(
                        `${game.route}?mode=${mode.replace("Min", "min")}`,
                      )
                    }
                    className="min-h-[44px] rounded-full border border-white/30 bg-white/15 px-4 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageScaffold>
  );
}
