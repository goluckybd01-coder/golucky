import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Status = "pending" | "approved" | "rejected" | "more_info";

const STEPS: { key: Status; label: string }[] = [
  { key: "pending", label: "Submitted" },
  { key: "more_info", label: "Reviewing" },
  { key: "approved", label: "Approved" },
];

export function StatusTimeline({ status }: { status: Status }) {
  const activeIndex =
    status === "approved" ? 2 : status === "more_info" ? 1 : status === "rejected" ? -1 : 0;

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <XCircle className="h-6 w-6 text-red-400" />
        <div>
          <p className="font-semibold text-red-300">Payment Rejected</p>
          <p className="text-xs text-red-200/70">Please contact support or resubmit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-black/40 p-4 backdrop-blur">
      {STEPS.map((s, i) => {
        const done = i <= activeIndex;
        const current = i === activeIndex;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                  : "border-white/20 bg-white/5 text-white/40"
              } ${current ? "ring-2 ring-amber-400/50" : ""}`}
            >
              {done ? <CheckCircle2 className="h-5 w-5" /> : current ? (
                <Clock className="h-5 w-5 animate-pulse" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </motion.div>
            <span className={`text-xs ${done ? "text-emerald-300" : "text-white/50"}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
