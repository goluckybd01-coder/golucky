import { useEffect, useState } from "react";
import { Loader2, Save, Upload, Wrench, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAgentPaymentSettings } from "@/hooks/useAgentPaymentSettings";

export default function AgentPaymentSettingsAdmin() {
  const { settings, qrSignedUrl, loading, refresh } = useAgentPaymentSettings();
  const [form, setForm] = useState({
    is_agent_application_enabled: true,
    is_usdt_payment_enabled: true,
    maintenance_mode: false,
    application_fee_usdt: 50,
    usdt_wallet_address: "",
    usdt_network: "TRC20",
    payment_instructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        is_agent_application_enabled: settings.is_agent_application_enabled,
        is_usdt_payment_enabled: settings.is_usdt_payment_enabled,
        maintenance_mode: settings.maintenance_mode,
        application_fee_usdt: Number(settings.application_fee_usdt),
        usdt_wallet_address: settings.usdt_wallet_address || "",
        usdt_network: settings.usdt_network || "TRC20",
        payment_instructions: settings.payment_instructions || "",
      });
    }
  }, [settings]);

  const save = async () => {
    if (!settings) return;
    if (!form.usdt_wallet_address.trim()) {
      toast.error("Wallet address is required");
      return;
    }
    if (form.application_fee_usdt <= 0) {
      toast.error("Fee must be greater than 0");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("agent_payment_settings")
      .update({
        ...form,
        usdt_wallet_address: form.usdt_wallet_address.trim(),
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved — live for all applicants");
    refresh();
  };

  const uploadQr = async (file: File) => {
    if (!settings) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("QR image must be under 2MB");
    if (!file.type.startsWith("image/")) return toast.error("Image files only");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `qr-${settings.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("agent-payment-qr")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { error: dbErr } = await supabase
      .from("agent_payment_settings")
      .update({ qr_code_url: path })
      .eq("id", settings.id);
    setUploading(false);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("QR code updated");
    refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-emerald-500" />
        <div>
          <h2 className="text-xl font-bold">Agent Payment Settings</h2>
          <p className="text-sm text-muted-foreground">
            Controls the USDT (TRC20) payment shown on the Agent Application.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ToggleRow
          label="Agent Application"
          desc="Master switch for the application flow"
          value={form.is_agent_application_enabled}
          onChange={(v) => setForm((f) => ({ ...f, is_agent_application_enabled: v }))}
        />
        <ToggleRow
          label="USDT Payment"
          desc="Enable / disable USDT TRC20 fee"
          value={form.is_usdt_payment_enabled}
          onChange={(v) => setForm((f) => ({ ...f, is_usdt_payment_enabled: v }))}
        />
        <ToggleRow
          label="Maintenance Mode"
          desc="Show a maintenance banner to users"
          value={form.maintenance_mode}
          onChange={(v) => setForm((f) => ({ ...f, maintenance_mode: v }))}
          icon={<Wrench className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Application Fee (USDT)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.application_fee_usdt}
            onChange={(e) =>
              setForm((f) => ({ ...f, application_fee_usdt: Number(e.target.value) }))
            }
          />
        </Field>
        <Field label="Network">
          <Input
            value={form.usdt_network}
            onChange={(e) => setForm((f) => ({ ...f, usdt_network: e.target.value }))}
            placeholder="TRC20"
          />
        </Field>
      </div>

      <Field label="USDT Wallet Address">
        <Input
          value={form.usdt_wallet_address}
          onChange={(e) => setForm((f) => ({ ...f, usdt_wallet_address: e.target.value }))}
          placeholder="T..."
          className="font-mono"
        />
      </Field>

      <Field label="Payment Instructions">
        <Textarea
          rows={4}
          value={form.payment_instructions}
          onChange={(e) => setForm((f) => ({ ...f, payment_instructions: e.target.value }))}
          placeholder="Shown to users on the payment page"
        />
      </Field>

      <Field label="QR Code">
        <div className="flex items-center gap-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-lg border bg-white p-2">
            {qrSignedUrl ? (
              <img src={qrSignedUrl} alt="Current QR" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No QR</span>
            )}
          </div>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload / Replace
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadQr(f);
              }}
            />
          </label>
        </div>
      </Field>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
  icon,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
      <div>
        <p className="flex items-center gap-2 font-medium">
          {icon}
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
