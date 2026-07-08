import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSkeleton from "@/components/HomeSkeleton";
import CmsSectionRenderer, { type CmsSection } from "@/components/cms/CmsSectionRenderer";
import { Badge } from "@/components/ui/badge";

const LegacyHome = lazy(() => import("@/pages/Home"));

/**
 * Gate: reads the `cms_home_enabled` feature flag.
 * - flag OFF → render existing hardcoded Home (zero impact)
 * - flag ON  → render published CMS sections in display_order
 * - ?cms_preview=1 → admin preview (shows drafts + unpublished too)
 *
 * Any error / empty result → falls back to legacy Home so the live site
 * cannot go blank because of a bad CMS edit.
 */
const HomeCmsGate = () => {
  const [params] = useSearchParams();
  const previewMode = params.get("cms_preview") === "1";
  const [ready, setReady] = useState(false);
  const [useCms, setUseCms] = useState(false);
  const [sections, setSections] = useState<CmsSection[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: flag } = await supabase
          .from("admin_feature_flags")
          .select("flag_value")
          .eq("flag_name", "cms_home_enabled")
          .maybeSingle();

        const cmsOn = Boolean(flag?.flag_value) || previewMode;
        if (!cmsOn) {
          if (!cancelled) {
            setUseCms(false);
            setReady(true);
          }
          return;
        }

        let query = supabase
          .from("admin_page_sections")
          .select("*")
          .eq("page_key", "home")
          .order("display_order", { ascending: true });

        if (!previewMode) query = query.eq("is_published", true);

        const { data } = await query;
        const rows = (data as CmsSection[]) || [];
        const now = Date.now();
        const visible = rows.filter((s) => {
          if (s.starts_at && new Date(s.starts_at).getTime() > now) return false;
          if (s.ends_at && new Date(s.ends_at).getTime() < now) return false;
          if (!previewMode && s.status === "expired") return false;
          return true;
        });

        if (!cancelled) {
          // Safety: if CMS has no visible sections, fall back to legacy Home.
          if (visible.length === 0 && !previewMode) {
            setUseCms(false);
          } else {
            setSections(visible);
            setUseCms(true);
          }
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setUseCms(false);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewMode]);

  if (!ready) return <HomeSkeleton />;

  // Non-preview: always the real legacy Home (design unchanged).
  if (!previewMode) {
    return (
      <Suspense fallback={<HomeSkeleton />}>
        <LegacyHome />
      </Suspense>
    );
  }

  // Preview mode: render the EXACT legacy Home layout, overlaid with a
  // CMS status panel driven by admin_page_sections data. No design change.
  const now = Date.now();
  const statusOf = (s: CmsSection): "live" | "draft" | "scheduled" | "expired" => {
    if (s.starts_at && new Date(s.starts_at).getTime() > now) return "scheduled";
    if (s.ends_at && new Date(s.ends_at).getTime() < now) return "expired";
    if (!s.is_published) return "draft";
    return "live";
  };
  const tone: Record<string, string> = {
    live: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    draft: "bg-slate-600/40 text-slate-200 border-slate-400/40",
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    expired: "bg-red-500/20 text-red-300 border-red-500/40",
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 bg-amber-500/95 text-black text-center text-xs font-bold py-2 shadow-md">
        CMS PREVIEW MODE — legacy Home layout with live CMS section data. Not visible to users.
      </div>
      <Suspense fallback={<HomeSkeleton />}>
        <LegacyHome />
      </Suspense>
      <aside className="fixed bottom-4 right-4 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl p-3 shadow-2xl">
        <div className="text-[11px] font-bold text-amber-300 mb-2 uppercase tracking-wider">
          CMS Sections ({sections.length})
        </div>
        <ul className="space-y-1.5">
          {sections.map((s) => {
            const st = statusOf(s);
            return (
              <li key={s.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 truncate">
                  <span className="text-slate-500 mr-1">{s.display_order}</span>
                  {s.title || s.section_key}
                </span>
                <Badge className={`shrink-0 ${tone[st]} border text-[9px] px-1.5 py-0`}>
                  {st.toUpperCase()}
                </Badge>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
};

export default HomeCmsGate;
