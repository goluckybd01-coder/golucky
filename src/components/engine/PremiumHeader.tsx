import React from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGlobalWallet as useWallet } from "@/context/WalletContext";
import { formatTaka } from "@/lib/currency";

interface Props { title: string; subtitle?: string }

const PremiumHeader: React.FC<Props> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { balance } = useWallet();
  return (
    <header className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-primary/90 via-primary to-accent p-4 text-primary-foreground shadow-lg">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-full bg-white/10 p-2 backdrop-blur hover:bg-white/20 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold tracking-wide">{title}</h1>
          {subtitle && <p className="text-[11px] opacity-80">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          <Wallet size={13} />
          <span>{formatTaka(balance ?? 0, 0)}</span>
        </div>
      </div>
    </header>
  );
};
export default PremiumHeader;
