import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Gamepad2, Search, Filter, MoreHorizontal, Eye, Ban, CheckCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Bet {
  id: string;
  user_id: string;
  game_type: string;
  amount: number;
  multiplier: number | null;
  payout: number | null;
  status: string;
  created_at: string;
}

export function GameAdminModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bets, isLoading } = useQuery({
    queryKey: ["admin-bets", gameFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (gameFilter !== "all") {
        query = query.eq("game_type", gameFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Bet[];
    },
  });

  const updateBetMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bets"] });
      toast.success("Bet status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredBets = bets?.filter(bet => 
    searchTerm === "" || bet.user_id.includes(searchTerm) || bet.id.includes(searchTerm)
  );

  const stats = {
    totalBets: bets?.length || 0,
    totalVolume: bets?.reduce((sum, b) => sum + b.amount, 0) || 0,
    totalPayout: bets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0,
    winRate: bets?.filter(b => b.status === "won").length / (bets?.length || 1) * 100 || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Game Administration</h2>
          <p className="text-muted-foreground">Manage bets and game activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalVolume.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPayout.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Recent Bets
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="crash">Crash</SelectItem>
                  <SelectItem value="aviator">Aviator</SelectItem>
                  <SelectItem value="mines">Mines</SelectItem>
                  <SelectItem value="dice">Dice</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBets?.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-mono text-xs">{bet.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{bet.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="capitalize">{bet.game_type}</TableCell>
                    <TableCell>${bet.amount.toFixed(2)}</TableCell>
                    <TableCell>{bet.multiplier ? `${bet.multiplier.toFixed(2)}x` : "-"}</TableCell>
                    <TableCell>{bet.payout ? `$${bet.payout.toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        bet.status === "won" ? "default" : 
                        bet.status === "lost" ? "destructive" : "secondary"
                      }>
                        {bet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateBetMutation.mutate({ id: bet.id, status: "cancelled" })}>
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel Bet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
