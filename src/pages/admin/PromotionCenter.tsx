import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download, Megaphone, Image as ImageIcon, Star, PiggyBank, Ticket, Gift, Bell, Sparkles } from "lucide-react";

type PromoRow = {
  id: string;
  promo_type: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  reward_amount?: number | null;
  is_enabled: boolean;
  display_order: number;
  start_date?: string | null;
  end_date?: string | null;
  target_audience: string;
  target_vip_min: number;
  target_agent_only: boolean;
  target_countries: string[];
  view_count: number;
  click_count: number;
  created_at: string;
};

type BannerRow = {
  id: string;
  banner_type: string;
  title: string;
  image_url: string;
  link?: string | null;
  link_type?: string | null;
  is_enabled: boolean;
  display_order: number;
  start_date?: string | null;
  end_date?: string | null;
  target_audience: string;
  target_vip_min: number;
  target_countries: string[];
  view_count: number;
  click_count: number;
};

const PROMO_TABS: { key: string; label: string; icon: any; types: string[] }[] = [
  { key: "banners", label: "Homepage Banners", icon: ImageIcon, types: ["homepage", "home"] },
  { key: "agent_banners", label: "Agent Banners", icon: Megaphone, types: ["agent"] },
  { key: "floating", label: "Floating", icon: Sparkles, types: ["floating_banner"] },
  { key: "popups", label: "Popups", icon: Bell, types: ["popup", "welcome_popup", "first_deposit_popup"] },
  { key: "vip", label: "VIP Promo", icon: Star, types: ["vip_promo"] },
  { key: "fd", label: "FD Promo", icon: PiggyBank, types: ["fd_promo"] },
  { key: "lucky", label: "Lucky Draw", icon: Ticket, types: ["lucky_draw_promo"] },
  { key: "announcements", label: "Announcements", icon: Gift, types: ["announcement"] },
];

const emptyPromo = (type: string): Partial<PromoRow> => ({
  promo_type: type,
  title: "",
  description: "",
  image_url: "",
  cta_label: "",
  cta_link: "",
  reward_amount: 0,
  is_enabled: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  target_audience: "all",
  target_vip_min: 0,
  target_agent_only: false,
  target_countries: [],
});

const emptyBanner = (bannerType: string): Partial<BannerRow> => ({
  banner_type: bannerType,
  title: "",
  image_url: "",
  link: "",
  link_type: "url",
  is_enabled: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  target_audience: "all",
  target_vip_min: 0,
  target_countries: [],
});

