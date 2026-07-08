import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, leftIcon, rightIcon, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center h-12 rounded-xl border bg-white/5 backdrop-blur transition-all",
            error
              ? "border-rose-500/60 focus-within:border-rose-400 focus-within:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
              : "border-white/10 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
          )}
        >
          {leftIcon && <span className="pl-4 text-muted-foreground">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 h-full bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none",
              className
            )}
            {...rest}
          />
          {rightIcon && <span className="pr-4 text-muted-foreground">{rightIcon}</span>}
        </div>
        {(error || hint) && (
          <p className={cn("text-xs", error ? "text-rose-400" : "text-muted-foreground")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";
export default Field;
