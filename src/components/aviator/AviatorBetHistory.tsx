import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Clock, BarChart3, Circle } from "lucide-react";
import { formatTaka } from "@/lib/currency";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Scatter,
  ComposedChart,
  Line
} from "recharts";

export interface BetHistoryEntry {
  id: string;
  roundId: string;
  stake: number;
  outcome: 'win' | 'loss' | 'pending';
  multiplier: number | null;
  crashPoint: number;
  payout: number;
  profit: number;
  timestamp: Date;
}

interface AviatorBetHistoryProps {
  history: BetHistoryEntry[];
}

const BetMarkerDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const isWin = payload.outcome === 'win';
  const color = isWin ? '#2ECC71' : '#ef4444';
  const size = Math.min(6, 3 + Math.abs(payload.singleProfit) / 100);
  return (
    <g>
      <circle cx={cx} cy={cy} r={size + 2} fill={color} opacity={0.3} />
      <circle cx={cx} cy={cy} r={size} fill={color} stroke="#1a1a1a" strokeWidth={1} />
      {isWin && <circle cx={cx - size/3} cy={cy - size/3} r={size/3} fill="white" opacity={0.5} />}
    </g>
  );
};

const AviatorBetHistory = ({ history }: AviatorBetHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [showChart, setShowChart] = useState(true);
  const filteredHistory = history.filter(entry => {
    if (filter === 'wins') return entry.outcome === 'win';
    if (filter === 'losses') return entry.outcome === 'loss';
    return true;
  });
  const totalBets = history.length;
  const wins = history.filter(e => e.outcome === 'win').length;
  const losses = history.filter(e => e.outcome === 'loss').length;
  const totalProfit = history.reduce((sum, e) => sum + e.profit, 0);
  const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
  const bestWin = history.filter(e => e.outcome === 'win').reduce((max, e) => Math.max(max, e.payout), 0);
  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    const reversed = [...history].reverse();
    let cumulative = 0;
    return reversed.map((entry, index) => {
      cumulative += entry.profit;
      return { bet: index + 1, profit: cumulative, outcome: entry.outcome, singleProfit: entry.profit, multiplier: entry.multiplier, stake: entry.stake };
    });
  }, [history]);
  const chartMin = useMemo(() => chartData.length === 0 ? 0 : Math.min(0, ...chartData.map(d => d.profit)), [chartData]);
  const chartMax = useMemo(() => chartData.length === 0 ? 100 : Math.max(100, ...chartData.map(d => d.profit)), [chartData]);
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#2d2d2d] border border-gray-700 rounded-lg px-2.5 py-2 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${data.outcome === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-300 font-medium">Bet #{data.bet}</span>
          </div>
          <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Stake:</span><span className="text-white">{formatTaka(data.stake)}</span></div>
          {data.outcome === 'win' && data.multiplier && (
            <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Cashout:</span><span className="text-green-400">{data.multiplier.toFixed(2)}x</span></div>
          )}
          <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-gray-700">
            <span className="text-gray-500">Result:</span>
            <span className={`font-bold ${data.singleProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{data.singleProfit >= 0 ? '+' : ''}{formatTaka(data.singleProfit)}</span>
          </div>
        </div>
      );
    }
    return null;
  };
  if (history.length === 0) return null;
  return (
    <div className="mx-2 mb-2">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-[#1a1a1a] rounded-xl px-3 py-2 flex items-center justify-between border border-gray-800/50">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">My Bets</span>
          <span className="text-xs text-gray-500">({totalBets})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-400">{wins}W</span><span className="text-gray-600">/</span><span className="text-red-400">{losses}L</span>
          </div>
          <div className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalProfit >= 0 ? '+' : ''}{formatTaka(totalProfit)}</div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="bg-[#1a1a1a] rounded-b-xl border-x border-b border-gray-800/50 -mt-2 pt-4">
              <div className="grid grid-cols-4 gap-2 px-3 pb-3">
                <div className="bg-[#2d2d2d] rounded-lg p-2 text-center"><div className="text-xs text-gray-400">Win Rate</div><div className="text-sm font-bold text-white">{winRate.toFixed(1)}%</div></div>
                <div className="bg-[#2d2d2d] rounded-lg p-2 text-center"><div className="text-xs text-gray-400">Total Bets</div><div className="text-sm font-bold text-white">{totalBets}</div></div>
                <div className="bg-[#2d2d2d] rounded-lg p-2 text-center"><div className="text-xs text-gray-400">Best Win</div><div className="text-sm font-bold text-green-400">{formatTaka(bestWin)}</div></div>
                <div className="bg-[#2d2d2d] rounded-lg p-2 text-center"><div className="text-xs text-gray-400">P/L</div><div className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalProfit >= 0 ? '+' : ''}{formatTaka(totalProfit)}</div></div>
              </div>
              {chartData.length >= 2 && (
                <div className="px-3 pb-3">
                  <button onClick={() => setShowChart(!showChart)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-2">
                    <BarChart3 className="w-3.5 h-3.5" /><span>{showChart ? 'Hide' : 'Show'} P/L Chart</span>
                    {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <AnimatePresence>
                    {showChart && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 140, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-[#2d2d2d] rounded-lg p-2 overflow-hidden">
                        <ResponsiveContainer width="100%" height={110}>
                          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis dataKey="bet" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} domain={[chartMin - 20, chartMax + 20]} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" strokeWidth={1} />
                            <Area type="monotone" dataKey="profit" stroke="none" fill={totalProfit >= 0 ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.3)'} />
                            <Line type="monotone" dataKey="profit" stroke={totalProfit >= 0 ? '#2ECC71' : '#ef4444'} strokeWidth={2} dot={<BetMarkerDot />} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className="flex gap-1 px-3 pb-2">
                {(['all', 'wins', 'losses'] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30' : 'bg-[#2d2d2d] text-gray-400 border border-transparent hover:bg-[#3d3d3d]'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1.5">
                {filteredHistory.slice(0, 20).map((entry, index) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between p-2 rounded-lg ${entry.outcome === 'win' ? 'bg-green-900/20 border border-green-800/30' : entry.outcome === 'loss' ? 'bg-red-900/20 border border-red-800/30' : 'bg-gray-800/30 border border-gray-700/30'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${entry.outcome === 'win' ? 'bg-green-600/30' : entry.outcome === 'loss' ? 'bg-red-600/30' : 'bg-gray-600/30'}`}>
                        {entry.outcome === 'win' ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : entry.outcome === 'loss' ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5"><span className="text-xs font-medium text-white">{formatTaka(entry.stake)}</span></div>
                        <div className="text-[10px] text-gray-500">Crash: {entry.crashPoint.toFixed(2)}x</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${entry.outcome === 'win' ? 'text-green-400' : 'text-red-400'}`}>{entry.profit >= 0 ? '+' : ''}{formatTaka(entry.profit)}</div>
                      <div className="text-[10px] text-gray-500">#{entry.roundId.slice(-6)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AviatorBetHistory;
