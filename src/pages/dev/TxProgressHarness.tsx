import { useSearchParams } from "react-router-dom";
import TxProgress, { TxStage, TxFailedAt } from "@/components/wallet/TxProgress";

/**
 * Dev-only harness for Playwright E2E of TxProgress in the exact call-site
 * configurations used by VerifyDeposit and USDTDepositFlow.
 *
 * URL: /__dev/tx-progress?ctx=verify|usdt&stage=pending|approved|refreshed|failed&failedAt=pending|approved|refreshed
 */
export default function TxProgressHarness() {
  const [sp] = useSearchParams();
  const ctx = (sp.get("ctx") ?? "verify") as "verify" | "usdt";
  const stage = (sp.get("stage") ?? "pending") as TxStage;
  const failedAt = (sp.get("failedAt") ?? "pending") as TxFailedAt;
  const failedMessage = sp.get("failedMessage") ?? undefined;

  const labels =
    ctx === "usdt"
      ? { approved: "Credited", refreshed: "Vault Updated" }
      : { approved: "Credited" };

  return (
    <div data-testid="tx-harness" data-ctx={ctx} className="min-h-screen bg-black p-6 grid place-items-center">
      <div className="w-full max-w-md">
        <TxProgress stage={stage} failedAt={failedAt} labels={labels} failedMessage={failedMessage} />
      </div>
    </div>
  );
}
