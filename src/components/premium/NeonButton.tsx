import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "emerald" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_32px_-2px_hsl(var(--primary)/0.8)]",
  gold:
    "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] hover:shadow-[0_0_32px_-2px_rgba(251,191,36,0.8)]",
  emerald:
    "bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)] hover:shadow-[0_0_32px_-2px_rgba(16,185,129,0.8)]",
  ghost:
    "bg-white/5 text-foreground border border-white/10 hover:bg-white/10",
  danger:
    "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_24px_-4px_rgba(244,63,94,0.6)] hover:shadow-[0_0_32px_-2px_rgba(244,63,94,0.8)]",
};

// 8px grid: h-8 (32) / h-10 (40) / h-12 (48); px multiples of 8
const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-2 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-3 rounded-2xl",
};

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ variant = "primary", size = "md", loading, leftIcon, rightIcon, fullWidth, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);
NeonButton.displayName = "NeonButton";
export default NeonButton;
