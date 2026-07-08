import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Bomb, Gem, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinesStatsPanelProps {
  stats: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalWagered: number;
    totalProfit: number;
    biggestWin: number;
    bestMultiplier: number;
    avgMultiplier: number;
  };
  className?: string;
}

export function MinesStatsPanel({ stats, className }: MinesStatsPanelProps) {
  const statItems = [
    {
      label: 'Total Games',
      value: stats.totalGames.toLocaleString(),
      icon: BarChart3,
      color: 'text-blue-400',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: stats.winRate >= 50 ? 'text-green-400' : 'text-orange-400',
    },
    {
      label: 'Total Profit',
      value: `$${stats.totalProfit.toFixed(2)}`,
      icon: stats.totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Biggest Win',
      value: `$${stats.biggestWin.toFixed(2)}`,
      icon: Gem,
      color: 'text-yellow-400',
    },
    {
      label: 'Best Multiplier',
      value: `${stats.bestMultiplier.toFixed(2)}x`,
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      label: 'Avg Multiplier',
      value: `${stats.avgMultiplier.toFixed(2)}x`,
      icon: Bomb,
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className={cn("bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4", className)}>
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Your Stats
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <item.icon className={cn("w-4 h-4", item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <div className={cn("text-lg font-bold", item.color)}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Win/Loss Bar */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Gem className="w-3 h-3 text-green-400" />
            {stats.totalWins} Wins
          </span>
          <span className="flex items-center gap-1">
            <Bomb className="w-3 h-3 text-red-400" />
            {stats.totalLosses} Losses
          </span>
        </div>
        <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.winRate}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}
