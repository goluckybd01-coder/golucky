import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, TrendingUp, TrendingDown, RefreshCw, Shield } from "lucide-react";
import { useMarketPrices, formatPriceUSD, type MarketPrice } from "@/hooks/useMarketPrices";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AssetGlyph } from "@/lib/assetEmojis";

type CategoryFilter = "all" | "internal" | "crypto" | "forex" | "commodity";

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "internal", label: "GoLucky" },
  { key: "crypto", label: "Crypto" },
  { key: "commodity", label: "Commodities" },
  { key: "forex", label: "Forex" },
];

export default function TradingMarkets() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const { data, isLoading, isFetching, error, refetch } = useMarketPrices(10_000);

  const prices = data?.prices ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prices.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.symbol.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q) ||
        p.base_code.toLowerCase().includes(q)
      );
    });
  }, [prices, filter, query]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0b0e11]/85 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/5"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">Markets</h1>
            <p className="text-[11px] text-white/40">
              Live • {data ? new Date(data.generated_at).toLocaleTimeString() : "—"}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-white/5"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coin, pair…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/40"
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
                filter === t.key
                  ? "bg-amber-400 text-black"
                  : "bg-white/[0.04] text-white/70 hover:bg-white/10",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] md:grid-cols-[1.6fr_1fr_1fr_1fr] px-3 py-2 text-[11px] uppercase tracking-wider text-white/40">
          <span>Pair</span>
          <span className="text-right">Last Price</span>
          <span className="text-right">24h Change</span>
          <span className="text-right hidden md:block">24h Volume</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-300">
            Failed to load markets: {(error as Error).message}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">No assets match.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {visible.map((p) => (
              <MarketRow
                key={p.id}
                price={p}
                onClick={() => navigate(`/markets/${encodeURIComponent(p.symbol.replace("/", "-"))}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MarketRow({ price, onClick }: { price: MarketPrice; onClick: () => void }) {
  const up = price.change_24h >= 0;
  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[1.4fr_1fr_1fr_0.8fr] md:grid-cols-[1.6fr_1fr_1fr_1fr] items-center px-3 py-3 hover:bg-white/[0.03] transition text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
            price.category === "internal"
              ? "bg-gradient-to-br from-amber-300 to-amber-600 text-black"
              : price.category === "crypto"
                ? "bg-gradient-to-br from-orange-400/30 to-yellow-500/20 text-amber-200"
                : price.category === "commodity"
                  ? "bg-gradient-to-br from-yellow-300/20 to-amber-700/20 text-yellow-200"
                  : "bg-gradient-to-br from-sky-400/20 to-blue-700/20 text-sky-200",
          )}
        >
          <AssetGlyph symbol={price.symbol} size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <AssetGlyph symbol={price.symbol} size={16} />
            <span className="font-semibold text-sm truncate">{price.symbol}</span>
            {price.is_admin_controlled && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Shield className="h-2.5 w-2.5" /> DEMO
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/40 truncate">{price.display_name}</div>
        </div>
      </div>

      <div className="text-right tabular-nums font-medium">
        {formatPriceUSD(price.price, price.decimals)}
      </div>

      <div
        className={cn(
          "text-right tabular-nums font-medium flex items-center justify-end gap-1",
          up ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {up ? "+" : ""}
        {price.change_24h.toFixed(2)}%
      </div>

      <div className="text-right tabular-nums text-white/60 text-sm hidden md:block">
        {price.volume_24h > 0
          ? `$${(price.volume_24h / 1e6).toFixed(2)}M`
          : "—"}
      </div>
    </button>
  );
}
