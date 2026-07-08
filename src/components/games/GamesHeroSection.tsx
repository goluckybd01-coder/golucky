import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, Bell, ChevronRight, Crown, ArrowRight, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * GamesHeroSection — matches the reference:
 *  1. Top bar (logo, wallet, VIP, bell, avatar)
 *  2. Agent Program banner
 *  3. Mega Jackpot ticker with MAJOR / MINOR / MINI tiers
 *  4. "PLAY & WIN BIG EVERY DAY" divider heading
 *  5. 12 themed category cards in a 4-col grid
 *  6. TOP GAME PROVIDERS strip
 */

type Cat = {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: keyof typeof colorMap;
  route?: string;
};

const colorMap = {
  emerald: { text: "text-emerald-300", border: "border-emerald-500/50", glow: "shadow-[0_0_35px_rgba(16,185,129,0.28)]", pillText: "text-emerald-200/90", pillBorder: "border-emerald-400/40", arrow: "bg-emerald-400", grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.35),rgba(16,185,129,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  violet:  { text: "text-violet-300",  border: "border-violet-500/50",  glow: "shadow-[0_0_35px_rgba(139,92,246,0.28)]",  pillText: "text-violet-200/90",  pillBorder: "border-violet-400/40",  arrow: "bg-violet-400",  grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.38),rgba(139,92,246,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  amber:   { text: "text-amber-300",   border: "border-amber-500/50",   glow: "shadow-[0_0_35px_rgba(245,158,11,0.28)]",  pillText: "text-amber-200/90",   pillBorder: "border-amber-400/40",   arrow: "bg-amber-400",   grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.35),rgba(245,158,11,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  sky:     { text: "text-sky-300",     border: "border-sky-500/50",     glow: "shadow-[0_0_35px_rgba(14,165,233,0.28)]",  pillText: "text-sky-200/90",     pillBorder: "border-sky-400/40",     arrow: "bg-sky-400",     grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.35),rgba(14,165,233,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  red:     { text: "text-red-400",     border: "border-red-500/50",     glow: "shadow-[0_0_35px_rgba(239,68,68,0.28)]",   pillText: "text-red-200/90",     pillBorder: "border-red-400/40",     arrow: "bg-red-500",     grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.38),rgba(239,68,68,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  yellow:  { text: "text-yellow-300",  border: "border-yellow-500/50",  glow: "shadow-[0_0_35px_rgba(234,179,8,0.28)]",   pillText: "text-yellow-200/90",  pillBorder: "border-yellow-400/40",  arrow: "bg-yellow-400",  grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.35),rgba(234,179,8,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  cyan:    { text: "text-cyan-300",    border: "border-cyan-500/50",    glow: "shadow-[0_0_35px_rgba(6,182,212,0.28)]",   pillText: "text-cyan-200/90",    pillBorder: "border-cyan-400/40",    arrow: "bg-cyan-400",    grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.35),rgba(6,182,212,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  fuchsia: { text: "text-fuchsia-300", border: "border-fuchsia-500/50", glow: "shadow-[0_0_35px_rgba(217,70,239,0.28)]",  pillText: "text-fuchsia-200/90", pillBorder: "border-fuchsia-400/40", arrow: "bg-fuchsia-400", grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.38),rgba(217,70,239,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
  rose:    { text: "text-rose-300",    border: "border-rose-500/50",    glow: "shadow-[0_0_35px_rgba(244,63,94,0.28)]",   pillText: "text-rose-200/90",    pillBorder: "border-rose-400/40",    arrow: "bg-rose-500",    grad: "bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.38),rgba(244,63,94,0.08)_45%,rgba(0,0,0,0.95)_85%)]" },
} as const;

const CATS: Cat[] = [
  { key: "all",     title: "ALL GAME",       subtitle: "120+ GAMES",  emoji: "🎮", color: "amber" },
  { key: "lottery", title: "LOTTERY",        subtitle: "4 GAMES",     emoji: "🎱", color: "violet" },
  { key: "crypto",  title: "GOLUCKY TRADING",subtitle: "50+ PAIRS",   emoji: "🐂", color: "emerald", route: "/binary-trading" },
  { key: "forex",   title: "FOREX TRADING",  subtitle: "30+ PAIRS",   emoji: "💱", color: "sky",     route: "/binary-trading" },
  { key: "crypto2", title: "CRYPTO TRADING", subtitle: "100+ COINS",  emoji: "₿",  color: "amber",   route: "/binary-trading" },
  { key: "aviator", title: "AVIATOR",        subtitle: "8 GAMES",     emoji: "✈️", color: "red",     route: "/aviator" },
  { key: "crash",   title: "CRASH",          subtitle: "12 GAMES",    emoji: "🚀", color: "emerald",   route: "/crash" },
  { key: "slot",    title: "SLOTS",          subtitle: "150+ GAMES",  emoji: "🎰", color: "yellow" },
  { key: "fishing", title: "FISHING",        subtitle: "20+ GAMES",   emoji: "🦈", color: "cyan" },
  { key: "table",   title: "TABLE",          subtitle: "25+ GAMES",   emoji: "🃏", color: "emerald" },
  { key: "arcade",  title: "ARCADE",         subtitle: "30+ GAMES",   emoji: "🕹️", color: "fuchsia" },
  { key: "live",    title: "LIVE CASINO",    subtitle: "50+ GAMES",   emoji: "💃", color: "rose" },
];

const AGENT_TIERS = [
  { level: 1, amount: "৳ 2 লাখ",   color: "emerald" },
  { level: 2, amount: "৳ 3.5 লাখ", color: "cyan" },
  { level: 3, amount: "৳ 5 লাখ",   color: "amber" },
  { level: 4, amount: "৳ 8 লাখ",   color: "violet" },
  { level: 5, amount: "৳ 12 লাখ",  color: "red" },
  { level: 6, amount: "৳ 15 লাখ",  color: "red" },
  { level: 7, amount: "৳ 25 লাখ",  color: "rose" },
] as const;

const PROVIDERS = [
  { name: "PRAGMATIC PLAY", color: "emerald" },
  { name: "EVOLUTION",      color: "amber" },
  { name: "PG SOFT",        color: "emerald" },
  { name: "JILI",           color: "amber" },
  { name: "SPRIBE",         color: "amber" },
  { name: "HACKSAW GAMING", color: "fuchsia" },
  { name: "BOOMING GAMES",  color: "amber" },
  { name: "PLAY'N GO",      color: "sky" },
  { name: "NETENT",         color: "sky" },
] as const;

interface Props {
  onCategorySelect: (key: string) => void;
  activeCategory?: string;
}

export default function GamesHeroSection({ onCategorySelect, activeCategory }: Props) {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
      if (data?.balance != null) setBalance(Number(data.balance));
    })();
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCat = (c: Cat) => (c.route ? navigate(c.route) : onCategorySelect(c.key));

  return (
    <div className="bg-black">
      {/* 1. Top bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1">
            <span className="text-2xl -mt-2">👑</span>
            <span className="text-3xl md:text-4xl font-black tracking-tight">
              <span className="text-emerald-400">Go</span>
              <span className="text-emerald-300">LUCKY</span>
            </span>
          </div>
          <div className="text-[10px] font-bold text-amber-200/90 tracking-[0.35em] mt-1 pl-7">
            PLAY · INVEST · EARN
          </div>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => navigate("/deposit")}
          className="flex items-center gap-2 bg-black/70 border border-emerald-500/40 rounded-full pl-3 pr-1 py-1 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
        >
          <Wallet className="h-4 w-4 text-emerald-300" />
          <span className="text-sm font-black text-white tabular-nums">৳ {fmt(balance)}</span>
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Plus className="h-4 w-4 text-black" strokeWidth={3} />
          </span>
        </button>

        <button
          onClick={() => navigate("/vip")}
          className="hidden sm:flex items-center gap-2 rounded-full border border-amber-400/60 bg-black/70 pl-2 pr-3 py-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
        >
          <Crown className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-black text-amber-200">VIP 5</span>
          <ChevronRight className="h-4 w-4 text-amber-300" />
        </button>

        <button className="relative h-9 w-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
          <Bell className="h-4 w-4 text-white/80" />
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center">5</span>
        </button>

        <button onClick={() => navigate("/account")} className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 border-2 border-emerald-300/60 flex items-center justify-center text-lg">👤</div>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black" />
        </button>
      </div>

      {/* 2. Agent recruitment banner */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-black via-amber-950/40 to-black shadow-[0_20px_60px_rgba(245,158,11,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(245,158,11,0.28),transparent_65%)]" />
          <div className="relative p-4 md:p-6">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8">
                <h2 className="text-xl md:text-3xl font-black leading-tight bg-gradient-to-b from-yellow-100 via-amber-200 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                  BECOME AN AGENT<br/>&amp; EARN BIG
                </h2>
                <div className="mt-1 text-[10px] md:text-xs font-bold tracking-wider text-white/80">
                  7 LEVELS · UNLIMITED INCOME · LIFETIME BENEFITS
                </div>
                <button
                  onClick={() => navigate("/agent/apply")}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/60 bg-black/60 text-amber-200 font-black text-xs md:text-sm shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                >
                  JOIN AGENT PROGRAM
                  <span className="h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-black" strokeWidth={3} />
                  </span>
                </button>
              </div>
              <div className="col-span-4 flex items-center justify-center">
                <div className="text-6xl md:text-8xl drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">🕴️</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] md:text-xs text-white/80">
              <span>★ High Commission</span>
              <span>◉ Daily Payout</span>
              <span>▣ Lifetime Earning</span>
              <span>👤 24/7 Support</span>
            </div>

            {/* Agent tier cards */}
            <div className="mt-3 grid grid-cols-7 gap-1.5 md:gap-2">
              {AGENT_TIERS.map((t) => {
                const cm = colorMap[t.color as keyof typeof colorMap];
                return (
                  <div
                    key={t.level}
                    className={`rounded-xl border ${cm.border} bg-black/60 py-2 px-1 text-center ${cm.glow}`}
                  >
                    <div className="text-base md:text-2xl leading-none">👑</div>
                    <div className={`mt-1 text-[8px] md:text-[10px] font-black tracking-widest ${cm.text}`}>AGENT {t.level}</div>
                    <div className="text-[9px] md:text-xs font-black text-amber-200 mt-0.5 tabular-nums whitespace-nowrap">{t.amount}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 12-category grid */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 gap-2 md:gap-4">

          {CATS.map((c) => {
            const cm = colorMap[c.color];
            const isActive = !c.route && activeCategory === c.key;
            return (
              <button
                key={c.key + c.title}
                onClick={() => handleCat(c)}
                aria-pressed={isActive}
                className={`group relative text-center rounded-xl md:rounded-2xl overflow-hidden border ${cm.border} ${cm.grad} p-2 md:p-4 ${cm.glow} hover:scale-[1.03] transition-transform ${
                  isActive
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-[1.02] brightness-110'
                    : ''
                }`}
              >
                {isActive && (
                  <span className="absolute top-1 right-1 text-[7px] md:text-[9px] font-black tracking-widest px-1.5 md:px-2 py-0.5 rounded-full bg-amber-400 text-black shadow-lg">
                    ACTIVE
                  </span>
                )}
                <div className="text-3xl md:text-7xl mb-1 md:mb-2 drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)]">{c.emoji}</div>
                <div className={`text-[10px] md:text-lg font-black tracking-wide leading-tight ${cm.text} drop-shadow-[0_0_10px_currentColor]`}>{c.title}</div>
                <div className="flex items-center justify-between mt-1.5 md:mt-3 gap-1">
                  <span className={`text-[7px] md:text-[10px] font-black tracking-wider px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full border bg-black/50 ${cm.pillBorder} ${cm.pillText} truncate`}>
                    {c.subtitle}
                  </span>
                  <span className={`h-4 w-4 md:h-7 md:w-7 shrink-0 rounded-full flex items-center justify-center ${cm.arrow} shadow-lg group-hover:translate-x-0.5 transition-transform`}>
                    <ArrowRight className="h-2 w-2 md:h-3.5 md:w-3.5 text-black" strokeWidth={3} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Mega Jackpot ticker (below the grid) */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-black via-amber-950/30 to-black p-3 md:p-4 flex items-center gap-3 md:gap-5 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-[10px] font-black tracking-widest text-amber-300 leading-none">MEGA</div>
              <div className="text-[10px] font-black tracking-widest text-amber-300 leading-none mt-0.5">JACKPOT</div>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-black text-amber-200 tabular-nums shrink-0">৳ 25,789,250.50</div>
          <Divider />
          <Tier label="MAJOR" amount="৳ 5,789,250" color="text-violet-300" />
          <Divider />
          <Tier label="MINOR" amount="৳ 789,250"   color="text-sky-300" />
          <Divider />
          <Tier label="MINI"  amount="৳ 289,250"   color="text-emerald-300" />
          <div className="flex-1" />
          <ChevronRight className="h-5 w-5 text-amber-300 shrink-0" />
        </div>
      </div>


      {/* 6. Top Game Providers */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-white/[0.02] to-black p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 mx-auto">
              <span className="text-amber-300">◆</span>
              <div className="text-amber-300 text-sm font-black tracking-[0.25em]">TOP GAME PROVIDERS</div>
              <span className="text-amber-300">◆</span>
            </div>
            <button className="shrink-0 inline-flex items-center gap-1 rounded-full border border-white/15 text-white/80 text-[11px] font-bold px-3 py-1.5">
              VIEW ALL <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {PROVIDERS.map((p) => {
              const cm = colorMap[p.color as keyof typeof colorMap];
              return (
                <div
                  key={p.name}
                  className={`rounded-xl border ${cm.border} bg-black/60 py-3 px-3 flex items-center justify-center text-center ${cm.glow}`}
                >
                  <span className={`text-[11px] md:text-xs font-black tracking-wider ${cm.text}`}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const Divider = () => <div className="h-8 w-px bg-white/10 shrink-0" />;

const Tier = ({ label, amount, color }: { label: string; amount: string; color: string }) => (
  <div className="shrink-0">
    <div className={`text-[10px] font-black tracking-widest ${color}`}>{label}</div>
    <div className="text-sm md:text-base font-black text-white/90 tabular-nums">{amount}</div>
  </div>
);
