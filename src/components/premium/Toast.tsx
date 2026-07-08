import { toast as sonner } from "sonner";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import { ReactNode } from "react";

type ToastKind = "success" | "error" | "info" | "warning";

interface ToastOptions {
  description?: ReactNode;
  duration?: number;
}

const styles: Record<ToastKind, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-emerald-400" />,
    className: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 to-slate-950/90",
  },
  error: {
    icon: <XCircle size={18} className="text-rose-400" />,
    className: "border-rose-500/30 bg-gradient-to-br from-rose-950/90 to-slate-950/90",
  },
  info: {
    icon: <Info size={18} className="text-sky-400" />,
    className: "border-sky-500/30 bg-gradient-to-br from-sky-950/90 to-slate-950/90",
  },
  warning: {
    icon: <AlertCircle size={18} className="text-amber-400" />,
    className: "border-amber-500/30 bg-gradient-to-br from-amber-950/90 to-slate-950/90",
  },
};

function show(kind: ToastKind, title: ReactNode, opts: ToastOptions = {}) {
  const s = styles[kind];
  return sonner.custom(
    (id) => (
      <div
        className={`flex items-start gap-3 rounded-2xl border backdrop-blur-xl p-4 min-w-[280px] max-w-sm shadow-2xl ${s.className}`}
      >
        <div className="mt-0.5">{s.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {opts.description && (
            <div className="mt-1 text-xs text-muted-foreground">{opts.description}</div>
          )}
        </div>
        <button
          onClick={() => sonner.dismiss(id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    ),
    { duration: opts.duration ?? 5000 }
  );
}

export const PremiumToast = {
  success: (title: ReactNode, opts?: ToastOptions) => show("success", title, opts),
  error: (title: ReactNode, opts?: ToastOptions) => show("error", title, opts),
  info: (title: ReactNode, opts?: ToastOptions) => show("info", title, opts),
  warning: (title: ReactNode, opts?: ToastOptions) => show("warning", title, opts),
};

export default PremiumToast;
