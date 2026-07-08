import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download, Image as ImageIcon } from "lucide-react";

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
  created_at?: string;
};

const BANNER_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "agent", label: "Agent" },
  { value: "promotion", label: "Promotion" },
  { value: "wallet", label: "Wallet" },
];

const emptyBanner = (): Partial<BannerRow> => ({
  banner_type: "homepage",
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

export default function BannersAdmin() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "on" | "off">("all");
  const [editing, setEditing] = useState<Partial<BannerRow> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BannerRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as any as BannerRow[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows
      .filter(b => typeFilter === "all" ? true : b.banner_type === typeFilter)
      .filter(b => statusFilter === "all" ? true : statusFilter === "on" ? b.is_enabled : !b.is_enabled)
      .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()));
  }, [rows, typeFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(b => b.is_enabled).length,
    views: rows.reduce((s, b) => s + (b.view_count || 0), 0),
    clicks: rows.reduce((s, b) => s + (b.click_count || 0), 0),
  }), [rows]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.image_url?.trim()) {
      return toast.error("Title and image URL are required");
    }
    try {
      const { error } = await (supabase as any).rpc("admin_upsert_banner", { p_data: editing });
      if (error) throw error;
      toast.success(editing.id ? "Banner updated" : "Banner created");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any).rpc("admin_toggle_banner", { p_id: id, p_enabled: enabled });
      if (error) throw error;
      load();
    } catch (e: any) {
      toast.error(e.message || "Toggle failed");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await (supabase as any).rpc("admin_delete_banner", { p_id: confirmDelete.id });
      if (error) throw error;
      toast.success("Deleted");
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nothing to export");
    const keys = Object.keys(filtered[0]);
    const csv = [keys.join(",")]
      .concat(filtered.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `banners-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Banners" description="Manage homepage, agent, promotion and wallet banners">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={exportCsv} className="border-white/10 bg-white/5">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button onClick={() => setEditing(emptyBanner())} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />New Banner
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total banners", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Total views", value: stats.views },
            { label: "Total clicks", value: stats.clicks },
          ].map(s => (
            <Card key={s.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="text-xs text-white/50">{s.label}</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">{s.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters + table */}
        <Card className="bg-white/[0.03] border-white/10">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white/90 text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-300" /> All Banners
              </CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search title…"
                    className="pl-8 bg-white/5 border-white/10 w-full sm:w-56"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {BANNER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="on">Enabled</SelectItem>
                    <SelectItem value="off">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-white/50 text-center py-10">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-white/50 text-center py-10 border border-dashed border-white/10 rounded-lg">
                No banners found. Click <span className="text-amber-300">New Banner</span> to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 px-2">Banner</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Order</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Audience</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Stats</th>
                      <th className="text-left py-2 px-2">Enabled</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-3">
                            {b.image_url ? (
                              <img src={b.image_url} alt="" className="w-14 h-8 object-cover rounded border border-white/10" />
                            ) : (
                              <div className="w-14 h-8 bg-white/5 rounded border border-white/10" />
                            )}
                            <div>
                              <div className="text-white/90 font-medium">{b.title}</div>
                              {b.link && <div className="text-xs text-white/40 truncate max-w-[220px]">{b.link}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2"><Badge variant="outline" className="border-white/10">{b.banner_type}</Badge></td>
                        <td className="py-2 px-2 text-white/70">{b.display_order}</td>
                        <td className="py-2 px-2 hidden md:table-cell text-white/70">
                          {b.target_audience}{b.target_vip_min ? ` · VIP≥${b.target_vip_min}` : ""}
                        </td>
                        <td className="py-2 px-2 hidden md:table-cell text-white/70">
                          {b.view_count || 0} views · {b.click_count || 0} clicks
                        </td>
                        <td className="py-2 px-2">
                          <Switch checked={b.is_enabled} onCheckedChange={(v) => toggle(b.id, v)} />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(b)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(b)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label>Banner type</Label>
                <Select value={editing.banner_type} onValueChange={(v) => setEditing({ ...editing, banner_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display order</Label>
                <Input type="number" value={editing.display_order ?? 0} onChange={e => setEditing({ ...editing, display_order: Number(e.target.value) })} className="bg-white/5 border-white/10" />
              </div>
              <div className="md:col-span-2">
                <Label>Image URL</Label>
                <Input value={editing.image_url || ""} onChange={e => setEditing({ ...editing, image_url: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label>Link</Label>
                <Input value={editing.link || ""} onChange={e => setEditing({ ...editing, link: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label>Link type</Label>
                <Select value={editing.link_type || "url"} onValueChange={(v) => setEditing({ ...editing, link_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="internal">Internal route</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start date</Label>
                <Input type="datetime-local" value={editing.start_date?.slice(0, 16) || ""} onChange={e => setEditing({ ...editing, start_date: e.target.value || null })} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="datetime-local" value={editing.end_date?.slice(0, 16) || ""} onChange={e => setEditing({ ...editing, end_date: e.target.value || null })} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={editing.target_audience || "all"} onValueChange={(v) => setEditing({ ...editing, target_audience: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="user">Players only</SelectItem>
                    <SelectItem value="agent">Agents only</SelectItem>
                    <SelectItem value="vip">VIP only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min VIP level</Label>
                <Input type="number" min={0} max={10} value={editing.target_vip_min ?? 0} onChange={e => setEditing({ ...editing, target_vip_min: Number(e.target.value) })} className="bg-white/5 border-white/10" />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch checked={!!editing.is_enabled} onCheckedChange={(v) => setEditing({ ...editing, is_enabled: v })} />
                <span className="text-sm text-white/70">Enabled</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-white/10 bg-white/5">Cancel</Button>
            <Button onClick={save} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold">
              {editing?.id ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently remove <span className="text-white">{confirmDelete?.title}</span>. This action is logged and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-600 hover:bg-red-500">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