export default function PromotionCenter() {
  const [tab, setTab] = useState("banners");
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "on" | "off">("all");

  const [editingPromo, setEditingPromo] = useState<Partial<PromoRow> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<BannerRow> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "promo" | "banner"; id: string; title: string } | null>(null);

  const isBannerTab = tab === "banners" || tab === "agent_banners";
  const currentTabDef = PROMO_TABS.find(t => t.key === tab)!;

  const load = async () => {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([
        (supabase as any).from("promotions").select("*").order("display_order").order("created_at", { ascending: false }),
        supabase.from("banners").select("*").order("display_order").order("created_at", { ascending: false }),
      ]);
      if (p.error) throw p.error;
      if (b.error) throw b.error;
      setPromos((p.data as PromoRow[]) || []);
      setBanners((b.data as any as BannerRow[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (isBannerTab) {
      const bannerType = tab === "banners" ? "homepage" : "agent";
      return banners
        .filter(b => b.banner_type === bannerType)
        .filter(b => statusFilter === "all" ? true : statusFilter === "on" ? b.is_enabled : !b.is_enabled)
        .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()));
    }
    return promos
      .filter(p => currentTabDef.types.includes(p.promo_type))
      .filter(p => statusFilter === "all" ? true : statusFilter === "on" ? p.is_enabled : !p.is_enabled)
      .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));
  }, [tab, promos, banners, search, statusFilter, isBannerTab, currentTabDef]);

  const savePromo = async () => {
    if (!editingPromo) return;
    if (!editingPromo.title?.trim()) return toast.error("Title is required");
    try {
      const payload = { ...editingPromo };
      const { data, error } = await (supabase as any).rpc("admin_upsert_promotion", { p_data: payload });
      if (error) throw error;
      toast.success(editingPromo.id ? "Promotion updated" : "Promotion created");
      setEditingPromo(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const saveBanner = async () => {
    if (!editingBanner) return;
    if (!editingBanner.title?.trim() || !editingBanner.image_url?.trim()) return toast.error("Title and image URL are required");
    try {
      const { error } = await (supabase as any).rpc("admin_upsert_banner", { p_data: editingBanner });
      if (error) throw error;
      toast.success(editingBanner.id ? "Banner updated" : "Banner created");
      setEditingBanner(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const toggle = async (kind: "promo" | "banner", id: string, enabled: boolean) => {
    try {
      const fn = kind === "promo" ? "admin_toggle_promotion" : "admin_toggle_banner";
      const { error } = await (supabase as any).rpc(fn, { p_id: id, p_enabled: enabled });
      if (error) throw error;
      load();
    } catch (e: any) {
      toast.error(e.message || "Toggle failed");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const fn = confirmDelete.kind === "promo" ? "admin_delete_promotion" : "admin_delete_banner";
      const { error } = await (supabase as any).rpc(fn, { p_id: confirmDelete.id });
      if (error) throw error;
      toast.success("Deleted");
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCsv = () => {
    const data = rows as any[];
    if (!data.length) return toast.error("Nothing to export");
    const keys = Object.keys(data[0]);
    const csv = [keys.join(",")]
      .concat(data.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${tab}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    if (isBannerTab) {
      setEditingBanner(emptyBanner(tab === "banners" ? "homepage" : "agent"));
    } else {
      setEditingPromo(emptyPromo(currentTabDef.types[0]));
    }
  };

  const stats = useMemo(() => {
    const activeP = promos.filter(p => p.is_enabled).length;
    const activeB = banners.filter(b => b.is_enabled).length;
    const totalViews = promos.reduce((s, p) => s + (p.view_count || 0), 0) + banners.reduce((s, b) => s + (b.view_count || 0), 0);
    const totalClicks = promos.reduce((s, p) => s + (p.click_count || 0), 0) + banners.reduce((s, b) => s + (b.click_count || 0), 0);
    return { total: promos.length + banners.length, active: activeP + activeB, views: totalViews, clicks: totalClicks };
  }, [promos, banners]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0a1f] to-[#0a0a1a] text-white p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Promotion Management
            </h1>
            <p className="text-white/60 text-sm mt-1">Module 14 · Banners · Popups · VIP · FD · Lucky Draw · Announcements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} className="border-white/10 bg-white/5"><Download className="w-4 h-4 mr-2"/>Export</Button>
            <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"><Plus className="w-4 h-4 mr-2"/>New</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total items", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Views", value: stats.views },
            { label: "Clicks", value: stats.clicks },
          ].map(s => (
            <Card key={s.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="text-xs text-white/50">{s.label}</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">{s.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/[0.03] border-white/10">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white/90 text-lg">Manage Promotions</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40"/>
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title…" className="pl-8 bg-white/5 border-white/10 w-56"/>
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="on">Enabled</SelectItem><SelectItem value="off">Disabled</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-white/5 flex-wrap h-auto">
                {PROMO_TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger key={t.key} value={t.key} className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                      <Icon className="w-4 h-4 mr-1.5"/>{t.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {PROMO_TABS.map(t => (
                <TabsContent key={t.key} value={t.key} className="mt-4">
                  {loading ? (
                    <div className="text-white/50 text-center py-8">Loading…</div>
                  ) : rows.length === 0 ? (
                    <div className="text-white/50 text-center py-8 border border-dashed border-white/10 rounded-lg">
                      No {t.label.toLowerCase()} yet. Click <span className="text-amber-300">New</span> to create one.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-white/50 text-left border-b border-white/10">
                          <tr>
                            <th className="py-2 px-2">Title</th>
                            <th className="py-2 px-2">Target</th>
                            <th className="py-2 px-2">Schedule</th>
                            <th className="py-2 px-2">Views / Clicks</th>
                            <th className="py-2 px-2">Status</th>
                            <th className="py-2 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r: any) => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  {r.image_url && <img src={r.image_url} alt="" className="w-10 h-10 object-cover rounded"/>}
                                  <div>
                                    <div className="font-medium text-white/90">{r.title}</div>
                                    <div className="text-xs text-white/40">{r.promo_type || r.banner_type}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-white/70">
                                <div>{r.target_audience}{r.target_agent_only ? " · agent" : ""}</div>
                                <div className="text-xs text-white/40">VIP≥{r.target_vip_min} · {r.target_countries?.length ? r.target_countries.join(",") : "any"}</div>
                              </td>
                              <td className="py-2 px-2 text-xs text-white/60">
                                <div>{r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"}</div>
                                <div>→ {r.end_date ? new Date(r.end_date).toLocaleDateString() : "—"}</div>
                              </td>
                              <td className="py-2 px-2 text-white/70">{r.view_count || 0} / {r.click_count || 0}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <Switch checked={r.is_enabled} onCheckedChange={(v) => toggle(isBannerTab ? "banner" : "promo", r.id, v)}/>
                                  <Badge variant={r.is_enabled ? "default" : "secondary"} className={r.is_enabled ? "bg-emerald-500/20 text-emerald-300" : ""}>
                                    {r.is_enabled ? "ON" : "OFF"}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Button size="sm" variant="ghost" onClick={() => isBannerTab ? setEditingBanner(r) : setEditingPromo(r)}>
                                  <Pencil className="w-4 h-4"/>
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setConfirmDelete({ kind: isBannerTab ? "banner" : "promo", id: r.id, title: r.title })}>
                                  <Trash2 className="w-4 h-4"/>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingPromo} onOpenChange={(o) => !o && setEditingPromo(null)}>
        <DialogContent className="bg-[#0f0a1f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPromo?.id ? "Edit" : "New"} Promotion</DialogTitle></DialogHeader>
          {editingPromo && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={editingPromo.promo_type} onValueChange={v => setEditingPromo({ ...editingPromo, promo_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {["welcome_popup","first_deposit_popup","floating_banner","popup","vip_promo","fd_promo","lucky_draw_promo","announcement"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Display order"><Input type="number" value={editingPromo.display_order ?? 0} onChange={e => setEditingPromo({ ...editingPromo, display_order: Number(e.target.value) })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Title" full><Input value={editingPromo.title || ""} onChange={e => setEditingPromo({ ...editingPromo, title: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Description" full><Textarea value={editingPromo.description || ""} onChange={e => setEditingPromo({ ...editingPromo, description: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Image URL" full><Input value={editingPromo.image_url || ""} onChange={e => setEditingPromo({ ...editingPromo, image_url: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="CTA label"><Input value={editingPromo.cta_label || ""} onChange={e => setEditingPromo({ ...editingPromo, cta_label: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="CTA link"><Input value={editingPromo.cta_link || ""} onChange={e => setEditingPromo({ ...editingPromo, cta_link: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Reward amount (৳)"><Input type="number" value={editingPromo.reward_amount ?? 0} onChange={e => setEditingPromo({ ...editingPromo, reward_amount: Number(e.target.value) })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Enabled">
                <div className="flex items-center h-10"><Switch checked={!!editingPromo.is_enabled} onCheckedChange={v => setEditingPromo({ ...editingPromo, is_enabled: v })}/></div>
              </Field>
              <Field label="Start date"><Input type="datetime-local" value={toLocal(editingPromo.start_date)} onChange={e => setEditingPromo({ ...editingPromo, start_date: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="End date"><Input type="datetime-local" value={toLocal(editingPromo.end_date)} onChange={e => setEditingPromo({ ...editingPromo, end_date: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Target audience">
                <Select value={editingPromo.target_audience || "all"} onValueChange={v => setEditingPromo({ ...editingPromo, target_audience: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent>{["all","user","agent","vip"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="VIP min level"><Input type="number" value={editingPromo.target_vip_min ?? 0} onChange={e => setEditingPromo({ ...editingPromo, target_vip_min: Number(e.target.value) })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Agent only">
                <div className="flex items-center h-10"><Switch checked={!!editingPromo.target_agent_only} onCheckedChange={v => setEditingPromo({ ...editingPromo, target_agent_only: v })}/></div>
              </Field>
              <Field label="Countries (comma-separated ISO)" full>
                <Input value={(editingPromo.target_countries || []).join(",")} onChange={e => setEditingPromo({ ...editingPromo, target_countries: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="BD,IN,PK" className="bg-white/5 border-white/10"/>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPromo(null)}>Cancel</Button>
            <Button onClick={savePromo} className="bg-amber-500 text-black">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBanner} onOpenChange={(o) => !o && setEditingBanner(null)}>
        <DialogContent className="bg-[#0f0a1f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBanner?.id ? "Edit" : "New"} Banner</DialogTitle></DialogHeader>
          {editingBanner && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Banner type">
                <Select value={editingBanner.banner_type} onValueChange={v => setEditingBanner({ ...editingBanner, banner_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent>{["homepage","agent"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Display order"><Input type="number" value={editingBanner.display_order ?? 0} onChange={e => setEditingBanner({ ...editingBanner, display_order: Number(e.target.value) })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Title" full><Input value={editingBanner.title || ""} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Image URL" full><Input value={editingBanner.image_url || ""} onChange={e => setEditingBanner({ ...editingBanner, image_url: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Link"><Input value={editingBanner.link || ""} onChange={e => setEditingBanner({ ...editingBanner, link: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Link type">
                <Select value={editingBanner.link_type || "url"} onValueChange={v => setEditingBanner({ ...editingBanner, link_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent>{["url","route","game"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Enabled">
                <div className="flex items-center h-10"><Switch checked={!!editingBanner.is_enabled} onCheckedChange={v => setEditingBanner({ ...editingBanner, is_enabled: v })}/></div>
              </Field>
              <Field label="Start date"><Input type="datetime-local" value={toLocal(editingBanner.start_date)} onChange={e => setEditingBanner({ ...editingBanner, start_date: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="End date"><Input type="datetime-local" value={toLocal(editingBanner.end_date)} onChange={e => setEditingBanner({ ...editingBanner, end_date: e.target.value })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Target audience">
                <Select value={editingBanner.target_audience || "all"} onValueChange={v => setEditingBanner({ ...editingBanner, target_audience: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                  <SelectContent>{["all","user","agent","vip"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="VIP min level"><Input type="number" value={editingBanner.target_vip_min ?? 0} onChange={e => setEditingBanner({ ...editingBanner, target_vip_min: Number(e.target.value) })} className="bg-white/5 border-white/10"/></Field>
              <Field label="Countries (comma-separated ISO)" full>
                <Input value={(editingBanner.target_countries || []).join(",")} onChange={e => setEditingBanner({ ...editingBanner, target_countries: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="BD,IN,PK" className="bg-white/5 border-white/10"/>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingBanner(null)}>Cancel</Button>
            <Button onClick={saveBanner} className="bg-amber-500 text-black">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-[#0f0a1f] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirmDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">This action is permanent and will be recorded in the staff audit log.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-white/70 text-xs">{label}</Label>
      {children}
    </div>
  );
}

function toLocal(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
