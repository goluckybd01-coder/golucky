const BetCard = ({ 
  bet, index, getGameIcon, getStatusBadge, getStatusColor, formatBetValue, onViewDetails
}: { 
  bet: GameBet; index: number;
  getGameIcon: (type: string) => string;
  getStatusBadge: (status: string, result: string | null) => JSX.Element;
  getStatusColor: (status: string, result: string | null) => string;
  formatBetValue: (type: string, value: string) => string;
  onViewDetails: (bet: GameBet) => void;
}) => (
  <motion.div initial={{ opacity: 0, x: -30, rotateY: -10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ delay: index * 0.05, type: "spring", stiffness: 150 }} whileHover={{ scale: 1.01, x: 5 }} style={{ transformStyle: "preserve-3d" }}>
    <Premium3DCard className="p-5" glowColor={bet.result === "win" || bet.status === "won" ? "rgba(16,185,129,0.2)" : "rgba(20,184,166,0.15)"}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.15, rotate: 15 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-2xl border border-white/10"
            style={{ boxShadow: "0 8px 25px rgba(20,184,166,0.2)" }}>{getGameIcon(bet.game_type)}</motion.div>
          <div>
            <p className="text-white font-bold text-lg">{bet.game_type}</p>
            <p className="text-white/40 text-xs font-medium">{bet.game_mode}</p>
          </div>
        </div>
        {getStatusBadge(bet.status, bet.result)}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Bet", value: formatBetValue(bet.bet_type, bet.bet_value), color: "text-white" },
          { label: "Amount", value: `৳${bet.bet_amount.toFixed(2)}`, color: "text-amber-400" },
          { label: "Multiplier", value: `${bet.multiplier}x`, color: "text-cyan-400" },
          { label: "Payout", value: bet.result === "win" || bet.status === "won" ? `+৳${(bet.payout || 0).toFixed(2)}` : bet.result === "lose" || bet.status === "lost" ? `-৳${bet.bet_amount.toFixed(2)}` : `৳${bet.potential_win.toFixed(2)}`, color: getStatusColor(bet.status, bet.result) },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 + i * 0.05 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10" whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-white/40 text-xs font-medium mb-1">{item.label}</p>
            <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2"><Clock className="w-3 h-3" /><span>{format(new Date(bet.created_at), "dd MMM yyyy, HH:mm")}</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => onViewDetails(bet)} className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-medium text-xs">Details</button>
          <span className="font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">#{bet.trade_id.slice(-8)}</span>
        </div>
      </div>
    </Premium3DCard>
  </motion.div>
);

interface GameBet {
  id: string; game_type: string; game_mode: string; bet_type: string; bet_value: string;
  bet_amount: number; multiplier: number; potential_win: number; payout: number | null;
  status: string; result: string | null; trade_id: string; created_at: string; settled_at: string | null;
}

const GameHistory = () => {
  const navigate = useNavigate();
  const [bets, setBets] = useState<GameBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({ totalBets: 0, totalWon: 0, totalLost: 0, netProfit: 0 });
  const [selectedBet, setSelectedBet] = useState<GameBet | null>(null);
  const [showBetDetails, setShowBetDetails] = useState(false);
  
  const handleViewDetails = (bet: GameBet) => { setSelectedBet(bet); setShowBetDetails(true); };
  
  const convertToBetDetails = (bet: GameBet): BetDetails => {
    const isWin = bet.result === 'win' || bet.status === 'won';
    const isLose = bet.result === 'lose' || bet.status === 'lost';
    let duration = 1;
    if (bet.game_mode.includes('1min') || bet.game_mode.includes('1 min')) duration = 1;
    else if (bet.game_mode.includes('3min') || bet.game_mode.includes('3 min')) duration = 3;
    else if (bet.game_mode.includes('5min') || bet.game_mode.includes('5 min')) duration = 5;
    else if (bet.game_mode.includes('10min') || bet.game_mode.includes('10 min')) duration = 10;
    return {
      period: bet.trade_id, betType: `${bet.bet_type}: ${bet.bet_value}`, betAmount: bet.bet_amount,
      multiplier: bet.multiplier, potentialWin: bet.potential_win,
      result: isWin || isLose ? (isWin ? 1 : 0) : null, isWin: isWin ? true : isLose ? false : null,
      payout: bet.payout || 0, timestamp: new Date(bet.created_at), duration, roundKey: bet.trade_id,
    };
  };

  useEffect(() => { fetchBetHistory(); }, []);
  useEffect(() => { calculateStats(); }, [bets, activeTab]);

  const fetchBetHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("game_bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setBets(data || []);
    } catch (error) { console.error("Error fetching bet history:", error); }
    finally { setIsLoading(false); }
  };

  const calculateStats = () => {
    const filteredBets = activeTab === "all" ? bets : bets.filter(b => b.game_type.toLowerCase().replace(/\s+/g, '') === activeTab);
    const wonBets = filteredBets.filter(b => b.result === "win" || b.status === "won");
    const lostBets = filteredBets.filter(b => b.result === "lose" || b.status === "lost");
    const totalWon = wonBets.reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalLost = lostBets.reduce((sum, b) => sum + b.bet_amount, 0);
    setStats({ totalBets: filteredBets.length, totalWon, totalLost, netProfit: totalWon - totalLost });
  };

  const getFilteredBets = () => activeTab === "all" ? bets : bets.filter(b => b.game_type.toLowerCase().replace(/\s+/g, '') === activeTab);

  const getGameIcon = (gameType: string) => {
    const type = gameType.toLowerCase();
    if (type.includes("wingo") || type.includes("win go")) return "🎯";
    if (type.includes("k3")) return "🎲";
    if (type.includes("5d") || type.includes("fived")) return "🎰";
    if (type.includes("trx")) return "💎";
    if (type.includes("crash")) return "🚀";
    if (type.includes("mines")) return "💣";
    return "🎮";
  };

  const getStatusColor = (status: string, result: string | null) => {
    if (result === "win" || status === "won") return "text-emerald-400";
    if (result === "lose" || status === "lost") return "text-red-400";
    if (status === "pending") return "text-amber-400";
    return "text-gray-400";
  };

  const getStatusBadge = (status: string, result: string | null) => {
    if (result === "win" || status === "won") return (
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
        <Badge className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-400 border-emerald-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}><Trophy className="w-3.5 h-3.5 mr-1.5" /></motion.div>
          Won
        </Badge>
      </motion.div>
    );
    if (result === "lose" || status === "lost") return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <Badge className="bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-400 border-red-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">Lost</Badge>
      </motion.div>
    );
    if (status === "pending") return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <Badge className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-400 border-amber-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Pending</motion.span>
        </Badge>
      </motion.div>
    );
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 rounded-xl">{status}</Badge>;
  };

  const formatBetValue = (betType: string, betValue: string) => {
    if (betType === "number") return `Number: ${betValue}`;
    if (betType === "color") return `Color: ${betValue}`;
    if (betType === "size") return `Size: ${betValue}`;
    return `${betType}: ${betValue}`;
  };

  const gameFilters = [
    { value: "all", label: "All", icon: "📊" },
    { value: "wingo", label: "WinGo", icon: "🎯" },
    { value: "k3", label: "K3", icon: "🎲" },
    { value: "5d", label: "5D", icon: "🎰" },
    { value: "trxwin", label: "TRX", icon: "💎" },
    { value: "crash", label: "Crash", icon: "🚀" },
  ];

