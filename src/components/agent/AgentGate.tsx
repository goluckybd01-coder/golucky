import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Clock, XCircle, Lock, Sparkles, LifeBuoy } from "lucide-react";

export type AgentStatus = "not_applied" | "pending" | "approved" | "rejected" | "suspended";

interface AgentApp {
  status: string;
  created_at: string;
  can_reapply?: boolean | null;
}

interface Props {
  children: (ctx: { userId: string; status: AgentStatus }) => React.ReactNode;
}

/**
 * Role/status-based visibility gate for Agent features.
 * Backend RLS on agent_* tables enforces agent_user_id = auth.uid(); this component
 * additionally hides dashboard/wallet UI unless agent_status === 'approved'.
 */
export default function AgentGate({ children }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<AgentStatus>("not_applied");
  const [app, setApp] = useState<AgentApp | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("agent_status")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: application } = await supabase
          .from("agent_applications")
          .select("status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .maybeSingle();

        if (application) setApp({ ...(application as any), can_reapply: true });

        const raw = String(profile?.agent_status || (application as any)?.status || "not_applied").toLowerCase();
        const normalized: AgentStatus =
          raw === "approved" ? "approved" :
          raw === "pending"  ? "pending"  :
          raw === "rejected" ? "rejected" :
          raw === "suspended"? "suspended": "not_applied";
        setStatus(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (status === "approved" && userId) {
    return <>{children({ userId, status })}</>;
  }

  return (
    <div className="mx-auto w-full max-w-[560px] p-4">
      {status === "not_applied" && <ApplyCTA />}
      {status === "pending" && <PendingCard submittedAt={app?.created_at} />}
      {status === "rejected" && <RejectedCard canReapply={app?.can_reapply ?? false} />}
      {status === "suspended" && <SuspendedCard />}
    </div>
  );
}

function ApplyCTA() {
  return (
    <Card className="overflow-hidden border-amber-300/30 bg-gradient-to-br from-[#0a0805] via-black to-[#0a0a0f]">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-400/15 shadow-[0_0_30px_rgba(254,192,19,0.5)]">
          <Crown className="h-7 w-7 text-amber-300" />
        </div>
        <div>
          <h2 className="bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text text-2xl font-black uppercase tracking-tight text-transparent">
            Become a GoLucky Agent
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Unlock daily commission, monthly salary, team income and lifetime rewards.
          </p>
        </div>
        <Link to="/agent/apply" className="w-full">
          <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 font-black uppercase tracking-wider text-black hover:from-amber-300 hover:to-amber-400">
            <Sparkles className="mr-2 h-4 w-4" /> Apply for Agent Account
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PendingCard({ submittedAt }: { submittedAt?: string }) {
  return (
    <Card className="border-cyan-400/30 bg-gradient-to-br from-cyan-950/30 to-black">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <Clock className="h-10 w-10 text-cyan-300" />
        <h2 className="text-xl font-black text-white">Agent Application Pending</h2>
        <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">Under review</Badge>
        {submittedAt && (
          <p className="text-xs text-white/60">
            Submitted {new Date(submittedAt).toLocaleDateString()}
          </p>
        )}
        <p className="text-sm text-white/60">
          Our team is reviewing your application. You'll be notified once a decision is made.
        </p>
        <Link to="/support/chat?type=agent" className="w-full">
          <Button variant="outline" className="w-full">
            <LifeBuoy className="mr-2 h-4 w-4" /> Contact Support
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function RejectedCard({ canReapply }: { canReapply: boolean }) {
  return (
    <Card className="border-rose-400/30 bg-gradient-to-br from-rose-950/30 to-black">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <XCircle className="h-10 w-10 text-rose-300" />
        <h2 className="text-xl font-black text-white">Application Not Approved</h2>
        <p className="text-sm text-white/60">
          Your previous agent application was not approved.
        </p>
        {canReapply ? (
          <Link to="/agent/apply" className="w-full">
            <Button className="w-full bg-amber-500 font-black text-black hover:bg-amber-400">
              Re-apply
            </Button>
          </Link>
        ) : (
          <Link to="/support/chat?type=agent" className="w-full">
            <Button variant="outline" className="w-full">
              <LifeBuoy className="mr-2 h-4 w-4" /> Contact Support
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function SuspendedCard() {
  return (
    <Card className="border-white/20 bg-gradient-to-br from-neutral-900 to-black">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <Lock className="h-10 w-10 text-white/70" />
        <h2 className="text-xl font-black text-white">Agent Account Suspended</h2>
        <p className="text-sm text-white/60">
          Your agent dashboard is locked. Please contact support to restore access.
        </p>
        <Link to="/support/chat?type=agent" className="w-full">
          <Button variant="outline" className="w-full">
            <LifeBuoy className="mr-2 h-4 w-4" /> Contact Support
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
