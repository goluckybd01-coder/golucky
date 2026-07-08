/**
 * WalletHub — Ultra Premium Dual Wallet page.
 * Route: /wallet
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useDualWallet } from "@/hooks/useDualWallet";
import WalletHero from "@/components/wallet/dual/WalletHero";
import MainWalletCard from "@/components/wallet/dual/MainWalletCard";
import ProviderWalletCard from "@/components/wallet/dual/ProviderWalletCard";
import CurrencySwapCard from "@/components/wallet/dual/CurrencySwapCard";
import QuickTransferCard from "@/components/wallet/dual/QuickTransferCard";
import WalletHistoryTabs from "@/components/wallet/dual/WalletHistoryTabs";
import { transferFromProvider } from "@/lib/dualWalletService";
import { toast } from "sonner";

export default function WalletHub() {
  const w = useDualWallet();
  const [swapOpen, setSwapOpen] = useState(false);
  const [pulling, setPulling] = useState(false);

  const pullAll = async () => {
    if (w.providerBalance <= 0) return;
    setPulling(true);
    const res = await transferFromProvider(w.providerBalance, "generic");
    setPulling(false);
    if (!res.success) return toast.error(res.error ?? "Pull-back failed");
    toast.success("Provider balance pulled to Main");
    w.refresh();
  };

  return (
    <>
      <Helmet>
        <title>Wallet · GoLucky — BDT & USDT Dual Wallet</title>
        <meta
          name="description"
          content="GoLucky ultra-premium dual wallet: BDT and USDT sub-balances, 3rd-party provider wallet, instant swap and transfer."
        />
      </Helmet>

      <main className="gl-canvas min-h-screen px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          <WalletHero
            balanceBDT={w.balanceBDT}
            balanceUSDT={w.balanceUSDT}
            providerBalance={w.providerBalance}
            rate={w.rate}
            onRefresh={w.refresh}
            isLoading={w.isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <MainWalletCard
              balanceBDT={w.balanceBDT}
              balanceUSDT={w.balanceUSDT}
              onOpenSwap={() => setSwapOpen((s) => !s)}
            />
            <ProviderWalletCard
              providerBalance={w.providerBalance}
              onPullBack={pullAll}
              pulling={pulling}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {swapOpen ? (
              <CurrencySwapCard
                balanceBDT={w.balanceBDT}
                balanceUSDT={w.balanceUSDT}
                rate={w.rate}
                onDone={w.refresh}
              />
            ) : (
              <div
                className="gl-glass rounded-3xl p-5 md:p-6 flex flex-col justify-center items-start gap-2"
              >
                <div className="text-[10px] uppercase tracking-[0.24em] gl-text-dim">Currency</div>
                <div className="text-sm gl-text">
                  Use the <span style={{ color: "var(--gl-cyan)" }}>Swap</span> button on the Main
                  Wallet card to open BDT ⇄ USDT conversion.
                </div>
                <div className="text-xs gl-text-dim">
                  Current rate: 1 USDT = ৳{w.rate.toLocaleString()}
                </div>
              </div>
            )}

            <QuickTransferCard
              balanceBDT={w.balanceBDT}
              providerBalance={w.providerBalance}
              onDone={w.refresh}
            />
          </div>

          <WalletHistoryTabs userId={w.userId} />
        </div>
      </main>
    </>
  );
}
