import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Search, Download, Pin, Megaphone } from "lucide-react";

type Row = {
  id: string;
  title: string;
  message: string;
  priority: "urgent" | "normal" | "info";
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const empty = (): Partial<Row> => ({
  title: "",
  message: "",
  priority: "normal",
  is_pinned: false,
});

const priorityColor: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-300 border-red-500/30",
  normal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  info: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

async function audit(action: string, id: string | null, oldRow: any, newRow: any) {
  try {
    await (supabase as any).rpc("log_staff_action", {
      p_action: action,
      p_module: "announcements",
      p_target_type: "agent_announcement",
      p_target_id: id,
      p_old: oldRow,
      p_new: newRow,
    });
  } catch (e) {
    console.warn("[announcements] audit log failed", e);
  }
}

export default function AnnouncementsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [pinnedFilter, setPinnedFilter] = useState<"all" | "pinned" | "unpinned">("all");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows
    .filter(r => priorityFilter === "all" ? true : r.priority === priorityFilter)
    .filter(r => pinnedFilter === "all" ? true : pinnedFilter === "pinned" ? r.is_pinned : !r.is_pinned)
    .filter(r => !search
      || r.title.toLowerCase().includes(search.toLowerCase())
      || r.message.toLowerCase().includes(search.toLowerCase())
    ), [rows, search, priorityFilter, pinnedFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    pinned: rows.filter(r => r.is_pinned).length,
    urgent: rows.filter(r => r.priority === "urgent").length,
    week: rows.filter(r => new Date(r.created_at).getTime() > Date.now() - 7 * 864e5).length,
  }), [rows]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.message?.trim()) {
      return toast.error("Title and message are required");
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title: editing.title.trim(),
        message: editing.message.trim(),
        priority: editing.priority || "normal",
        is_pinned: !!editing.is_pinned,
      };

      if (editing.id) {
        const oldRow = rows.find(r => r.id === editing.id);
        const { data, error } = await supabase
          .from("agent_announcements")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        await audit("update", editing.id, oldRow, data);
        toast.success("Announcement updated");
      } else {
        const { data, error } = await supabase
          .from("agent_announcements")
          .insert({ ...payload, created_by: userData.user?.id ?? null })
          .select()
          .single();
        if (error) throw error;
        await audit("create", data.id, null, data);
        toast.success("Announcement created");
      }
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const togglePin = async (row: Row) => {
    try {
      const { data, error } = await supabase
        .from("agent_announcements")
        .update({ is_pinned: !row.is_pinned })
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      await audit(row.is_pinned ? "unpin" : "pin", row.id, row, data);
      load();
    } catch (e: any) {
      toast.error(e.message || "Toggle failed");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from("agent_announcements")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw error;
      await audit("delete", confirmDelete.id, confirmDelete, null);
      toast.success("Announcement deleted");
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nothing to export");
    const keys = ["id", "title", "message", "priority", "is_pinned", "created_at"];
    const csv = [keys.join(",")]
      .concat(filtered.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `announcements-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Announcements" description="Broadcast messages to approved agents">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={exportCsv} className="border-white/10 bg-white/5">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button onClick={() => setEditing(empty())} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />New Announcement
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Pinned", value: stats.pinned },
            { label: "Urgent", value: stats.urgent },
            { label: "Last 7 days", value: stats.week },
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
              <CardTitle className="text-white/90 text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-300" /> All Announcements
              </CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or message…" className="pl-8 bg-white/5 border-white/10 w-full sm:w-64" />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={pinnedFilter} onValueChange={(v: any) => setPinnedFilter(v)}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pinned">Pinned</SelectItem>
                    <SelectItem value="unpinned">Unpinned</SelectItem>
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
                No announcements found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 px-2">Announcement</th>
                      <th className="text-left py-2 px-2">Priority</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Created</th>
                      <th className="text-left py-2 px-2">Pinned</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] align-top">
                        <td className="py-3 px-2 max-w-[520px]">
                          <div className="text-white/90 font-medium flex items-center gap-2">
                            {r.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-300" />}
                            {r.title}
                          </div>
                          <div className="text-xs text-white/50 mt-1 line-clamp-2 whitespace-pre-wrap">{r.message}</div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={priorityColor[r.priority] || ""}>{r.priority}</Badge>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell text-white/60 text-xs">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <Switch checked={r.is_pinned} onCheckedChange={() => togglePin(r)} />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(r)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(r)}>
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} className="bg-white/5 border-white/10" maxLength={200} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={editing.message || ""} onChange={e => setEditing({ ...editing, message: e.target.value })} className="bg-white/5 border-white/10 min-h-[140px]" maxLength={4000} />
                <div className="text-xs text-white/40 mt-1">{editing.message?.length || 0} / 4000</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={editing.priority || "normal"} onValueChange={(v: any) => setEditing({ ...editing, priority: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3">
                  <Switch checked={!!editing.is_pinned} onCheckedChange={(v) => setEditing({ ...editing, is_pinned: v })} />
                  <span className="text-sm text-white/70 pb-2">Pin to top</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-white/10 bg-white/5">Cancel</Button>
            <Button onClick={save} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold">
              {editing?.id ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently remove <span className="text-white">{confirmDelete?.title}</span>. This action is logged.
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
