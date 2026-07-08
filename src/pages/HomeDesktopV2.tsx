import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import {
  Bell, Plus, Wallet, ArrowRightLeft, Crown, Gift, Users, Home as HomeIcon,
  Sparkles, Ticket, LineChart, Trophy, Radio, Fish, Plane, Zap, Grid3x3,
  ChevronRight, Play, Shield, Star, Bot, Palmtree, TrendingUp, TrendingDown,
  Download, CheckCircle2, Rocket, Dice5, Club, ArrowRight,
} from "lucide-react";

/* ============================================================
   Home Desktop V2 — pixel-close mirror of reference design
   All colors reuse existing tokens (--background, --card, gold, emerald).
   ============================================================ */

const gold = "text-amber-400";
const goldSoft = "text-amber-300/80";
const cardBase =
  "rounded-xl border border-amber-500/20 bg-[hsl(var(--card))]/60 backdrop-blur";
const goldBorder = "border border-amber-500/30";

export default function HomeDesktopV2() {
  const navigate = useNavigate();
  const { balance } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050b18] via-[#07101f] to-[#050b18] text-slate-100">
      <TopBar navigate={navigate} balance={Number(balance || 0)} />
      <NoticeTicker />

      <div className="mx-auto max-w-[1440px] px-4 py-4 grid grid-cols-[210px_1fr_320px] gap-4">
        <LeftSidebar navigate={navigate} />

        <main className="min-w-0 space-y-4">
          <AgentHero navigate={navigate} />
          <BenefitsStrip />
          <CategoryChips navigate={navigate} />
          <FeatureGamesGrid navigate={navigate} />
          <MiniPromoRow navigate={navigate} />
          <LiveWinners />
          <div className="grid grid-cols-2 gap-4">
            <AIPredictionCard />
            <AgentPromoCard navigate={navigate} />
          </div>
          <GameLobbyRow navigate={navigate} />
          <AboutFooter />
        </main>

        <aside className="space-y-4">
          <TradingPanel navigate={navigate} />
          <CoinsList />
        </aside>
      </div>
    </div>
  );
}

