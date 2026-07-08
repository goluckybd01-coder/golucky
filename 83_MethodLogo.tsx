import novaCoinLogo from "@/assets/nova-coin-logo.png.asset.json";
import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import ewalletLogo from "@/assets/ewallet-logo.png";

type Props = { method: "ewallet" | "novafi" | "usdt" | "binance"; size?: number };

// Official Tether (USDT) logo — green circular
const UsdtLogo = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} aria-label="USDT">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      fill="#FFFFFF"
      d="M17.9 14.4v-2h4.6v-3H9.5v3h4.6v2c-3.7.2-6.5.9-6.5 1.8s2.8 1.6 6.5 1.8v6.4h3.8v-6.4c3.7-.2 6.5-.9 6.5-1.8s-2.8-1.6-6.5-1.8zm0 3.05v-.01c-.1 0-.6.04-1.9.04-1 0-1.7-.03-2-.04v.01c-3.2-.14-5.6-.7-5.6-1.36s2.4-1.22 5.6-1.36v2.18c.3.02 1 .06 2 .06 1.3 0 1.8-.05 1.9-.06v-2.18c3.2.14 5.6.7 5.6 1.36s-2.4 1.22-5.6 1.36z"
    />
  </svg>
);

// Official Binance logo — yellow diamond
const BinanceLogo = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 128 128" width={size} height={size} aria-label="Binance">
    <g fill="#F3BA2F">
      <path d="M38.7 55.6L64 30.3l25.3 25.3 14.7-14.7L64 1 24 41l14.7 14.7z" />
      <path d="M1 64l14.7-14.7L30.4 64 15.7 78.7z" />
      <path d="M38.7 72.4L64 97.7l25.3-25.3L104 87.1 64 127 24 87.1l-.1-.1z" />
      <path d="M97.6 64l14.7-14.7L127 64l-14.7 14.7z" />
      <path d="M78.9 64L64 49.1 52.9 60.2l-1.3 1.3-2.6 2.6 14.9 14.9z" />
    </g>
  </svg>
);

// Premium E-Wallet logo — GoLucky branded PNG asset
const EwalletLogo = ({ size = 44 }: { size?: number }) => (
  <img
    src={ewalletLogo}
    alt="GoLucky E-Wallet"
    width={size}
    height={size}
    className="object-contain drop-shadow-[0_0_10px_rgba(0,230,118,0.55)]"
    loading="lazy"
    decoding="async"
  />
);

const NovaLogo = ({ size = 44 }: { size?: number }) => (
  <img
    src={novaCoinLogo.url}
    alt="NovaFi Wallet"
    width={size}
    height={size}
    className="object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.55)]"
    loading="lazy"
    decoding="async"
  />
);

const MethodLogo = ({ method, size = 44 }: Props) => {
  switch (method) {
    case "usdt":
      return <UsdtLogo size={size} />;
    case "binance":
      return <BinanceLogo size={size} />;
    case "novafi":
      return <NovaLogo size={size} />;
    case "ewallet":
    default:
      return <EwalletLogo size={size} />;
  }
};

// Small stacked brand badges (bKash / Nagad / Rocket) shown under E-Wallet card
export const EwalletBrandBadges = () => (
  <div className="flex items-center justify-center gap-1.5 mt-1.5">
    <img src={bkashLogo} alt="bKash" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20" />
    <img src={nagadLogo} alt="Nagad" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20" />
    <span
      className="w-4 h-4 rounded-full ring-1 ring-white/20 flex items-center justify-center text-[8px] font-bold text-white"
      style={{ background: "linear-gradient(135deg,#8b1a8b,#4b0082)" }}
      aria-label="Rocket"
      title="Rocket"
    >
      R
    </span>
  </div>
);

export default MethodLogo;
