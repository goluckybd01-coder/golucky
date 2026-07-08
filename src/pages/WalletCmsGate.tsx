import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSkeleton from "@/components/HomeSkeleton";
import CmsSectionRenderer, { type CmsSection } from "@/components/cms/CmsSectionRenderer";
import { Badge } from "@/components/ui/badge";

const LegacyWallet = lazy(() => import("@/pages/WalletCentre"));

/** Wallet CMS gate — `cms_wallet_enabled` flag gates live rendering.
 *  ?cms_preview=1 → admin preview (drafts + unpublished)
 *  ?cms_preview=1&compare=1 → side-by-side CMS vs Legacy
 *  ?cms_force_legacy=1 → force legacy render (used by compare iframe). */
const WalletCmsGate = () => {
  const [params] = useSearchParams();
  const previewMode = params.get("cms_preview") === "1";
  const forceLegacy = params.get("cms_force_legacy") === "1";
  const compareMode = previewMode && params.get("compare") === "1";
  const [ready, setReady] = useState(false);
  const [useCms, setUseCms] = useState(false);
  const [sections, setSections] = useState<CmsSection[]>([]);

  if (compareMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <div className="sticky top-0 z-40 bg-amber-500/90 text-black text-center text-xs font-bold py-2 flex items-center justify-center gap-3">
          CMS COMPARE MODE — CMS (left) vs Legacy (right)
          <a href="/wallet?cms_preview=1" className="underline">← back to preview</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 flex-1">
          <div className="flex flex-col border border-emerald-500/40 rounded-lg overflow-hidden">
            <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5">CMS RENDERED</div>
            <iframe src="/wallet?cms_preview=1" className="w-full flex-1 min-h-[80vh] bg-white" title="CMS preview" />
          </div>
          <div className="flex flex-col border border-slate-500/40 rounded-lg overflow-hidden">
            <div className="bg-slate-600 text-white text-xs font-bold px-3 py-1.5">LIVE LEGACY</div>
            <iframe src="/wallet?cms_force_legacy=1" className="w-full flex-1 min-h-[80vh] bg-white" title="Legacy live" />
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: flag } = await supabase
          .from("admin_feature_flags")
          .select("flag_value")
          .eq("flag_name", "cms_wallet_enabled")
          .maybeSingle();
        const cmsOn = Boolean(flag?.flag_value) || previewMode;
        if (!cmsOn) {
          if (!cancelled) { setUseCms(false); setReady(true); }
          return;
        }
        let query = supabase
          .from("admin_page_sections")
          .select("*")
          .eq("page_key", "wallet")
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
          if (visible.length === 0 && !previewMode) setUseCms(false);
          else { setSections(visible); setUseCms(true); }
          setReady(true);
        }
      } catch {
        if (!cancelled) { setUseCms(false); setReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [previewMode]);

  if (!ready) return <HomeSkeleton />;
  if (forceLegacy || !useCms) {
    return (
      <Suspense fallback={<HomeSkeleton />}>
        <LegacyWallet />
      </Suspense>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      {previewMode && (
        <div className="sticky top-0 z-40 bg-amber-500/90 text-black text-center text-xs font-bold py-2 flex items-center justify-center gap-3">
          CMS PREVIEW MODE — shows drafts &amp; unpublished sections. Not visible to users.
          <a href="/wallet?cms_preview=1&compare=1" className="underline font-bold">Compare vs Legacy →</a>
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

export default WalletCmsGate;
