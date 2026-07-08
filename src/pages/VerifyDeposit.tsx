import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Clock, XCircle, ShieldCheck, ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/context/WalletContext";
import TxProgress from "@/components/wallet/TxProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RESTART_TOOLTIP_ID = "last-restart-tooltip";
const RESTART_TOOLTIP_TEXT =
  "Time of the most recent polling restart. The counter resets to 0 when a new terminal state is reached (approved, rejected, failed, or cancelled).";

const TERMINAL_STATUSES = new Set(["approved", "rejected", "failed", "cancelled", "canceled"]);

type Result =
  | { state: "loading" }
  | {
      state: "found";
      status: string;
      amount: number;
      method: string;
      created_at: string;
      txn_id?: string | null;
      reason?: string | null;
    }
  | { state: "missing" }
  | { state: "error"; message: string };

/**
 * Default polling interval (ms) for deposit status refresh.
 * Override per-environment with VITE_VERIFY_DEPOSIT_POLL_INTERVAL,
 * or per-instance via the `pollInterval` prop.
 */
export const DEFAULT_POLL_INTERVAL = (() => {
  const raw = Number(import.meta.env.VITE_VERIFY_DEPOSIT_POLL_INTERVAL);
  return Number.isFinite(raw) && raw >= 1000 ? Math.floor(raw) : 8_000;
})();

/**
 * Default max failed polling attempts before stopping and showing Retry.
 * Override per-environment with VITE_VERIFY_DEPOSIT_MAX_ATTEMPTS,
 * or per-instance via the `maxFailedAttempts` prop.
 */
