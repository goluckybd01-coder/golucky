import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSkeleton from "@/components/HomeSkeleton";
import CmsSectionRenderer, { type CmsSection } from "@/components/cms/CmsSectionRenderer";
import { Badge } from "@/components/ui/badge";

const LegacyGames = lazy(() => import("@/pages/GamesPremium"));

/**
 * Gate for the Games page — mirrors HomeCmsGate.
 * Flag `cms_games_enabled` OFF → legacy GamesPremium (zero impact).
 * Flag ON → render published sections from admin_page_sections (page_key='games').
 * ?cms_preview=1 → shows drafts (admin preview).
 * Any error / empty result → falls back to legacy page.
 */
const GamesCmsGate = () => {
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
          .eq("flag_name", "cms_games_enabled")
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
          .eq("page_key", "games")
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

  if (!useCms) {
    return (
      <Suspense fallback={<HomeSkeleton />}>
        <LegacyGames />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      {previewMode && (
        <div className="sticky top-0 z-40 bg-amber-500/90 text-black text-center text-xs font-bold py-2">
          CMS PREVIEW MODE — shows drafts &amp; unpublished sections. Not visible to users.
        </div>
      )}
      <div className="max-w-[430px] lg:max-w-[1280px] mx-auto px-4 py-4 space-y-4">
        {sections.map((s) => (
          <div key={s.id} className="relative">
            {previewMode && !s.is_published && (
              <Badge className="absolute -top-2 right-2 z-10 bg-slate-700 text-white border-slate-500">
                DRAFT
              </Badge>
            )}
            <CmsSectionRenderer section={s} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesCmsGate;
