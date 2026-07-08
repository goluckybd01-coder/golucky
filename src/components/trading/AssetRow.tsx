import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import Sparkline from "./Sparkline";
import { fmtPrice } from "@/lib/usdBdt";
import type { MarketPrice } from "@/hooks/useMarketPrices";
import { AssetGlyph } from "@/lib/assetEmojis";

interface Props {
  asset: MarketPrice;
  onTrade: () => void;
  onChart: () => void;
}

// Premium glassmorphism asset row with sparkline, change %, and quick BUY/SELL.
export default function AssetRow({ asset, onTrade, onChart }: Props) {
  const up = (asset.change_24h ?? 0) >= 0;
  const isInternal = asset.is_admin_controlled;
  const spread = Math.max(asset.price * 0.0002, 0.01);
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`group relative rounded-2xl border ${isInternal ? "border-amber-400/30" : "border-white/10"} bg-white/[0.03] backdrop-blur-md p-3 transition-shadow hover:shadow-lg hover:shadow-amber-500/10`}
    >
      {isInternal && (
        <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[9px] font-extrabold text-black tracking-wider">GOLUCKY</span>
      )}
      <div className="flex items-center gap-3">
        <button onClick={onChart} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <div className={`w-9 h-9 rounded-full grid place-items-center ${
            isInternal ? "bg-gradient-to-br from-amber-400 to-amber-700 text-black" : "bg-white/10 text-white/80"
          }`}>
            <AssetGlyph symbol={asset.symbol} size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
              <AssetGlyph symbol={asset.symbol} size={16} />
              {asset.symbol}
            </div>
            <div className="text-[10px] text-white/40 truncate">{asset.display_name}</div>
          </div>
        </button>

        <div className="hidden sm:block">
          <Sparkline value={asset.price} color={up ? "#34d399" : "#f87171"} />
        </div>

        <div className="text-right min-w-[88px]">
          <div className="text-sm font-bold font-mono tabular-nums text-white">${fmtPrice(asset.price, asset.decimals)}</div>
          <div className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {asset.change_24h.toFixed(2)}%
          </div>
        </div>

        <button
          onClick={onTrade}
          className="ml-1 px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/30 hover:from-amber-300 hover:to-amber-500 active:scale-95 transition"
        >TRADE</button>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/35">
        <span>Spread ${fmtPrice(spread, asset.decimals)}</span>
        <span>{asset.source === "admin" ? "Internal feed" : asset.source}</span>
      </div>
    </motion.div>
  );
}
