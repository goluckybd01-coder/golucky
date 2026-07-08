import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { getAsset, formatPrice, TRADING_ASSETS } from "@/lib/tradingAssets";
import MiniSparkline from "@/components/trading/MiniSparkline";
import { TokenLogo } from "@/components/trading/TokenLogo";
import { fetchFinnhubPrices } from "@/lib/finnhubPrices";

export default function TokenDetail() {
  const { asset } = useParams();
  const navigate = useNavigate();
  const a = getAsset(asset);

  const [price, setPrice] = useState(a?.base ?? 0);
  const [open, setOpen] = useState(a?.base ?? 0);
  const [history, setHistory] = useState<number[]>(() =>
    a ? Array.from({ length: 48 }, (_, i) => a.base + Math.sin(i / 4) * a.vol * 2 + (Math.random() - 0.5) * a.vol) : []
  );
  const [volume, setVolume] = useState<number>(() => Math.round((a?.base ?? 100) * 1000 * (Math.random() + 0.5)));
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  const isSim = a?.custom === true;

  useEffect(() => {
    if (!a) return;
    const tick = (p: number) => {
      setPrice(p);
      setHistory(h => [...h.slice(-99), p]);
      setUpdatedAt(Date.now());
      setVolume(v => Math.max(0, v + Math.round((Math.random() - 0.45) * (a.base * 50))));
    };
    if (isSim) {
      const t = setInterval(() => {
        const move = (Math.random() - 0.5) * a.vol * 2;
        tick(Math.max(a.vol, price + move));
      }, 1500);
      return () => clearInterval(t);
    }
    const pull = async () => {
      const live = await fetchFinnhubPrices([a.id]);
      const lp = live?.[a.id];
      if (lp?.price) {
        tick(lp.price);
        if (lp.change != null) setOpen(lp.price / (1 + lp.change / 100));
      }
    };
    pull();
    const t = setInterval(pull, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id]);

  if (!a) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">Token not found</div>
          <button onClick={() => navigate("/games/trading")} className="text-sky-400 underline text-sm">Back to Markets</button>
        </div>
      </div>
    );
  }

  const change = open ? ((price - open) / open) * 100 : 0;
  const up = change >= 0;
  const high = Math.max(...history, price);
  const low = Math.min(...history, price);
  const related = TRADING_ASSETS.filter(x => x.group === a.group && x.id !== a.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
        <div className="max-w-[430px] lg:max-w-[1024px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/games/trading")} className="clickable w-9 h-9 rounded-full bg-white/5 grid place-items-center border border-white/10">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/30 to-amber-500/20 border border-white/10 grid place-items-center overflow-hidden shrink-0">
            <TokenLogo src={a.logo} symbol={a.symbol} name={a.name} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold">{a.name}</div>
            <div className="text-[10px] text-white/60">{a.symbol} · {a.group}</div>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isSim ? "bg-amber-500/15 text-amber-300 border-amber-400/30" : "bg-sky-500/15 text-sky-300 border-sky-400/30"}`}>
            {isSim ? "SIM" : "LIVE"}
          </span>
        </div>
      </div>

      <div className="max-w-[430px] lg:max-w-[1024px] mx-auto px-4 py-4 space-y-4">
        {/* Price card */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider">Price</div>
              <div className="text-[28px] font-extrabold font-mono">${formatPrice(price)}</div>
              <div className={`text-[13px] font-bold flex items-center gap-1 mt-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {up ? "+" : ""}{change.toFixed(2)}% (24h)
              </div>
            </div>
            <MiniSparkline data={history} up={up} width={140} height={56} />
          </div>
          <div className="text-[10px] text-white/40 mt-2">Updated {Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))}s ago</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "24h High", v: `$${formatPrice(high)}` },
            { k: "24h Low",  v: `$${formatPrice(low)}` },
            { k: "Volume",   v: volume.toLocaleString() },
          ].map(s => (
            <div key={s.k} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div className="text-[10px] text-white/50 uppercase">{s.k}</div>
              <div className="text-[13px] font-bold mt-0.5 font-mono">{s.v}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/games/trading/${a.id}`)}
          className="clickable w-full rounded-2xl bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950 font-extrabold py-3 flex items-center justify-center gap-2"
        >
          Trade {a.symbol} <ExternalLink className="w-4 h-4" />
        </button>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h3 className="text-[12px] font-bold text-white/80 mb-2 px-1">More in {a.group}</h3>
            <div className="grid grid-cols-2 gap-2">
              {related.map(r => (
                <button key={r.id} onClick={() => navigate(`/markets/${r.id}`)} className="clickable text-left rounded-xl border border-white/10 bg-slate-900/60 hover:border-sky-400/40 p-3">
                  <div className="text-[12px] font-bold">{r.name}</div>
                  <div className="text-[10px] text-white/50">{r.symbol}</div>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="h-10" />
      </div>
    </div>
  );
}
