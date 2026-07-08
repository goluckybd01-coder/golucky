import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowDown, ArrowUp, Clock, Wallet, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Check, Settings, Copy } from "lucide-react";
import { toast } from "sonner";
import { TRADING_ASSETS, getAsset, formatPrice } from "@/lib/tradingAssets";
import { fetchFinnhubPrices } from "@/lib/finnhubPrices";
import { TokenLogo } from "@/components/trading/TokenLogo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { buildTradesCSV, buildTradesPDFHtml, calculateTradePnl, safeFilenameSegment, PAYOUT as EXPORT_PAYOUT } from "@/lib/tradeExport";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

function exportTradesCSV(trades: Trade[], assetSymbol: string) {
  const csv = buildTradesCSV(trades);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trade-history-${safeFilenameSegment(assetSymbol)}-${Date.now()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function exportTradesPDF(trades: Trade[], assetSymbol: string) {
  const html = buildTradesPDFHtml(trades, assetSymbol);
  const w = window.open("", "_blank");
  if (!w) { toast.error("Popup blocked — allow popups to export PDF"); return; }
  w.document.write(html); w.document.close();
}

const TIMEFRAMES = [
  { label: "30s", sec: 30 },
  { label: "1m",  sec: 60 },
  { label: "3m",  sec: 180 },
  { label: "5m",  sec: 300 },
];
const BALANCE_KEY = "golucky:trading:balance";
const HIST_KEY = "golucky:trading:history";
const PAYOUT = 0.85;

type Trade = {
  id: number; asset: string; symbol: string; dir: "UP" | "DOWN";
  stake: number; potentialWin: number; result: "win" | "loss"; payout: number; forced?: "UP" | "DOWN" | null;
  startPrice: number; endPrice: number; at: string;
  duration?: number;
  payoutRatio?: number;
  poolSnapshot?: { peopleBuy: number; peopleSell: number; poolBuy: number; poolSell: number };
};

// Dev-only runtime guard: derived render order (group -> filter) must match
// the source-of-truth order in TRADING_ASSETS. Runs once per module load.
function computeAssetOrderDrift() {
  const groups = Array.from(new Set(TRADING_ASSETS.map(a => a.group)));
  const rendered = groups.flatMap(g => TRADING_ASSETS.filter(a => a.group === g).map(a => a.id));
  const expected = TRADING_ASSETS.map(a => a.id);
  return rendered.join(",") === expected.join(",") ? null : { expected, rendered };
}
// Overlay is opt-out via VITE_TRADING_ORDER_DRIFT_OVERLAY=false; defaults on in DEV, off in prod.
const ORDER_DRIFT_OVERLAY_ENABLED =
  (import.meta.env.VITE_TRADING_ORDER_DRIFT_OVERLAY ?? (import.meta.env.DEV ? "true" : "false")) !== "false";
const ASSET_ORDER_DRIFT = ORDER_DRIFT_OVERLAY_ENABLED ? computeAssetOrderDrift() : null;
if (ASSET_ORDER_DRIFT) {
   
  console.error("[BinaryTrading] Coin render order drifted from tradingAssets.ts", ASSET_ORDER_DRIFT);
}

export default function BinaryTrading() {
  const navigate = useNavigate();
  const { asset: assetId } = useParams();
  const asset = getAsset(assetId) || TRADING_ASSETS[0];
  const { isSuperAdmin } = useIsSuperAdmin();

  // Dev-only runtime toggle for the order-drift overlay (persisted in localStorage).
  const [driftOverlayOn, setDriftOverlayOn] = useState<boolean>(() => {
    if (!import.meta.env.DEV) return false;
    const v = localStorage.getItem("golucky:trading:driftOverlay");
    return v == null ? true : v === "1";
  });
  useEffect(() => {
    if (import.meta.env.DEV) localStorage.setItem("golucky:trading:driftOverlay", driftOverlayOn ? "1" : "0");
  }, [driftOverlayOn]);

  // Dev-only keyboard shortcut: press "D" to toggle the order-drift overlay.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "d" && e.key !== "D") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      setDriftOverlayOn(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [price, setPrice] = useState(asset.base);
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 60 }, (_, i) => asset.base + Math.sin(i / 4) * asset.vol * 2)
  );
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [stake, setStake] = useState(10);
  const [balance, setBalance] = useState<number>(() => {
    const v = Number(localStorage.getItem(BALANCE_KEY)); return Number.isFinite(v) && v > 0 ? v : 1000;
  });
  const [active, setActive] = useState<{ dir: "UP" | "DOWN"; startPrice: number; endsAt: number; stake: number; startedAt: number; duration: number } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [activeAmounts, setActiveAmounts] = useState<number[]>([]);
  const [addMoreLocked, setAddMoreLocked] = useState(false);
  const forceWinRef = useRef<"UP" | "DOWN" | null>(null);
  const [forceWinTick, setForceWinTick] = useState(0);
  const resolvedRef = useRef<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [adminPriceInput, setAdminPriceInput] = useState("");
  const adminBiasRef = useRef<"up" | "down" | "random" | null>(null);
  const adminPausedRef = useRef(false);
  const [adminTick, setAdminTick] = useState(0); // forces re-render of status badge
  // Experts Option market simulation: people on each side + pool
  const [peopleBuy, setPeopleBuy] = useState(() => 8 + Math.floor(Math.random() * 20));
  const [peopleSell, setPeopleSell] = useState(() => 8 + Math.floor(Math.random() * 20));
  const [poolBuy, setPoolBuy] = useState(() => 200 + Math.floor(Math.random() * 800));
  const [poolSell, setPoolSell] = useState(() => 200 + Math.floor(Math.random() * 800));
  const minoritySideRef = useRef<"UP" | "DOWN" | null>(null);

  // Live simulation of other traders joining BUY/SELL pools
  useEffect(() => {
    const t = setInterval(() => {
      setPeopleBuy(p => Math.max(1, p + (Math.random() < 0.5 ? 1 : Math.random() < 0.3 ? -1 : 0)));
      setPeopleSell(p => Math.max(1, p + (Math.random() < 0.5 ? 1 : Math.random() < 0.3 ? -1 : 0)));
      setPoolBuy(p => Math.max(50, p + Math.floor((Math.random() - 0.45) * 60)));
      setPoolSell(p => Math.max(50, p + Math.floor((Math.random() - 0.45) * 60)));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // Real-time Trade History sync — cross-tab via storage events + same-tab via custom event
  useEffect(() => {
    const reload = () => {
      try { setTrades(JSON.parse(localStorage.getItem(HIST_KEY) || "[]")); } catch { /* ignore */ }
    };
    const onStorage = (e: StorageEvent) => { if (e.key === HIST_KEY) reload(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("golucky:trades:updated", reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("golucky:trades:updated", reload);
    };
  }, []);

  // reset on asset change
  useEffect(() => {
    setPrice(asset.base);
    setHistory(Array.from({ length: 60 }, (_, i) => asset.base + Math.sin(i / 4) * asset.vol * 2));
    setActive(null);
  }, [asset.id]);

  // live price loop
  useEffect(() => {
    const t = setInterval(() => {
      if (adminPausedRef.current) return;
      setPrice(prev => {
        let delta = (Math.random() - 0.5) * asset.vol * 2;
        const bias = adminBiasRef.current;
        // Experts Option engine: active trade trends in trade dir for 80% of duration
        if (active) {
          const force = forceWinRef.current;
          let dir: 1 | -1 | 0 = 0;
          if (force) dir = force === "UP" ? 1 : -1;
          else {
            const elapsed = (Date.now() - active.startedAt) / 1000;
            const trendWindow = active.duration * 0.8;
            if (elapsed < trendWindow) dir = active.dir === "UP" ? 1 : -1;
            else dir = Math.random() > 0.5 ? 1 : -1; // 20% reversal window
          }
          delta = dir * Math.abs(delta) + dir * asset.vol * 1.2;
        } else if (bias === "up") delta = Math.abs(delta) + asset.vol * 0.8;
        else if (bias === "down") delta = -Math.abs(delta) - asset.vol * 0.8;
        else if (bias === "random") delta = (Math.random() - 0.5) * asset.vol * 6;
        const next = Math.max(asset.vol, prev + delta);
        setHistory(h => [...h.slice(-119), next]);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [asset.id, active]);

  // real price loop (Finnhub) — overrides simulated price for supported symbols
  useEffect(() => {
    if (asset.custom) return; // skip GLC/NOVA
    let cancelled = false;
    const pull = async () => {
      // Skip real-feed when admin has paused or biased the market
      if (adminPausedRef.current || adminBiasRef.current) return;
      const res = await fetchFinnhubPrices([asset.id]);
      const p = res[asset.id]?.price;
      if (!cancelled && p && p > 0) {
        setPrice(p);
        setHistory(h => [...h.slice(-119), p]);
      }
    };
    pull();
    const t = setInterval(pull, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [asset.id, asset.custom]);

  // active trade countdown + automatic settlement on zero
  useEffect(() => {
    if (!active) { setRemaining(0); setAddMoreLocked(false); return; }
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((active.endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 10 && !addMoreLocked) setAddMoreLocked(true);
      if (left <= 0 && resolvedRef.current !== active.startedAt) {
        resolvedRef.current = active.startedAt; // guard against double-settlement
        const endPrice = price;
        const force = forceWinRef.current;
        const totalStake = activeAmounts.reduce((s, n) => s + n, active.stake) - active.stake + active.stake;
        // total = sum(activeAmounts) (which already includes initial)
        const stakeSum = activeAmounts.reduce((s, n) => s + n, 0) || active.stake;
        let won: boolean;
        if (force) {
          won = force === active.dir;
        } else {
          // Experts Option realistic market: minority side wins
          const minority: "UP" | "DOWN" = peopleBuy <= peopleSell ? "UP" : "DOWN";
          minoritySideRef.current = minority;
          won = active.dir === minority;
        }
        const payout = won ? stakeSum * PAYOUT : -stakeSum;
        const trade: Trade = {
          id: Date.now(), asset: asset.name, symbol: asset.symbol,
          dir: active.dir, stake: stakeSum, potentialWin: stakeSum * PAYOUT, forced: force,
          result: won ? "win" : "loss",
          payout, startPrice: active.startPrice, endPrice, at: new Date().toISOString(),
          duration: active.duration,
          payoutRatio: PAYOUT,
          poolSnapshot: { peopleBuy, peopleSell, poolBuy, poolSell },
        };
        setBalance(b => {
          const nb = b + (won ? stakeSum + stakeSum * PAYOUT : 0);
          localStorage.setItem(BALANCE_KEY, String(nb));
          return nb;
        });
        setTrades(prev => {
          const next = [trade, ...prev].slice(0, 100);
          localStorage.setItem(HIST_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("golucky:trades:updated"));
          return next;
        });
        if (won) {
          toast.success(`✅ ${active.dir} WIN — +$${(stakeSum * PAYOUT).toFixed(2)}`, {
            description: `${asset.symbol} · stake $${stakeSum.toFixed(2)} · ${active.startPrice.toFixed(2)} → ${endPrice.toFixed(2)}${force ? " · forced" : ""}`,
            duration: 6000,
            closeButton: true,
          });
        } else {
          toast.error(`❌ ${active.dir} LOSS — −$${stakeSum.toFixed(2)}`, {
            description: `${asset.symbol} · ${active.startPrice.toFixed(2)} → ${endPrice.toFixed(2)}${force ? " · forced" : ""}`,
            duration: 6000,
            closeButton: true,
          });
        }
        forceWinRef.current = null;
        setActiveAmounts([]);
        setAddMoreLocked(false);
        setActive(null);
      }
    }, 250);
    return () => clearInterval(t);
  }, [active, price, asset, activeAmounts, addMoreLocked]);

  function placeBet(dir: "UP" | "DOWN") {
    if (active) {
      // same direction → Add More
      if (dir === active.dir && !addMoreLocked) addMore();
      return;
    }
    if (stake <= 0 || stake > balance) return;
    setBalance(b => { const nb = b - stake; localStorage.setItem(BALANCE_KEY, String(nb)); return nb; });
    const now = Date.now();
    setActive({ dir, startPrice: price, endsAt: now + timeframe.sec * 1000, stake, startedAt: now, duration: timeframe.sec });
    setActiveAmounts([stake]);
    setAddMoreLocked(false);
    forceWinRef.current = null;
    // Reflect user's bet in the live pool
    if (dir === "UP") { setPeopleBuy(p => p + 1); setPoolBuy(p => p + stake); }
    else { setPeopleSell(p => p + 1); setPoolSell(p => p + stake); }
  }

  function addMore() {
    if (!active || addMoreLocked || stake <= 0 || stake > balance) return;
    setBalance(b => { const nb = b - stake; localStorage.setItem(BALANCE_KEY, String(nb)); return nb; });
    setActiveAmounts(arr => [...arr, stake]);
    if (active.dir === "UP") setPoolBuy(p => p + stake);
    else setPoolSell(p => p + stake);
  }

  function adminForceWin(side: "UP" | "DOWN") {
    if (!active) return;
    forceWinRef.current = side;
    setForceWinTick(t => t + 1);
  }

  // Admin controls (local price override, no backend impact)
  function adminSetPrice() {
    const v = parseFloat(adminPriceInput);
    if (!Number.isFinite(v) || v <= 0) return;
    adminPausedRef.current = true;
    adminBiasRef.current = null;
    setPrice(v);
    setHistory(h => [...h.slice(-119), v]);
    // If a trade is in flight, refresh remaining immediately so timer stays in sync
    if (active) setRemaining(Math.max(0, Math.ceil((active.endsAt - Date.now()) / 1000)));
    setAdminTick(t => t + 1);
  }
  const adminForce = (dir: "up" | "down" | "random") => {
    adminPausedRef.current = false;
    adminBiasRef.current = dir;
    setAdminTick(t => t + 1);
  };
  const adminAuto = () => {
    adminPausedRef.current = false;
    adminBiasRef.current = null;
    setAdminTick(t => t + 1);
  };
  const adminReset = () => {
    adminPausedRef.current = false;
    adminBiasRef.current = null;
    forceWinRef.current = null;
    setActive(null);
    setActiveAmounts([]);
    setAddMoreLocked(false);
    setTrades([]);
    localStorage.removeItem(HIST_KEY);
    setBalance(1000);
    localStorage.setItem(BALANCE_KEY, "1000");
    setPeopleBuy(8 + Math.floor(Math.random() * 20));
    setPeopleSell(8 + Math.floor(Math.random() * 20));
    setPoolBuy(200 + Math.floor(Math.random() * 800));
    setPoolSell(200 + Math.floor(Math.random() * 800));
    setPrice(asset.base);
    setHistory(Array.from({ length: 60 }, (_, i) => asset.base + Math.sin(i / 4) * asset.vol * 2));
    setAdminTick(t => t + 1);
    toast.success("Reset complete");
  };

  // chart canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
    const data = history; if (data.length < 2) return;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // line
    const stepX = W / (data.length - 1);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX; const y = H - ((v - min) / range) * (H - 16) - 8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // Lock chart color during active trade (Experts Option style)
    const activeColor = active ? (active.dir === "UP" ? "#34d399" : "#f87171") : null;
    if (activeColor) {
      ctx.strokeStyle = activeColor; ctx.lineWidth = 2.4; ctx.stroke();
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#38bdf8"); grad.addColorStop(1, "#fbbf24");
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.stroke();
    }
    // fill
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const fg = ctx.createLinearGradient(0, 0, 0, H);
    if (activeColor) {
      const rgba = active!.dir === "UP" ? "rgba(52,211,153," : "rgba(248,113,113,";
      fg.addColorStop(0, rgba + "0.25)"); fg.addColorStop(1, rgba + "0)");
    } else {
      fg.addColorStop(0, "rgba(56,189,248,0.25)"); fg.addColorStop(1, "rgba(56,189,248,0)");
    }
    ctx.fillStyle = fg; ctx.fill();
    // active markers
    if (active) {
      const y0 = H - ((active.startPrice - min) / range) * (H - 16) - 8;
      ctx.strokeStyle = active.dir === "UP" ? "#34d399" : "#f87171"; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); ctx.setLineDash([]);
    }
  }, [history, active]);

  const change24 = useMemo(() => {
    const first = history[0] ?? price;
    return ((price - first) / first) * 100;
  }, [history, price]);
  const up = change24 >= 0;

  return (
    <>
    {ASSET_ORDER_DRIFT && driftOverlayOn && (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] px-3 py-2 rounded-lg bg-red-600/95 text-white text-[11px] font-mono shadow-2xl border border-red-300">
        <div className="flex items-center justify-between gap-3 mb-0.5">
          <span className="font-bold">⚠ Trading coin order drift (dev only)</span>
          <button onClick={() => setDriftOverlayOn(false)} className="clickable px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px]">Hide</button>
        </div>
        <div className="opacity-90">expected: {ASSET_ORDER_DRIFT.expected.join(", ")}</div>
        <div className="opacity-90">rendered: {ASSET_ORDER_DRIFT.rendered.join(", ")}</div>
      </div>
    )}
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
        <div className="max-w-[430px] lg:max-w-[1280px] mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games/trading")}
              className="clickable flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-[11px] font-bold text-white/80 hover:text-sky-200 transition"
              aria-label="Back to Trading Markets"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Trading Markets</span>
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => setDriftOverlayOn(v => !v)}
                title="Toggle order-drift overlay (press D)"
                className="clickable h-9 px-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70"
              >
                drift:{driftOverlayOn ? "on" : "off"}
              </button>
            )}
            {/* Breadcrumb + symbol picker */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-white/50">
                <button onClick={() => navigate("/games/trading")} className="clickable hover:text-sky-300">Trading</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/70">{asset.group}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-sky-300 font-bold truncate">{asset.symbol}</span>
              </div>
              <button
                onClick={() => !active && setPickerOpen(v => !v)}
                disabled={!!active}
                className="clickable mt-0.5 flex items-center gap-2 text-[14px] font-bold truncate hover:text-sky-300 disabled:opacity-60"
                aria-expanded={pickerOpen}
                aria-haspopup="listbox"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500/30 to-amber-500/20 border border-white/10 grid place-items-center overflow-hidden shrink-0">
                  <TokenLogo src={asset.logo} symbol={asset.symbol} name={asset.name} fallbackClassName="text-[9px] font-extrabold" />
                </span>
                <span className="truncate">{asset.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition ${pickerOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
              <Wallet className="w-3 h-3" /> ${balance.toFixed(2)}
            </div>
          </div>

          {pickerOpen && (
            <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl max-h-72 overflow-y-auto shadow-2xl">
              {Array.from(new Set(TRADING_ASSETS.map(a => a.group))).map(group => (
                <div key={group}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5">{group}</div>
                  {TRADING_ASSETS.filter(a => a.group === group).map(a => {
                    const selected = a.id === asset.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setPickerOpen(false); if (!selected) navigate(`/games/trading/${a.id}`); }}
                        className={`clickable w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] border-b border-white/5 last:border-0 transition ${
                          selected ? "bg-sky-500/15 text-white" : "hover:bg-white/5 text-white/80"
                        }`}
                        role="option"
                        aria-selected={selected}
                      >
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500/30 to-amber-500/20 border border-white/10 grid place-items-center overflow-hidden shrink-0">
                          <TokenLogo src={a.logo} symbol={a.symbol} name={a.name} fallbackClassName="text-[8px] font-extrabold" />
                        </span>
                        <span className="font-bold">{a.symbol}</span>
                        <span className="text-white/50 truncate">{a.name}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-sky-300 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[430px] lg:max-w-[1280px] mx-auto px-4 py-4 space-y-4">
        {/* Asset selector strip — highlights preselected symbol */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {TRADING_ASSETS.filter(a => a.group === asset.group).map(a => {
            const selected = a.id === asset.id;
            return (
              <button
                key={a.id}
                onClick={() => !active && navigate(`/games/trading/${a.id}`)}
                disabled={!!active}
                className={`clickable shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-bold transition ${
                  selected
                    ? "bg-gradient-to-r from-sky-500/30 to-amber-500/20 border-sky-400 text-white shadow-[0_0_18px_rgba(56,189,248,0.35)] ring-1 ring-sky-300/60"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                } ${active && !selected ? "opacity-40" : ""}`}
                aria-pressed={selected}
              >
                        <span className={`w-6 h-6 rounded-full grid place-items-center text-[9px] font-extrabold overflow-hidden shrink-0 ${selected ? "bg-sky-400/30 border border-sky-300/60" : "bg-white/10 border border-white/10"}`}>
                          <TokenLogo src={a.logo} symbol={a.symbol} name={a.name} fallbackClassName="text-[9px] font-extrabold" />
                        </span>
                <span className="whitespace-nowrap">{a.symbol}</span>
                {selected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Price */}
        <div className="flex items-end gap-3">
          <div className="text-[34px] font-mono font-extrabold tracking-tight bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text text-transparent">
            ${formatPrice(price)}
          </div>
          <div className={`mb-2 text-[12px] font-bold flex items-center gap-1 ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? "+" : ""}{change24.toFixed(2)}%
          </div>
        </div>

        {/* Active Trade Banner (Experts Option) */}
        {active && (() => {
          const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
          const ss = String(remaining % 60).padStart(2, "0");
          const pct = Math.max(0, Math.min(100, (remaining / active.duration) * 100));
          const urgent = remaining <= 10;
          return (
            <div className={`rounded-2xl border px-4 py-3 space-y-2 ${
              active.dir === "UP" ? "border-emerald-400/40 bg-emerald-500/10" : "border-rose-400/40 bg-rose-500/10"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{active.dir === "UP" ? "📈" : "📉"}</span>
                  <div>
                    <div className={`text-[13px] font-extrabold ${active.dir === "UP" ? "text-emerald-300" : "text-rose-300"}`}>{active.dir} ACTIVE</div>
                    <div className="text-[10px] text-white/60">{activeAmounts.length} trade{activeAmounts.length > 1 ? "s" : ""} · entry ${active.startPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-extrabold text-[20px] tabular-nums border ${
                  urgent ? "border-amber-400/60 bg-amber-500/15 text-amber-200 animate-pulse" : "border-white/15 bg-slate-950/50 text-white"
                }`} aria-live="polite">
                  <Clock className="w-4 h-4" /> {mm}:{ss}
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full transition-[width] duration-200 ${urgent ? "bg-amber-400" : active.dir === "UP" ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/60">Stake <span className="text-white font-extrabold font-mono">${activeAmounts.reduce((s, n) => s + n, 0).toFixed(2)}</span></span>
                <span className="text-amber-300 font-bold">Win → ${(activeAmounts.reduce((s, n) => s + n, 0) * (1 + PAYOUT)).toFixed(2)}</span>
              </div>
            </div>
          );
        })()}

        {/* Chart */}
        <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-2 overflow-hidden">
          <canvas ref={canvasRef} style={{ width: "100%", height: 220 }} />
          {active && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-950/80 border border-sky-400/40 text-[12px] font-bold flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-sky-300" /> {remaining}s
            </div>
          )}
        </div>

        {/* Timeframes */}
        <div className="grid grid-cols-4 gap-2">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => !active && setTimeframe(tf)}
              disabled={!!active}
              className={`clickable py-2 rounded-xl text-[12px] font-bold border transition ${
                timeframe.label === tf.label
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 border-sky-400 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              } ${active ? "opacity-50" : ""}`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Stake */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/60 font-semibold">Stake (USD)</span>
            <span className="text-[10px] text-amber-300 font-bold">Payout 85%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStake(s => Math.max(1, s - 5))} className="clickable w-9 h-9 rounded-lg bg-white/5 border border-white/10">−</button>
            <input
              type="number" min={1} value={stake}
              onChange={e => setStake(Math.max(1, Number(e.target.value) || 1))}
              className="flex-1 text-center bg-transparent border border-white/10 rounded-lg py-2 font-mono font-bold text-[15px]"
            />
            <button onClick={() => setStake(s => s + 5)} className="clickable w-9 h-9 rounded-lg bg-white/5 border border-white/10">+</button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[5, 10, 25, 100].map(v => (
              <button key={v} onClick={() => setStake(v)} className="clickable py-1.5 text-[11px] rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">${v}</button>
            ))}
          </div>
        </div>

        {/* People & Pool (Experts Option) */}
        {(() => {
          const totalPool = poolBuy + poolSell;
          const buyPct = totalPool > 0 ? (poolBuy / totalPool) * 100 : 50;
          return (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-extrabold">👥 BUY {peopleBuy} · ${poolBuy.toFixed(0)}</span>
                <span className="text-white/50">Total Pool <span className="text-amber-300 font-extrabold">${totalPool.toFixed(0)}</span></span>
                <span className="text-rose-300 font-extrabold">SELL {peopleSell} · ${poolSell.toFixed(0)} 👥</span>
              </div>
              <div className="h-2 w-full rounded-full bg-rose-500/30 overflow-hidden">
                <div className="h-full bg-emerald-400 transition-[width] duration-500" style={{ width: `${buyPct}%` }} />
              </div>
              <div className="text-[9px] text-white/40 text-center">Minority side wins (Retail Market Logic)</div>
            </div>
          );
        })()}

        {/* BUY / SELL */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => placeBet("UP")} disabled={!!active && active.dir !== "UP"}
            className="clickable rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 py-4 font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-40"
          >
            <ArrowUp className="w-5 h-5" /> BUY 📈
          </button>
          <button
            onClick={() => placeBet("DOWN")} disabled={!!active && active.dir !== "DOWN"}
            className="clickable rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 py-4 font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 disabled:opacity-40"
          >
            <ArrowDown className="w-5 h-5" /> SELL 📉
          </button>
        </div>

        {/* Add More (same direction) */}
        {active && (
          <button
            onClick={addMore}
            disabled={addMoreLocked || stake > balance}
            className="clickable w-full py-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-[13px] font-extrabold disabled:opacity-40"
          >
            {addMoreLocked ? "🔒 Add More locked (final 10s)" : `➕ Add More — $${stake} (${active.dir})`}
          </button>
        )}

        {/* History */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-bold">Trade History <span className="text-white/40 font-normal">(latest {Math.min(trades.length, 15)} of {trades.length})</span></h3>
            <div className="flex items-center gap-2">
              {trades.length > 0 && (
                <>
                  <button data-testid="export-csv-btn" onClick={() => exportTradesCSV(trades, asset.symbol)} className="text-[11px] text-emerald-300 hover:text-emerald-200">CSV</button>
                  <button data-testid="export-pdf-btn" onClick={() => exportTradesPDF(trades, asset.symbol)} className="text-[11px] text-sky-300 hover:text-sky-200">PDF</button>
                </>
              )}
              {trades.length > 0 && (
                <button onClick={() => { setTrades([]); localStorage.removeItem(HIST_KEY); }} className="text-[11px] text-white/50 hover:text-rose-300">Clear</button>
              )}
              <button onClick={() => navigate("/games/trading")} className="text-[11px] text-sky-300 flex items-center gap-0.5">
                All markets <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          {trades.length === 0 ? (
            <div className="text-[12px] text-white/50 py-4 text-center">No trades yet</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {trades.slice(0, 15).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTrade(t)}
                  className="clickable w-full text-left rounded-lg bg-white/5 border border-white/5 p-2 hover:bg-white/10 hover:border-white/15 transition"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${t.dir === "UP" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{t.dir}</span>
                    {t.forced && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">FORCED {t.forced}</span>
                    )}
                    <span className="text-white/80 truncate flex-1">{t.symbol}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.result === "win" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {t.result === "win" ? "WIN" : "LOSS"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] font-mono">
                    <div><div className="text-white/40">Stake</div><div className="text-white">${(t.stake ?? 0).toFixed(2)}</div></div>
                    <div><div className="text-white/40">Potential</div><div className="text-amber-300">${(t.potentialWin ?? (t.stake ?? 0) * (1 + PAYOUT)).toFixed(2)}</div></div>
                    <div><div className="text-white/40">Price</div><div className="text-white/70">{(t.startPrice ?? 0).toFixed(2)}→{(t.endPrice ?? 0).toFixed(2)}</div></div>
                    <div className="text-right"><div className="text-white/40">P&L</div><div className={`font-extrabold ${t.result === "win" ? "text-emerald-400" : "text-rose-400"}`}>{t.result === "win" ? "+" : ""}${(t.payout ?? 0).toFixed(2)}</div></div>
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5">{new Date(t.at).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-10" />
      </div>

        {/* Admin Controls — gated to verified super_admin staff only */}
        {isSuperAdmin && (
        <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60">
          <button
            onClick={() => setAdminOpen(v => !v)}
            className="clickable w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-bold text-amber-300"
          >
            <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Admin Controls</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${adminPausedRef.current || adminBiasRef.current ? "border-amber-400/40 bg-amber-500/10" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"}`}>
              {adminPausedRef.current ? "Manual 🔒" : "Auto"}
            </span>
          </button>
          {adminOpen && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
              <div className="flex gap-2">
                <input
                  type="number" step="0.01" placeholder="Set price..."
                  value={adminPriceInput}
                  onChange={e => setAdminPriceInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[12px] font-mono"
                />
                <button onClick={adminSetPrice} className="clickable px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-bold">Set</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <button onClick={() => adminForce("up")} className="clickable py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">📈 UP</button>
                <button onClick={() => adminForce("down")} className="clickable py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[11px] font-bold">📉 DOWN</button>
                <button onClick={() => adminForce("random")} className="clickable py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 text-[11px] font-bold">🎲 Rnd</button>
                <button onClick={adminAuto} className="clickable py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-bold">▶ Auto</button>
                <button onClick={adminReset} className="clickable py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-[11px] font-bold">↻ Reset</button>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] font-bold text-amber-300 mb-1.5">🎯 Force Win {active ? `(active: ${active.dir})` : "(needs active trade)"}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => adminForceWin("UP")} disabled={!active} className="clickable py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold disabled:opacity-40">🟢 Force BUY Win</button>
                  <button onClick={() => adminForceWin("DOWN")} disabled={!active} className="clickable py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-bold disabled:opacity-40">🔴 Force SELL Win</button>
                </div>
                {forceWinRef.current && active && (
                  <div className="mt-1.5 text-[10px] text-amber-300">
                    Forcing <b>{forceWinRef.current}</b> win — chart trends accordingly.
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/40">Local simulation override — does not affect other users.</p>
            </div>
          )}
        </div>
        )}
    </div>

    <Sheet open={!!detailTrade} onOpenChange={(o) => !o && setDetailTrade(null)}>

      <SheetContent side="right" className="w-full sm:max-w-md bg-slate-950 border-l border-white/10 text-white overflow-y-auto">
        {detailTrade && (() => {
          const t = detailTrade;
          const ratio = t.payoutRatio ?? PAYOUT;
          const snap = t.poolSnapshot;
          const total = snap ? snap.poolBuy + snap.poolSell : 0;
          const buyPct = total > 0 ? (snap!.poolBuy / total) * 100 : 50;
          const delta = t.endPrice - t.startPrice;
          return (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-white flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${t.dir === "UP" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{t.dir}</span>
                  <span>{t.symbol}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded text-[11px] font-bold ${t.result === "win" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                    {t.result === "win" ? "WIN" : "LOSS"}
                  </span>
                </SheetTitle>
                <SheetDescription className="text-white/50 text-[11px]">
                  {new Date(t.at).toLocaleString()} · {t.asset}
                  {t.forced && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">FORCED {t.forced}</span>}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-3 text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    const lines = [
                      `Symbol: ${t.symbol} (${t.asset})`,
                      `Side: ${t.dir === "UP" ? "BUY" : "SELL"}`,
                      `Amount (Stake): $${t.stake.toFixed(2)}`,
                      `Payout ratio: ${(ratio * 100).toFixed(0)}%`,
                      `Potential win: $${t.potentialWin.toFixed(2)}`,
                      `Result: ${t.result.toUpperCase()} (${t.result === "win" ? "+" : ""}$${t.payout.toFixed(2)})`,
                      snap
                        ? `Pool snapshot — BUY: ${snap.peopleBuy} people / $${snap.poolBuy.toFixed(0)} · SELL: ${snap.peopleSell} people / $${snap.poolSell.toFixed(0)}`
                        : `Pool snapshot — n/a`,
                      `Time: ${new Date(t.at).toLocaleString()}`,
                    ].join("\n");
                    navigator.clipboard?.writeText(lines).then(
                      () => toast.success("Trade details copied"),
                      () => toast.error("Copy failed")
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2 text-[12px] font-semibold text-white/80"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy details
                </button>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Trade Details</div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono">
                    <div className="text-white/50">Side</div><div className="text-right font-bold">{t.dir === "UP" ? "BUY 📈" : "SELL 📉"}</div>
                    <div className="text-white/50">Stake</div><div className="text-right">${t.stake.toFixed(2)}</div>
                    <div className="text-white/50">Payout ratio</div><div className="text-right text-amber-300">{(ratio * 100).toFixed(0)}%</div>
                    <div className="text-white/50">Potential win</div><div className="text-right text-amber-300">${t.potentialWin.toFixed(2)}</div>
                    <div className="text-white/50">Duration</div><div className="text-right">{t.duration ? `${t.duration}s` : "—"}</div>
                    <div className="text-white/50">P&L</div>
                    <div className={`text-right font-extrabold ${t.result === "win" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.result === "win" ? "+" : ""}${t.payout.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Price Movement</div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div><div className="text-white/40 text-[10px]">Entry</div><div>{t.startPrice.toFixed(4)}</div></div>
                    <div><div className="text-white/40 text-[10px]">Exit</div><div>{t.endPrice.toFixed(4)}</div></div>
                    <div>
                      <div className="text-white/40 text-[10px]">Δ</div>
                      <div className={delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {delta >= 0 ? "+" : ""}{delta.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {snap && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Pool Snapshot (at settle)</div>
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-emerald-300">BUY {snap.peopleBuy} · ${snap.poolBuy.toFixed(0)}</span>
                      <span className="text-rose-300">${snap.poolSell.toFixed(0)} · {snap.peopleSell} SELL</span>
                    </div>
                    <div className="h-2 rounded-full bg-rose-500/30 overflow-hidden">
                      <div className="h-full bg-emerald-500/70" style={{ width: `${buyPct}%` }} />
                    </div>
                    <div className="mt-1.5 text-[10px] text-white/40 text-center font-mono">
                      Total pool ${total.toFixed(0)} · {buyPct.toFixed(1)}% BUY
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </SheetContent>
    </Sheet>
    </>
  );
}
