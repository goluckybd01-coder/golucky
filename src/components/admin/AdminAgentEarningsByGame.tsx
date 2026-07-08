import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Gamepad2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface AgentEarning {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  game_type: string;
  total_bets: number;
  total_bet_amount: number;
  total_commission: number;
  player_count: number;
}

export function AdminAgentEarningsByGame() {
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  const { data: earnings, isLoading } = useQuery({
    queryKey: ["admin-agent-earnings-by-game", selectedGame, dateRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      let query = supabase
        .from("agent_commissions")
        .select(`
          agent_id,
          game_type,
          commission_amount,
          bet_amount,
          created_at,
          agents!inner(id, name, agent_code)
        `)
        .gte("created_at", daysAgo.toISOString());

      if (selectedGame !== "all") {
        query = query.eq("game_type", selectedGame);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by agent and game
      const aggregated: Record<string, AgentEarning> = {};
      
      data?.forEach((record: any) => {
        const key = `${record.agent_id}-${record.game_type}`;
        if (!aggregated[key]) {
          aggregated[key] = {
            agent_id: record.agent_id,
            agent_name: record.agents?.name || "Unknown",
            agent_code: record.agents?.agent_code || "N/A",
            game_type: record.game_type,
            total_bets: 0,
            total_bet_amount: 0,
            total_commission: 0,
            player_count: 0,
          };
        }
        aggregated[key].total_bets += 1;
        aggregated[key].total_bet_amount += record.bet_amount || 0;
        aggregated[key].total_commission += record.commission_amount || 0;
      });

      return Object.values(aggregated).sort((a, b) => b.total_commission - a.total_commission);
    },
  });

  const gameTypes = ["all", "wingo", "k3", "5d", "trx", "aviator", "crash", "dragon_tiger", "four_in_one"];

  const totalCommission = earnings?.reduce((sum, e) => sum + e.total_commission, 0) || 0;
  const totalBets = earnings?.reduce((sum, e) => sum + e.total_bet_amount, 0) || 0;
  const uniqueAgents = new Set(earnings?.map(e => e.agent_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Earnings by Game</h2>
          <p className="text-muted-foreground">Track agent commissions across different games</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
            <SelectContent>
              {gameTypes.map((game) => (
                <SelectItem key={game} value={game}>
                  {game === "all" ? "All Games" : game.replace("_", " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCommission)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bet Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBets)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Game Types</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(earnings?.map(e => e.game_type)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead className="text-right">Bets</TableHead>
                  <TableHead className="text-right">Bet Volume</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings?.map((earning, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{earning.agent_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{earning.agent_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{earning.game_type.replace("_", " ").toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{earning.total_bets}</TableCell>
                    <TableCell className="text-right">{formatCurrency(earning.total_bet_amount)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(earning.total_commission)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!earnings || earnings.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No earnings data found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
