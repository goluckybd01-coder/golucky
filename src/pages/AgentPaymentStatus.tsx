import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PartyPopper, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusTimeline } from "@/components/agent-payment/StatusTimeline";

interface PaymentRow {
  id: string;
  status: "pending" | "approved" | "rejected" | "more_info";
  amount_usdt: number;
  network: string;
  txid: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function AgentPaymentStatus() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) return;

    const fetchRow = async () => {
      const { data } = await supabase
        .from("agent_application_payments")
        .select("id,status,amount_usdt,network,txid,admin_note,created_at,reviewed_at")
        .eq("id", paymentId)
        .maybeSingle();
      setRow(data as PaymentRow | null);
      setLoading(false);
    };

    fetchRow();
    const timer = setInterval(fetchRow, 8000);

    const channel = supabase
      .channel(`aap_${paymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agent_application_payments",
          filter: `id=eq.${paymentId}`,
        },
        (payload) => setRow(payload.new as PaymentRow)
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [paymentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/70">
        Payment not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <header className="sticky top-0 z-10 border-b border-emerald-500/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/agent/dashboard")}
            className="rounded-full bg-white/5 p-2 hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-lg font-bold text-amber-300">Payment Status</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-6">
        {row.status === "approved" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500/20 to-amber-500/10 p-6 text-center"
          >
            <PartyPopper className="mx-auto h-12 w-12 text-amber-300" />
            <p className="mt-2 font-serif text-2xl font-bold text-amber-200">
              Payment Approved!
            </p>
            <p className="mt-1 text-sm text-emerald-200/80">
              Your agent application review has been unlocked.
            </p>
          </motion.div>
        )}

        <StatusTimeline status={row.status} />

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/60 p-5">
          <Row label="Amount" value={`${Number(row.amount_usdt).toFixed(2)} USDT`} />
          <Row label="Network" value={row.network} />
          <Row label="TXID" value={row.txid} mono />
          <Row label="Submitted" value={new Date(row.created_at).toLocaleString()} />
          {row.reviewed_at && (
            <Row label="Reviewed" value={new Date(row.reviewed_at).toLocaleString()} />
          )}
          {row.admin_note && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              <p className="text-xs uppercase tracking-widest text-amber-300/70">
                Admin note
              </p>
              <p className="mt-1">{row.admin_note}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-emerald-300/70">{label}</span>
      <span className={`text-right text-sm ${mono ? "break-all font-mono text-amber-100" : "text-white/90"}`}>
        {value}
      </span>
    </div>
  );
}
