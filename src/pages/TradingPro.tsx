import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, Plus, Bell, Search, Star, TrendingUp, TrendingDown,
  Home, Gamepad2, Gift, LineChart, Wallet, User as UserIcon,
  Settings, Maximize2, Crosshair, Minus,
} from "lucide-react";
import { TRADING_ASSETS, formatPrice, type TradingAsset } from "@/lib/tradingAssets";
import { AssetGlyph } from "@/lib/assetEmojis";

/* ----------------------------- helpers ----------------------------- */
const bdt = (n: number) =>
  "৳" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIMEFRAMES = [
  { id: "30s", label: "30 Sec" },
  { id: "1m", label: "1 Min" },
  { id: "3m", label: "3 Min" },
  { id: "5m", label: "5 Min" },
  { id: "15m", label: "15 Min" },
  { id: "30m", label: "30 Min" },
  { id: "1h", label: "1 Hour" },
];

const TV_SYMBOL: Record<string, string> = {
  "GLC-USD": "BINANCE:BTCUSDT",
  "NOVA-USD": "BINANCE:ETHUSDT",
  "XAU-USD": "OANDA:XAUUSD",
  "XAG-USD": "OANDA:XAGUSD",
  "XTI-USD": "TVC:USOIL",
  "XCU-USD": "OANDA:XCUUSD",
  "XNG-USD": "NYMEX:NG1!",
  "BTC-USD": "BINANCE:BTCUSDT",
  "ETH-USD": "BINANCE:ETHUSDT",
  "LTC-USD": "BINANCE:LTCUSDT",
  "SOL-USD": "BINANCE:SOLUSDT",
  "XRP-USD": "BINANCE:XRPUSDT",
  "GBP-USD": "OANDA:GBPUSD",
  "EUR-USD": "OANDA:EURUSD",
};

/* ---------------------------- TradingView chart ---------------------------- */
function TVChart({ symbol, interval }: { symbol: string; interval: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    container.style.height = "100%";
    container.style.width = "100%";
    ref.current.appendChild(container);
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Asia/Dhaka",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#050505",
      hide_top_toolbar: true,
      hide_legend: false,
      allow_symbol_change: false,
      studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
      backgroundColor: "#050505",
      gridColor: "rgba(16,185,129,0.06)",
      support_host: "https://www.tradingview.com",
    });
    ref.current.appendChild(s);
  }, [symbol, interval]);
  return <div ref={ref} className="w-full h-full" />;
}

/* ----------------------------- data types ----------------------------- */
type OpenTrade = {
  id: string; asset: TradingAsset; dir: "UP" | "DOWN"; stake: number; timeLeft: number; payout: number;
};
type HistoryRow = {
  id: string; asset: TradingAsset; dir: "UP" | "DOWN"; stake: number; win: boolean; payout: number; ts: string;
};

