import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const toneClasses: Record<NonNullable<MetricTileProps["tone"]>, string> = {
  default: "border-border",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-rose-500/30 bg-rose-500/5",
  info: "border-sky-500/30 bg-sky-500/5",
};

export function MetricTile({ label, value, sub, icon, tone = "default", className }: MetricTileProps) {
  return (
    <Card className={cn("p-4 border", toneClasses[tone], className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
      </div>
    </Card>
  );
}

export function formatBDT(n: number | undefined | null): string {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1e7) return `৳${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `৳${(v / 1e5).toFixed(2)} L`;
  if (Math.abs(v) >= 1e3) return `৳${(v / 1e3).toFixed(1)} K`;
  return `৳${v.toFixed(2)}`;
}

export function formatInt(n: number | undefined | null): string {
  return Number(n ?? 0).toLocaleString();
}
