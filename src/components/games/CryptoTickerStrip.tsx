import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Live crypto ticker strip.
 * Fetches BTC/ETH/BNB/TRX from CoinGecko every 60s (no key required).
 * Falls back to last-known / seeded values on network error.
 */
type Coin = {
  id: string;
  symbol: string;
  color: string;
};

const COINS: Coin[] = [
  { id: "bitcoin",      symbol: "BTC", color: "#F7931A" },
  { id: "ethereum",     symbol: "ETH", color: "#8A92B2" },
  { id: "binancecoin",  symbol: "BNB", color: "#F3BA2F" },
  { id: "tron",         symbol: "TRX", color: "#EF4444" },
];

const SEED: Record<string, { price: number; change: number }> = {
  BTC: { price: 68500, change: 2.4 },
  ETH: { price: 3550,  change: 1.8 },
  BNB: { price: 615,   change: 0.9 },
  TRX: { price: 0.135, change: 1.2 },
};

const fmtPrice = (p: number) =>
  p >= 100
    ? `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${p.toLocaleString("en-US", { maximumFractionDigits: p < 1 ? 4 : 2 })}`;

export default function CryptoTickerStrip() {
  const [data, setData] = useState<Record<string, { price: number; change: number }>>(SEED);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { headers: { accept: "application/json" } },
        );
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as Record<
          string,
          { usd: number; usd_24h_change: number }
        >;
        if (cancelled) return;
        const next: Record<string, { price: number; change: number }> = {};
        for (const c of COINS) {
          const row = json[c.id];
          if (row) next[c.symbol] = { price: row.usd, change: row.usd_24h_change };
        }
        setData((prev) => ({ ...prev, ...next }));
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div
      role="marquee"
      aria-label="Live cryptocurrency prices"
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: "0 10px 30px -18px rgba(0,0,0,0.9)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
          style={{
            color: live ? "#12C665" : "#FEC013",
            borderColor: live ? "#12C66555" : "#FEC01355",
            background: live ? "#12C66518" : "#FEC01318",
          }}
          aria-label={live ? "Live data" : "Cached data"}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: live ? "#12C665" : "#FEC013",
              boxShadow: `0 0 8px ${live ? "#12C665" : "#FEC013"}`,
            }}
          />
          {live ? "LIVE" : "CACHE"}
        </span>

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-3 min-w-max">
            {COINS.map((c) => {
              const row = data[c.symbol] ?? SEED[c.symbol];
              const up = row.change >= 0;
              return (
                <li
                  key={c.symbol}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-black/30"
                >
                  <span
                    className="text-[10px] font-black tracking-wider"
                    style={{ color: c.color }}
                  >
                    {c.symbol}
                  </span>
                  <span className="text-[11px] font-bold text-white tabular-nums">
                    {fmtPrice(row.price)}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-black tabular-nums"
                    style={{ color: up ? "#12C665" : "#EF4444" }}
                  >
                    {up ? (
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    )}
                    {up ? "+" : ""}
                    {row.change.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
