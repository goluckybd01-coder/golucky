import { useState } from "react";
import { Coins, Settings2, FileCheck2, LayoutDashboard, ScrollText } from "lucide-react";
import AgentPaymentSettingsAdmin from "./AgentPaymentSettings";
import AgentPaymentSubmissions from "./AgentPaymentSubmissions";
import AgentPaymentDashboard from "./AgentPaymentDashboard";
import AgentPaymentAuditLogs from "./AgentPaymentAuditLogs";

type Tab = "dashboard" | "submissions" | "settings" | "audit";

export default function AgentPaymentsAdmin() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
          <Coins className="h-7 w-7" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-yellow-300 via-emerald-300 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
            Agent Payment Gateway
          </h1>
          <p className="text-sm text-muted-foreground">
            USDT (TRC20) application-fee gateway — dashboard, verifications & settings.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border p-1 w-fit">
        <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </TabBtn>
        <TabBtn active={tab === "submissions"} onClick={() => setTab("submissions")}>
          <FileCheck2 className="h-4 w-4" /> Payments
        </TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
          <Settings2 className="h-4 w-4" /> Settings
        </TabBtn>
        <TabBtn active={tab === "audit"} onClick={() => setTab("audit")}>
          <ScrollText className="h-4 w-4" /> Audit Logs
        </TabBtn>
      </div>

      {tab === "dashboard" && <AgentPaymentDashboard />}
      {tab === "submissions" && <AgentPaymentSubmissions />}
      {tab === "settings" && <AgentPaymentSettingsAdmin />}
      {tab === "audit" && <AgentPaymentAuditLogs />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
