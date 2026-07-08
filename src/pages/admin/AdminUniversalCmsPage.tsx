import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Pencil, Trash2, Copy, GripVertical, Eye, EyeOff, History, RotateCcw,
  Calendar, Loader2, Image as ImageIcon, Video, Sparkles, PlayCircle,
} from "lucide-react";
import CmsEmptyStateBanner from "@/components/admin/CmsEmptyStateBanner";

const PAGES = [
  { key: "home", label: "Home Page" },
  { key: "games", label: "Games" },
  { key: "lucky_hub", label: "Lucky Hub" },
  { key: "rewards", label: "Rewards Centre" },
  { key: "wallet", label: "Wallet Centre" },
  { key: "profile", label: "Profile" },
  { key: "vip", label: "VIP Club" },
  { key: "agent", label: "Agent Programme" },
  { key: "deposit", label: "Deposit Centre" },
  { key: "withdraw", label: "Withdraw Centre" },
  { key: "promotions", label: "Promotions" },
];

const FLAG = "universal_cms_enabled";
type MediaType = "image" | "video" | "icon" | "lottie";

type Section = {
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
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  display_order: number;
  is_published: boolean;
  metadata: any;
};

const emptyDraft = (page_key: string): Partial<Section> => ({
  page_key,
  section_key: "",
  title: "",
  subtitle: "",
  description: "",
  cta_label: "",
  cta_link: "",
  image_url: "",
  icon: "",
  category: "",
  badge: "",
  starts_at: null,
  ends_at: null,
  status: "draft",
  display_order: 0,
  is_published: false,
  metadata: { media_type: "image" as MediaType, media_url: "" },
});

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `sec_${Date.now()}`;

