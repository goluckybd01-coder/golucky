import { LucideIcon, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  isValid?: boolean;
  showPasswordToggle?: boolean;
}

const LuxeInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  error,
  isValid,
  showPasswordToggle,
  type = "text",
  className,
  disabled,
  ...rest
}: Props) => {
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const inputType = showPasswordToggle ? (reveal ? "text" : "password") : type;
  const hasValue = value.length > 0;

  return (
    <div className="w-full">
      <div
        className={cn(
          "luxe-input-wrap flex items-center gap-3 px-4 h-14 relative",
          error && "has-error",
          disabled && "opacity-60",
          className,
        )}
      >
        {Icon && (
          <Icon
            size={18}
            className={cn(
              "shrink-0 transition-colors",
              hasValue ? "text-[hsl(var(--luxe-gold))]" : "text-[hsl(var(--luxe-ivory)/0.5)]",
            )}
          />
        )}
        <div className="relative flex-1 h-full">
          <label
            htmlFor={id}
            className={cn(
              "absolute left-0 pointer-events-none transition-all font-medium",
              hasValue
                ? "top-1 text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--luxe-gold)/0.85)]"
                : "top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--luxe-ivory)/0.55)]",
            )}
          >
            {label}
          </label>
          <input
            id={id}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full h-full bg-transparent outline-none text-[hsl(var(--luxe-ivory))] text-[15px] pt-4 tracking-wide autofill:!bg-transparent"
            style={{ WebkitTextFillColor: "hsl(var(--luxe-ivory))" }}
            {...rest}
          />
        </div>
        {showPasswordToggle && hasValue && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="shrink-0 text-[hsl(var(--luxe-ivory)/0.6)] hover:text-[hsl(var(--luxe-gold))] transition-colors"
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {!showPasswordToggle && isValid && !error && (
          <CheckCircle2 size={18} className="shrink-0 text-[hsl(var(--luxe-emerald))]" />
        )}
        {error && <AlertCircle size={18} className="shrink-0 text-destructive" />}
      </div>
      {error && (
        <p className="mt-1.5 pl-2 text-xs text-destructive/90 font-medium">{error}</p>
      )}
    </div>
  );
};

export default LuxeInput;
