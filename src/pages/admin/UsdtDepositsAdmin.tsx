import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, CheckCircle2, XCircle, Loader2, ExternalLink, FileSearch } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

type Status = "pending" | "verified" | "rejected";

interface Payment {
  id: string;
  user_id: string;
  amount_usdt: number | null;
  amount: number;
  txid: string | null;
  wallet_address: string | null;
  status: Status | "success" | "failed";
  proof_url: string | null;
  gateway: string | null;
  admin_id: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  verified: "default",
  rejected: "destructive",
};

type ModalMode = "approve" | "reject" | "view";

export default function UsdtDepositsAdmin() {
  const [tab, setTab] = useState<Status>("pending");
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [usdtRate, setUsdtRate] = useState<number>(130);

  const [modal, setModal] = useState<{ payment: Payment; mode: ModalMode } | null>(null);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [profitRate, setProfitRate] = useState<number>(10);
  const [rejectReason, setRejectReason] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("status", tab)
      .eq("gateway", "usdt-trc20")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setItems((data as Payment[]) || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.rpc("get_usdt_rate").then(({ data }) => {
      if (data != null) setUsdtRate(Number(data));
    });
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("usdt-deposits-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const openModal = (payment: Payment, mode: ModalMode) => {
    setDurationDays(30);
    setProfitRate(10);
    setRejectReason("");
    setModal({ payment, mode });
  };

  const runApprove = async () => {
    if (!modal) return;
    setBusyId(modal.payment.id);
    const { data, error } = await supabase.rpc("approve_usdt_payment", {
      p_payment_id: modal.payment.id,
      p_duration_days: durationDays,
      p_profit_rate: profitRate,
    });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`FD created (#${(data as any)?.fd_id ?? "—"})`);
    setModal(null);
    load();
  };

  const runReject = async () => {
    if (!modal) return;
    setBusyId(modal.payment.id);
    const { error } = await supabase.rpc("reject_usdt_payment", {
      p_payment_id: modal.payment.id,
      p_reason: rejectReason || "Not verified on chain",
    });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setModal(null);
    load();
  };

  const bdtOf = (p: Payment) =>
    Number(p.amount ?? 0) || Number(p.amount_usdt ?? 0) * usdtRate;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Helmet><title>USDT Deposits · Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold">USDT Deposit Verification</h1>
        <p className="text-sm text-muted-foreground">
          Verify TXIDs on-chain, then approve to auto-create the linked Fixed Deposit.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No {tab} deposits.</Card>
          ) : (
            items.map((p) => (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[p.status] ?? "outline"}>{p.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {Number(p.amount_usdt ?? p.amount).toFixed(2)} USDT
                      <span className="ml-2 text-xs text-muted-foreground">≈ ৳{bdtOf(p).toLocaleString("en-BD")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">user: {p.user_id.slice(0, 8)}…</div>
                  </div>
                  <div className="flex-1 min-w-[280px] space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">TXID:</span>
                      <span className="font-mono truncate">{p.txid}</span>
                      {p.txid && (
                        <>
                          <button onClick={() => copy(p.txid!)} className="text-primary"><Copy className="h-3 w-3" /></button>
                          <a href={`https://tronscan.org/#/transaction/${p.txid}`} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="h-3 w-3" /></a>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">Wallet:</span>
                      <span className="font-mono truncate">{p.wallet_address}</span>
                      {p.wallet_address && (
                        <button onClick={() => copy(p.wallet_address!)} className="text-primary"><Copy className="h-3 w-3" /></button>
                      )}
                    </div>
                    {p.rejection_reason && <div className="text-destructive">Reason: {p.rejection_reason}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" onClick={() => openModal(p, "view")}><FileSearch className="h-4 w-4 mr-1" /> Details</Button>
                  {p.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => openModal(p, "approve")}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => openModal(p, "reject")}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-lg">
          {modal && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {modal.mode === "approve" && "Approve USDT Deposit"}
                  {modal.mode === "reject" && "Reject USDT Deposit"}
                  {modal.mode === "view" && "Transaction Details"}
                </DialogTitle>
                <DialogDescription>
                  Payment #{modal.payment.id.slice(0, 8)}… · {new Date(modal.payment.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Row label="Status"><Badge variant={statusVariant[modal.payment.status] ?? "outline"}>{modal.payment.status}</Badge></Row>
                <Row label="User ID"><span className="font-mono text-xs">{modal.payment.user_id}</span></Row>
                <Row label="Amount (USDT)"><span className="font-semibold">{Number(modal.payment.amount_usdt ?? modal.payment.amount).toFixed(2)} USDT</span></Row>
                <Row label="Amount (BDT)"><span className="font-semibold">৳{bdtOf(modal.payment).toLocaleString("en-BD")}</span><span className="ml-2 text-xs text-muted-foreground">@ ৳{usdtRate}/USDT</span></Row>
                <Row label="TXID">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs truncate">{modal.payment.txid ?? "—"}</span>
                    {modal.payment.txid && (
                      <>
                        <button onClick={() => copy(modal.payment.txid!)}><Copy className="h-3 w-3" /></button>
                        <a href={`https://tronscan.org/#/transaction/${modal.payment.txid}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                      </>
                    )}
                  </div>
                </Row>
                <Row label="Wallet"><span className="font-mono text-xs truncate">{modal.payment.wallet_address ?? "—"}</span></Row>
                {modal.payment.rejection_reason && <Row label="Reject reason"><span className="text-destructive">{modal.payment.rejection_reason}</span></Row>}
                <Row label="Audit log">
                  <Link to={`/admin/audit-logs?ref=${modal.payment.id}`} className="text-primary underline text-xs inline-flex items-center gap-1">
                    View related entries <ExternalLink className="h-3 w-3" />
                  </Link>
                </Row>
                {modal.mode === "approve" && (
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                    <div><label className="text-xs text-muted-foreground">Duration (days)</label><Input type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(+e.target.value)} /></div>
                    <div><label className="text-xs text-muted-foreground">Profit rate (%)</label><Input type="number" min={0} max={100} step="0.1" value={profitRate} onChange={(e) => setProfitRate(+e.target.value)} /></div>
                  </div>
                )}
                {modal.mode === "reject" && (
                  <div className="mt-3 border-t pt-3">
                    <label className="text-xs text-muted-foreground">Reject reason</label>
                    <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Not verified on chain" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setModal(null)}>Close</Button>
                {modal.mode === "approve" && (
                  <Button onClick={runApprove} disabled={busyId === modal.payment.id}>
                    {busyId === modal.payment.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    Confirm & Create FD
                  </Button>
                )}
                {modal.mode === "reject" && (
                  <Button variant="destructive" onClick={runReject} disabled={busyId === modal.payment.id}>
                    {busyId === modal.payment.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                    Confirm Reject
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 text-right">{children}</div>
    </div>
  );
}
