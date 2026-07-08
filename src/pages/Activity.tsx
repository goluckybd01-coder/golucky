import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Plus, Minus, Bell, Search, Star, TrendingUp, TrendingDown,
  Home, Gamepad2, Gift, LineChart as LineChartIcon, Wallet as WalletIcon,
  User as UserIcon, Settings, Maximize2, Crosshair, ChevronDown, Clock, X,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { TRADING_ASSETS, formatPrice, type TradingAsset } from "@/lib/tradingAssets";
import { AssetGlyph } from "@/lib/assetEmojis";
import {
  openTradePosition, settleTradePosition, fetchOwnOpenPositions,
  fetchOwnHistory, fetchFavorites, toggleFavorite, fetchAssetsFromDb,
  type TradePosition,
} from "@/lib/tradingPositions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonner } from "sonner";

/* Skeleton row for Supabase-backed lists */
function SkeletonRow({ variant = "trade" }: { variant?: "trade" | "winner" }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none animate-pulse">
      <div className={`${variant === "winner" ? "w-6 h-6 rounded-full" : "w-5 h-5 rounded"} bg-white/10`} />
      {variant === "winner" && <div className="w-8 h-8 rounded-full bg-white/10" />}
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-24 bg-white/10 rounded" />
        <div className="h-2 w-16 bg-white/5 rounded" />
      </div>
      <div className="h-3 w-14 bg-white/10 rounded" />
    </div>
  );
}
function SkeletonList({ count = 3, variant }: { count?: number; variant?: "trade" | "winner" }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} variant={variant} />)}</>;
}

/* Inline retry notice for failed Supabase reads */
function RetryNotice({
  message,
  onRetry,
  loading,
  compact,
}: { message: string; onRetry: () => void; loading?: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="shrink-0 h-9 pl-2 pr-3 rounded-full border border-[#EA3943]/50 bg-[#EA3943]/10 text-[#EA3943] flex items-center gap-1.5 text-[11px] font-semibold disabled:opacity-60"
        aria-label="Retry loading favorites"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Loading..." : "Retry favorites"}
      </button>
    );
  }
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-[#EA3943]/40 bg-[#EA3943]/10 px-2.5 py-2 text-[11px] text-[#FCA5A5]"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EA3943]" />
      <div className="flex-1 truncate">{message || "Failed to load."}</div>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md border border-[#EA3943]/50 px-2 py-1 text-[10px] font-bold text-white hover:bg-[#EA3943]/20 disabled:opacity-60"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Loading" : "Retry"}
      </button>
    </div>
  );
}

function SectionLoadingNotice({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#16C784]/25 bg-[#16C784]/10 px-2.5 py-2 text-[11px] font-semibold text-[#16C784]">
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

/* --------------------------- constants --------------------------- */

const TIMEFRAMES = [
  { id: "30s", label: "30 Sec" },
  { id: "1m",  label: "1 Min" },
  { id: "3m",  label: "3 Min" },
  { id: "5m",  label: "5 Min" },
  { id: "15m", label: "15 Min" },
  { id: "30m", label: "30 Min" },
  { id: "1h",  label: "1 Hour" },
];

const EXPIRIES: { id: 30 | 60 | 180 | 300; label: string }[] = [
  { id: 30,  label: "30 Sec" },
  { id: 60,  label: "1 Min" },
  { id: 180, label: "3 Min" },
  { id: 300, label: "5 Min" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000, 10000];

const TV_SYMBOL: Record<string, string> = {
  "GLC/USD": "BINANCE:BTCUSDT", "NOVA/USD": "BINANCE:ETHUSDT",
  "XAU/USD": "OANDA:XAUUSD",    "XAG/USD": "OANDA:XAGUSD",
  "XTI/USD": "TVC:USOIL",       "XCU/USD": "OANDA:XCUUSD",
  "XNG/USD": "NYMEX:NG1!",      "BTC/USD": "BINANCE:BTCUSDT",
  "ETH/USD": "BINANCE:ETHUSDT", "LTC/USD": "BINANCE:LTCUSDT",
  "SOL/USD": "BINANCE:SOLUSDT", "XRP/USD": "BINANCE:XRPUSDT",
  "GBP/USD": "OANDA:GBPUSD",    "EUR/USD": "OANDA:EURUSD",
};

const bdt = (n: number) => "৳" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* --------------------------- TradingView chart --------------------------- */
function TVChart({ symbol, interval }: { symbol: string; interval: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    ref.current.appendChild(inner);
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
      toolbar_bg: "#0B0E14",
      hide_top_toolbar: true,
      hide_legend: false,
      allow_symbol_change: false,
      studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
      backgroundColor: "#0B0E14",
      gridColor: "rgba(22,199,132,0.06)",
      support_host: "https://www.tradingview.com",
    });
    ref.current.appendChild(s);
  }, [symbol, interval]);
  return <div ref={ref} className="w-full h-full" />;
}

