import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, Save, Send, EyeOff, History, RotateCcw, Sparkles } from "lucide-react";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "games", label: "Games" },
  { key: "lucky_hub", label: "Lucky Hub" },
  { key: "rewards", label: "Rewards" },
  { key: "wallet", label: "Wallet" },
  { key: "profile", label: "Profile" },
];

const FLAG_NAME = "ai_builder_enabled";

type FormState = {
  sectionName: string;
  pageName: string;
  description: string;
  category: string;
  bannerText: string;
  buttonText: string;
  icon: string;
  imageUrl: string;
};

const EMPTY: FormState = {
  sectionName: "",
  pageName: "home",
  description: "",
  category: "general",
  bannerText: "",
  buttonText: "Explore",
  icon: "sparkles",
  imageUrl: "",
};

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `sec_${Date.now()}`;

export default function AdminAiBuilderPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [flagOn, setFlagOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const loadFlag = useCallback(async () => {
    const { data } = await supabase
      .from("admin_feature_flags")
      .select("flag_value")
      .eq("flag_name", FLAG_NAME)
      .maybeSingle();
    setFlagOn(!!data?.flag_value);
  }, []);

  const loadSections = useCallback(async () => {
    const { data } = await supabase
      .from("admin_page_sections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setSections(data ?? []);
  }, []);

  const loadVersions = useCallback(async (sectionId: string) => {
    const { data } = await supabase
      .from("admin_cms_versions")
      .select("*")
      .eq("section_id", sectionId)
      .order("version_number", { ascending: false })
      .limit(20);
    setVersions(data ?? []);
  }, []);

  useEffect(() => {
    loadFlag();
    loadSections();
  }, [loadFlag, loadSections]);

  const toggleFlag = async (next: boolean) => {
    const { error } = await supabase
      .from("admin_feature_flags")
      .upsert(
        { flag_name: FLAG_NAME, flag_value: next, description: "Enable AI Builder generated sections on live site" },
        { onConflict: "flag_name" }
      );
    if (error) return toast.error(error.message);
    setFlagOn(next);
    toast.success(`AI Builder ${next ? "enabled" : "disabled"} on live site`);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const buildPayload = (published: boolean) => ({
    page_key: form.pageName,
    section_key: slug(form.sectionName),
    title: form.sectionName,
    subtitle: form.bannerText,
    description: form.description,
    cta_label: form.buttonText,
    cta_link: `/${form.pageName === "home" ? "" : form.pageName}`,
    image_url: form.imageUrl || null,
    icon: form.icon,
    category: form.category,
    badge: "AI",
    status: published ? "published" : "draft",
    is_published: published,
    metadata: { source: "ai_builder", banner_text: form.bannerText, button_text: form.buttonText },
  });

  const snapshotVersion = async (sectionId: string, note: string) => {
    const { data: section } = await supabase.from("admin_page_sections").select("*").eq("id", sectionId).single();
    const { data: items } = await supabase.from("admin_section_items").select("*").eq("section_id", sectionId);
    const { data: last } = await supabase
      .from("admin_cms_versions")
      .select("version_number")
      .eq("section_id", sectionId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (last?.version_number ?? 0) + 1;
    await supabase.from("admin_cms_versions").insert({
      section_id: sectionId,
      version_number: nextVersion,
      snapshot: section as any,
      items_snapshot: (items ?? []) as any,
      note,
    });
    return nextVersion;
  };

  const logAction = async (action: string, sectionId: string | null, targetVersion?: number) => {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("admin_publish_logs").insert({
      actor_id: auth.user?.id ?? null,
      action,
      page_key: form.pageName,
      section_id: sectionId,
      target_version: targetVersion ?? null,
      payload: { form },
    });
  };

  const generate = async (published: boolean) => {
    if (!form.sectionName.trim()) return toast.error("Section Name required");
    setBusy(true);
    try {
      const payload = buildPayload(published);
      const { data: maxRow } = await supabase
        .from("admin_page_sections")
        .select("display_order")
        .eq("page_key", form.pageName)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const display_order = (maxRow?.display_order ?? 0) + 10;
      const { data: section, error: e1 } = await supabase
        .from("admin_page_sections")
        .insert({ ...payload, display_order })
        .select()
        .single();
      if (e1 || !section) throw e1 || new Error("insert failed");

      await supabase.from("admin_section_items").insert({
        section_id: section.id,
        title: form.sectionName,
        subtitle: form.bannerText,
        description: form.description,
        cta_label: form.buttonText,
        cta_link: payload.cta_link,
        image_url: form.imageUrl || null,
        icon: form.icon,
        category: form.category,
        badge: "AI",
        status: payload.status,
        display_order: 10,
      } as any);

      if (form.bannerText) {
        await supabase.from("banners").insert({
          title: form.sectionName,
          subtitle: form.bannerText,
          image_url: form.imageUrl || null,
          cta_label: form.buttonText,
          cta_link: payload.cta_link,
          is_active: published,
          display_order,
        } as any).then(() => {}, () => {});
      }

      const v = await snapshotVersion(section.id, published ? "Initial publish" : "Initial draft");
      await logAction(published ? "publish" : "draft", section.id, v);

      toast.success(`Section ${published ? "published" : "saved as draft"} (v${v})`);
      setActiveSectionId(section.id);
      setForm(EMPTY);
      loadSections();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate section");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (row: any) => {
    setBusy(true);
    try {
      const next = !row.is_published;
      await supabase
        .from("admin_page_sections")
        .update({ is_published: next, status: next ? "published" : "unpublished" })
        .eq("id", row.id);
      const v = await snapshotVersion(row.id, next ? "Publish" : "Unpublish");
      await logAction(next ? "publish" : "unpublish", row.id, v);
      toast.success(next ? "Published" : "Unpublished");
      loadSections();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (sectionId: string, version: any) => {
    setBusy(true);
    try {
      const snap = version.snapshot || {};
      const { id, created_at, updated_at, ...rest } = snap;
      await supabase.from("admin_page_sections").update(rest).eq("id", sectionId);
      await supabase.from("admin_section_items").delete().eq("section_id", sectionId);
      const items = (version.items_snapshot as any[]) || [];
      if (items.length) {
        const clean = items.map(({ id, created_at, updated_at, ...i }: any) => ({ ...i, section_id: sectionId }));
        await supabase.from("admin_section_items").insert(clean);
      }
      const v = await snapshotVersion(sectionId, `Rollback to v${version.version_number}`);
      await logAction("rollback", sectionId, v);
      toast.success(`Rolled back to v${version.version_number}`);
      loadSections();
      loadVersions(sectionId);
    } catch (e: any) {
      toast.error(e?.message || "Rollback failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" /> AI Builder
          </h1>
          <p className="text-muted-foreground text-sm">Generate CMS sections, items, banners &amp; navigation from one form.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Live Site</div>
            <div className="text-sm font-semibold">{flagOn ? "ON" : "OFF (safe)"}</div>
          </div>
          <Switch checked={flagOn} onCheckedChange={toggleFlag} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Section Name</Label>
                <Input value={form.sectionName} onChange={(e) => set("sectionName", e.target.value)} />
              </div>
              <div>
                <Label>Page</Label>
                <Select value={form.pageName} onValueChange={(v) => set("pageName", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGES.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
              <div>
                <Label>Icon (lucide name)</Label>
                <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Banner Text</Label>
              <Input value={form.bannerText} onChange={(e) => set("bannerText", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Button Text</Label>
                <Input value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPreview((p) => !p)}>
                <Eye className="w-4 h-4 mr-1" /> {preview ? "Hide" : "Preview"}
              </Button>
              <Button variant="secondary" onClick={() => generate(false)} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Draft
              </Button>
              <Button onClick={() => generate(true)} disabled={busy}>
                <Send className="w-4 h-4 mr-1" /> Publish
              </Button>
            </div>

            {preview && (
              <div className="mt-4 rounded-lg border p-4 bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground mb-1">Preview · {form.pageName}</div>
                <div className="flex gap-3">
                  {form.imageUrl && <img src={form.imageUrl} alt="" className="w-24 h-24 rounded object-cover" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge>AI</Badge>
                      <span className="text-xs text-muted-foreground">{form.category}</span>
                    </div>
                    <div className="text-lg font-semibold">{form.sectionName || "Section title"}</div>
                    <div className="text-sm text-primary">{form.bannerText}</div>
                    <div className="text-sm text-muted-foreground">{form.description}</div>
                    <Button size="sm" className="mt-2">{form.buttonText}</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections ({sections.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-auto">
            {sections.map((s) => (
              <div key={s.id} className={`rounded border p-3 ${activeSectionId === s.id ? "border-primary" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.title}</span>
                      <Badge variant={s.is_published ? "default" : "outline"}>
                        {s.is_published ? "Live" : s.status || "draft"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.page_key} · {s.section_key} · order {s.display_order}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(s)} disabled={busy}>
                      {s.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveSectionId(s.id);
                        loadVersions(s.id);
                      }}
                    >
                      <History className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!sections.length && <div className="text-sm text-muted-foreground">No sections yet.</div>}
          </CardContent>
        </Card>
      </div>

      {activeSectionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Version History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">v{v.version_number} — {v.note || "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => rollback(activeSectionId, v)} disabled={busy}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rollback
                </Button>
              </div>
            ))}
            {!versions.length && <div className="text-sm text-muted-foreground">No versions.</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
