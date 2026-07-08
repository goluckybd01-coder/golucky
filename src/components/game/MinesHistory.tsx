import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gem, Bomb, TrendingUp, Clock, ChevronDown, ChevronUp, Eye, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getGridLabel } from "@/lib/minesEngine";
import { Button } from "@/components/ui/button";
import { MinesRoundDetailsModal } from "./MinesRoundDetailsModal";

interface MinesRound {
  id: string;
  grid_size: number;
  mine_count: number;
  bet_amount: number;
  current_multiplier: number;
  final_payout: number | null;
  tax_amount: number | null;
  net_amount: number | null;
  status: string;
  outcome: string | null;
  revealed_positions: number[];
  picked_tiles_sequence: number[] | null;
  mine_positions: number[];
  seed_hash: string;
  server_seed: string | null;
  client_seed: string | null;
  nonce: number;
  safe_picks: number;
  difficulty: string;
  created_at: string;
  ended_at: string | null;
}

export const MinesHistory = () => {
  const [rounds, setRounds] = useState<MinesRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRound, setSelectedRound] = useState<MinesRound | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('mines_rounds')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setRounds(data as MinesRound[]);
    }
    setIsLoading(false);
  };

  const openRoundDetails = (round: MinesRound) => {
    setSelectedRound(round);
    setIsModalOpen(true);
  };

  const displayedRounds = isExpanded ? rounds : rounds.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-1/3" />
          <div className="h-12 bg-slate-700 rounded" />
          <div className="h-12 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-medium text-sm">Game History</span>
        </div>
        <p className="text-slate-500 text-sm text-center py-4">No games played yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-medium text-sm">Game History</span>
          </div>
          <span className="text-slate-500 text-xs">{rounds.length} games</span>
        </div>

        <div className="space-y-2">
          {displayedRounds.map((round) => {
            const isWin = round.status === 'won' || round.status === 'cashed_out';
            const profit = isWin ? (round.net_amount || 0) - round.bet_amount : -round.bet_amount;

            return (
              <div
                key={round.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:opacity-80",
                  isWin
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}
                onClick={() => openRoundDetails(round)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isWin ? "bg-emerald-500/20" : "bg-red-500/20"
                  )}>
                    {isWin ? (
                      <Gem className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Bomb className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">
                        {getGridLabel(round.grid_size as 9 | 25 | 49)}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {round.mine_count} mines
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{round.safe_picks || round.revealed_positions?.length || 0} picks</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(round.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {isWin && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      <span className={cn(
                        "font-bold text-sm",
                        isWin ? "text-emerald-400" : "text-red-400"
                      )}>
                        {profit >= 0 ? '+' : ''}৳{profit.toFixed(2)}
                      </span>
                    </div>
                    {isWin && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span>{round.current_multiplier?.toFixed(2)}x</span>
                        {round.tax_amount && round.tax_amount > 0 && (
                          <>
                            <Receipt className="w-3 h-3" />
                            <span className="text-amber-400">-৳{round.tax_amount.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRoundDetails(round);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {rounds.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show More ({rounds.length - 5} more) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      <MinesRoundDetailsModal
        round={selectedRound}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRound(null);
        }}
      />
    </>
  );
};
