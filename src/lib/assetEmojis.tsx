// Central map of trading asset symbols to display glyphs (emoji or unicode).
export const ASSET_EMOJI: Record<string, string> = {
  "GLC/USD": "🍀",
  "NOVA/USD": "⭐",
  "XAU/USD": "🥇",
  "XAG/USD": "🥈",
  "XCU/USD": "🔶",
  "XTI/USD": "🛢️",
  "XNG/USD": "🔥",
  "BTC/USD": "₿",
  "ETH/USD": "⟠",
  "XRP/USD": "✖",
  "LTC/USD": "Ł",
  "SOL/USD": "◎",
  "GBP/USD": "£",
  "EUR/USD": "€",
};

export function getAssetEmoji(symbol?: string): string {
  if (!symbol) return "•";
  return ASSET_EMOJI[symbol.toUpperCase()] ?? "•";
}

interface GlyphProps {
  symbol?: string;
  size?: number;
  className?: string;
}

// Reusable inline glyph for trading asset logos.
export function AssetGlyph({ symbol, size = 16, className = "" }: GlyphProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center leading-none ${className}`}
      style={{ fontSize: size, width: size, height: size }}
    >
      {getAssetEmoji(symbol)}
    </span>
  );
}
