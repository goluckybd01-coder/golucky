import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import CandleChart from "@/components/trading/CandleChart";
import BetTicket from "@/components/trading/BetTicket";
import ActiveTradesPanel from "@/components/trading/ActiveTradesPanel";
import { fmtPrice } from "@/lib/usdBdt";
import { AssetGlyph } from "@/lib/assetEmojis";

export default function TradingAsset() {
  const { asset: param } = useParams();
  const navigate = useNavigate();
  const symbol = useMemo(() => (param || "").replace("-", "/").toUpperCase(), [param]);
  const { data, isLoading } = useMarketPrices(3_000);
  const [ticketOpen, setTicketOpen] = useState(false);

  const asset = (data?.prices || []).find((p) => p.symbol === symbol);

  if (!isLoading && !asset && data) return <Navigate to="/trading" replace />;

  const up = (asset?.change_24h ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white pb-40">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/60 border-b border-amber-500/15">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/trading")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold flex items-center gap-2">
              <AssetGlyph symbol={symbol} size={20} />
              {symbol}
            </h1>
            <p className="text-[10px] text-white/50 truncate">{asset?.display_name || "Loading…"}</p>
          </div>
          {asset && (
            <div className="text-right">
              <div className="text-base font-extrabold font-mono tabular-nums">${fmtPrice(asset.price, asset.decimals)}</div>
              <div className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {(asset.change_24h ?? 0).toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 pt-4 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <div className="h-[280px] sm:h-[340px]">
            <CandleChart
              symbol={symbol}
              price={asset?.price ?? 0}
              height={typeof window !== "undefined" && window.innerWidth < 640 ? 280 : 340}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-1">
          <button
            onClick={() => setTicketOpen(true)}
            className="h-14 rounded-2xl text-base font-extrabold bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-lg shadow-rose-500/30 transition active:scale-[0.98]"
          >↓ SELL</button>
          <button
            onClick={() => setTicketOpen(true)}
            className="h-14 rounded-2xl text-base font-extrabold bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition active:scale-[0.98]"
          >↑ BUY</button>
        </div>
      </main>

      <BetTicket asset={asset ?? null} open={ticketOpen} onClose={() => setTicketOpen(false)} />
      <ActiveTradesPanel />
    </div>
  );
}
