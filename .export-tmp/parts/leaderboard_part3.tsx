  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] pb-24 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowingOrb className="w-[500px] h-[500px] bg-amber-500/20 -top-64 -left-64" />
        <GlowingOrb className="w-96 h-96 bg-orange-500/15 top-1/3 -right-48" />
        <GlowingOrb className="w-80 h-80 bg-purple-500/10 bottom-1/4 left-1/4" />
        
        {[...Array(15)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.4} 
            duration={10 + Math.random() * 5}
            x={Math.random() * 100}
          />
        ))}

        {[...Array(10)].map((_, i) => (
          <FloatingSparkle
            key={`sparkle-${i}`}
            delay={i * 0.6}
            x={Math.random() * 100}
            y={Math.random() * 100}
          />
        ))}

        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(251,146,60,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(251,146,60,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Premium Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/30 via-orange-500/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-purple-500/10" />
        
        <div className="relative px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10 backdrop-blur border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Trophy className="w-7 h-7 text-amber-400" />
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
                  Leaderboard
                </h1>
              </div>
            </div>
            {/* Live Status & Countdown */}
            <div className="flex items-center gap-2">
              <motion.div 
                className={`flex items-center gap-1.5 backdrop-blur px-3 py-1.5 rounded-full border ${
                  isRefreshing 
                    ? "bg-green-500/20 border-green-500/40" 
                    : "bg-white/10 border-white/20"
                }`}
                animate={isRefreshing ? { scale: [1, 1.1, 1] } : { scale: [1, 1.03, 1] }}
                transition={{ duration: isRefreshing ? 0.3 : 2, repeat: isRefreshing ? 0 : Infinity }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                </motion.div>
                <span className="text-green-400 text-xs font-bold">LIVE</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-1.5 bg-white/5 backdrop-blur px-2.5 py-1.5 rounded-full border border-white/10"
                animate={nextUpdate <= 5 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: nextUpdate <= 5 ? Infinity : 0 }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-green-400" : "text-white/60"}`} />
                <span className={`text-xs font-mono ${nextUpdate <= 10 ? "text-orange-400" : "text-white/60"}`}>
                  {nextUpdate}s
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="mt-4 flex items-end justify-center gap-3 pb-4">
          {/* 2nd Place */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 p-0.5 mb-2"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-2xl">🥈</span>
              </div>
            </motion.div>
            <div className="bg-gradient-to-t from-gray-400 to-gray-300 w-22 h-20 rounded-t-lg flex flex-col items-center justify-center px-2">
              <span className="text-white font-bold text-lg">2</span>
              <span className="text-white/90 text-[10px] truncate max-w-full">
                {topWinners[1]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[1]?.total_win}
                initial={{ scale: 1.2, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white/80 text-[10px] font-bold"
              >
                ৳{formatAmount(topWinners[1]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            className="flex flex-col items-center -mt-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <motion.div 
                className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 p-0.5 mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: "0 0 30px rgba(251, 191, 36, 0.5)" }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                  <span className="text-3xl">👑</span>
                </div>
              </motion.div>
              <motion.div 
                className="absolute -top-2 left-1/2 -translate-x-1/2"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </div>
            <div className="bg-gradient-to-t from-yellow-500 to-amber-400 w-28 h-24 rounded-t-lg flex flex-col items-center justify-center shadow-lg px-2">
              <span className="text-white font-bold text-xl">1</span>
              <span className="text-white/90 text-xs truncate max-w-full font-medium">
                {topWinners[0]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[0]?.total_win}
                initial={{ scale: 1.3, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white font-bold text-sm"
              >
                ৳{formatAmount(topWinners[0]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 p-0.5 mb-2"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-2xl">🥉</span>
              </div>
            </motion.div>
            <div className="bg-gradient-to-t from-amber-700 to-orange-600 w-22 h-18 rounded-t-lg flex flex-col items-center justify-center px-2">
              <span className="text-white font-bold text-lg">3</span>
              <span className="text-white/90 text-[10px] truncate max-w-full">
                {topWinners[2]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[2]?.total_win}
                initial={{ scale: 1.2, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white/80 text-[10px] font-bold"
              >
                ৳{formatAmount(topWinners[2]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Your Rank Banner */}
      {userRank && (
        <motion.div 
          className="mx-4 mt-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PremiumCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-white font-bold">Your Ranking</p>
                  <p className="text-white/50 text-sm">Keep playing to climb up!</p>
                </div>
              </div>
              <motion.span 
                className="text-3xl font-bold text-teal-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                #{userRank}
              </motion.span>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <PremiumCard className="p-1.5">
            <TabsList className="w-full bg-transparent border-0 p-0">
              <TabsTrigger
                value="winners"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Top Winners
              </TabsTrigger>
              <TabsTrigger
                value="vip"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Crown className="w-4 h-4 mr-1" />
                VIP Elite
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Flame className="w-4 h-4 mr-1" />
                Most Active
              </TabsTrigger>
            </TabsList>
          </PremiumCard>

          {/* Top Winners Tab */}
          <TabsContent value="winners" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              topWinners.map((entry, index) => renderWinnerCard(entry, index + 1, index))
            )}
          </TabsContent>

          {/* VIP Elite Tab */}
          <TabsContent value="vip" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              topVIP.map((entry, index) => renderVIPCard(entry, index + 1, index))
            )}
          </TabsContent>

          {/* Most Active Tab */}
          <TabsContent value="active" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              activePlayers.map((entry, index) => renderActiveCard(entry, index + 1, index))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Info Banner */}
      <motion.div 
        className="mx-4 mt-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PremiumCard className="p-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Star className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-white font-bold">Climb the Ranks!</p>
              <p className="text-white/50 text-sm">Play more games and increase your VIP level to appear on the leaderboard</p>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-5 h-5 text-white/40" />
            </motion.div>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
