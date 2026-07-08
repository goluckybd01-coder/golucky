import React from "react";
import { MARKETS, type Market, marketLabel } from "@/engine";
import { cn } from "@/lib/utils";

interface Props { market: Market; onChange: (m: Market) => void }
const MarketTabs: React.FC<Props> = ({ market, onChange }) => (
  <div className="grid grid-cols-4 gap-2 p-3">
    {MARKETS.map((m) => (
      <button
        key={m}
        onClick={() => onChange(m)}
        className={cn(
          "rounded-2xl px-2 py-2.5 text-xs font-bold transition-all shadow-sm",
          market === m
            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground scale-[1.02] shadow-md"
            : "bg-card text-muted-foreground hover:text-foreground"
        )}
      >
        {marketLabel(m)}
      </button>
    ))}
  </div>
);
export default MarketTabs;
