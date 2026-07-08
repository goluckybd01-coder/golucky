import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Loader2, ShieldAlert, Wrench } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { useAgentPaymentSettings } from "@/hooks/useAgentPaymentSettings";
import { UsdtPaymentCard } from "@/components/agent-payment/UsdtPaymentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_NETWORK = "TRC20";
const ALLOWED_TOKEN = "USDT";
const normalizeNet = (v: string | null | undefined) =>
  (v ?? "").trim().toUpperCase().replace(/[-_\s]/g, "");

const txidSchema = z
  .string()
  .trim()
  .min(20, { message: "TXID must be at least 20 characters" })
  .max(128, { message: "TXID too long" })
  .regex(/^[a-fA-F0-9]{64}$/, {
    message: "TRC20 TXID must be a 64-character hex hash",
  });

const getDeviceInfo = () => {
  if (typeof navigator === "undefined") return "unknown";
  return `${navigator.platform || "?"} | ${navigator.userAgent.slice(0, 200)}`;
};

export default function AgentPayment() {
  const navigate = useNavigate();
  const { applicationId } = useParams<{ applicationId: string }>();
  const { settings, qrSignedUrl, loading } = useAgentPaymentSettings();

  const [txid, setTxid] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ txid?: string; file?: string }>({});

  const disabled = useMemo(() => {
    if (!settings) return true;
    return (
      settings.maintenance_mode ||
      !settings.is_agent_application_enabled ||
      !settings.is_usdt_payment_enabled ||
      !settings.usdt_wallet_address ||
      normalizeNet(settings.usdt_network) !== ALLOWED_NETWORK
    );
  }, [settings]);

  const handleFile = (f: File | null) => {
    if (!f) return setScreenshot(null);
    if (f.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, file: "File must be under 5MB" }));
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, file: "Only image files are allowed" }));
      return;
    }
    setErrors((e) => ({ ...e, file: undefined }));
    setScreenshot(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (normalizeNet(settings.usdt_network) !== ALLOWED_NETWORK) {
      toast.error("Only USDT on TRC20 is supported. Other networks are not accepted.");
      return;
    }
    const parsed = txidSchema.safeParse(txid);
    if (!parsed.success) {
      setErrors({ txid: parsed.error.issues[0].message });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        toast.error("Please sign in to submit payment");
        navigate("/login");
        return;
      }

      let screenshotPath: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split(".").pop() || "png";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("agent-payment-proofs")
          .upload(path, screenshot, { contentType: screenshot.type });
        if (upErr) throw upErr;
        screenshotPath = path;
      }

      const { data, error } = await supabase.functions.invoke("agent-payment-submit", {
        body: {
          application_id: applicationId ?? null,
          txid: parsed.data,
          screenshot_path: screenshotPath,
          device_info: getDeviceInfo(),
          network: ALLOWED_NETWORK,
          token: ALLOWED_TOKEN,
        },
      });

      if (error) {
        const msg = (data as { error?: string })?.error || error.message;
        if (/duplicate|already/i.test(msg)) {
          toast.error("This TXID has already been submitted");
        } else {
          toast.error(msg);
        }
        return;
      }
      toast.success("Payment submitted for verification");
      navigate(`/agent/payment/status/${(data as { id: string }).id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/70">
        Payment system unavailable
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <header className="sticky top-0 z-10 border-b border-emerald-500/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-white/5 p-2 hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-lg font-bold text-amber-300">
              Agent Application Payment
            </h1>
            <p className="text-xs text-emerald-300/70">One-time verification fee</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-6">
        {settings.maintenance_mode ? (
          <MaintenanceBanner />
        ) : !settings.is_agent_application_enabled ? (
          <DisabledBanner text="Agent applications are currently paused." />
        ) : !settings.is_usdt_payment_enabled ? (
          <DisabledBanner text="USDT payments are temporarily disabled." />
        ) : !settings.usdt_wallet_address ? (
          <DisabledBanner text="Payment address not configured yet. Please try again shortly." />
        ) : null}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <UsdtPaymentCard
            amount={Number(settings.application_fee_usdt)}
            network={settings.usdt_network}
            address={settings.usdt_wallet_address}
            qrUrl={qrSignedUrl}
          />
        </motion.div>

        {settings.payment_instructions && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/80">
            {settings.payment_instructions}
          </div>
        )}

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-emerald-500/20 bg-black/60 p-5 backdrop-blur"
        >
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-emerald-300/80">
              Transaction Hash (TXID)
            </label>
            <Input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="Paste your TRC20 transaction hash"
              disabled={disabled || submitting}
              aria-invalid={!!errors.txid}
              className="border-emerald-500/30 bg-black/50 font-mono text-sm text-amber-100 placeholder:text-white/30"
            />
            {errors.txid && (
              <p className="mt-1 text-xs text-red-400">{errors.txid}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-emerald-300/80">
              Screenshot (Optional)
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm ${
                disabled ? "opacity-50" : "hover:bg-white/5"
              } ${screenshot ? "border-emerald-400/60 text-emerald-200" : "border-white/20 text-white/60"}`}
            >
              <Upload className="h-4 w-4" />
              <span className="truncate">
                {screenshot ? screenshot.name : "Upload proof (PNG/JPG, max 5MB)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                disabled={disabled || submitting}
              />
            </label>
            {errors.file && <p className="mt-1 text-xs text-red-400">{errors.file}</p>}
          </div>

          <Button
            type="submit"
            disabled={disabled || submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 font-bold text-black hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit Payment"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}

function MaintenanceBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
      <Wrench className="h-5 w-5" />
      <div>
        <p className="font-semibold">Maintenance Mode</p>
        <p className="text-xs opacity-80">
          The payment system is briefly down for maintenance. Please try again shortly.
        </p>
      </div>
    </div>
  );
}

function DisabledBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
      <ShieldAlert className="h-5 w-5" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