/* ============================== PAGE ============================== */
export default function Trading() {
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ---------- assets (DB + local fallback) ---------- */
  const [assets, setAssets] = useState<TradingAsset[]>(TRADING_ASSETS);
  const [dbAssetIds, setDbAssetIds] = useState<Record<string, string>>({}); // symbol -> uuid
  useEffect(() => {
    (async () => {
      const rows = await fetchAssetsFromDb();
      if (rows.length) {
        const map: Record<string, string> = {};
        rows.forEach(r => { map[r.symbol] = r.id; });
        setDbAssetIds(map);
      }
    })();
  }, []);

  const [activeId, setActiveId] = useState<string>(
    () => localStorage.getItem("golucky:trading:selected") ?? TRADING_ASSETS[0].id
  );
  const asset = useMemo(() => assets.find(a => a.id === activeId) ?? assets[0], [assets, activeId]);
  useEffect(() => { localStorage.setItem("golucky:trading:selected", activeId); }, [activeId]);

  /* ---------- prices ---------- */
  const [prices, setPrices] = useState<Record<string, number>>(
    () => Object.fromEntries(TRADING_ASSETS.map(a => [a.id, a.base]))
  );
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        const f: Record<string, "up" | "down" | null> = {};
        for (const a of TRADING_ASSETS) {
          const drift = (Math.random() - 0.5) * a.vol * 0.5;
          const cur = prev[a.id] ?? a.base;
          const nv = Math.max(0.0001, cur + drift);
          next[a.id] = nv;
          f[a.id] = nv > cur ? "up" : nv < cur ? "down" : null;
        }
        setFlash(f);
        return next;
      });
    }, 1200);
    return () => clearInterval(iv);
  }, []);
  const [changes] = useState<Record<string, number>>({
    "GLC-USD": 2.45, "NOVA-USD": -1.25, "XAU-USD": 0.85, "XAG-USD": 0.65,
    "XTI-USD": -0.35, "XCU-USD": 1.15, "XNG-USD": -0.75, "BTC-USD": 2.35,
    "ETH-USD": 1.85, "LTC-USD": -0.45, "SOL-USD": 2.05, "XRP-USD": -0.25,
    "GBP-USD": 0.35, "EUR-USD": 0.25,
  });

  /* ---------- favorites ---------- */
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("golucky:trading:favs") ?? "[]")); }
    catch { return new Set(["GLC-USD","NOVA-USD","XAU-USD","BTC-USD","ETH-USD","XTI-USD"]); }
  });
  const [favsLoading, setFavsLoading] = useState(false);
  const [favsError, setFavsError] = useState<string | null>(null);
  useEffect(() => {
    localStorage.setItem("golucky:trading:favs", JSON.stringify([...favs]));
  }, [favs]);
  const loadFavorites = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setFavsLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setFavsError(null); return; }
      const dbIds = await fetchFavorites();
      setFavsError(null);
      if (!dbIds.length) return;
      const idBySymbol = Object.entries(dbAssetIds).reduce<Record<string,string>>((acc,[sym,id]) => (acc[id]=sym, acc), {});
      const localIds = new Set<string>();
      dbIds.forEach(id => {
        const sym = idBySymbol[id];
        const a = TRADING_ASSETS.find(x => x.symbol === sym);
        if (a) localIds.add(a.id);
      });
      if (localIds.size) setFavs(localIds);
    } catch (e) {
      const msg = (e as Error)?.message ?? "Please try again.";
      setFavsError(msg);
      sonner.error("Couldn't load favorites", { description: msg });
    } finally {
      if (showLoading) setFavsLoading(false);
    }
  }, [dbAssetIds]);
  useEffect(() => { loadFavorites(); }, [loadFavorites]);
  const toggleFav = useCallback((id: string) => {
    const a = TRADING_ASSETS.find(x => x.id === id); if (!a) return;
    const dbId = dbAssetIds[a.symbol];
    setFavs(prev => {
      const n = new Set(prev);
      const on = !n.has(id);
      on ? n.add(id) : n.delete(id);
      if (dbId) toggleFavorite(dbId, on).catch((e) => {
        sonner.error("Couldn't sync favorite", { description: (e as Error)?.message ?? "Change saved locally." });
      });
      return n;
    });
  }, [dbAssetIds]);

  /* ---------- search ---------- */
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => assets.filter(a =>
      a.symbol.toLowerCase().includes(q.toLowerCase()) ||
      a.name.toLowerCase().includes(q.toLowerCase())
    ),
    [assets, q]
  );

  /* ---------- trade form ---------- */
  const [stake, setStake] = useState(1000);
  const [expiry, setExpiry] = useState<30 | 60 | 180 | 300>(30);
  const payoutPct = 85;
  const expected = Math.round(stake * (payoutPct / 100));

  /* ---------- countdown ticker ---------- */
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  const nextExpiry = useMemo(() => Math.max(0, expiry - (Math.floor(now / 1000) % expiry)), [expiry, now]);

  /* ---------- open + history from Supabase ---------- */
  const [open, setOpen] = useState<TradePosition[]>([]);
  const [history, setHistory] = useState<TradePosition[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [openLoading, setOpenLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openTradesError, setOpenTradesError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const openLoadedOnce = useRef(false);
  const historyLoadedOnce = useRef(false);
  const loadOpenTrades = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading || !openLoadedOnce.current) setOpenLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
      if (!data.user) { setOpen([]); setOpenLoading(false); openLoadedOnce.current = true; setOpenTradesError(null); return; }
      const rows = await fetchOwnOpenPositions();
      setOpen(rows);
      setOpenTradesError(null);
    } catch (e) {
      const msg = (e as Error)?.message ?? "Retrying shortly.";
      setOpenTradesError(msg);
      if (!openLoadedOnce.current) {
        sonner.error("Couldn't load open trades", { description: msg });
      }
    } finally {
      setOpenLoading(false);
      openLoadedOnce.current = true;
    }
  }, []);
  const loadTradeHistory = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading || !historyLoadedOnce.current) setHistoryLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
      if (!data.user) { setHistory([]); setHistoryLoading(false); historyLoadedOnce.current = true; setHistoryError(null); return; }
      const rows = await fetchOwnHistory(20);
      setHistory(rows);
      setHistoryError(null);
    } catch (e) {
      const msg = (e as Error)?.message ?? "Retrying shortly.";
      setHistoryError(msg);
      if (!historyLoadedOnce.current) {
        sonner.error("Couldn't load trade history", { description: msg });
      }
    } finally {
      setHistoryLoading(false);
      historyLoadedOnce.current = true;
    }
  }, []);
  const refresh = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    await Promise.all([loadOpenTrades({ showLoading }), loadTradeHistory({ showLoading })]);
  }, [loadOpenTrades, loadTradeHistory]);
  useEffect(() => { refresh({ showLoading: true }); const iv = setInterval(() => refresh(), 2500); return () => clearInterval(iv); }, [refresh]);

  /* ---------- settlement loop ---------- */
  const settling = useRef<Set<string>>(new Set());
  const [popup, setPopup] = useState<{ result: "win" | "loss" | "void"; amount: number } | null>(null);
  useEffect(() => {
    const iv = setInterval(async () => {
      for (const p of open) {
        if (settling.current.has(p.id)) continue;
        if (Date.now() >= new Date(p.closes_at).getTime() + 250) {
          settling.current.add(p.id);
          const res = await settleTradePosition(p.id);
          if (res.success && !(res as Record<string, unknown>).already) {
            setPopup({ result: (res.result ?? "void") as any, amount: Number(res.payout_bdt ?? 0) });
            setTimeout(() => setPopup(null), 2500);
            refresh();
          }
          setTimeout(() => settling.current.delete(p.id), 5000);
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [open, refresh]);

  /* ---------- place trade ---------- */
  const [placing, setPlacing] = useState(false);
  const place = async (direction: "UP" | "DOWN") => {
    if (placing) return;
    if (!signedIn) {
      toast({ title: "Sign in to trade", description: "Please log in to place a position." });
      navigate("/login"); return;
    }
    const assetUuid = dbAssetIds[asset.symbol];
    if (!assetUuid) {
      toast({ title: "Asset unavailable", description: asset.symbol, variant: "destructive" });
      return;
    }
    setPlacing(true);
    const res = await openTradePosition({ assetId: assetUuid, direction, durationSec: expiry, stakeBdt: stake });
    setPlacing(false);
    if (!res.success) {
      toast({ title: "Trade failed", description: res.error ?? "Unknown error", variant: "destructive" });
      return;
    }
    toast({ title: `${direction} placed`, description: `${asset.symbol} · ${bdt(stake)} · ${expiry}s` });
    refresh();
  };

  /* ---------- top winners (aggregate today) ---------- */
  type Winner = { rank: number; name: string; amt: number; flag: string; avatar?: string | null };
  const [winners, setWinners] = useState<Winner[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const loadWinners = useCallback(async () => {
    setWinnersLoading(true);
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("trade_positions")
        .select("user_id,pnl_bdt")
        .eq("result", "win")
        .gte("settled_at", start.toISOString())
        .limit(500);
      if (error) throw error;
      setWinnersError(null);
      if (!data?.length) { setWinners([]); return; }
      const totals: Record<string, number> = {};
      data.forEach((r: any) => { totals[r.user_id] = (totals[r.user_id] ?? 0) + Number(r.pnl_bdt ?? 0); });
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const ids = top.map(([id]) => id);
      const { data: profs, error: pErr } = await supabase
        .from("profiles").select("id,username,display_name,avatar_url,country_code").in("id", ids);
      if (pErr) throw pErr;
      const flagFor = (cc?: string) => cc ? String.fromCodePoint(...cc.toUpperCase().split("").map(c => 127397 + c.charCodeAt(0))) : "🌐";
      setWinners(top.map(([id, amt], i) => {
        const p: any = profs?.find((x: any) => x.id === id);
        return {
          rank: i + 1,
          name: p?.display_name || p?.username || "Trader",
          amt: Number(amt),
          flag: flagFor(p?.country_code),
          avatar: p?.avatar_url ?? null,
        };
      }));
    } catch (e) {
      const msg = (e as Error)?.message ?? "Please try again.";
      setWinnersError(msg);
      sonner.error("Couldn't load top winners", { description: msg });
    } finally {
      setWinnersLoading(false);
    }
  }, []);
  useEffect(() => { loadWinners(); }, [loadWinners, history.length]);

  /* --------------------------- render --------------------------- */
  const currentPrice = prices[asset.id] ?? asset.base;
  const currentChg = changes[asset.id] ?? 0;

  const tvInterval = expiry <= 60 ? "1" : expiry <= 180 ? "3" : "5";
  const tvSymbol = TV_SYMBOL[asset.symbol] ?? "BINANCE:BTCUSDT";

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white overflow-x-hidden pb-24">
      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(22,199,132,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(212,175,55,0.05),transparent_45%)]" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-3 pt-3">
        {/* =========== HEADER =========== */}
        <header className="flex items-center gap-2 flex-wrap">
          <button className="w-9 h-9 grid place-items-center rounded-lg text-[#D4AF37] hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-1.5 select-none">
            <span className="text-xl">👑</span>
            <div className="leading-none">
              <div className="font-black text-lg tracking-tight text-[#16C784]">GoLucky</div>
              <div className="text-[7px] tracking-[0.35em] text-white/50 mt-0.5">PLAY · INVEST · EARN</div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <button className="relative w-9 h-9 grid place-items-center rounded-full bg-white/5 border border-white/10">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EA3943] text-[9px] grid place-items-center font-bold">5</span>
            </button>
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#16C784] to-emerald-800 grid place-items-center ring-2 ring-[#16C784]/40">
              <UserIcon className="w-4 h-4" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#16C784] ring-2 ring-[#0B0E14]" />
            </div>
            <div className="flex items-center gap-1 px-2 h-8 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/5">
              <span className="text-[#D4AF37] text-[10px]">👑</span>
              <span className="text-[#D4AF37] text-[10px] font-bold tracking-wider">VIP 5</span>
            </div>
          </div>

          <div className="w-full flex items-center gap-2 mt-1">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#16C784]/30 bg-[#16C784]/5 px-2.5 h-10">
              <div className="leading-tight">
                <div className="text-[8px] text-white/50 tracking-wider">DEMO ACCOUNT</div>
                <div className="text-[#16C784] font-bold text-sm">৳ 25,850.50</div>
              </div>
              <button className="ml-auto w-6 h-6 rounded-full bg-[#16C784] text-black grid place-items-center hover:brightness-110">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => navigate("/deposit")}
              className="h-10 px-3 rounded-xl bg-gradient-to-b from-[#1DB954] to-[#16A34A] text-white font-bold text-xs shadow-[0_0_18px_rgba(22,199,132,0.35)]"
            >Deposit</button>
            <button
              onClick={() => navigate("/withdraw")}
              className="h-10 px-3 rounded-xl border border-[#D4AF37]/60 text-[#D4AF37] font-bold text-xs"
            >Withdraw</button>
          </div>
        </header>

        {/* =========== ASSET TICKER =========== */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {assets.filter(a => favs.has(a.id)).map(a => {
            const c = changes[a.id] ?? 0;
            const active = a.id === activeId;
            return (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={`shrink-0 h-9 pl-2 pr-3 rounded-full border flex items-center gap-1.5 text-[11px] transition ${
                  active
                    ? "bg-[#16C784]/10 border-[#16C784] shadow-[0_0_12px_rgba(22,199,132,0.35)]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <AssetGlyph symbol={a.symbol} size={16} />
                <span className="font-semibold">{a.symbol}</span>
                <span className={c >= 0 ? "text-[#16C784] font-bold" : "text-[#EA3943] font-bold"}>
                  {c >= 0 ? "+" : ""}{c.toFixed(2)}%
                </span>
              </button>
            );
          })}
            {favsError && <RetryNotice compact message={favsError} onRetry={() => loadFavorites({ showLoading: true })} loading={favsLoading} />}
          <button className="shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center">
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* =========== MAIN GRID =========== */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* ---------- ASSETS SIDEBAR ---------- */}
          <MobileAssetsDrawer
            assets={filtered}
            activeId={activeId}
            prices={prices}
            changes={changes}
            flash={flash}
            favs={favs}
            onSelect={setActiveId}
            onToggleFav={toggleFav}
            q={q}
            setQ={setQ}
          />
          <aside className="hidden lg:block lg:col-span-3 rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl p-3">
            <div className="text-[#D4AF37] font-bold tracking-widest text-xs mb-2">ASSETS</div>
            <SearchInput q={q} setQ={setQ} />
            <AssetList
              assets={filtered}
              activeId={activeId}
              prices={prices}
              changes={changes}
              flash={flash}
              favs={favs}
              onSelect={setActiveId}
              onToggleFav={toggleFav}
            />
            <button className="mt-3 w-full h-10 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#D4AF37]/10">
              <Star className="w-4 h-4" /> Add to Favorites
            </button>
          </aside>

          {/* ---------- CHART + PANELS ---------- */}
          <section className="lg:col-span-9 space-y-3">
            {/* Chart card */}
            <div className="rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl overflow-hidden">
              {/* symbol header */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5 flex-wrap">
                <button onClick={() => toggleFav(activeId)} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
                  <Star className={`w-4 h-4 ${favs.has(activeId) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/50"}`} />
                </button>
                <AssetGlyph symbol={asset.symbol} size={28} />
                <div className="min-w-0">
                  <div className="text-white font-bold text-base leading-none">{asset.symbol}</div>
                  <div className="text-[10px] text-white/50 mt-1">{asset.name}</div>
                </div>
                <div className="ml-1 flex items-baseline gap-1.5">
                  <div className={`text-xl font-black tabular-nums transition-colors ${
                    flash[asset.id] === "up" ? "text-[#16C784]" : flash[asset.id] === "down" ? "text-[#EA3943]" : "text-white"
                  }`}>${formatPrice(currentPrice)}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    currentChg >= 0 ? "bg-[#16C784]/15 text-[#16C784]" : "bg-[#EA3943]/15 text-[#EA3943]"
                  }`}>{currentChg >= 0 ? "+" : ""}{currentChg.toFixed(2)}%</span>
                </div>
                <div className="ml-auto flex items-center gap-3 text-[10px] text-white/70">
                  <Stat label="High" v={`$${formatPrice(currentPrice * 1.015)}`} />
                  <Stat label="Low"  v={`$${formatPrice(currentPrice * 0.985)}`} />
                  <Stat label="24H Volume" v="12.45M" />
                  <div className="flex items-center gap-1 text-[#16C784] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" /> LIVE
                  </div>
                </div>
              </div>

              {/* timeframes */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none">
                <span className="text-[9px] tracking-widest text-white/50 mr-1 shrink-0">TIME</span>
                {TIMEFRAMES.map(t => (
                  <button
                    key={t.id}
                    className="shrink-0 h-7 px-2.5 rounded-full text-[11px] font-semibold border bg-white/5 border-white/10 text-white/70"
                  >{t.label}</button>
                ))}
                <button className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 grid place-items-center">
                  <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                </button>
                <div className="ml-auto flex items-center gap-2 text-white/50 shrink-0 pr-1">
                  <Crosshair className="w-4 h-4" />
                  <Settings className="w-4 h-4" />
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* chart */}
              <div className="h-[360px] lg:h-[480px] bg-[#0B0E14]">
                <TVChart symbol={tvSymbol} interval={tvInterval} />
              </div>
            </div>

            {/* Trade panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* INVESTMENT */}
              <div className="rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl p-3">
                <div className="text-[10px] tracking-widest text-white/50 mb-1.5">INVESTMENT</div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setStake(s => Math.max(100, s - 100))} className="w-9 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center"><Minus className="w-4 h-4" /></button>
                  <div className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 flex items-center">
                    <div className="text-[#16C784] font-bold text-sm">৳ {stake.toLocaleString()}</div>
                  </div>
                  <button onClick={() => setStake(s => s + 100)} className="w-9 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {QUICK_AMOUNTS.map(v => (
                    <button
                      key={v}
                      onClick={() => setStake(v)}
                      className={`h-8 rounded-lg text-[11px] font-bold ${
                        stake === v
                          ? "bg-[#16C784]/15 border border-[#16C784] text-[#16C784]"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >৳{v >= 1000 ? `${v/1000}k` : v}</button>
                  ))}
                  <button className="h-8 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-white/70">ALL</button>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[10px] tracking-widest text-white/50">
                  EXPECTED PROFIT <span className="ml-auto text-[#16C784] bg-[#16C784]/10 px-1.5 py-0.5 rounded font-bold">৳ {payoutPct}%</span>
                </div>
                <div className="text-[#16C784] text-xl font-black mt-0.5">৳ {expected.toLocaleString()}.00</div>
              </div>

              {/* EXPIRY */}
              <div className="rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl p-3">
                <div className="flex items-center gap-1 text-[10px] tracking-widest text-white/50">
                  EXPIRY TIME <ChevronDown className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-5 h-5 text-white/60" />
                  <div className="text-2xl font-black tabular-nums">00:00:{String(nextExpiry).padStart(2,"0")}</div>
                </div>
                <div className="text-[11px] text-white/60 mt-0.5">{EXPIRIES.find(e => e.id === expiry)?.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {EXPIRIES.map(e => (
                    <button
                      key={e.id}
                      onClick={() => setExpiry(e.id)}
                      className={`h-8 rounded-lg text-[11px] font-bold ${
                        expiry === e.id ? "bg-[#16C784]/15 border border-[#16C784] text-[#16C784]" : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >{e.label}</button>
                  ))}
                </div>
              </div>

              {/* PAYOUT */}
              <div className="rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl p-3">
                <div className="text-[10px] tracking-widest text-white/50">PAYOUT</div>
                <div className="text-[#16C784] text-3xl font-black leading-none mt-1">{payoutPct}%</div>
                <div className="text-[#16C784] font-bold text-sm mt-1">৳ {expected.toLocaleString()}.00</div>
                <div className="text-[10px] text-white/40 mt-2">Fixed payout on winning trades</div>
              </div>
            </div>

            {/* UP / DOWN */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={placing}
                onClick={() => place("UP")}
                className="h-16 rounded-xl bg-gradient-to-b from-[#1DB954] to-[#16A34A] text-white font-black text-base shadow-[0_0_28px_rgba(22,199,132,0.45)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <TrendingUp className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div>UP</div>
                  <div className="text-[9px] font-medium opacity-80">Price will go Up</div>
                </div>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={placing}
                onClick={() => place("DOWN")}
                className="h-16 rounded-xl bg-gradient-to-b from-[#EF4444] to-[#B91C1C] text-white font-black text-base shadow-[0_0_28px_rgba(234,57,67,0.45)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <TrendingDown className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div>DOWN</div>
                  <div className="text-[9px] font-medium opacity-80">Price will go Down</div>
                </div>
              </motion.button>
            </div>

            {/* Activity: Open / History / Winners */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <SectionCard title={`OPEN TRADES (${open.length})`}>
                {openTradesError && <div className="mb-2"><RetryNotice message={openTradesError} onRetry={() => loadOpenTrades({ showLoading: true })} loading={openLoading} /></div>}
                {openLoading && open.length > 0 && <SectionLoadingNotice label="Refreshing open trades..." />}
                {openLoading && open.length === 0 ? <SkeletonList count={3} /> : open.length === 0 && !openTradesError && <Empty>No open positions</Empty>}
                {open.map(p => {
                  const remain = Math.max(0, Math.floor((new Date(p.closes_at).getTime() - now) / 1000));
                  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
                  const ss = String(remain % 60).padStart(2, "0");
                  const cur = prices[TRADING_ASSETS.find(a => a.symbol === p.symbol)?.id ?? ""] ?? p.open_price;
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none text-xs">
                      <AssetGlyph symbol={p.symbol} size={20} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] truncate">{p.symbol}</div>
                        <div className="text-white/50">৳ {Number(p.stake_bdt).toLocaleString()}</div>
                      </div>
                      <div className={`font-bold ${p.direction === "UP" ? "text-[#16C784]" : "text-[#EA3943]"}`}>
                        {p.direction === "UP" ? "▲ UP" : "▼ DOWN"}
                      </div>
                      <div className="text-right w-20">
                        <div className="text-white/80 tabular-nums">00:{mm}:{ss}</div>
                        <div className="text-white/50 text-[10px]">${formatPrice(cur)}</div>
                      </div>
                    </div>
                  );
                })}
              </SectionCard>

              <SectionCard title="TRADE HISTORY">
                {historyError && <div className="mb-2"><RetryNotice message={historyError} onRetry={() => loadTradeHistory({ showLoading: true })} loading={historyLoading} /></div>}
                {historyLoading && history.length > 0 && <SectionLoadingNotice label="Refreshing trade history..." />}
                {historyLoading && history.length === 0 ? <SkeletonList count={4} /> : history.length === 0 && !historyError && <Empty>No trades yet</Empty>}
                {history.map(h => {
                  const win = h.result === "win";
                  return (
                    <div key={h.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none text-xs">
                      <AssetGlyph symbol={h.symbol} size={20} />
                      <div className="flex-1 font-bold text-[13px] truncate">{h.symbol}</div>
                      <div className={`font-bold w-10 ${h.direction === "UP" ? "text-[#16C784]" : "text-[#EA3943]"}`}>{h.direction}</div>
                      <div className="w-16 text-white/70">৳{Number(h.stake_bdt).toLocaleString()}</div>
                      <div className={`w-20 text-right font-bold ${win ? "text-[#16C784]" : "text-[#EA3943]"}`}>
                        {win ? "+" : "-"}৳{Math.abs(Number(h.pnl_bdt ?? 0)).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </SectionCard>

              <SectionCard title="TOP WINNERS TODAY">
                {winnersError && <div className="mb-2"><RetryNotice message={winnersError} onRetry={loadWinners} loading={winnersLoading} /></div>}
                {winnersLoading && winners.length > 0 && <SectionLoadingNotice label="Refreshing top winners..." />}
                {winnersLoading && winners.length === 0 ? <SkeletonList count={5} variant="winner" /> : winners.length === 0 && !winnersError && <Empty>No winners yet today</Empty>}
                {winners.map(w => (
                  <div key={w.rank} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-none">
                    <div className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-black ${
                      w.rank === 1 ? "bg-[#D4AF37] text-black" :
                      w.rank === 2 ? "bg-white/70 text-black" :
                      w.rank === 3 ? "bg-amber-700 text-black" : "bg-white/10 text-white/80"
                    }`}>{w.rank}</div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#16C784] to-emerald-800 grid place-items-center overflow-hidden">
                      {w.avatar ? <img src={w.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 text-[13px] font-bold truncate">{w.name}</div>
                    <div className="text-[#16C784] font-bold text-[12px]">+৳{Math.round(w.amt).toLocaleString()}</div>
                    <div className="text-base">{w.flag}</div>
                  </div>
                ))}
              </SectionCard>
            </div>

            {/* News / Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <SectionCard title="MARKET NEWS">
                <NewsItem title="Gold prices steady as investors await US inflation data" time="2 min ago" />
                <NewsItem title="Bitcoin rises above $66K as market sentiment improves" time="5 min ago" />
                <NewsItem title="Oil prices fall on concerns over global demand" time="10 min ago" />
              </SectionCard>
              <SectionCard title="MARKET SIGNALS">
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { s: "XAU/USD", a: "BUY",  t: "Strong Buy",  c: "green" },
                    { s: "BTC/USD", a: "BUY",  t: "Buy",         c: "green" },
                    { s: "XTI/USD", a: "SELL", t: "Sell",        c: "red" },
                    { s: "ETH/USD", a: "BUY",  t: "Buy",         c: "green" },
                  ].map(x => (
                    <div key={x.s} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                      <div className="text-[11px] font-bold">{x.s}</div>
                      <div className={`text-sm font-black my-0.5 ${x.c === "green" ? "text-[#16C784]" : "text-[#EA3943]"}`}>{x.a}</div>
                      <div className="text-[10px] text-white/60">{x.t}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Promo */}
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/20 via-[#0F1420] to-[#16C784]/10 backdrop-blur-xl p-4 relative overflow-hidden">
              <div className="text-[#D4AF37] font-black text-lg leading-tight">BOOST YOUR PROFIT</div>
              <div className="text-white/70 text-xs mt-1">Invite friends & earn more</div>
              <button
                onClick={() => navigate("/agent-apply")}
                className="mt-3 h-10 px-4 rounded-lg bg-gradient-to-b from-[#1DB954] to-[#16A34A] text-white font-black text-sm shadow-[0_0_18px_rgba(22,199,132,0.5)]"
              >
                INVITE NOW
              </button>
              <div className="absolute right-2 bottom-1 text-5xl select-none">🎁</div>
            </div>
          </section>
        </div>
      </div>

      {/* =========== RESULT POPUP =========== */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={popup.result === "loss"
              ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }
              : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[60] grid place-items-center pointer-events-none"
          >
            <div className={`rounded-2xl px-6 py-5 border backdrop-blur-xl ${
              popup.result === "win"
                ? "bg-[#16C784]/15 border-[#16C784] shadow-[0_0_60px_rgba(22,199,132,0.6)]"
                : popup.result === "loss"
                ? "bg-[#EA3943]/15 border-[#EA3943] shadow-[0_0_60px_rgba(234,57,67,0.6)]"
                : "bg-white/10 border-white/20"
            }`}>
              <div className={`text-3xl font-black text-center ${
                popup.result === "win" ? "text-[#16C784]" : popup.result === "loss" ? "text-[#EA3943]" : "text-white"
              }`}>
                {popup.result === "win" ? "🎉 YOU WON!" : popup.result === "loss" ? "💥 LOST" : "REFUND"}
              </div>
              {popup.amount > 0 && (
                <div className="text-white text-center mt-1 text-lg font-bold">+{bdt(popup.amount)}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========== BOTTOM NAV =========== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-[#D4AF37]/20">
        <div className="max-w-[430px] lg:max-w-[1440px] mx-auto grid grid-cols-6 h-16 px-2">
          <NavBtn icon={<Home className="w-5 h-5" />} label="Home" onClick={() => navigate("/")} />
          <NavBtn icon={<Gamepad2 className="w-5 h-5" />} label="Games" onClick={() => navigate("/games")} />
          <NavBtn icon={<Gift className="w-5 h-5" />} label="Lucky Hub" onClick={() => navigate("/lucky-hub")} />
          <NavBtn icon={<LineChartIcon className="w-5 h-5" />} label="Trading" active />
          <NavBtn icon={<WalletIcon className="w-5 h-5" />} label="Wallet" onClick={() => navigate("/wallet")} />
          <NavBtn icon={<UserIcon className="w-5 h-5" />} label="Profile" onClick={() => navigate("/account")} />
        </div>
      </nav>
    </div>
  );
}

/* ============================ subcomponents ============================ */

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="text-right">
      <div className="text-white/40 text-[9px] leading-none">{label}</div>
      <div className="font-semibold mt-0.5">{v}</div>
    </div>
  );
}

function SearchInput({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <div className="relative mb-2">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search assets"
        className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-[#16C784]"
      />
    </div>
  );
}

function AssetList({
  assets, activeId, prices, changes, flash, favs, onSelect, onToggleFav,
}: {
  assets: TradingAsset[]; activeId: string;
  prices: Record<string, number>; changes: Record<string, number>;
  flash: Record<string, "up" | "down" | null>;
  favs: Set<string>;
  onSelect: (id: string) => void;
  onToggleFav: (id: string) => void;
}) {
  return (
    <div className="space-y-1 max-h-[420px] lg:max-h-[560px] overflow-y-auto pr-1">
      {assets.map(a => {
        const c = changes[a.id] ?? 0;
        const active = a.id === activeId;
        const f = flash[a.id];
        return (
          <div
            key={a.id}
            className={`w-full flex items-center gap-2 rounded-xl px-2 py-2 text-left transition ${
              active
                ? "bg-gradient-to-r from-[#16C784]/15 to-transparent border border-[#16C784]/50 border-l-4 border-l-[#16C784] shadow-[inset_0_0_16px_rgba(22,199,132,0.15)]"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <button onClick={() => onSelect(a.id)} className="flex items-center gap-2 flex-1 min-w-0">
              <AssetGlyph symbol={a.symbol} size={24} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{a.symbol}</div>
                <div className="text-[10px] text-white/50 truncate">{a.name}</div>
              </div>
              <div className="text-right">
                <div className={`text-[11px] font-bold ${c >= 0 ? "text-[#16C784]" : "text-[#EA3943]"}`}>
                  {c >= 0 ? "+" : ""}{c.toFixed(2)}%
                </div>
                <div className={`text-[11px] font-semibold tabular-nums transition-colors ${
                  f === "up" ? "text-[#16C784]" : f === "down" ? "text-[#EA3943]" : "text-white/80"
                }`}>${formatPrice(prices[a.id] ?? a.base)}</div>
              </div>
            </button>
            <button onClick={() => onToggleFav(a.id)} className="w-7 h-7 grid place-items-center rounded-md hover:bg-white/5">
              <Star className={`w-3.5 h-3.5 ${favs.has(a.id) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/40"}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MobileAssetsDrawer(props: React.ComponentProps<typeof AssetList> & { q: string; setQ: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = props.assets.find(a => a.id === props.activeId);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-xl border border-white/10 bg-[#0F1420]/90 backdrop-blur-xl px-3 flex items-center gap-2"
      >
        <div className="text-[#D4AF37] font-bold tracking-widest text-xs">ASSETS</div>
        <div className="ml-auto flex items-center gap-2">
          {active && <><AssetGlyph symbol={active.symbol} size={18} /><span className="text-sm font-bold">{active.symbol}</span></>}
          <ChevronDown className="w-4 h-4 text-white/60" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute left-0 top-0 bottom-0 w-[86%] max-w-[360px] bg-[#0F1420] border-r border-white/10 p-3 overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center mb-2">
                <div className="text-[#D4AF37] font-bold tracking-widest text-xs">ASSETS</div>
                <button className="ml-auto w-8 h-8 grid place-items-center rounded-lg hover:bg-white/5" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SearchInput q={props.q} setQ={props.setQ} />
              <div className="flex-1 overflow-y-auto">
                <AssetList
                  assets={props.assets}
                  activeId={props.activeId}
                  prices={props.prices}
                  changes={props.changes}
                  flash={props.flash}
                  favs={props.favs}
                  onSelect={(id) => { props.onSelect(id); setOpen(false); }}
                  onToggleFav={props.onToggleFav}
                />
              </div>
              <button className="mt-2 w-full h-10 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center gap-2 text-sm font-semibold">
                <Star className="w-4 h-4" /> Add to Favorites
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F1420]/90 backdrop-blur-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[#D4AF37] font-bold tracking-widest text-xs">{title}</div>
        <button className="text-[#16C784] text-[11px] font-semibold">View All ›</button>
      </div>
      <div>{children}</div>
    </div>
  );
}

function NewsItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-none">
      <div className="text-[13px]">{title}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{time}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-white/40 text-xs py-6">{children}</div>;
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 relative ${
        active ? "text-[#16C784]" : "text-white/50 hover:text-white/80"
      }`}
    >
      {active && (
        <span className="absolute top-1 h-8 w-14 rounded-full bg-[#16C784]/15 border border-[#16C784]/40 shadow-[0_0_16px_rgba(22,199,132,0.5)]" />
      )}
      <span className="relative">{icon}</span>
      <span className={`text-[9px] font-semibold relative ${active ? "font-bold" : ""}`}>{label}</span>
    </button>
  );
}
