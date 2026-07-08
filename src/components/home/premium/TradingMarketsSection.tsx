import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { fmtPrice } from "@/lib/usdBdt";
import { AssetGlyph } from "@/lib/assetEmojis";

const FEATURED = ["GLC/USD", "NOVA/USD", "BTC/USD", "ETH/USD", "XAU/USD", "EUR/USD"];

export default function TradingMarketsSection() {
  const navigate = useNavigate();
  const { data } = useMarketPrices(8_000);

  const tickers = useMemo(() => {
    const list = data?.prices || [];
    const map = new Map(list.map((p) => [p.symbol, p]));
    return FEATURED.map((s) => map.get(s)).filter(Boolean) as NonNullable<ReturnType<typeof map.get>>[];
  }, [data]);

  return (
    <div>
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            🔥 GoLucky Trading
          </h2>
          <p className="text-[11px] text-white/60 mt-0.5">Crypto · Forex · Commodities · GLC & NOVA</p>
        </div>
        <button onClick={() => navigate("/trading")} className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
          Open <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tickers.map((t, i) => {
          const up = (t.change_24h ?? 0) >= 0;
          const internal = t.is_admin_controlled;
          return (
            <motion.button
              key={t.symbol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/trading/${t.symbol.replace("/", "-")}`)}
              className={`relative text-left rounded-xl border ${internal ? "border-amber-400/40" : "border-white/10"} bg-white/[0.03] backdrop-blur-md p-2.5 hover:bg-white/[0.06] transition`}
            >
              {internal && (
                <span className="absolute -top-1.5 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[8px] font-extrabold text-black tracking-wider">GLC</span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1"><AssetGlyph symbol={t.symbol} size={18} />{t.symbol}</span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                  {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {(t.change_24h ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="text-sm font-extrabold font-mono tabular-nums mt-0.5 text-white">${fmtPrice(t.price, t.decimals)}</div>
              <div className="text-[9px] text-white/40 truncate">{t.display_name}</div>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/trading")}
        className="mt-3 w-full py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/30 hover:from-amber-300 hover:to-amber-500 transition"
      >
        Trade all 14 markets →
      </button>
    </div>
  );
}
