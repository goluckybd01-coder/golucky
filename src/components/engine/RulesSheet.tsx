import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const RulesSheet: React.FC<{ rules: string[]; title?: string }> = ({ rules, title = "How to Play" }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-3 mt-3 mb-6 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-amber-950/30 shadow-[0_8px_32px_-12px_rgba(245,158,11,0.25)] backdrop-blur-xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-amber-400/5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
          📘 {title}
        </span>
        <ChevronDown
          className={cn("text-amber-300 transition-transform duration-300", open && "rotate-180")}
          size={16}
        />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-amber-400/15 bg-slate-950/30 px-4 py-4 text-xs leading-relaxed text-amber-100/80">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 text-amber-400">◆</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
export default RulesSheet;