export const DEFAULT_MAX_FAILED_ATTEMPTS = (() => {
  const raw = Number(import.meta.env.VITE_VERIFY_DEPOSIT_MAX_ATTEMPTS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
})();

interface VerifyDepositProps {
  maxFailedAttempts?: number;
  pollInterval?: number;
}

export default function VerifyDeposit({
  maxFailedAttempts = DEFAULT_MAX_FAILED_ATTEMPTS,
  pollInterval = DEFAULT_POLL_INTERVAL,
}: VerifyDepositProps = {}) {
  const { orderId = "" } = useParams();
  const [sp] = useSearchParams();
  const [r, setR] = useState<Result>({ state: "loading" });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState(pollInterval);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartCount, setRestartCount] = useState(0);
  const [lastRestartTime, setLastRestartTime] = useState<Date | null>(null);
  const [restartTipOpen, setRestartTipOpen] = useState(false);
  const [restartTipTerminalOpen, setRestartTipTerminalOpen] = useState(false);

  const makeTooltipKeyHandler = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setter((prev) => !prev);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setter(false);
    }
  };
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const failedAttemptsRef = useRef(0);
  const refreshStartedRef = useRef(false);
  const [walletRefreshed, setWalletRefreshed] = useState(false);
  const { refresh: refreshWallet } = useWalletContext();

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("transaction_requests")
        .select("amount,status,payment_method,created_at,payment_details,id")
        .eq("type", "deposit")
        .or(`id.eq.${orderId},payment_details->>order_number.eq.${orderId}`)
        .limit(1)
        .maybeSingle();
      if (error) {
        throw new Error(error.message || "Failed to fetch deposit status");
      }
      if (!data) {
        setR({ state: "missing" });
      } else {
        const pd = (data.payment_details || {}) as {
          txn_id?: string;
          order_number?: string;
          reason?: string;
          rejection_reason?: string;
          failure_reason?: string;
          cancel_reason?: string;
          message?: string;
        };
        setR({
          state: "found",
          status: data.status,
          amount: Number(data.amount),
          method: data.payment_method || "—",
          created_at: data.created_at,
          txn_id: pd.txn_id ?? null,
          reason:
            pd.rejection_reason ||
            pd.failure_reason ||
            pd.cancel_reason ||
            pd.reason ||
            pd.message ||
            null,
        });
        if (TERMINAL_STATUSES.has((data.status || "").toLowerCase())) {
          clearTimers();
          setIsRestarting(false);
          setRestartCount(0);
          if ((data.status || "").toLowerCase() === "approved" && !refreshStartedRef.current) {
            refreshStartedRef.current = true;
            Promise.resolve(refreshWallet()).finally(() => setWalletRefreshed(true));
          }
        }
      }
      failedAttemptsRef.current = 0;
      setLastUpdated(new Date());
      setNextRefresh(pollInterval);
    } catch (e) {
      failedAttemptsRef.current += 1;
      const attempts = failedAttemptsRef.current;
      const msg = e instanceof Error ? e.message : "Network error";
      if (attempts >= maxFailedAttempts) {
        clearTimers();
        setIsRestarting(false);
        setR({
          state: "error",
          message: `${msg} (stopped after ${attempts} attempts)`,
        });
      }
    }
  }, [orderId, clearTimers, maxFailedAttempts, pollInterval, refreshWallet]);

  const startPolling = useCallback(() => {
    clearTimers();
    timerRef.current = setInterval(() => {
      setNextRefresh((prev) => {
        if (prev <= 1000) {
          fetchStatus();
          return pollInterval;
        }
        return prev - 1000;
      });
    }, 1000);
  }, [clearTimers, fetchStatus, pollInterval]);

  const restartPolling = useCallback(() => {
    failedAttemptsRef.current = 0;
    clearTimers();
    setIsRestarting(true);
    setRestartCount((c) => c + 1);
    setLastRestartTime(new Date());
    // Keep current state visible (terminal banner stays) until a new result arrives.
    setLastUpdated(null);
    setNextRefresh(pollInterval);
    fetchStatus();
    startPolling();
  }, [clearTimers, fetchStatus, startPolling, pollInterval]);

  useEffect(() => {
    // Clean slate on (re)mount or orderId change — ensures Retry resets cleanly.
    clearTimers();
    failedAttemptsRef.current = 0;
    setR({ state: "loading" });
    setLastUpdated(null);
    setNextRefresh(pollInterval);

    fetchStatus();
    startPolling();

    return () => {
      clearTimers();
    };
     
  }, [orderId, clearTimers, fetchStatus, startPolling, pollInterval]);

  // Extra safety net: always clear any remaining timers on unmount.
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const expectedAmount = sp.get("amount");
  const tint =
    r.state === "found"
      ? r.status === "approved"
        ? "#10b981"
        : r.status === "pending"
        ? "#fbbf24"
        : "#ef4444"
      : "#64748b";
  const Icon =
    r.state === "found"
      ? r.status === "approved"
        ? CheckCircle
        : r.status === "pending"
        ? Clock
        : XCircle
      : XCircle;

  return (
    <div
      className="min-h-screen w-full grid place-items-center p-4"
      style={{
        background:
          "radial-gradient(800px 600px at 50% -10%, rgba(16,185,129,0.18), transparent 60%)," +
          "linear-gradient(180deg,#020308,#04070f 60%,#060a14)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 p-6 backdrop-blur-2xl"
        style={{ background: "linear-gradient(180deg, rgba(20,28,46,0.95), rgba(10,14,24,0.95))" }}
      >
        <div className="flex items-center gap-2 text-emerald-300 text-[12px] font-semibold mb-4">
          <ShieldCheck className="h-4 w-4" /> GoLucky Verification
        </div>

        {r.state === "loading" ? (
          <div className="py-2" role="status" aria-live="polite" aria-busy="true">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24 bg-white/10" />
                <Skeleton className="h-5 w-40 bg-white/10" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-20 bg-white/10" />
                  <Skeleton className="h-3 w-32 bg-white/10" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-[12px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Fetching deposit status… preparing QR countdown</span>
            </div>
          </div>
        ) : r.state === "missing" ? (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-rose-400 mx-auto" />
            <h1 className="text-white font-extrabold text-lg mt-3">Receipt not found</h1>
            <p className="text-white/55 text-sm mt-1">No deposit matches order ID</p>
            <code className="block mt-2 text-amber-300 font-mono text-[12px]">{orderId}</code>
          </div>
        ) : r.state === "error" ? (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-rose-400 mx-auto" />
            <h1 className="text-white font-extrabold text-lg mt-3">Couldn't load deposit</h1>
            <p className="text-white/55 text-sm mt-1 break-words">{r.message}</p>
            <button
              onClick={restartPolling}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-semibold text-[13px] hover:bg-emerald-500/30 transition"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
            {restartCount > 0 && (
              <div className="text-white/50 text-[11px] mt-2">
                Restart attempts: {restartCount}
                {lastRestartTime && (
                  <span className="ml-1.5 opacity-80">
                    · Last restart:{" "}
                    <TooltipProvider delayDuration={200}>
                      <Tooltip open={restartTipOpen} onOpenChange={setRestartTipOpen}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-describedby={RESTART_TOOLTIP_ID}
                            onKeyDown={makeTooltipKeyHandler(setRestartTipOpen)}
                            onBlur={() => setRestartTipOpen(false)}
                            className="underline decoration-dotted cursor-help bg-transparent p-0 text-inherit focus:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded"
                          >
                            {lastRestartTime.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent id={RESTART_TOOLTIP_ID} role="tooltip" className="max-w-xs text-xs">
                          {RESTART_TOOLTIP_TEXT}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <TxProgress
              className="mb-4"
              stage={
                ["rejected", "failed", "cancelled", "canceled"].includes(r.status.toLowerCase())
                  ? "failed"
                  : r.status === "approved"
                  ? walletRefreshed
                    ? "refreshed"
                    : "approved"
                  : "pending"
              }
              labels={{ approved: "Credited" }}
            />
            {r.status === "approved" && (
              <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 flex items-center gap-2 text-emerald-200 text-[12px] font-semibold">
                <CheckCircle className="h-4 w-4" />
                Deposit confirmed — funds credited. Auto-refresh stopped.
              </div>
            )}
            {TERMINAL_STATUSES.has(r.status.toLowerCase()) && r.status !== "approved" && (
              <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 flex items-start gap-2 text-rose-200 text-[12px]">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold capitalize">Deposit {r.status} — polling stopped.</div>
                  <div className="text-rose-200/80 break-words">
                    Reason: {r.reason || "No reason provided by the payment processor."}
                  </div>
                  <button
                    onClick={restartPolling}
                    disabled={isRestarting}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-100 font-semibold text-[11px] hover:bg-rose-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRestarting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Retrying…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" /> Try again
                      </>
                    )}
                  </button>
                  {restartCount > 0 && (
                    <div className="text-rose-200/70 text-[10px] font-medium">
                      Restart attempts: {restartCount}
                      {lastRestartTime && (
                        <span className="ml-1.5 opacity-80">
                          · Last restart:{" "}
                          <TooltipProvider delayDuration={200}>
                            <Tooltip open={restartTipTerminalOpen} onOpenChange={setRestartTipTerminalOpen}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-describedby={`${RESTART_TOOLTIP_ID}-terminal`}
                                  onKeyDown={makeTooltipKeyHandler(setRestartTipTerminalOpen)}
                                  onBlur={() => setRestartTipTerminalOpen(false)}
                                  className="underline decoration-dotted cursor-help bg-transparent p-0 text-inherit focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-200/60 rounded"
                                >
                                  {lastRestartTime.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                id={`${RESTART_TOOLTIP_ID}-terminal`}
                                role="tooltip"
                                className="max-w-xs text-xs"
                              >
                                {RESTART_TOOLTIP_TEXT}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl grid place-items-center"
                style={{ background: `${tint}1f`, border: `1px solid ${tint}55` }}
              >
                <Icon className="h-6 w-6" style={{ color: tint }} />
              </div>
              <div>
                <div className="text-white/55 text-[11px] uppercase tracking-wider font-semibold">
                  Deposit Status
                </div>
                <div className="text-white text-xl font-extrabold capitalize">{r.status}</div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-[13px]">
              <Row k="Order ID" v={orderId} mono />
              <Row k="Amount" v={`৳${r.amount.toLocaleString("en-IN")}`} />
              {expectedAmount && Number(expectedAmount) !== r.amount && (
                <div className="text-rose-300 text-[11px]">
                  ⚠ QR amount ৳{Number(expectedAmount).toLocaleString("en-IN")} does not match record
                </div>
              )}
              <Row k="Method" v={r.method.replace("_", " ")} />
              <Row k="Txn ID" v={r.txn_id || "—"} mono />
              <Row k="Date" v={new Date(r.created_at).toLocaleString("en-GB")} />
            </div>
          </>
        )}

        <Link
          to="/home"
          className="mt-6 inline-flex items-center gap-1 text-white/60 hover:text-white text-[12px]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to GoLucky
        </Link>

        {r.state === "found" && lastUpdated && (
          !TERMINAL_STATUSES.has(r.status.toLowerCase()) ? (
          <div className="mt-4 flex items-center justify-between text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Auto-refreshing
            </span>
            <span>Next in {Math.ceil(nextRefresh / 1000)}s</span>
          </div>
        ) : (
          <div className="mt-4 text-[11px] text-white/40 text-center">
            Final status — polling stopped.
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55 text-[11.5px] uppercase tracking-wider font-semibold">{k}</span>
      <span className={`text-white font-semibold truncate ${mono ? "font-mono text-amber-200" : ""}`}>{v}</span>
    </div>
  );
}
