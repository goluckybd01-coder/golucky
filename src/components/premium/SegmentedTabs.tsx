import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface SegmentedTab<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

function SegmentedTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  size = "md",
  fullWidth,
  className,
}: SegmentedTabsProps<T>) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur",
        fullWidth && "w-full",
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-medium transition-all",
              h,
              fullWidth && "flex-1",
              active
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.5)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