function SortableRow({ s, onEdit, onDup, onDel, onToggle, onHistory, busy }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const media = s.metadata?.media_type as MediaType | undefined;
  const scheduled = s.starts_at && new Date(s.starts_at) > new Date();
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border rounded p-2 bg-card">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground p-1">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {s.image_url ? (
          <img src={s.image_url} alt="" className="w-full h-full object-cover" />
        ) : media === "video" ? <Video className="w-4 h-4" />
          : media === "lottie" ? <PlayCircle className="w-4 h-4" />
          : media === "icon" ? <Sparkles className="w-4 h-4" />
          : <ImageIcon className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{s.title || s.section_key}</span>
          <Badge variant={s.is_published ? "default" : "outline"}>
            {s.is_published ? "Live" : s.status || "draft"}
          </Badge>
          {scheduled && <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />Scheduled</Badge>}
          {media && <Badge variant="outline">{media}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          #{s.display_order} · {s.section_key} {s.category ? `· ${s.category}` : ""}
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => onToggle(s)} disabled={busy}>
          {s.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => onDup(s)} disabled={busy}><Copy className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => onHistory(s)}><History className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => onDel(s)} disabled={busy}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminUniversalCmsPage() {
  const [page, setPage] = useState("home");
  const [sections, setSections] = useState<Section[]>([]);
  const [flagOn, setFlagOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<Section> | null>(null);
  const [preview, setPreview] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [historyFor, setHistoryFor] = useState<Section | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [dbg, setDbg] = useState<{ uid: string | null; email: string | null; roles: string[]; staffRole: string | null; isAdmin: boolean | null; homeCount: number | null; countErr?: string; err?: string; checkedAt?: string }>({ uid: null, email: null, roles: [], staffRole: null, isAdmin: null, homeCount: null });

  const runDebug = useCallback(async () => {
    try {
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id ?? null;
      const email = sess.user?.email ?? null;
      let isAdmin: boolean | null = null;
      let roles: string[] = [];
      let staffRole: string | null = null;
      let err: string | undefined;
      if (uid) {
        const [{ data, error }, { data: roleRows }, { data: staffRow }] = await Promise.all([
          supabase.rpc("is_admin_user", { _user_id: uid }),
          supabase.from("user_roles").select("role").eq("user_id", uid),
          supabase.from("staff_accounts").select("staff_role").eq("user_id", uid).maybeSingle(),
        ]);
        if (error) err = error.message;
        else isAdmin = !!data;
        roles = (roleRows ?? []).map((r: any) => String(r.role));
        staffRole = staffRow?.staff_role ?? null;
      }
      setDbg((d) => ({ ...d, uid, email, roles, staffRole, isAdmin, err, checkedAt: new Date().toLocaleTimeString() }));
    } catch (e: any) {
      setDbg((d) => ({ ...d, err: e?.message ?? String(e), checkedAt: new Date().toLocaleTimeString() }));
    }
  }, []);
  useEffect(() => { runDebug(); }, [runDebug]);

  const runHomeCount = useCallback(async () => {
    const { count, error } = await supabase
      .from("admin_page_sections")
      .select("id", { count: "exact", head: true })
      .eq("page_key", "home");
    setDbg((d) => ({ ...d, homeCount: count ?? 0, countErr: error?.message, checkedAt: new Date().toLocaleTimeString() }));
  }, []);


  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_page_sections")
      .select("*")
      .eq("page_key", page)
      .order("display_order", { ascending: true });
    setSections((data ?? []) as Section[]);
  }, [page]);

  const loadFlag = useCallback(async () => {
    const { data } = await supabase.from("admin_feature_flags").select("flag_value").eq("flag_name", FLAG).maybeSingle();
    setFlagOn(!!data?.flag_value);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFlag(); }, [loadFlag]);

  const toggleFlag = async (v: boolean) => {
    await supabase.from("admin_feature_flags").upsert(
      { flag_name: FLAG, flag_value: v, description: "Publish Universal CMS sections to live pages" },
      { onConflict: "flag_name" }
    );
    setFlagOn(v);
    toast.success(`Live CMS ${v ? "enabled" : "disabled"}`);
  };

  const snapshot = async (sectionId: string, note: string) => {
    const { data: sec } = await supabase.from("admin_page_sections").select("*").eq("id", sectionId).single();
    const { data: items } = await supabase.from("admin_section_items").select("*").eq("section_id", sectionId);
    const { data: last } = await supabase
      .from("admin_cms_versions").select("version_number")
      .eq("section_id", sectionId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const v = (last?.version_number ?? 0) + 1;
    await supabase.from("admin_cms_versions").insert({
      section_id: sectionId, version_number: v, snapshot: sec as any,
      items_snapshot: (items ?? []) as any, note,
    });
    return v;
  };

  const logAction = async (action: string, sectionId: string | null, target_version?: number) => {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("admin_publish_logs").insert({
      actor_id: auth.user?.id ?? null, action, page_key: page,
      section_id: sectionId, target_version: target_version ?? null, payload: {},
    });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const isNew = !editing.id;
      const payload: any = {
        page_key: editing.page_key || page,
        section_key: editing.section_key || slug(editing.title || ""),
        title: editing.title, subtitle: editing.subtitle, description: editing.description,
        cta_label: editing.cta_label, cta_link: editing.cta_link,
        image_url: editing.image_url || null, icon: editing.icon, category: editing.category,
        badge: editing.badge, starts_at: editing.starts_at || null, ends_at: editing.ends_at || null,
        status: editing.status || "draft", is_published: !!editing.is_published,
        metadata: editing.metadata || {},
      };
      let id = editing.id as string | undefined;
      if (isNew) {
        const maxOrder = sections.reduce((m, s) => Math.max(m, s.display_order), 0);
        const { data, error } = await supabase.from("admin_page_sections")
          .insert({ ...payload, display_order: maxOrder + 10 }).select().single();
        if (error) throw error;
        id = data.id;
      } else {
        const { error } = await supabase.from("admin_page_sections").update(payload).eq("id", id!);
        if (error) throw error;
      }
      const v = await snapshot(id!, isNew ? "Create" : "Edit");
      await logAction(isNew ? "create" : "edit", id!, v);
      toast.success(`Saved (v${v})`);
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally { setBusy(false); }
  };

  const remove = async (s: Section) => {
    if (!confirm(`Delete "${s.title || s.section_key}"?`)) return;
    setBusy(true);
    try {
      await snapshot(s.id, "Pre-delete snapshot");
      await supabase.from("admin_section_items").delete().eq("section_id", s.id);
      await supabase.from("admin_page_sections").delete().eq("id", s.id);
      await logAction("delete", s.id);
      toast.success("Deleted");
      load();
    } catch (e: any) { toast.error(e?.message || "Delete failed"); }
    finally { setBusy(false); }
  };

  const duplicate = async (s: Section) => {
    setBusy(true);
    try {
      const { id, ...rest } = s as any;
      const maxOrder = sections.reduce((m, x) => Math.max(m, x.display_order), 0);
      const { data, error } = await supabase.from("admin_page_sections").insert({
        ...rest,
        section_key: `${s.section_key}_copy_${Date.now().toString(36).slice(-4)}`,
        title: `${s.title || s.section_key} (Copy)`,
        is_published: false, status: "draft",
        display_order: maxOrder + 10,
      }).select().single();
      if (error) throw error;
      await snapshot(data.id, "Duplicated");
      await logAction("duplicate", data.id);
      toast.success("Duplicated");
      load();
    } catch (e: any) { toast.error(e?.message || "Duplicate failed"); }
    finally { setBusy(false); }
  };

  const togglePublish = async (s: Section) => {
    setBusy(true);
    try {
      const next = !s.is_published;
      await supabase.from("admin_page_sections").update({
        is_published: next, status: next ? "published" : "unpublished",
      }).eq("id", s.id);
      const v = await snapshot(s.id, next ? "Publish" : "Unpublish");
      await logAction(next ? "publish" : "unpublish", s.id, v);
      toast.success(next ? "Published" : "Unpublished");
      load();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(false); }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx);
    setSections(reordered);
    setBusy(true);
    try {
      await Promise.all(reordered.map((s, i) =>
        supabase.from("admin_page_sections").update({ display_order: (i + 1) * 10 }).eq("id", s.id)
      ));
      await logAction("reorder", null);
      toast.success("Order updated");
      load();
    } catch (e: any) { toast.error(e?.message || "Reorder failed"); }
    finally { setBusy(false); }
  };

  const openHistory = async (s: Section) => {
    setHistoryFor(s);
    const { data } = await supabase.from("admin_cms_versions")
      .select("*").eq("section_id", s.id).order("version_number", { ascending: false }).limit(30);
    setVersions(data ?? []);
  };

  const rollback = async (v: any) => {
    if (!historyFor) return;
    setBusy(true);
    try {
      const { id, created_at, updated_at, ...rest } = v.snapshot || {};
      await supabase.from("admin_page_sections").update(rest).eq("id", historyFor.id);
      await supabase.from("admin_section_items").delete().eq("section_id", historyFor.id);
      const items = (v.items_snapshot as any[]) || [];
      if (items.length) {
        const clean = items.map(({ id, created_at, updated_at, ...i }: any) => ({ ...i, section_id: historyFor.id }));
        await supabase.from("admin_section_items").insert(clean);
      }
      const nv = await snapshot(historyFor.id, `Rollback to v${v.version_number}`);
      await logAction("rollback", historyFor.id, nv);
      toast.success(`Rolled back to v${v.version_number}`);
      openHistory(historyFor); load();
    } catch (e: any) { toast.error(e?.message || "Rollback failed"); }
    finally { setBusy(false); }
  };

  const pageLabel = useMemo(() => PAGES.find((p) => p.key === page)?.label ?? page, [page]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Universal CMS Manager</h1>
          <p className="text-sm text-muted-foreground">One dashboard for every page's sections, media, schedule &amp; versions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setPreview((p) => !p)}>
            <Eye className="w-4 h-4 mr-1" /> {preview ? "Exit Preview" : "Preview"}
          </Button>
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Live Site</div>
              <div className="text-sm font-semibold">{flagOn ? "ON" : "OFF (safe)"}</div>
            </div>
            <Switch checked={flagOn} onCheckedChange={toggleFlag} />
          </div>
        </div>
      </div>

      <div className={`rounded-lg border px-3 py-2 text-xs font-mono flex flex-wrap items-center gap-x-4 gap-y-1 ${dbg.isAdmin === false || dbg.err ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-muted/40 text-muted-foreground"}`}>
        <span><b>email:</b> {dbg.email ?? <em>—</em>}</span>
        <span><b>auth.uid():</b> {dbg.uid ?? <em>null (not signed in)</em>}</span>
        <span><b>user_roles:</b> {dbg.roles.length ? dbg.roles.join(", ") : <em>none</em>}</span>
        <span><b>staff_role:</b> {dbg.staffRole ?? <em>none</em>}</span>
        <span><b>is_admin_user():</b> {dbg.isAdmin === null ? "—" : String(dbg.isAdmin)}</span>
        <span>
          <b>home rows (RLS):</b>{" "}
          {dbg.countErr ? <span className="text-destructive">{dbg.countErr}</span> : dbg.homeCount === null ? "—" : dbg.homeCount}
        </span>
        {dbg.err && <span><b>error:</b> {dbg.err}</span>}
        {dbg.checkedAt && <span className="opacity-70">checked {dbg.checkedAt}</span>}
        <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto" onClick={runHomeCount}>
          Count home rows
        </Button>
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={runDebug}>
          <RotateCcw className="w-3 h-3 mr-1" /> Recheck
        </Button>
        {dbg.isAdmin === false && (
          <span className="w-full text-[11px]">RLS is hiding all rows because this user isn't recognised as admin. Add them to <code>user_roles</code>/<code>staff_accounts</code>.</span>
        )}
      </div>

      <Tabs value={page} onValueChange={setPage}>
        <TabsList className="flex flex-wrap h-auto">
          {PAGES.map((p) => <TabsTrigger key={p.key} value={p.key}>{p.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{pageLabel} — {sections.length} section(s)</CardTitle>
          <Button onClick={() => setEditing(emptyDraft(page))}>
            <Plus className="w-4 h-4 mr-1" /> Add Section
          </Button>
        </CardHeader>
        <CardContent>
          {preview ? (
            <div className="space-y-3">
              {sections.filter((s) => s.is_published).map((s) => (
                <div key={s.id} className="border rounded p-4">
                  <div className="flex gap-3">
                    {s.image_url && <img src={s.image_url} className="w-24 h-24 object-cover rounded" alt="" />}
                    <div>
                      <div className="flex gap-2 items-center">
                        {s.badge && <Badge>{s.badge}</Badge>}
                        <span className="font-semibold">{s.title}</span>
                      </div>
                      <div className="text-sm text-primary">{s.subtitle}</div>
                      <div className="text-sm text-muted-foreground">{s.description}</div>
                      {s.cta_label && <Button size="sm" className="mt-2">{s.cta_label}</Button>}
                    </div>
                  </div>
                </div>
              ))}
              {!sections.some((s) => s.is_published) && <div className="text-sm text-muted-foreground">Nothing published yet.</div>}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((s) => (
                    <SortableRow key={s.id} s={s} busy={busy}
                      onEdit={setEditing} onDup={duplicate} onDel={remove}
                      onToggle={togglePublish} onHistory={openHistory} />
                  ))}
                  {!sections.length && <CmsEmptyStateBanner page={page} onRetry={load} />}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Section — {pageLabel}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Key</Label><Input value={editing.section_key ?? ""} onChange={(e) => setEditing({ ...editing, section_key: e.target.value })} placeholder="auto from title" /></div>
              </div>
              <div><Label>Subtitle / Banner Text</Label><Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Category</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><Label>Badge</Label><Input value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} /></div>
                <div><Label>Icon</Label><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="lucide name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Button Text</Label><Input value={editing.cta_label ?? ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} /></div>
                <div><Label>Button Link</Label><Input value={editing.cta_link ?? ""} onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Media Type</Label>
                  <Select value={editing.metadata?.media_type ?? "image"}
                    onValueChange={(v) => setEditing({ ...editing, metadata: { ...(editing.metadata || {}), media_type: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="icon">Icon</SelectItem>
                      <SelectItem value="lottie">Lottie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Media URL</Label>
                  <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({
                    ...editing, image_url: e.target.value,
                    metadata: { ...(editing.metadata || {}), media_url: e.target.value },
                  })} placeholder="https://... or /path" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Publish At</Label>
                  <Input type="datetime-local"
                    value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""}
                    onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Unpublish At</Label>
                  <Input type="datetime-local"
                    value={editing.ends_at ? editing.ends_at.slice(0, 16) : ""}
                    onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v, status: v ? "published" : "draft" })} />
                <Label>Publish immediately</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Version History — {historyFor?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">v{v.version_number} — {v.note || "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => rollback(v)} disabled={busy}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rollback
                </Button>
              </div>
            ))}
            {!versions.length && <div className="text-sm text-muted-foreground">No versions.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
