const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("winners");
  const [topWinners, setTopWinners] = useState<LeaderboardEntry[]>([]);
  const [topVIP, setTopVIP] = useState<LeaderboardEntry[]>([]);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdate, setNextUpdate] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update amounts with small random changes to simulate live updates
  const updateAmountsLive = useCallback(() => {
    setTopWinners(prev => prev.map(entry => ({
      ...entry,
      total_win: entry.total_win + Math.floor(Math.random() * 5000) - 1000,
      total_bet: entry.total_bet + Math.floor(Math.random() * 8000),
    })));
    
    setTopVIP(prev => prev.map(entry => ({
      ...entry,
      total_win: entry.total_win + Math.floor(Math.random() * 8000) - 2000,
      total_bet: entry.total_bet + Math.floor(Math.random() * 15000),
    })));
    
    setActivePlayers(prev => prev.map(entry => ({
      ...entry,
      weekly_games: entry.weekly_games + Math.floor(Math.random() * 5),
      weekly_won: entry.weekly_won + Math.floor(Math.random() * 3000) - 500,
    })));
    
    setLastUpdated(new Date());
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextUpdate(prev => {
        if (prev <= 1) {
          updateAmountsLive();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [updateAmountsLive]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const { data: winnersData } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .order("total_win", { ascending: false })
        .limit(50);

      const { data: vipData } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .order("vip_level", { ascending: false })
        .order("total_bet", { ascending: false })
        .limit(50);

      const { data: activeData } = await supabase
        .from("weekly_active_players")
        .select("*")
        .limit(50);

      setTopWinners(winnersData && winnersData.length > 0 ? winnersData : generateMockWinners());
      setTopVIP(vipData && vipData.length > 0 ? vipData : generateMockVIPPlayers());
      setActivePlayers(activeData && activeData.length > 0 ? activeData : generateMockActivePlayers());

      const { data: { user } } = await supabase.auth.getUser();
      if (user && winnersData) {
        const rank = winnersData.findIndex((entry: LeaderboardEntry) => 
          entry.profile_id === user.id
        );
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setTopWinners(generateMockWinners());
      setTopVIP(generateMockVIPPlayers());
      setActivePlayers(generateMockActivePlayers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const getVIPColor = (level: number): string => {
    const vipLevel = VIP_LEVELS.find(v => v.level === level);
    return vipLevel?.color || "from-amber-400 to-yellow-500";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ boxShadow: "0 0 20px rgba(251, 191, 36, 0.5)" }}
      >
        <Trophy className="w-5 h-5 text-white" />
      </motion.div>
    );
    if (rank === 2) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      >
        <Medal className="w-5 h-5 text-white" />
      </motion.div>
    );
    if (rank === 3) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      >
        <Medal className="w-5 h-5 text-white" />
      </motion.div>
    );
    return (
      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{rank}</span>
      </div>
    );
  };

  const renderWinnerCard = (entry: LeaderboardEntry, rank: number, index: number) => (
    <motion.div 
      key={entry.profile_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Users className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white font-medium`}>
            VIP{entry.vip_level}
          </span>
          <span className="text-xs text-white/50">Bet: ৳{formatAmount(entry.total_bet)}</span>
        </div>
      </div>

      <div className="text-right">
        <motion.p 
          className="text-lg font-bold text-green-400"
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ৳{formatAmount(entry.total_win)}
        </motion.p>
        <p className="text-xs text-white/40">Total Win</p>
      </div>
    </motion.div>
  );

  const renderVIPCard = (entry: LeaderboardEntry, rank: number, index: number) => (
    <motion.div 
      key={entry.profile_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Crown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <p className="text-xs text-white/50 mt-0.5">Total Bet: ৳{formatAmount(entry.total_bet)}</p>
      </div>

      <div className="text-right">
        <motion.span 
          className={`inline-flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white`}
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-4 h-4" />
          VIP{entry.vip_level}
        </motion.span>
      </div>
    </motion.div>
  );

  const renderActiveCard = (entry: ActivePlayer, rank: number, index: number) => (
    <motion.div 
      key={entry.user_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-orange-500/15 to-red-500/10 border-orange-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Flame className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white font-medium`}>
            VIP{entry.vip_level}
          </span>
          <span className="text-xs text-white/50">Won: ৳{formatAmount(entry.weekly_won)}</span>
        </div>
      </div>

      <div className="text-right">
        <motion.p 
          className="text-lg font-bold text-orange-400 flex items-center gap-1"
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4" />
          {entry.weekly_games}
        </motion.p>
        <p className="text-xs text-white/40">Games</p>
      </div>
    </motion.div>
  );
