import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type CmsSection = {
  id: string;
  page_key: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_url: string | null;
  icon: string | null;
  category: string | null;
  badge: string | null;
  vip_only: boolean;
  agent_only: boolean;
  non_agent_only: boolean;
  bangladesh_only: boolean;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  display_order: number;
  is_published: boolean;
  metadata: Record<string, unknown> | null;
};

/**
 * Generic CMS section renderer.
 * Renders any section by its `category` (hero, banner, vip, agent, rewards,
 * promotions, finance, games, ai, wallet, or a generic fallback).
 * Extend the switch below to add richer templates per category.
 */
export const CmsSectionRenderer = ({ section }: { section: CmsSection }) => {
  const navigate = useNavigate();
  const cat = (section.category || "generic").toLowerCase();

  const cta = section.cta_label && section.cta_link ? (
    <Button
      onClick={() => navigate(section.cta_link!)}
      className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
    >
      {section.cta_label}
    </Button>
  ) : null;

  const badges = (
    <div className="flex gap-1.5 flex-wrap">
      {section.badge && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{section.badge}</Badge>}
      {section.vip_only && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">VIP</Badge>}
      {section.agent_only && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Agent</Badge>}
      {section.bangladesh_only && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">BD</Badge>}
    </div>
  );

  // Hero-style large card
  if (cat === "hero" || cat === "banner") {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-white/10 bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 p-6 min-h-[180px]">
        {section.image_url && (
          <img
            src={section.image_url}
            alt={section.title || section.section_key}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            loading="lazy"
          />
        )}
        <div className="relative">
          {badges}
          <h2 className="text-2xl font-bold text-white mt-2">{section.title}</h2>
          {section.subtitle && <p className="text-sm text-amber-300 mt-1">{section.subtitle}</p>}
          {section.description && <p className="text-sm text-slate-300 mt-2 max-w-lg">{section.description}</p>}
          {cta}
        </div>
      </Card>
    );
  }

  // Compact card (default for vip/agent/rewards/finance/games/ai/generic)
  const tint: Record<string, string> = {
    vip: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    agent: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    rewards: "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
    finance: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    games: "from-orange-500/20 to-red-500/10 border-orange-500/30",
    ai: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    wallet: "from-slate-500/20 to-slate-700/10 border-slate-500/30",
    promotions: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
    generic: "from-slate-500/10 to-slate-700/10 border-white/10",
  };
  const tone = tint[cat] || tint.generic;

  return (
    <Card className={`rounded-2xl border bg-gradient-to-br ${tone} p-5`}>
      <div className="flex items-start gap-4">
        {section.image_url && (
          <img
            src={section.image_url}
            alt=""
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          {badges}
          <h3 className="text-lg font-bold text-white mt-1">{section.title}</h3>
          {section.subtitle && <p className="text-sm text-slate-300 mt-0.5">{section.subtitle}</p>}
          {section.description && <p className="text-xs text-slate-400 mt-2">{section.description}</p>}
          {cta}
        </div>
      </div>
    </Card>
  );
};

export default CmsSectionRenderer;
