import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Props {
  amount: number;
  network: string;
  address: string;
  qrUrl: string | null;
}

export function UsdtPaymentCard({ amount, network, address, qrUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Wallet address copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-black via-zinc-900 to-black p-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-300/70">
            Application Fee
          </p>
          <p className="mt-1 font-serif text-4xl font-bold text-amber-300">
            {amount.toFixed(2)}{" "}
            <span className="text-lg text-emerald-300">USDT</span>
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          {network}
        </div>
      </div>

      <div className="relative mt-6 flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-2">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="USDT TRC20 wallet QR code"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <QrCode className="h-10 w-10" />
              <span className="text-[10px]">QR unavailable</span>
            </div>
          )}
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs uppercase tracking-widest text-emerald-300/70">
            Wallet Address ({network})
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 p-3">
            <code className="flex-1 break-all font-mono text-sm text-amber-100">
              {address || "— not configured —"}
            </code>
            <button
              onClick={copy}
              disabled={!address}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-30"
              aria-label="Copy wallet address"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
