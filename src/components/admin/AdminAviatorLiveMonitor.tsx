/**
 * AdminAviatorLiveMonitor - Real-time betting oversight for admins
 * Shows live bets, risk exposure, and round controls
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, 
  Users, DollarSign, RefreshCw, Eye, Shield 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AviatorRound {
  id: string;
  round_number: number;
  phase: string;
  crash_multiplier: number;
  total_bets: number;
  total_payouts: number;
  player_count: number;
  created_at: string;
}

interface AviatorBetAdmin {
  id: string;
  round_id: string;
  user_id: string;
  bet_amount: number;
  auto_cashout_multiplier: number | null;
  outcome: string;
  cashout_multiplier: number | null;
  win_amount: number | null;
  placed_at: string;
  // Joined profile data
  profile?: {
    display_user_id: string;
    phone: string;
  };
}

interface LiveStats {
  activeRound: AviatorRound | null;
  liveBets: AviatorBetAdmin[];
  totalExposure: number;
  potentialPayout: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

const AdminAviatorLiveMonitor = () => {
  const [stats, setStats] = useState<LiveStats>({
    activeRound: null,
    liveBets: [],
    totalExposure: 0,
    potentialPayout: 0,
    riskLevel: "low",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch live data
  const fetchLiveData = async () => {
    try {
      // Get active round
      const { data: rounds } = await supabase
        .from("aviator_rounds")
        .select("*")
        .in("phase", ["betting", "running"])
        .order("created_at", { ascending: false })
        .limit(1);

      const activeRound = rounds?.[0] || null;

      if (!activeRound) {
        setStats(prev => ({ ...prev, activeRound: null, liveBets: [] }));
        setIsLoading(false);
        return;
      }

      // Get live bets
      const { data: bets } = await supabase
        .from("aviator_bets")
        .select("*")
        .eq("round_id", activeRound.id)
        .order("placed_at", { ascending: false });

      // Get user profiles for display
      const userIds = [...new Set((bets || []).map(b => b.user_id))];
      const { data: profiles } = userIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("user_id, display_user_id, phone")
            .in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const liveBets: AviatorBetAdmin[] = (bets || []).map(bet => ({
        ...bet,
        profile: profileMap.get(bet.user_id),
      }));

      // Calculate exposure
      const pendingBets = liveBets.filter(b => b.outcome === "pending");
      const totalExposure = pendingBets.reduce((sum, b) => sum + b.bet_amount, 0);
      
      // Potential payout if all pending bets cashout at current crash multiplier
      const potentialPayout = pendingBets.reduce((sum, b) => {
        const multiplier = b.auto_cashout_multiplier || activeRound.crash_multiplier;
        return sum + (b.bet_amount * multiplier);
      }, 0);

      // Calculate risk level
      let riskLevel: LiveStats["riskLevel"] = "low";
      if (potentialPayout > 50000) riskLevel = "medium";
      if (potentialPayout > 100000) riskLevel = "high";
      if (potentialPayout > 250000) riskLevel = "critical";

      setStats({
        activeRound,
        liveBets,
        totalExposure,
        potentialPayout,
        riskLevel,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching live data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Realtime is disabled on the underlying tables after the security lockdown;
  // the 2-second polling above keeps the monitor up to date.
  useEffect(() => {
    return () => {};
  }, []);

  const getRiskColor = (level: LiveStats["riskLevel"]) => {
    switch (level) {
      case "low": return "text-green-400 bg-green-500/20";
      case "medium": return "text-yellow-400 bg-yellow-500/20";
      case "high": return "text-orange-400 bg-orange-500/20";
      case "critical": return "text-red-400 bg-red-500/20";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "betting": return "bg-blue-500";
      case "running": return "bg-green-500";
      case "crashed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-bold text-white">Aviator Live Monitor</h1>
          <Badge variant="outline" className="animate-pulse border-green-500 text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping" />
            LIVE
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLiveData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Round Info */}
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Round</span>
              {stats.activeRound && (
                <Badge className={getPhaseColor(stats.activeRound.phase)}>
                  {stats.activeRound.phase.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-white">
              #{stats.activeRound?.round_number || "—"}
            </div>
            {stats.activeRound?.phase === "running" && (
              <div className="text-xs text-gray-500 mt-1">
                Crash at: {stats.activeRound.crash_multiplier.toFixed(2)}x
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players */}
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs">Players</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.activeRound?.player_count || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.liveBets.filter(b => b.outcome === "pending").length} active
            </div>
          </CardContent>
        </Card>

        {/* Exposure */}
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">Total Bets</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {formatTaka(stats.totalExposure)}
            </div>
          </CardContent>
        </Card>

        {/* Risk */}
        <Card className="bg-[#141414] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-xs">Risk Level</span>
            </div>
            <div className={`text-xl font-bold px-3 py-1 rounded-lg inline-block ${getRiskColor(stats.riskLevel)}`}>
              {stats.riskLevel.toUpperCase()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max payout: {formatTaka(stats.potentialPayout)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Bets Table */}
      <Card className="bg-[#141414] border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Live Bets ({stats.liveBets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-2 px-2">User</th>
                  <th className="text-right py-2 px-2">Bet</th>
                  <th className="text-center py-2 px-2">Auto C/O</th>
                  <th className="text-center py-2 px-2">Status</th>
                  <th className="text-right py-2 px-2">Result</th>
                  <th className="text-right py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.liveBets.slice(0, 20).map((bet) => (
                  <motion.tr
                    key={bet.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-b border-white/5 ${
                      bet.outcome === "cashed_out" ? "bg-green-900/10" :
                      bet.outcome === "crashed" ? "bg-red-900/10" : ""
                    }`}
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                          {(bet.profile?.display_user_id || "U")[0]}
                        </div>
                        <div>
                          <div className="text-white text-xs">
                            {bet.profile?.display_user_id || bet.user_id.slice(0, 8)}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            {bet.profile?.phone?.slice(-4) || "****"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 text-white font-medium">
                      {formatTaka(bet.bet_amount)}
                    </td>
                    <td className="text-center py-2 px-2 text-gray-400">
                      {bet.auto_cashout_multiplier ? `${bet.auto_cashout_multiplier}x` : "—"}
                    </td>
                    <td className="text-center py-2 px-2">
                      <Badge className={
                        bet.outcome === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        bet.outcome === "cashed_out" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }>
                        {bet.outcome}
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-2">
                      {bet.outcome === "cashed_out" ? (
                        <div className="flex items-center justify-end gap-1 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>{bet.cashout_multiplier?.toFixed(2)}x</span>
                          <span className="text-xs">({formatTaka(bet.win_amount || 0)})</span>
                        </div>
                      ) : bet.outcome === "crashed" ? (
                        <div className="flex items-center justify-end gap-1 text-red-400">
                          <TrendingDown className="w-3 h-3" />
                          <span>-{formatTaka(bet.bet_amount)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-2 text-gray-500 text-xs">
                      {new Date(bet.placed_at).toLocaleTimeString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {stats.liveBets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No active bets
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last update */}
      <div className="text-center text-gray-500 text-xs">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AdminAviatorLiveMonitor;
