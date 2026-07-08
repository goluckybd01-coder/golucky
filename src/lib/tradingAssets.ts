import novaCoinLogo from "@/assets/nova-coin-logo.png.asset.json";

export type TradingAsset = {
  id: string;          // URL-safe id, e.g. "BTC-USD"
  name: string;
  symbol: string;      // "BTC/USD"
  group: "🔥 Your Coins" | "Commodities" | "Crypto" | "Forex";
  base: number;
  vol: number;
  custom?: boolean;
  logo?: string;
};

// Order & prices locked to the reference asset panel (14 assets).
export const TRADING_ASSETS: TradingAsset[] = [
  { id: "GLC-USD",  name: "GoLucky Coin",  symbol: "GLC/USD",  group: "🔥 Your Coins", base: 0.2856,    vol: 0.0008, custom: true },
  { id: "NOVA-USD", name: "Nova Coin",     symbol: "NOVA/USD", group: "🔥 Your Coins", base: 1.6502,    vol: 0.004,  custom: true, logo: novaCoinLogo.url },
  { id: "XAU-USD",  name: "Gold",          symbol: "XAU/USD",  group: "Commodities",   base: 2343.65,   vol: 1.5 },
  { id: "XAG-USD",  name: "Silver",        symbol: "XAG/USD",  group: "Commodities",   base: 27.35,     vol: 0.05 },
  { id: "XTI-USD",  name: "WTI Oil",       symbol: "XTI/USD",  group: "Commodities",   base: 78.25,     vol: 0.08 },
  { id: "XCU-USD",  name: "Copper",        symbol: "XCU/USD",  group: "Commodities",   base: 4.3250,    vol: 0.008 },
  { id: "XNG-USD",  name: "Natural Gas",   symbol: "XNG/USD",  group: "Commodities",   base: 2.650,     vol: 0.01 },
  { id: "BTC-USD",  name: "Bitcoin",       symbol: "BTC/USD",  group: "Crypto",        base: 66245.30,  vol: 60 },
  { id: "ETH-USD",  name: "Ethereum",      symbol: "ETH/USD",  group: "Crypto",        base: 3142.25,   vol: 8 },
  { id: "LTC-USD",  name: "Litecoin",      symbol: "LTC/USD",  group: "Crypto",        base: 85.30,     vol: 0.15 },
  { id: "SOL-USD",  name: "Solana",        symbol: "SOL/USD",  group: "Crypto",        base: 128.00,    vol: 0.4 },
  { id: "XRP-USD",  name: "Ripple",        symbol: "XRP/USD",  group: "Crypto",        base: 0.52,      vol: 0.002 },
  { id: "GBP-USD",  name: "British Pound", symbol: "GBP/USD",  group: "Forex",         base: 1.2650,    vol: 0.0004 },
  { id: "EUR-USD",  name: "Euro",          symbol: "EUR/USD",  group: "Forex",         base: 1.0850,    vol: 0.0003 },
];

export function getAsset(id: string | undefined): TradingAsset | undefined {
  if (!id) return undefined;
  return TRADING_ASSETS.find(a => a.id.toLowerCase() === id.toLowerCase());
}

export function formatPrice(p: number): string {
  if (p >= 1000) return p.toFixed(2);
  if (p >= 10) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(4);
}
