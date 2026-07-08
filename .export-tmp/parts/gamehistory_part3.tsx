  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 50%)` }} />
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (<FloatingParticle key={i} delay={i * 0.5} size={Math.random() * 10 + 6} left={`${Math.random() * 100}%`} duration={Math.random() * 6 + 10} />))}
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (<FloatingSparkle key={i} delay={i * 0.8} x={`${10 + Math.random() * 80}%`} y={`${10 + Math.random() * 80}%`} />))}
      </div>
      <GlowingOrb className="w-[500px] h-[500px] -top-64 -right-64" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
      <GlowingOrb className="w-80 h-80 top-1/3 -left-40" color="radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" />
      <GlowingOrb className="w-96 h-96 bottom-10 right-0" color="radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)" />

      <div className="relative pt-6 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 via-teal-600/10 to-transparent" />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute" style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}>
            <Star className="w-3 h-3 text-yellow-300/60" />
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }} className="relative z-10 flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-sm" style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}>
            <ArrowLeft size={22} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <motion.div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ boxShadow: "0 8px 25px rgba(20,184,166,0.4)" }}>
                <History size={20} className="text-white" />
              </motion.div>
              Game History
            </h1>
            <p className="text-white/50 text-sm mt-1">View your betting records</p>
          </div>
          <motion.div animate={{ y: [-3, 3, -3], rotate: [0, 360] }} transition={{ y: { duration: 2, repeat: Infinity }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}>
            <Sparkles size={24} className="text-cyan-400" />
          </motion.div>
        </motion.div>
      </div>

      <div className="px-4 py-4 relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <StatCard3D icon={Gamepad2} label="Total Bets" value={stats.totalBets.toString()} color="bg-gradient-to-br from-teal-500 to-cyan-600" delay={0.1} />
          <StatCard3D icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit" value={`${stats.netProfit >= 0 ? "+" : ""}৳${stats.netProfit.toFixed(2)}`}
            color={stats.netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-red-500 to-rose-600"} delay={0.2} />
          <StatCard3D icon={Trophy} label="Total Won" value={`৳${stats.totalWon.toFixed(2)}`} color="bg-gradient-to-br from-emerald-500 to-teal-600" delay={0.3} />
          <StatCard3D icon={Target} label="Total Lost" value={`৳${stats.totalLost.toFixed(2)}`} color="bg-gradient-to-br from-red-500 to-pink-600" delay={0.4} />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Premium3DCard className="p-2 mb-5" delay={0.5}>
              <TabsList className="w-full bg-transparent grid grid-cols-6 gap-1">
                {gameFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value}
                    className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/30 text-xs py-3 rounded-xl transition-all data-[state=inactive]:text-white/60">
                    <span className="mr-1">{filter.icon}</span><span className="hidden sm:inline">{filter.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Premium3DCard>
          </motion.div>
          <TabsContent value={activeTab} className="mt-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-teal-500/30 border-t-teal-500" />
                  <p className="text-white/50 mt-4 font-medium">Loading history...</p>
                </motion.div>
              ) : getFilteredBets().length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
                  <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-5 border border-white/10" style={{ boxShadow: "0 15px 40px rgba(20,184,166,0.2)" }}>
                    <History className="w-12 h-12 text-teal-400/50" />
                  </motion.div>
                  <p className="text-xl font-bold text-white">No bet history</p>
                  <p className="text-white/50 mt-2">Start playing to see your history here!</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {getFilteredBets().map((bet, index) => (
                    <BetCard key={bet.id} bet={bet} index={index} getGameIcon={getGameIcon} getStatusBadge={getStatusBadge}
                      getStatusColor={getStatusColor} formatBetValue={formatBetValue} onViewDetails={handleViewDetails} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
      {selectedBet && (
        <BetDetailsModal open={showBetDetails} onOpenChange={setShowBetDetails} bet={convertToBetDetails(selectedBet)} gameType={selectedBet.game_type} />
      )}
    </div>
  );
};

export default GameHistory;
