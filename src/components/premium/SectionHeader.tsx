import { ReactNode } from "react";

interface Props {
  title: string;
  hint?: string;
  icon?: ReactNode;
  cta?: { label: string; onClick: () => void };
  accent?: "gold" | "emerald";
}

const SectionHeader = ({ title, hint, icon, cta, accent = "gold" }: Props) => {
  const bar = accent === "emerald" ? "var(--gl-grad-emerald)" : "var(--gl-grad-gold)";
  return (
    <div className="mb-3 md:mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full shrink-0" style={{ background: bar }} />
          {icon}
          <h2 className="text-base md:text-xl font-black gl-text tracking-tight truncate">{title}</h2>
        </div>
        {hint && <div className="mt-1 ml-3 text-[11px] gl-text-dim truncate">{hint}</div>}
      </div>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          className="clickable shrink-0 text-[11px] font-bold gl-gold-text hover:opacity-80 transition"
        >
          {cta.label} →
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
