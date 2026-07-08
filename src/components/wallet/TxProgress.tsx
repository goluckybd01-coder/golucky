import { Check, Loader2, Clock, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TxStage = "pending" | "approved" | "refreshed" | "failed";
export type TxFailedAt = "pending" | "approved" | "refreshed";

interface Props {
  stage: TxStage;
  /** Which step the pipeline stopped on when stage === "failed". Defaults to "pending". */
  failedAt?: TxFailedAt;
  className?: string;
  labels?: { pending?: string; approved?: string; refreshed?: string };
  failedMessage?: string;
}

/**
 * Neon 3-step transaction indicator matching the GoLucky home aesthetic.
 * Pending (amber) → Credited (emerald) → Vault Updated (cyan).
 */
export default function TxProgress({ stage, failedAt = "pending", className, labels, failedMessage }: Props) {
  const STEPS = [
    {
      key: "pending" as const,
      icon: Clock,
      label: labels?.pending ?? "Pending",
      color: "#F5C86A",
      colorHi: "#FDE68A",
      grad: "linear-gradient(135deg,#FDE68A,#B8862F)",
    },
    {
      key: "approved" as const,
      icon: Check,
      label: labels?.approved ?? "Approved",
      color: "#10B981",
      colorHi: "#34D399",
      grad: "linear-gradient(135deg,#34D399,#047857)",
    },
    {
      key: "refreshed" as const,
      icon: Wallet,
      label: labels?.refreshed ?? "Refreshed",
      color: "#06B6D4",
      colorHi: "#67E8F9",
      grad: "linear-gradient(135deg,#67E8F9,#0E7490)",
    },
  ];

  const failed = stage === "failed";
  const failedIdx = failed ? Math.max(0, STEPS.findIndex((s) => s.key === failedAt)) : -1;
  const activeIdx = failed ? failedIdx : STEPS.findIndex((s) => s.key === stage);

  return (
    <div
      role="progressbar"
      aria-label="Transaction progress"
      aria-valuemin={0}
      aria-valuemax={STEPS.length}
      aria-valuenow={Math.max(0, activeIdx + 1)}
      className={cn(
        "relative w-full rounded-2xl p-[1.5px] overflow-hidden",
        className
      )}
      style={{
        background: failed
          ? "linear-gradient(135deg,#EF4444,#7f1d1d)"
          : "conic-gradient(from 140deg,#F5C86A 0%,#10B981 45%,#06B6D4 100%)",
        boxShadow: `0 14px 40px -18px ${failed ? "#EF444488" : "#10B98188"}`,
      }}
    >
      <div
        className="relative rounded-[14px] px-3 py-3.5"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%,rgba(255,255,255,0.04),transparent 60%),linear-gradient(160deg,#0a0a10 0%,#050508 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-1.5">
          {STEPS.map((s, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx && !failed;
            const upcoming = i > activeIdx && !failed;
            const isFailedStep = failed && i === failedIdx;

            const orbColor = isFailedStep ? "#EF4444" : done ? s.color : current ? s.color : "#3f3f46";
            const orbColorHi = isFailedStep ? "#FCA5A5" : done ? s.colorHi : current ? s.colorHi : "#52525b";
            const bg = done || current || isFailedStep
              ? isFailedStep
                ? "linear-gradient(135deg,#FCA5A5,#7f1d1d)"
                : s.grad
              : "linear-gradient(135deg,#1f1f26,#0a0a10)";

            const Icon = isFailedStep ? X : s.icon;

            return (
              <div key={s.key} className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className="relative h-11 w-11 rounded-full grid place-items-center border"
                    style={{
                      background: bg,
                      borderColor: `${orbColor}${done || current || isFailedStep ? "cc" : "44"}`,
                      boxShadow:
                        done || current || isFailedStep
                          ? `0 0 22px ${orbColor}, 0 0 8px ${orbColorHi}, inset 0 1px 0 rgba(255,255,255,0.35)`
                          : "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                  >
                    {current ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin text-black" strokeWidth={3} />
                    ) : done ? (
                      <Check className="h-[18px] w-[18px] text-black" strokeWidth={3.5} />
                    ) : (
                      <Icon
                        className="h-[18px] w-[18px]"
                        style={{ color: isFailedStep ? "#000" : upcoming ? "#71717a" : "#000" }}
                        strokeWidth={2.5}
                      />
                    )}
                    {(current || done) && (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ boxShadow: `0 0 0 2px ${orbColor}66`, opacity: current ? 0.6 : 0 }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[9.5px] font-black uppercase tracking-[0.14em] whitespace-nowrap"
                    style={{
                      color: isFailedStep ? "#FCA5A5" : done || current ? orbColorHi : "#71717a",
                      textShadow:
                        done || current || isFailedStep ? `0 0 8px ${orbColor}88` : "none",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: done ? "100%" : current ? "55%" : "0%",
                        background:
                          failed && i + 1 === failedIdx
                            ? "linear-gradient(90deg,#FCA5A5,#EF4444)"
                            : done
                            ? `linear-gradient(90deg,${s.colorHi},${STEPS[i + 1].colorHi})`
                            : `linear-gradient(90deg,${s.colorHi},transparent)`,
                        boxShadow:
                          failed && i + 1 === failedIdx
                            ? "0 0 10px #EF444488"
                            : current
                            ? `0 0 10px ${s.colorHi}, 0 0 4px ${s.color}`
                            : done
                            ? `0 0 10px ${s.color}88`
                            : "none",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {failed && (
          <div className="mt-2.5 text-[11px] text-rose-300 text-center font-bold tracking-wide">
            {failedMessage ?? `Transaction failed at ${STEPS[failedIdx].label} — balance unchanged.`}
          </div>
        )}
      </div>
    </div>
  );
}