/* ── Top Bar ── */
function TopBar({ navigate, balance }: { navigate: (p: string) => void; balance: number }) {
  const items = [
    { icon: Wallet, label: "Withdraw", to: "/withdraw" },
    { icon: ArrowRightLeft, label: "Transfer", to: "/wallet" },
    { icon: Crown, label: "VIP Club", to: "/vip" },
    { icon: Gift, label: "Rewards", to: "/promotion" },
    { icon: Users, label: "Refer & Earn", to: "/agent-apply" },
  ];
  return (
    <header className="border-b border-amber-500/20 bg-black/40 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-[1440px] px-4 h-16 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex flex-col leading-none">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            GoLucky
          </span>
          <span className="text-[9px] tracking-[0.3em] text-amber-400/70">PLAY • WIN • EARN</span>
        </button>

        <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/60 px-3 py-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-yellow-600 grid place-items-center text-[10px] font-black text-black">G</div>
          <div className="leading-tight">
            <div className="text-[10px] text-amber-300/70">GoLucky Coin</div>
            <div className="text-xs font-bold text-amber-200">GLC {balance.toFixed(2)}</div>
          </div>
        </div>

        <button
          onClick={() => navigate("/deposit")}
          className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          <Plus className="w-4 h-4" /> Deposit
        </button>

        <nav className="flex items-center gap-1 ml-2">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => navigate(it.to)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 transition"
            >
              <it.icon className="w-4 h-4" />
              <span className="text-[10px]">{it.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-amber-500/10">
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold grid place-items-center">5</span>
          </button>
          <button
            onClick={() => navigate("/account")}
            className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/60 pl-1 pr-3 py-1"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-600" />
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-slate-100">Rakib Hasan</div>
              <div className="text-[9px] text-amber-300">👑 VIP 5</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Notice Ticker ── */
function NoticeTicker() {
  const items = [
    { icon: "🎉", text: "Rakib Hasan Won ৳52,500 in Wingo" },
    { icon: "💰", text: "Mega Jackpot ৳1,25,78,500.75" },
    { icon: "👑", text: "New TRX Win Game is Live" },
    { icon: "🔥", text: "Summer Flash Sale is Live" },
  ];
  return (
    <div className="border-b border-amber-500/10 bg-black/30">
      <div className="mx-auto max-w-[1440px] px-4 h-9 flex items-center gap-6 overflow-hidden">
        <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black">NOTICE</span>
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 whitespace-nowrap">
            <span>{it.icon}</span>
            <span>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Left Sidebar ── */
function LeftSidebar({ navigate }: { navigate: (p: string) => void }) {
  const nav = [
    { icon: HomeIcon, label: "Home", to: "/", active: true },
    { icon: Sparkles, label: "Lucky Spin", to: "/lucky-hub", badge: "HOT" },
    { icon: Ticket, label: "Lottery", to: "/games/lottery" },
    { icon: LineChart, label: "Crypto Trading", to: "/trading" },
    { icon: Trophy, label: "Sports", to: "/games/sports" },
    { icon: Radio, label: "Live Casino", to: "/games/live" },
    { icon: Fish, label: "Fishing", to: "/games/fishing" },
    { icon: Plane, label: "Aviator", to: "/aviator" },
    { icon: Zap, label: "Crash", to: "/crash" },
    { icon: Dice5, label: "Slots", to: "/games/slots" },
    { icon: Grid3x3, label: "More Games", to: "/games" },
  ];
  return (
    <aside className="space-y-3">
      <div className={cardBase + " p-2"}>
        {nav.map((n) => (
          <button
            key={n.label}
            onClick={() => navigate(n.to)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
              n.active
                ? "bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-300 border-l-2 border-emerald-400"
                : "text-slate-300 hover:bg-amber-500/10 hover:text-amber-300"
            }`}
          >
            <n.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{n.label}</span>
            {n.badge && (
              <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-black">{n.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className={cardBase + " p-3 text-center"}>
        <div className="text-xs font-bold text-amber-300 mb-1">Lucky Spin</div>
        <div className="text-[10px] text-slate-400 mb-2">Spin & Win</div>
        <div className="relative mx-auto w-28 h-28 rounded-full bg-gradient-conic from-red-500 via-yellow-400 to-emerald-500 p-1">
          <div className="w-full h-full rounded-full bg-black/60 grid place-items-center">
            <div className="w-6 h-6 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
          </div>
        </div>
        <button
          onClick={() => navigate("/lucky-hub")}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-1.5 text-xs font-bold text-black"
        >
          Spin Now
        </button>
      </div>

      <div className={cardBase + " p-3 text-center"}>
        <div className="text-xs font-bold text-amber-300 mb-1">Daily Check-In</div>
        <div className="text-[10px] text-slate-400 mb-2">Claim Free Reward</div>
        <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-red-700 grid place-items-center text-3xl">🎁</div>
        <button
          onClick={() => navigate("/activity")}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-1.5 text-xs font-bold text-black"
        >
          Check In
        </button>
      </div>

      <div className={cardBase + " p-3 text-center"}>
        <div className="text-xs font-bold text-amber-300 mb-1">Download App</div>
        <div className="text-[10px] text-slate-400 mb-2">Play Anytime Anywhere</div>
        <div className="flex justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded bg-emerald-500/20 grid place-items-center text-lg">🤖</div>
          <div className="w-8 h-8 rounded bg-slate-500/20 grid place-items-center text-lg"></div>
        </div>
        <button
          onClick={() => navigate("/install")}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-1.5 text-xs font-bold text-black flex items-center justify-center gap-1"
        >
          <Download className="w-3 h-3" /> Download
        </button>
      </div>
    </aside>
  );
}

function AgentHero({ navigate }: { navigate: (p: string) => void }) {
  const perks = [
    "Agent to User সরাসরি টাকা লুৎনাফার",
    "User Details, Activity & Wallet View",
    "High % Agent Commission",
    "Instant Settlement & 24/7 Support",
  ];
  const tiers = [
    { icon: Shield, label: "STARTER", color: "text-emerald-400" },
    { icon: Shield, label: "SILVER", color: "text-slate-300" },
    { icon: Shield, label: "GOLD", color: "text-amber-400" },
    { icon: Shield, label: "PLATINUM", color: "text-sky-400" },
    { icon: Shield, label: "DIAMOND", color: "text-purple-400" },
    { icon: Star, label: "ELITE", color: "text-red-400" },
    { icon: Crown, label: "ROYAL PARTNER", color: "text-amber-300" },
  ];
  return (
    <div className={`${cardBase} p-5 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(245,158,11,0.15),transparent_60%)]" />
      <div className="relative grid grid-cols-2 gap-6">
        <div>
          <div className="inline-block rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 mb-2">GoLucky</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            AGENT PROGRAMME
          </h1>
          <div className="text-sm text-amber-200 mt-1 mb-4">
            7টি ক্যাটাগরিতে এজেন্ট হওয়ার সুযোগ
          </div>
          <ul className="space-y-1.5 mb-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {p}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/agent-apply")}
            className="rounded-full border-2 border-amber-400 bg-amber-500/10 px-5 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/20 inline-flex items-center gap-2"
          >
            Become an Agent Today <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 rounded-xl border border-emerald-500/50 bg-black/60 p-3 text-center">
              <div className="text-[10px] text-emerald-300">AGENT WALLET</div>
              <div className="text-lg font-black text-emerald-300">৳ 1,25,780.75</div>
            </div>
            <div className="text-2xl">👨‍💼</div>
            <div className="flex-1 rounded-xl border border-amber-500/50 bg-black/60 p-3 text-center">
              <div className="text-[10px] text-amber-300">USER WALLET</div>
              <div className="text-lg font-black text-amber-300">৳ 25,850.50</div>
            </div>
          </div>
          <div className="text-[10px] text-amber-300 mt-2">Instant Transfer Agent to User</div>
        </div>
      </div>

      <div className="relative mt-5 pt-4 border-t border-amber-500/20">
        <div className="text-center text-xs text-amber-300 font-bold mb-3">7 AGENT CATEGORIES</div>
        <div className="grid grid-cols-7 gap-2">
          {tiers.map((t) => (
            <div key={t.label} className="rounded-lg border border-amber-500/20 bg-black/40 p-2 text-center">
              <t.icon className={`w-6 h-6 mx-auto ${t.color}`} />
              <div className="text-[9px] text-slate-200 font-bold mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitsStrip() {
  const items = [
    { icon: ArrowRightLeft, title: "Direct Transfer", sub: "Agent to User" },
    { icon: Users, title: "User Management", sub: "View User Details" },
    { icon: TrendingUp, title: "High Commission", sub: "Up to Highest %" },
    { icon: Zap, title: "Instant Settlement", sub: "Real-time Payout" },
    { icon: Shield, title: "Secure & Safe", sub: "100% Protected" },
    { icon: Crown, title: "Exclusive Benefits", sub: "VIP Support & More" },
  ];
  return (
    <div className={`${cardBase} p-3 grid grid-cols-6 gap-3`}>
      {items.map((it) => (
        <div key={it.title} className="flex items-center gap-2">
          <it.icon className="w-5 h-5 text-emerald-400" />
          <div className="leading-tight">
            <div className="text-[11px] font-bold text-slate-100">{it.title}</div>
            <div className="text-[9px] text-slate-400">{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryChips({ navigate }: { navigate: (p: string) => void }) {
  const cats = [
    { emoji: "🎱", label: "Lottery", to: "/games/lottery", color: "from-blue-500 to-blue-700" },
    { emoji: "₿", label: "Crypto Trading", to: "/trading", color: "from-amber-400 to-amber-600" },
    { emoji: "⚽", label: "Sports", to: "/games/sports", color: "from-slate-600 to-slate-800" },
    { emoji: "🎴", label: "Live Casino", to: "/games/live", color: "from-red-500 to-red-700" },
    { emoji: "🐟", label: "Fishing", to: "/games/fishing", color: "from-cyan-500 to-cyan-700" },
    { emoji: "✈️", label: "Aviator", to: "/aviator", color: "from-red-600 to-red-900" },
    { emoji: "🚀", label: "Crash", to: "/crash", color: "from-orange-500 to-red-600" },
    { emoji: "🎰", label: "Slots", to: "/games/slots", color: "from-purple-500 to-purple-700" },
    { emoji: "♠️", label: "Table", to: "/games/table", color: "from-emerald-600 to-emerald-800" },
    { emoji: "🕹️", label: "Arcade", to: "/games/arcade", color: "from-emerald-500 to-teal-600" },
    { emoji: "⋯", label: "More", to: "/games", color: "from-amber-500 to-yellow-600" },
  ];
  return (
    <div className={`${cardBase} p-3 grid grid-cols-11 gap-2`}>
      {cats.map((c) => (
        <button
          key={c.label}
          onClick={() => navigate(c.to)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${c.color} grid place-items-center text-xl shadow-lg group-hover:scale-110 transition`}>
            {c.emoji}
          </div>
          <div className="text-[10px] text-slate-300 group-hover:text-amber-300">{c.label}</div>
        </button>
      ))}
    </div>
  );
}

function FeatureGamesGrid({ navigate }: { navigate: (p: string) => void }) {
  const games = [
    { name: "WINGO", emoji: "🎱", players: "12,457", badges: ["HOT", "HOT"], to: "/games/wingo", color: "from-blue-500 to-red-500" },
    { name: "K3", emoji: "🎲", players: "8,745", badges: ["HOT", "HOT"], to: "/games/k3", color: "from-red-500 to-orange-500" },
    { name: "TRX WIN", emoji: "🔺", players: "7,658", badges: ["LIVE", "LIVE"], to: "/games/trxwin", color: "from-red-600 to-red-900" },
    { name: "CASINO", emoji: "🎰", players: "15,245", badges: ["LIVE"], to: "/games/live", color: "from-amber-500 to-red-600" },
  ];
  return (
    <div>
      <SectionHead title="FEATURE GAMES" cta="View All" onCta={() => navigate("/games")} />
      <div className="grid grid-cols-4 gap-3">
        {games.map((g) => (
          <button
            key={g.name}
            onClick={() => navigate(g.to)}
            className={`${cardBase} relative overflow-hidden aspect-[4/5] p-4 flex flex-col items-center justify-between hover:border-amber-400 transition`}
          >
            <div className="absolute top-2 left-2 flex gap-1">
              {g.badges.map((b, i) => (
                <span key={i} className={`rounded px-1.5 py-0.5 text-[8px] font-black ${b === "HOT" ? "bg-red-500" : "bg-emerald-500"} text-black`}>
                  {b}
                </span>
              ))}
            </div>
            <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${g.color} grid place-items-center text-5xl mt-4`}>
              {g.emoji}
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-300">{g.name}</div>
              <div className="text-[10px] text-slate-400 mt-1">👥 {g.players}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniPromoRow({ navigate }: { navigate: (p: string) => void }) {
  const cards = [
    {
      title: "AI Game Predictor", live: true, to: "/ai-assistant",
      body: (
        <div className="mt-2">
          <div className="text-[10px] text-slate-400">WINGO</div>
          <div className="text-[10px] text-slate-300">Win Prediction</div>
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-[9px] text-slate-400">Confidence</div>
              <div className="text-sm font-bold text-emerald-400">92.68%</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 grid place-items-center text-xs font-black text-emerald-400">9.2</div>
          </div>
        </div>
      ),
      cta: "View Prediction",
    },
    {
      title: "Live Jackpot", live: true, to: "/lucky-hub",
      body: (
        <div className="mt-2 text-center">
          <div className="text-base font-black text-amber-300">৳ 1,25,78,500.75</div>
          <div className="text-4xl">🏆</div>
          <div className="text-[10px] text-slate-400 mt-1">24,785+ Participants</div>
        </div>
      ),
      cta: "Join Now",
    },
    {
      title: "AI Assistant", to: "/ai-assistant",
      body: (
        <div className="mt-2 text-center">
          <div className="text-3xl">🤖</div>
          <div className="text-[11px] font-bold mt-1">24/7</div>
          <div className="text-[10px] text-slate-400">Ready to Help</div>
        </div>
      ),
      cta: "Chat Now",
    },
    {
      title: "Summer Bonus", to: "/promotion",
      body: (
        <div className="mt-2 text-center">
          <Palmtree className="w-8 h-8 mx-auto text-emerald-400" />
          <div className="text-[10px] text-slate-300 mt-1">Up to 50% Bonus</div>
          <div className="text-[11px] font-black text-amber-300 mt-1">23 : 45 : 30</div>
        </div>
      ),
      cta: "Claim Now",
    },
    {
      title: "Refer & Earn", to: "/agent-apply",
      body: (
        <div className="mt-2 text-center">
          <div className="text-3xl">👥</div>
          <div className="text-[10px] text-slate-300 mt-1">Earn Unlimited</div>
          <div className="text-[10px] text-slate-400">Invite Friends</div>
        </div>
      ),
      cta: "Invite Now",
    },
    {
      title: "VIP Club", to: "/vip",
      body: (
        <div className="mt-2 text-center">
          <Crown className="w-8 h-8 mx-auto text-amber-400" />
          <div className="text-[10px] text-slate-300 mt-1">Exclusive Benefits</div>
        </div>
      ),
      cta: "View VIP",
    },
  ];
  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.title} className={`${cardBase} p-3 flex flex-col`}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-amber-300">{c.title}</div>
            {c.live && <span className="rounded bg-red-500 px-1 text-[8px] font-black text-black">LIVE</span>}
          </div>
          <div className="flex-1">{c.body}</div>
          <button
            onClick={() => navigate(c.to)}
            className="mt-2 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 py-1 text-[10px] font-bold text-black"
          >
            {c.cta}
          </button>
        </div>
      ))}
    </div>
  );
}

function LiveWinners() {
  const winners = [
    { name: "Rakib Hasan", game: "Wingo", amt: "৳ 52,500.00", ago: "Just Now" },
    { name: "Nusrat Jahan", game: "K3 Lottery", amt: "৳ 31,000.00", ago: "1 min ago" },
    { name: "MD. Al Amin", game: "TRX Win", amt: "৳ 75,000.00", ago: "2 min ago" },
    { name: "Jannat Islam", game: "5D Lottery", amt: "৳ 21,000.00", ago: "3 min ago" },
    { name: "Sakib Ahmed", game: "Aviator", amt: "৳ 18,500.00", ago: "4 min ago" },
    { name: "MD. Rony", game: "Casino", amt: "৳ 45,000.00", ago: "5 min ago" },
  ];
  return (
    <div className={cardBase + " p-4"}>
      <SectionHead title="LIVE WINNERS" cta="View All" onCta={() => {}} inline />
      <div className="grid grid-cols-6 gap-3 mt-3">
        {winners.map((w) => (
          <div key={w.name} className="text-center">
            <div className="relative mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-800 grid place-items-center text-xl">👤</div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs">🇧🇩</span>
            </div>
            <div className="text-[11px] font-bold text-slate-100 mt-2">{w.name}</div>
            <div className="text-[9px] text-slate-400">{w.game}</div>
            <div className="text-[11px] font-black text-emerald-400 mt-0.5">{w.amt}</div>
            <div className="text-[9px] text-slate-500">{w.ago}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPredictionCard() {
  return (
    <div className={cardBase + " p-4 flex items-center gap-4"}>
      <div className="w-24 h-24 rounded-full bg-gradient-conic from-cyan-500 via-purple-500 to-amber-400 p-1">
        <div className="w-full h-full rounded-full bg-black grid place-items-center text-2xl">🤖</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-300">AI PREDICTION</span>
          <span className="rounded bg-red-500 px-1 text-[8px] font-black text-black">LIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
          <div>
            <div className="text-slate-400">Current Game</div>
            <div className="font-black text-amber-300">WINGO</div>
          </div>
          <div>
            <div className="text-slate-400">Prediction</div>
            <div className="font-black text-emerald-400">BIG · 92.68%</div>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[2, 4, 7, 9, 1].map((n, i) => (
            <div key={i} className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-black text-white ${
              [2,4].includes(n) ? "bg-red-500" : n === 7 ? "bg-amber-500" : "bg-emerald-500"
            }`}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentPromoCard({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className={cardBase + " p-4 relative overflow-hidden"}>
      <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle,rgba(245,158,11,0.25),transparent)]" />
      <div className="relative">
        <div className="text-lg font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
          AGENT PROGRAMME
        </div>
        <div className="text-[11px] text-slate-300">High Commission • Instant Payout • Lifetime Earning</div>
        <div className="grid grid-cols-3 gap-2 my-3">
          {[
            { l: "Up to 25 Lakh", s: "Monthly Income" },
            { l: "Weekly Bonus", s: "Extra Earning" },
            { l: "Dedicated Support", s: "24/7 Service" },
          ].map((i) => (
            <div key={i.l} className="rounded-md border border-amber-500/20 bg-black/40 p-2 text-center">
              <div className="text-[10px] font-bold text-amber-300">{i.l}</div>
              <div className="text-[9px] text-slate-400">{i.s}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate("/agent-apply")}
          className="rounded-full border-2 border-amber-400 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300"
        >
          Become Agent →
        </button>
      </div>
    </div>
  );
}

function GameLobbyRow({ navigate }: { navigate: (p: string) => void }) {
  const games = [
    { name: "Wingo", emoji: "🎱", to: "/games/wingo", color: "from-blue-500 to-red-500" },
    { name: "K3 Lottery", emoji: "🎲", to: "/games/k3", color: "from-red-500 to-orange-500" },
    { name: "5D Lottery", emoji: "5D", to: "/games/5d", color: "from-slate-400 to-slate-600" },
    { name: "TRX Win", emoji: "🔺", to: "/games/trxwin", color: "from-red-600 to-red-900" },
    { name: "Aviator", emoji: "✈️", to: "/aviator", color: "from-red-600 to-red-900" },
    { name: "Crash", emoji: "🚀", to: "/crash", color: "from-orange-500 to-red-700" },
    { name: "Casino", emoji: "🎰", to: "/games/live", color: "from-red-500 to-red-700" },
    { name: "Slots", emoji: "777", to: "/games/slots", color: "from-red-500 to-amber-600" },
  ];
  return (
    <div className={cardBase + " p-4"}>
      <SectionHead title="GAME LOBBY" cta="View All" onCta={() => navigate("/games")} inline />
      <div className="grid grid-cols-8 gap-3 mt-3">
        {games.map((g) => (
          <button
            key={g.name}
            onClick={() => navigate(g.to)}
            className="group"
          >
            <div className={`aspect-square rounded-xl bg-gradient-to-br ${g.color} grid place-items-center text-3xl font-black shadow-lg group-hover:scale-105 transition`}>
              {g.emoji}
            </div>
            <div className="text-[10px] text-slate-300 mt-1.5 font-bold">{g.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AboutFooter() {
  return (
    <div className={cardBase + " p-4 grid grid-cols-[1fr_auto_auto] gap-6 items-center"}>
      <div>
        <div className="text-xs font-black text-amber-300">ABOUT GOLUCKY</div>
        <div className="text-[10px] text-slate-400 mt-1">
          GoLucky is a trusted gaming platform where you can Play, Win & Earn every day.
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Fastest Payout • Secure Platform • 24/7 Support</div>
        <button className="mt-2 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-bold text-emerald-300">
          Read More
        </button>
      </div>
      <div className="flex items-center gap-3">
        {[
          { i: Shield, l: "100% Secure", s: "SSL Encrypted" },
          { i: CheckCircle2, l: "Fair Play", s: "Provably Fair" },
          { i: Star, l: "Licensed", s: "Global License" },
          { i: Bot, l: "24/7 Support", s: "Always For You" },
        ].map((f) => (
          <div key={f.l} className="text-center">
            <f.i className="w-5 h-5 mx-auto text-amber-400" />
            <div className="text-[9px] font-bold text-slate-200 mt-0.5">{f.l}</div>
            <div className="text-[8px] text-slate-500">{f.s}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-300">
        {["bKash", "Nagad", "Rocket", "VISA", "MC", "USDT"].map((p) => (
          <div key={p} className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700">{p}</div>
        ))}
      </div>
    </div>
  );
}

function TradingPanel({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className={cardBase + " p-3"}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-amber-300">GoLucky Trading</div>
        <button onClick={() => navigate("/trading")} className="text-[10px] text-emerald-400">Open →</button>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-sm font-bold text-slate-100">BTC/USDT</span>
        <span className="text-emerald-400 text-xs font-bold">67,582.50</span>
        <span className="text-emerald-400 text-[10px]">+2.45%</span>
      </div>
      <div className="text-[9px] text-slate-500">Bitcoin</div>

      <div className="mt-2 h-24 rounded-md bg-black/40 relative overflow-hidden">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <polyline
            fill="none"
            stroke="hsl(160 84% 45%)"
            strokeWidth="1"
            points="0,30 10,28 20,25 30,22 40,24 50,18 60,20 70,14 80,12 90,8 100,6"
          />
          <polygon
            fill="hsl(160 84% 45% / 0.2)"
            points="0,30 10,28 20,25 30,22 40,24 50,18 60,20 70,14 80,12 90,8 100,6 100,40 0,40"
          />
        </svg>
      </div>

      <div className="mt-2 flex gap-1 text-[9px]">
        {["1M", "30M", "1H", "4H", "1D", "More"].map((t) => (
          <button key={t} className="flex-1 rounded bg-slate-800/60 py-1 text-slate-300 hover:bg-amber-500/20">{t}</button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="rounded-md bg-emerald-500 py-2 text-xs font-black text-black">BUY CALL</button>
        <button className="rounded-md bg-red-500 py-2 text-xs font-black text-white">BUY PUT</button>
      </div>
    </div>
  );
}

function CoinsList() {
  const coins = [
    { s: "BTC/USDT", p: "67,582.50", c: "+2.45%", up: true },
    { s: "ETH/USDT", p: "3,452.25", c: "+1.25%", up: true },
    { s: "SOL/USDT", p: "165.35", c: "+3.25%", up: true },
    { s: "BNB/USDT", p: "592.45", c: "+1.05%", up: true },
    { s: "XRP/USDT", p: "0.5286", c: "+1.45%", up: true },
    { s: "LTC/USDT", p: "88.45", c: "+0.85%", up: true },
  ];
  return (
    <div className={cardBase + " p-3"}>
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
        <span className="text-amber-300 font-bold">14 COINS</span>
        <div className="flex gap-6">
          <span>Price</span>
          <span>Change</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {coins.map((c) => (
          <div key={c.s} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/50">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/30" />
              <span className="text-slate-200 font-medium">{c.s}</span>
            </span>
            <span className="text-slate-100 font-bold">{c.p}</span>
            <span className={c.up ? "text-emerald-400" : "text-red-400"}>{c.c}</span>
          </div>
        ))}
      </div>
      <button className="mt-2 w-full text-center text-[10px] text-emerald-400">View All (14) →</button>
    </div>
  );
}

function SectionHead({ title, cta, onCta, inline }: { title: string; cta?: string; onCta?: () => void; inline?: boolean }) {
  return (
    <div className={inline ? "flex items-center justify-between" : "mb-2 flex items-center justify-between"}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded bg-amber-400" />
        <h2 className="text-sm font-black text-amber-300">{title}</h2>
      </div>
      {cta && (
        <button onClick={onCta} className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
          {cta} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
