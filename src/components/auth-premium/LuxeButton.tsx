import { ButtonHTMLAttributes, forwardRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "neon" | "ghost";
}

const LuxeButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, children, loading, variant = "primary", onClick, ...rest }, ref) => {
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = Date.now();
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== id)), 700);
      onClick?.(e);
    };

    const base =
      "relative overflow-hidden inline-flex items-center justify-center gap-2 h-14 px-6 rounded-full font-bold text-[15px] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed select-none transition-transform active:scale-[0.98]";

    const variants = {
      primary: "luxe-btn-primary",
      neon:
        "text-[hsl(var(--luxe-ivory))] border border-[hsl(var(--luxe-emerald)/0.55)] bg-[hsl(var(--luxe-black-2))] hover:border-[hsl(var(--luxe-emerald))] hover:shadow-[0_0_28px_hsl(var(--luxe-emerald)/0.45)]",
      ghost:
        "text-[hsl(var(--luxe-ivory)/0.85)] border border-[hsl(var(--luxe-border-gold))] bg-[hsl(0_0%_100%/0.02)] hover:bg-[hsl(0_0%_100%/0.06)]",
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(base, variants[variant], className)}
        {...rest}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : children}
        {ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{
              left: r.x,
              top: r.y,
              width: 6,
              height: 6,
              transform: "translate(-50%, -50%)",
              animation: "luxe-ripple 0.6s ease-out forwards",
            }}
          />
        ))}
        <style>{`
          @keyframes luxe-ripple {
            0% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
            100% { transform: translate(-50%,-50%) scale(60); opacity: 0; }
          }
        `}</style>
      </button>
    );
  },
);

LuxeButton.displayName = "LuxeButton";
export default LuxeButton;
