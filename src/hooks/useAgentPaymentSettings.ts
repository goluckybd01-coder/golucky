import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgentPaymentSettings {
  id: string;
  is_agent_application_enabled: boolean;
  is_usdt_payment_enabled: boolean;
  maintenance_mode: boolean;
  application_fee_usdt: number;
  usdt_wallet_address: string;
  usdt_network: string;
  qr_code_url: string | null;
  payment_instructions: string | null;
  updated_at: string;
}

export function useAgentPaymentSettings() {
  const [settings, setSettings] = useState<AgentPaymentSettings | null>(null);
  const [qrSignedUrl, setQrSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("agent_payment_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSettings(data as AgentPaymentSettings | null);

    // Resolve QR to a signed URL if stored as a bucket path
    if (data?.qr_code_url) {
      const url = data.qr_code_url as string;
      if (url.startsWith("http") || url.startsWith("data:")) {
        setQrSignedUrl(url);
      } else {
        const { data: signed } = await supabase.storage
          .from("agent-payment-qr")
          .createSignedUrl(url, 60 * 60);
        setQrSignedUrl(signed?.signedUrl ?? null);
      }
    } else {
      setQrSignedUrl(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("agent_payment_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_payment_settings" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
     
  }, []);

  return { settings, qrSignedUrl, loading, error, refresh: load };
}
