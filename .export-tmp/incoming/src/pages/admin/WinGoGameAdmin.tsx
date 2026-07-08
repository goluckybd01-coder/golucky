import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, RefreshCw, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import GameAdminSidebar from "@/components/game-admin/GameAdminSidebar";
import CompactLiveResultControl from "@/components/admin/CompactLiveResultControl";
import CompactLiveBetsPanel from "@/components/admin/CompactLiveBetsPanel";
import { useAdminGameTimer } from "@/hooks/useAdminGameTimer";

const WinGoGameAdmin = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("30sec");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const {
    modes,
    countdowns,
    currentTradeId,
    currentPeriodNumber,
    currentCountdown,
    progress,
    phase,
    getCountdownDigits,
  } = useAdminGameTimer('wingo', activeMode);

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const digits = getCountdownDigits(currentCountdown);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <GameAdminSidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/game-admin")}
              className="text-gray-300 hover:text-white h-8 w-8"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base">WinGo Manager</h1>
                <p className="text-gray-400 text-[10px]">Real-time Bet Monitoring & Control</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-600 text-gray-400 text-[10px]">
              <Clock size={10} className="mr-1" />
              {format(lastRefresh, 'HH:mm:ss')}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-gray-600 text-gray-300 hover:text-white h-7 text-xs"
            >
              <RefreshCw size={12} className="mr-1" />
              Refresh
            </Button>
          </div>
        </header>

        <div className="p-3 space-y-3">
          {/* Game Mode Tabs */}
          <Tabs value={activeMode} onValueChange={setActiveMode}>
            <TabsList className="bg-gray-800 border border-gray-700 w-full h-9">
              {modes.map(mode => (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="flex-1 text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white relative"
                >
                  <span>{mode.label}</span>
                  {activeMode !== mode.id && countdowns[mode.id] <= 5 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {modes.map(mode => (
              <TabsContent key={mode.id} value={mode.id} className="space-y-3 mt-3">
                {/* Compact Timer Card */}
                <Card className={`border transition-all ${
                  phase === 'locked' 
                    ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/40' 
                    : 'bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border-teal-500/30'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Timer Display */}
                        <div className={`relative w-12 h-12 rounded-lg flex items-center justify-center ${
                          phase === 'locked' ? 'bg-amber-500/20' : 'bg-teal-500/20'
                        }`}>
                          {phase === 'locked' && (
                            <div className="absolute inset-0 rounded-lg border-2 border-amber-500 animate-pulse" />
                          )}
                          <Clock className={`h-6 w-6 ${phase === 'locked' ? 'text-amber-400' : 'text-teal-400'}`} />
                        </div>
                        
                        <div>
                          {phase === 'locked' && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-[10px] animate-pulse mb-1">
                              <AlertCircle size={8} className="mr-1" />
                              LOCKED
                            </Badge>
                          )}
                          {phase === 'revealing' && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-[10px] animate-pulse mb-1">
                              <Zap size={8} className="mr-1" />
                              REVEALING
                            </Badge>
                          )}
                          {/* Digital Clock */}
                          <div className="flex items-center gap-0.5">
                            <div className="bg-gray-900 rounded px-1.5 py-0.5 text-xl font-mono font-bold text-white">
                              {digits.min1}
                            </div>
                            <div className="bg-gray-900 rounded px-1.5 py-0.5 text-xl font-mono font-bold text-white">
                              {digits.min2}
                            </div>
                            <span className={`text-xl font-bold ${phase === 'locked' ? 'text-amber-400' : 'text-teal-400'} animate-pulse`}>:</span>
                            <div className={`bg-gray-900 rounded px-1.5 py-0.5 text-xl font-mono font-bold ${
                              phase === 'locked' ? 'text-amber-400' : 'text-white'
                            }`}>
                              {digits.sec1}
                            </div>
                            <div className={`bg-gray-900 rounded px-1.5 py-0.5 text-xl font-mono font-bold ${
                              phase === 'locked' ? 'text-amber-400' : 'text-white'
                            }`}>
                              {digits.sec2}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-gray-400 text-[10px]">Period</p>
                        <Badge className="bg-teal-500/20 text-teal-400 text-[10px] font-mono">
                          {currentPeriodNumber || '-'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <Progress 
                        value={progress} 
                        className={`h-1.5 ${phase === 'locked' ? 'bg-amber-900/50' : 'bg-gray-700'}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Side by Side: Live Result Control + Live Bets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Live Result Control */}
                  <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30">
                    <CardContent className="p-3">
                      <CompactLiveResultControl
                        gameType="wingo"
                        gameMode={mode.id}
                        currentTradeId={currentTradeId}
                        onResultSet={handleRefresh}
                      />
                    </CardContent>
                  </Card>

                  {/* Live Bets Panel */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-teal-400" />
                        <span className="text-white text-sm font-medium">Live Bets</span>
                        <Badge className="bg-green-500/20 text-green-400 animate-pulse text-[9px]">
                          LIVE
                        </Badge>
                      </div>
                      <CompactLiveBetsPanel
                        gameType="wingo"
                        gameMode={mode.id}
                        tradeId={currentTradeId}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WinGoGameAdmin;
