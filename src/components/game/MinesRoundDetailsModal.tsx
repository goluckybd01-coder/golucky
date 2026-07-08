import { motion, AnimatePresence } from 'framer-motion';
import { X, Bomb, Gem, TrendingUp, Clock, Hash, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MinesRoundDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: {
    id: string;
    bet_amount: number;
    mine_count: number;
    grid_size: number;
    revealed_tiles: number[];
    mine_positions: number[];
    multiplier: number;
    payout: number;
    profit: number;
    status: string;
    server_seed_hash: string;
    client_seed: string;
    nonce: number;
    created_at: string;
  } | null;
}

export function MinesRoundDetailsModal({ isOpen, onClose, round }: MinesRoundDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !round) return null;

  const gridSize = Math.sqrt(round.grid_size);
  const isWin = round.status === 'cashed_out';

  const copyRoundId = async () => {
    await navigator.clipboard.writeText(round.id);
    setCopied(true);
    toast.success('Round ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b border-border",
            isWin ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10" : "bg-gradient-to-r from-red-500/10 to-orange-500/10"
          )}>
            <div className="flex items-center gap-2">
              {isWin ? (
                <Gem className="w-5 h-5 text-green-400" />
              ) : (
                <Bomb className="w-5 h-5 text-red-400" />
              )}
              <h2 className="text-lg font-bold text-foreground">
                {isWin ? 'Cash Out' : 'Busted!'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Result Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground mb-1">Bet</div>
                <div className="font-bold text-foreground">${round.bet_amount.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground mb-1">Multiplier</div>
                <div className="font-bold text-primary">{round.multiplier.toFixed(2)}x</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground mb-1">Payout</div>
                <div className="font-bold text-green-400">${round.payout.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-xs text-muted-foreground mb-1">Profit</div>
                <div className={cn("font-bold", round.profit >= 0 ? "text-green-400" : "text-red-400")}>
                  {round.profit >= 0 ? '+' : ''}{round.profit.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Grid Visualization */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Bomb className="w-4 h-4" />
                {round.mine_count} Mines • {round.revealed_tiles.length} Revealed
              </div>
              <div 
                className="grid gap-1 p-3 rounded-lg bg-muted/30"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              >
                {Array.from({ length: round.grid_size }).map((_, index) => {
                  const isMine = round.mine_positions.includes(index);
                  const isRevealed = round.revealed_tiles.includes(index);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "aspect-square rounded-md flex items-center justify-center text-xs",
                        isMine && isRevealed && "bg-red-500/30 border border-red-500/50",
                        !isMine && isRevealed && "bg-green-500/30 border border-green-500/50",
                        isMine && !isRevealed && "bg-red-500/10 border border-red-500/20",
                        !isMine && !isRevealed && "bg-muted/50 border border-border/30"
                      )}
                    >
                      {isMine ? (
                        <Bomb className="w-3 h-3 text-red-400" />
                      ) : isRevealed ? (
                        <Gem className="w-3 h-3 text-green-400" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Provably Fair Info */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                Provably Fair
              </div>
              <div className="text-xs font-mono bg-muted/50 p-2 rounded-lg break-all">
                {round.server_seed_hash.slice(0, 32)}...
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Nonce: {round.nonce}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(round.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
            </div>

            {/* Round ID */}
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted/50 p-2 rounded-lg truncate">
                {round.id}
              </code>
              <Button variant="outline" size="icon" onClick={copyRoundId}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
