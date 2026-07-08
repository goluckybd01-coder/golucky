import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Send, MessageCircle, Trash2, Download, RefreshCw } from "lucide-react";

type ChatStatus = "open" | "in_progress" | "closed";
type ChatPriority = "normal" | "high";
type ChatType = "user" | "agent_line";
type SenderType = "user" | "support";

type ChatRow = {
  id: string;
  chat_type: ChatType;
  user_id: string;
  assigned_support_id: string | null;
  priority: ChatPriority;
  status: ChatStatus;
  last_message_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  chat_id: string;
  sender_type: SenderType;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
};

const statusColor: Record<ChatStatus, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  closed: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const priorityColor: Record<ChatPriority, string> = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  normal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

async function audit(action: string, id: string | null, oldRow: any, newRow: any) {
  try {
    await (supabase as any).rpc("log_staff_action", {
      p_action: action,
      p_module: "support_chat",
      p_target_type: "support_chat",
      p_target_id: id,
      p_old: oldRow,
      p_new: newRow,
    });
  } catch (e) {
    console.warn("[support] audit log failed", e);
  }
}

export default function SupportChatAdmin() {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ChatRow | null>(null);
  const [me, setMe] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_chats")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      setChats((data as any) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages((data as any) || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) {
      toast.error(e.message || "Failed to load messages");
    }
  };

  useEffect(() => { loadChats(); }, []);
  useEffect(() => { if (selectedId) loadMessages(selectedId); }, [selectedId]);

  // realtime subscription for new messages in the open chat
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`support-chat-${selectedId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${selectedId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  const filtered = useMemo(() => chats
    .filter(c => statusFilter === "all" ? true : c.status === statusFilter)
    .filter(c => priorityFilter === "all" ? true : c.priority === priorityFilter)
    .filter(c => typeFilter === "all" ? true : c.chat_type === typeFilter)
    .filter(c => !search || c.user_id.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())),
  [chats, search, statusFilter, priorityFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: chats.length,
    open: chats.filter(c => c.status === "open").length,
    inProgress: chats.filter(c => c.status === "in_progress").length,
    high: chats.filter(c => c.priority === "high" && c.status !== "closed").length,
  }), [chats]);

  const selected = chats.find(c => c.id === selectedId) || null;

  const updateChat = async (id: string, patch: Partial<ChatRow>) => {
    const before = chats.find(c => c.id === id);
    try {
      const { data, error } = await supabase
        .from("support_chats")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await audit("update", id, before, data);
      setChats((prev) => prev.map(c => c.id === id ? (data as any) : c));
      toast.success("Chat updated");
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim() || !me) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: selectedId,
          sender_type: "support",
          sender_id: me,
          message: reply.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString(), status: selected?.status === "open" ? "in_progress" : selected?.status })
        .eq("id", selectedId);
      await audit("reply", selectedId, null, data);
      setReply("");
      loadChats();
    } catch (e: any) {
      toast.error(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from("support_chats")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw error;
      await audit("delete", confirmDelete.id, confirmDelete, null);
      toast.success("Chat deleted");
      if (selectedId === confirmDelete.id) { setSelectedId(null); setMessages([]); }
      setConfirmDelete(null);
      loadChats();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nothing to export");
    const keys = ["id", "chat_type", "user_id", "assigned_support_id", "priority", "status", "last_message_at", "created_at"];
    const csv = [keys.join(",")]
      .concat(filtered.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `support-chats-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Support Chat" description="Manage user and agent support conversations">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={loadChats} className="border-white/10 bg-white/5">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv} className="border-white/10 bg-white/5">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total chats", value: stats.total },
            { label: "Open", value: stats.open },
            { label: "In progress", value: stats.inProgress },
            { label: "High priority", value: stats.high },
          ].map(s => (
            <Card key={s.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="text-xs text-white/50">{s.label}</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">{s.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          {/* Chat list */}
          <Card className="bg-white/[0.03] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/90 text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-300" /> Conversations
              </CardTitle>
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or chat ID…" className="pl-8 bg-white/5 border-white/10" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Type</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="agent_line">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[560px] overflow-y-auto divide-y divide-white/5">
                {loading ? (
                  <div className="text-white/50 text-center py-8 text-sm">Loading…</div>
                ) : filtered.length === 0 ? (
                  <div className="text-white/50 text-center py-8 text-sm">No chats found.</div>
                ) : filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3 hover:bg-white/[0.04] transition ${selectedId === c.id ? "bg-white/[0.06]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-white/90 text-sm font-mono truncate">{c.user_id.slice(0, 8)}…</div>
                      <Badge variant="outline" className={`${statusColor[c.status]} text-[10px]`}>{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`${priorityColor[c.priority]} text-[10px]`}>{c.priority}</Badge>
                      <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">{c.chat_type}</Badge>
                      <span className="text-[10px] text-white/40 ml-auto">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversation panel */}
          <Card className="bg-white/[0.03] border-white/10 flex flex-col min-h-[560px]">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                Select a conversation to view messages.
              </div>
            ) : (
              <>
                <CardHeader className="pb-3 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div>
                      <div className="text-white/90 font-semibold text-sm font-mono">{selected.id}</div>
                      <div className="text-xs text-white/50 mt-0.5">User: {selected.user_id}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Select value={selected.status} onValueChange={(v: ChatStatus) => updateChat(selected.id, { status: v })}>
                        <SelectTrigger className="h-8 w-32 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selected.priority} onValueChange={(v: ChatPriority) => updateChat(selected.id, { priority: v })}>
                        <SelectTrigger className="h-8 w-24 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(selected)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[440px]">
                  {messages.length === 0 ? (
                    <div className="text-white/40 text-sm text-center py-6">No messages yet.</div>
                  ) : messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_type === "support" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender_type === "support" ? "bg-amber-500/15 border border-amber-500/20 text-amber-100" : "bg-white/5 border border-white/10 text-white/90"}`}>
                        <div className="whitespace-pre-wrap">{m.message}</div>
                        {m.attachment_url && (
                          <a href={m.attachment_url} target="_blank" rel="noreferrer" className="text-xs underline text-blue-300 mt-1 inline-block">Attachment</a>
                        )}
                        <div className="text-[10px] text-white/40 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-white/10 p-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type a reply…"
                      className="bg-white/5 border-white/10 min-h-[60px]"
                      disabled={selected.status === "closed"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReply(); }
                      }}
                    />
                    <Button
                      onClick={sendReply}
                      disabled={sending || !reply.trim() || selected.status === "closed"}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold self-end"
                    >
                      <Send className="w-4 h-4 mr-2" />Send
                    </Button>
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">⌘/Ctrl + Enter to send</div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes the chat and all its messages. This action is logged.
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
