import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Trash2, Plus, History, RotateCcw, Eye, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  category: string | null;
  badge: string | null;
  vip_only: boolean;
  agent_only: boolean;
  non_agent_only: boolean;
  bangladesh_only: boolean;
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "active" | "scheduled" | "expired";
  display_order: number;
  is_published: boolean;
};

const PAGES = [
  { key: "home", label: "Home Page" },
  { key: "games", label: "Games Page" },
  { key: "hub", label: "Lucky Hub" },
  { key: "rewards", label: "Rewards" },
  { key: "wallet", label: "Wallet" },
  { key: "profile", label: "Profile" },
] as const;

const FLAG_BY_PAGE: Record<string, string> = {
  home: "cms_home_enabled",
  games: "cms_games_enabled",
  hub: "cms_hub_enabled",
  rewards: "cms_rewards_enabled",
  wallet: "cms_wallet_enabled",
  profile: "cms_profile_enabled",
};

const AdminCmsFoundationPage = () => {
  const [pageKey, setPageKey] = useState<string>("home");
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flagOn, setFlagOn] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version_number: number; note: string | null; created_at: string }[]>([]);

  const selected = useMemo(() => sections.find((s) => s.id === selectedId) || null, [sections, selectedId]);

  const load = async () => {
    setLoading(true);
    const [{ data: sec }, { data: flag }] = await Promise.all([
      supabase
        .from("admin_page_sections")
        .select("*")
        .eq("page_key", pageKey)
        .order("display_order", { ascending: true }),
      supabase
        .from("admin_feature_flags")
        .select("flag_value")
        .eq("flag_name", FLAG_BY_PAGE[pageKey])
        .maybeSingle(),
    ]);
    setSections((sec as Section[]) || []);
    setFlagOn(Boolean(flag?.flag_value));
    setLoading(false);
  };

  const loadVersions = async (sectionId: string) => {
    const { data } = await supabase
      .from("admin_cms_versions")
      .select("id, version_number, note, created_at")
      .eq("section_id", sectionId)
      .order("version_number", { ascending: false });
    setVersions(data || []);
  };

  useEffect(() => {
    load();
    setSelectedId(null);
    setVersions([]);
  }, [pageKey]);

  useEffect(() => {
    if (selectedId) loadVersions(selectedId);
  }, [selectedId]);

  const createSection = async () => {
    const key = prompt("Section key (unique per page, e.g. hero, featured_games):")?.trim();
    if (!key) return;
    const nextOrder = sections.length ? Math.max(...sections.map((s) => s.display_order)) + 1 : 0;
    const { error } = await supabase.from("admin_page_sections").insert({
      page_key: pageKey,
      section_key: key,
      title: key,
      display_order: nextOrder,
      status: "draft",
    });
    if (error) return toast.error(error.message);
    toast.success("Section created");
    load();
  };

  const patch = (id: string, patchObj: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patchObj } : s)));
  };

  const saveSelected = async () => {
    if (!selected) return;
    const { id, ...rest } = selected;
    const { error } = await supabase.from("admin_page_sections").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (!confirm(`Delete section "${selected.section_key}"?`)) return;
    const { error } = await supabase.from("admin_page_sections").delete().eq("id", selected.id);
    if (error) return toast.error(error.message);
    setSelectedId(null);
    load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, display_order: i }));
    setSections(reordered);
    const results = await Promise.all(
      reordered.map((s) =>
        supabase.from("admin_page_sections").update({ display_order: s.display_order }).eq("id", s.id),
      ),
    );
    if (results.some((r) => r.error)) {
      toast.error("Reorder failed");
      load();
    } else {
      toast.success("Order saved");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const snapshot = async () => {
    if (!selected) return;
    const note = prompt("Version note (optional):") || null;
    const { error } = await supabase.rpc("admin_cms_snapshot_section", {
      p_section_id: selected.id,
      p_note: note,
    });
    if (error) return toast.error(error.message);
    toast.success("Snapshot saved");
    loadVersions(selected.id);
  };

  const rollback = async (version: number) => {
    if (!selected) return;
    if (!confirm(`Rollback "${selected.section_key}" to v${version}?`)) return;
    const { error } = await supabase.rpc("admin_cms_rollback_section", {
      p_section_id: selected.id,
      p_version_number: version,
    });
    if (error) return toast.error(error.message);
    toast.success(`Rolled back to v${version}`);
    load();
  };

  const togglePublish = async () => {
    if (!selected) return;
    const next = !selected.is_published;
    const { error } = await supabase
      .from("admin_page_sections")
      .update({ is_published: next, status: next ? "active" : "draft" })
      .eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Published" : "Unpublished");
    load();
  };

  const toggleFlag = async () => {
    const next = !flagOn;
    const { error } = await supabase
      .from("admin_feature_flags")
      .update({ flag_value: next })
      .eq("flag_name", FLAG_BY_PAGE[pageKey]);
    if (error) return toast.error(error.message);
    setFlagOn(next);
    toast.success(next ? "CMS rendering ON for this page" : "CMS rendering OFF (live site uses hardcoded)");
  };

  return (
    <AdminShell
      title="Page CMS Foundation"
      description="Manage dynamic sections per page. Live site only renders CMS content when the per-page flag is ON."
    >
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4 p-4 bg-slate-900/60 border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Select value={pageKey} onValueChange={setPageKey}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={createSection}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-3">
            <div>
              <p className="text-xs font-semibold text-amber-300">CMS-driven rendering</p>
              <p className="text-[11px] text-amber-200/70">
                {flagOn ? "ON — live site reads from CMS" : "OFF — live site uses hardcoded sections"}
              </p>
            </div>
            <Switch checked={flagOn} onCheckedChange={toggleFlag} />
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {loading && <p className="text-slate-400 text-sm">Loading…</p>}
            {!loading && sections.length === 0 && (
              <p className="text-slate-500 text-sm p-3 text-center">No sections yet. Click "New" to create one.</p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((s) => (
                  <SortableSectionRow
                    key={s.id}
                    section={s}
                    selected={selectedId === s.id}
                    onSelect={() => setSelectedId(s.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8 p-6 bg-slate-900/60 border-slate-700">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              Select a section to edit
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.section_key}</h3>
                  <p className="text-xs text-slate-400">Page: {selected.page_key}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={snapshot}>
                    <History className="h-4 w-4 mr-1" /> Snapshot
                  </Button>
                  <Button
                    size="sm"
                    variant={selected.is_published ? "outline" : "default"}
                    onClick={togglePublish}
                    className={selected.is_published ? "" : "bg-emerald-600 hover:bg-emerald-700"}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selected.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" onClick={saveSelected}>
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteSelected}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" value={selected.title} onChange={(v) => patch(selected.id, { title: v })} />
                <Field label="Subtitle" value={selected.subtitle} onChange={(v) => patch(selected.id, { subtitle: v })} />
                <div className="md:col-span-2">
                  <Label className="text-slate-300 text-xs">Description</Label>
                  <Textarea
                    value={selected.description || ""}
                    onChange={(e) => patch(selected.id, { description: e.target.value })}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                    rows={3}
                  />
                </div>
                <Field label="CTA Label" value={selected.cta_label} onChange={(v) => patch(selected.id, { cta_label: v })} />
                <Field label="CTA Link / Route" value={selected.cta_link} onChange={(v) => patch(selected.id, { cta_link: v })} />
                <Field label="Image URL" value={selected.image_url} onChange={(v) => patch(selected.id, { image_url: v })} />
                <Field label="Category" value={selected.category} onChange={(v) => patch(selected.id, { category: v })} />
                <Field label="Badge" value={selected.badge} onChange={(v) => patch(selected.id, { badge: v })} />
                <div>
                  <Label className="text-slate-300 text-xs">Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => patch(selected.id, { status: v as Section["status"] })}
                  >
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field
                  label="Starts At"
                  type="datetime-local"
                  value={selected.starts_at ? selected.starts_at.slice(0, 16) : ""}
                  onChange={(v) => patch(selected.id, { starts_at: v ? new Date(v).toISOString() : null })}
                />
                <Field
                  label="Ends At"
                  type="datetime-local"
                  value={selected.ends_at ? selected.ends_at.slice(0, 16) : ""}
                  onChange={(v) => patch(selected.id, { ends_at: v ? new Date(v).toISOString() : null })}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <Toggle label="VIP Only" checked={selected.vip_only} onChange={(v) => patch(selected.id, { vip_only: v })} />
                <Toggle label="Agent Only" checked={selected.agent_only} onChange={(v) => patch(selected.id, { agent_only: v })} />
                <Toggle label="Non-Agent Only" checked={selected.non_agent_only} onChange={(v) => patch(selected.id, { non_agent_only: v })} />
                <Toggle label="Bangladesh Only" checked={selected.bangladesh_only} onChange={(v) => patch(selected.id, { bangladesh_only: v })} />
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" /> Version History
                </h4>
                {versions.length === 0 ? (
                  <p className="text-xs text-slate-500">No snapshots yet. Click "Snapshot" before major edits.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700"
                      >
                        <div className="text-xs">
                          <span className="text-white font-medium">v{v.version_number}</span>
                          <span className="text-slate-400 ml-2">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                          {v.note && <span className="text-slate-500 ml-2">— {v.note}</span>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => rollback(v.version_number)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Rollback
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div>
    <Label className="text-slate-300 text-xs">{label}</Label>
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 bg-slate-800 border-slate-700 text-white"
    />
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700">
    <span className="text-xs text-slate-300">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SortableSectionRow = ({
  section: s,
  selected,
  onSelect,
}: {
  section: Section;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        selected ? "bg-orange-500/20 border border-orange-500/40" : "hover:bg-slate-800"
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-slate-500 hover:text-white cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{s.title || s.section_key}</p>
        <p className="text-xs text-slate-400 truncate">{s.section_key}</p>
      </div>
      {s.is_published ? (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">LIVE</Badge>
      ) : (
        <Badge variant="outline" className="text-slate-400 border-slate-600">
          {s.status}
        </Badge>
      )}
    </div>
  );
};

export default AdminCmsFoundationPage;