/* ================================ Page ================================ */
export default function TradingPro() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(TRADING_ASSETS[0].id);
  const asset = useMemo(() => TRADING_ASSETS.find(a => a.id === activeId)!, [activeId]);
  const [tf, setTf] = useState("5m");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Set<string>>(new Set(["GLC-USD", "NOVA-USD", "XAU-USD", "BTC-USD", "ETH-USD", "XTI-USD"]));
  const [stake, setStake] = useState(1000);
  const [expiry, setExpiry] = useState("30s");
  const [countdown, setCountdown] = useState(30);
  const [prices, setPrices] = useState<Record<string, number>>(
    () => Object.fromEntries(TRADING_ASSETS.map(a => [a.id, a.base]))
  );
  const [changes, setChanges] = useState<Record<string, number>>(
    () => ({
      "GLC-USD": 2.45, "NOVA-USD": -1.25, "XAU-USD": 0.85, "XAG-USD": 0.65,
      "XTI-USD": -0.35, "XCU-USD": 1.15, "XNG-USD": -0.75, "BTC-USD": 2.35,
      "ETH-USD": 1.85, "LTC-USD": -0.45, "SOL-USD": 2.05, "XRP-USD": -0.25,
      "GBP-USD": 0.35, "EUR-USD": 0.25,
    })
  );

  // live price wiggle
  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        for (const a of TRADING_ASSETS) {
          const drift = (Math.random() - 0.5) * a.vol * 0.4;
          next[a.id] = Math.max(0.0001, (prev[a.id] ?? a.base) + drift);
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // countdown loop
  useEffect(() => {
    const id = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleFav = (id: string) =>
    setFavs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const filtered = useMemo(
    () => TRADING_ASSETS.filter(a =>
      a.symbol.toLowerCase().includes(q.toLowerCase()) ||
      a.name.toLowerCase().includes(q.toLowerCase())
    ),
    [q]
  );

  const openTrades: OpenTrade[] = [
    { id: "1", asset: TRADING_ASSETS[2], dir: "UP",   stake: 1000, timeLeft: 18, payout: 1850 },
    { id: "2", asset: TRADING_ASSETS[7], dir: "DOWN", stake: 2000, timeLeft: 18, payout: 3700 },
    { id: "3", asset: TRADING_ASSETS[0], dir: "UP",   stake: 500,  timeLeft: 16, payout: 925 },
  ];
  const history: HistoryRow[] = [
    { id: "h1", asset: TRADING_ASSETS[8], dir: "UP",   stake: 1000, win: true,  payout: 1850, ts: "12:15:30" },
    { id: "h2", asset: TRADING_ASSETS[4], dir: "DOWN", stake: 500,  win: false, payout: 925,  ts: "12:14:30" },
    { id: "h3", asset: TRADING_ASSETS[0], dir: "UP",   stake: 2000, win: true,  payout: 3700, ts: "12:13:30" },
    { id: "h4", asset: TRADING_ASSETS[1], dir: "UP",   stake: 1000, win: true,  payout: 1850, ts: "12:12:30" },
    { id: "h5", asset: TRADING_ASSETS[3], dir: "DOWN", stake: 500,  win: false, payout: 925,  ts: "12:11:30" },
  ];
  const winners = [
    { rank: 1, name: "John D.",  amt: 58745, flag: "🇺🇸" },
    { rank: 2, name: "Alex M.",  amt: 42560, flag: "🇬🇧" },
    { rank: 3, name: "Rasel A.", amt: 31245, flag: "🇧🇩" },
    { rank: 4, name: "Sarah L.", amt: 27850, flag: "🇨🇦" },
    { rank: 5, name: "David M.", amt: 21450, flag: "🇦🇺" },
  ];

  const price = prices[asset.id] ?? asset.base;
  const chg = changes[asset.id] ?? 0;
  const payout = Math.round(stake * 1.85);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white overflow-x-hidden relative">
      {/* ambient bg */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(234,179,8,0.06),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 pb-28 pt-3">
        {/* ================ TOP HEADER ================ */}
        <header className="flex items-center gap-3 h-14">
          <button className="w-9 h-9 grid place-items-center rounded-lg text-amber-400 hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-1 select-none">
            <span className="text-2xl">👑</span>
            <div className="leading-none">
              <div className="font-black text-2xl tracking-tight bg-gradient-to-b from-emerald-300 to-emerald-500 bg-clip-text text-transparent">GoLucky</div>
              <div className="text-[8px] tracking-[0.35em] text-amber-400/80 mt-0.5">PLAY · INVEST · EARN</div>
            </div>
          </Link>

          <div className="ml-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 h-11">
            <div className="text-[9px] text-emerald-300/70 tracking-wider">DEMO ACCOUNT</div>
            <div className="text-emerald-200 font-bold text-sm">৳ 25,850.50</div>
            <button className="ml-1 w-6 h-6 rounded-full bg-emerald-500 text-black grid place-items-center hover:brightness-110">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button className="h-11 px-5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-bold text-sm shadow-[0_0_24px_rgba(16,185,129,0.35)]">
            Deposit
          </button>
          <button className="h-11 px-5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 text-black font-bold text-sm shadow-[0_0_24px_rgba(234,179,8,0.3)]">
            Withdraw
          </button>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10">
              <Bell className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] grid place-items-center font-bold">5</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 grid place-items-center ring-2 ring-emerald-500/40 relative">
              <UserIcon className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#050505]" />
            </div>
            <div className="flex items-center gap-1 px-3 h-10 rounded-xl border border-amber-500/40 bg-amber-950/30">
              <span className="text-amber-400 text-xs">👑</span>
              <span className="text-amber-300 text-xs font-bold tracking-wider">VIP 5</span>
            </div>
          </div>
        </header>

        {/* ================ FAVORITES BAR ================ */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {TRADING_ASSETS.filter(a => favs.has(a.id)).map(a => {
            const c = changes[a.id] ?? 0;
            const active = a.id === activeId;
            return (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={`shrink-0 h-11 px-3 rounded-xl border flex items-center gap-2 text-xs transition ${
                  active
                    ? "bg-emerald-950/70 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : "bg-white/5 border-white/10 hover:border-emerald-500/40"
                }`}
              >
                <AssetGlyph symbol={a.symbol} size={18} />
                <span className="font-semibold">{a.symbol}</span>
                <span className={c >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {c >= 0 ? "+" : ""}{c.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* ================ MAIN GRID: sidebar + chart ================ */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* ---------- SIDEBAR ---------- */}
          <aside className="col-span-3 rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl p-3">
            <div className="text-amber-400 font-bold tracking-widest text-xs mb-2">ASSETS</div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search assets"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
              {filtered.map(a => {
                const c = changes[a.id] ?? 0;
                const active = a.id === activeId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveId(a.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      active
                        ? "bg-gradient-to-r from-emerald-500/15 to-transparent border border-emerald-400/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <AssetGlyph symbol={a.symbol} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{a.symbol}</div>
                      <div className="text-[11px] text-white/50 truncate">{a.name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[11px] font-bold ${c >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {c >= 0 ? "+" : ""}{c.toFixed(2)}%
                      </div>
                      <div className="text-[11px] text-white/70">${formatPrice(prices[a.id] ?? a.base)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => toggleFav(activeId)}
              className="mt-3 w-full h-10 rounded-xl border border-amber-500/40 text-amber-300 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-amber-500/10"
            >
              <Plus className="w-4 h-4" /> Add to Favorites
            </button>
          </aside>

          {/* ---------- CHART + TRADE PANEL ---------- */}
          <section className="col-span-9 space-y-4">
            {/* Chart card */}
            <div className="rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl overflow-hidden">
              {/* symbol header */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
                <AssetGlyph symbol={asset.symbol} size={34} />
                <div>
                  <div className="text-amber-300 font-bold text-lg leading-none">{asset.symbol}</div>
                  <div className="text-[11px] text-white/50 mt-1">{asset.name}</div>
                </div>
                <div className="ml-4 flex items-baseline gap-2">
                  <div className="text-2xl font-black tabular-nums">${formatPrice(price)}</div>
                  <div className={`text-sm font-bold ${chg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-6 text-xs text-white/70">
                  <div><div className="text-white/40 text-[10px]">High</div><div className="font-semibold">${formatPrice(price * 1.015)}</div></div>
                  <div><div className="text-white/40 text-[10px]">Low</div><div className="font-semibold">${formatPrice(price * 0.985)}</div></div>
                  <div><div className="text-white/40 text-[10px]">24H Volume</div><div className="font-semibold">12.45M</div></div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                  </div>
                </div>
              </div>

              {/* timeframe row */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <span className="text-[10px] tracking-widest text-white/50 mr-2">TIME</span>
                {TIMEFRAMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTf(t.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                      tf === t.id
                        ? "border border-emerald-400 text-emerald-300 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-3 text-white/50">
                  <Crosshair className="w-4 h-4" />
                  <span className="text-xs">Indicators</span>
                  <Settings className="w-4 h-4" />
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* chart */}
              <div className="h-[460px] bg-[#050505]">
                <TVChart symbol={TV_SYMBOL[asset.id] ?? "BINANCE:BTCUSDT"} interval={tf.includes("h") ? "60" : tf.includes("m") ? tf.replace("m", "") : "1"} />
              </div>
            </div>

            {/* Trade panel row */}
            <div className="grid grid-cols-12 gap-4">
              {/* Investment */}
              <div className="col-span-5 rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl p-4">
                <div className="text-[11px] tracking-widest text-white/50 mb-2">INVESTMENT</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-11 rounded-lg bg-white/5 border border-white/10 px-3 grid place-items-start justify-start content-center">
                    <div className="text-emerald-300 font-bold">৳ {stake.toLocaleString()}</div>
                  </div>
                  <button onClick={() => setStake(s => Math.max(100, s - 100))} className="w-10 h-11 rounded-lg bg-white/5 border border-white/10 grid place-items-center"><Minus className="w-4 h-4" /></button>
                  <button onClick={() => setStake(s => s + 100)} className="w-10 h-11 rounded-lg bg-white/5 border border-white/10 grid place-items-center"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000, 10000].map(v => (
                    <button
                      key={v}
                      onClick={() => setStake(v)}
                      className={`h-9 rounded-lg text-xs font-bold ${
                        stake === v
                          ? "bg-emerald-500/15 border border-emerald-400 text-emerald-300"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >৳{v.toLocaleString()}</button>
                  ))}
                  <button className="h-9 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/70">ALL</button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[11px] tracking-widest text-white/50">EXPECTED PROFIT <span className="ml-2 text-emerald-400">▲ 85%</span></div>
                </div>
                <div className="text-emerald-400 text-2xl font-black mt-1">৳ {payout.toLocaleString()}.00</div>
              </div>

              {/* Expiry */}
              <div className="col-span-3 rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl p-4">
                <div className="text-[11px] tracking-widest text-white/50 mb-2">EXPIRY TIME</div>
                <div className="text-3xl font-black tabular-nums">00:00:{String(countdown).padStart(2, "0")}</div>
                <div className="mt-1 text-xs text-white/60">{TIMEFRAMES.find(t => t.id === expiry)?.label ?? "30 Sec"}</div>
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {["30s", "1m", "3m", "5m"].map(t => (
                    <button
                      key={t}
                      onClick={() => setExpiry(t)}
                      className={`h-8 rounded-md text-[11px] font-bold ${
                        expiry === t ? "bg-emerald-500/15 border border-emerald-400 text-emerald-300" : "bg-white/5 border border-white/10 text-white/60"
                      }`}
                    >{TIMEFRAMES.find(x => x.id === t)?.label}</button>
                  ))}
                </div>
              </div>

              {/* Payout + UP/DOWN */}
              <div className="col-span-4 space-y-3">
                <div className="rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl p-4">
                  <div className="text-[11px] tracking-widest text-white/50">PAYOUT</div>
                  <div className="text-emerald-400 text-3xl font-black">85%</div>
                  <div className="text-emerald-300 font-bold">৳ {payout.toLocaleString()}.00</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="h-16 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <div className="text-left leading-tight">
                      <div>UP</div>
                      <div className="text-[10px] font-medium opacity-80">Price will go Up</div>
                    </div>
                  </button>
                  <button className="h-16 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-black text-lg shadow-[0_0_30px_rgba(239,68,68,0.45)] flex items-center justify-center gap-2">
                    <TrendingDown className="w-6 h-6" />
                    <div className="text-left leading-tight">
                      <div>DOWN</div>
                      <div className="text-[10px] font-medium opacity-80">Price will go Down</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Second row: Open Trades / History / Winners */}
            <div className="grid grid-cols-12 gap-4">
              <Card title="OPEN TRADES (3)">
                {openTrades.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none text-xs">
                    <AssetGlyph symbol={t.asset.symbol} size={22} />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{t.asset.symbol}</div>
                      <div className="text-white/50">৳ {t.stake.toLocaleString()}</div>
                    </div>
                    <div className={`font-bold ${t.dir === "UP" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.dir === "UP" ? "▲ UP" : "▼ DOWN"}
                      <div className="text-white/60 font-normal">${formatPrice(prices[t.asset.id] ?? t.asset.base)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/80 tabular-nums">00:00:{String(t.timeLeft).padStart(2, "0")}</div>
                      <div className="text-emerald-400 font-bold">+৳ {t.payout.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </Card>

              <Card title="TRADE HISTORY" span={4}>
                {history.map(h => (
                  <div key={h.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none text-xs">
                    <AssetGlyph symbol={h.asset.symbol} size={22} />
                    <div className="flex-1 font-bold text-sm">{h.asset.symbol}</div>
                    <div className={`font-bold w-12 ${h.dir === "UP" ? "text-emerald-400" : "text-red-400"}`}>{h.dir}</div>
                    <div className="w-16 text-white/70">৳ {h.stake.toLocaleString()}</div>
                    <div className={`w-12 font-bold ${h.win ? "text-emerald-400" : "text-red-400"}`}>{h.win ? "+85%" : "-85%"}</div>
                    <div className={`w-20 text-right font-bold ${h.win ? "text-emerald-400" : "text-red-400"}`}>{h.win ? "+" : "-"}৳ {h.payout.toLocaleString()}</div>
                    <div className="w-14 text-right text-white/50">{h.ts}</div>
                  </div>
                ))}
              </Card>

              <Card title="TOP WINNERS TODAY" span={4}>
                {winners.map(w => (
                  <div key={w.rank} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-none">
                    <div className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-black ${
                      w.rank === 1 ? "bg-amber-400 text-black" : w.rank === 2 ? "bg-white/70 text-black" : w.rank === 3 ? "bg-amber-700 text-black" : "bg-white/10"
                    }`}>{w.rank}</div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 grid place-items-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-sm font-bold">{w.name}</div>
                    <div className="text-emerald-400 font-bold text-sm">+৳ {w.amt.toLocaleString()}.00</div>
                    <div className="text-lg">{w.flag}</div>
                  </div>
                ))}
              </Card>
            </div>

            {/* Third row: Market news / Market signals / Boost */}
            <div className="grid grid-cols-12 gap-4">
              <Card title="MARKET NEWS">
                <NewsItem title="Gold prices steady as investors await US inflation data" time="2 min ago" />
                <NewsItem title="Bitcoin rises above $66K as market sentiment improves" time="5 min ago" />
                <NewsItem title="Oil prices fall on concerns over global demand" time="10 min ago" />
              </Card>

              <Card title="MARKET SIGNALS" span={4}>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { s: "XAU/USD", a: "BUY",  t: "Strong Buy",  c: "emerald" },
                    { s: "BTC/USD", a: "BUY",  t: "Buy",         c: "emerald" },
                    { s: "XTI/USD", a: "SELL", t: "Sell",        c: "red" },
                    { s: "ETH/USD", a: "BUY",  t: "Buy",         c: "emerald" },
                  ].map(x => (
                    <div key={x.s} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                      <div className="text-[11px] font-bold">{x.s}</div>
                      <div className={`text-sm font-black my-1 ${x.c === "emerald" ? "text-emerald-400" : "text-red-400"}`}>{x.a}</div>
                      <div className="text-[10px] text-white/60">{x.t}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="col-span-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-black/60 to-emerald-950/40 backdrop-blur-xl p-4 relative overflow-hidden">
                <div className="text-amber-300 font-black text-lg leading-tight">BOOST YOUR PROFIT</div>
                <div className="text-white/70 text-xs mt-1">Invite friends & earn more</div>
                <button className="mt-4 h-10 px-4 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-black text-sm shadow-[0_0_18px_rgba(16,185,129,0.5)]">
                  INVITE NOW
                </button>
                <div className="absolute right-2 bottom-1 text-5xl">🎁</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ================ BOTTOM NAV ================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-emerald-500/20">
        <div className="max-w-[1440px] mx-auto grid grid-cols-6 h-16 px-4">
          <NavBtn icon={<Home className="w-5 h-5" />} label="Home" onClick={() => navigate("/")} />
          <NavBtn icon={<Gamepad2 className="w-5 h-5" />} label="Games" onClick={() => navigate("/games")} />
          <NavBtn icon={<Gift className="w-5 h-5" />} label="Lucky Hub" onClick={() => navigate("/lucky-hub")} />
          <NavBtn icon={<LineChart className="w-5 h-5" />} label="Trading" active />
          <NavBtn icon={<Wallet className="w-5 h-5" />} label="Wallet" onClick={() => navigate("/wallet")} />
          <NavBtn icon={<UserIcon className="w-5 h-5" />} label="Profile" onClick={() => navigate("/account")} />
        </div>
      </nav>
    </div>
  );
}

/* ---------- small components ---------- */
function Card({ title, children, span = 4 }: { title: string; children: React.ReactNode; span?: number }) {
  const spanCls = span === 3 ? "col-span-3" : span === 5 ? "col-span-5" : span === 6 ? "col-span-6" : "col-span-4";
  return (
    <div className={`${spanCls} rounded-2xl border border-emerald-500/15 bg-black/40 backdrop-blur-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-amber-400 font-bold tracking-widest text-xs">{title}</div>
        <button className="text-emerald-400 text-[11px] font-semibold">View All ›</button>
      </div>
      <div>{children}</div>
    </div>
  );
}

function NewsItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-none">
      <div className="text-sm">{title}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{time}</div>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 relative ${
        active ? "text-emerald-400" : "text-white/60 hover:text-white/90"
      }`}
    >
      {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.7)]" />}
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
