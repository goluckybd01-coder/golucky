import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Settings,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import GameAdminSidebar from '@/components/game-admin/GameAdminSidebar';
import { formatBDT } from '@/lib/agentConfig';

interface GameSetting {
  id: string;
  game_type: string;
  is_enabled: boolean;
  maintenance_mode: boolean;
  min_bet: number;
  max_bet: number;
  house_edge_percent: number;
}

interface GameStats {
  game_type: string;
  total_bets: number;
  total_volume: number;
  total_payout: number;
  profit: number;
  player_count: number;
}

const GAME_ICONS: Record<string, string> = {
  wingo: '🎯',
  k3: '🎲',
  '5d': '🏆',
  trxwin: '💎',
  crash: '🚀',
  mines: '💣',
  aviator: '✈️',
};

const GAME_COLORS: Record<string, string> = {
  wingo: 'from-orange-500 to-red-500',
  k3: 'from-blue-500 to-purple-500',
  '5d': 'from-yellow-500 to-orange-500',
  trxwin: 'from-cyan-500 to-blue-500',
  crash: 'from-red-500 to-pink-500',
  mines: 'from-green-500 to-emerald-500',
  aviator: 'from-purple-500 to-pink-500',
};

const GameAdminDashboard = () => {
  const [gameSettings, setGameSettings] = useState<GameSetting[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingGame, setUpdatingGame] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load game settings
      const { data: settings, error: settingsError } = await supabase
        .from('game_admin_settings')
        .select('*')
        .order('game_type');

      if (settingsError) throw settingsError;
      setGameSettings(settings || []);

      // Load game stats from game_bets
      const { data: bets, error: betsError } = await supabase
        .from('game_bets')
        .select('game_type, bet_amount, payout, user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!betsError && bets) {
        // Aggregate stats by game type
        const statsMap: Record<string, GameStats> = {};
        const playerMap: Record<string, Set<string>> = {};

        bets.forEach(bet => {
          const gt = bet.game_type.toLowerCase();
          if (!statsMap[gt]) {
            statsMap[gt] = {
              game_type: gt,
              total_bets: 0,
              total_volume: 0,
              total_payout: 0,
              profit: 0,
              player_count: 0,
            };
            playerMap[gt] = new Set();
          }
          statsMap[gt].total_bets++;
          statsMap[gt].total_volume += bet.bet_amount || 0;
          statsMap[gt].total_payout += bet.payout || 0;
          if (bet.user_id) playerMap[gt].add(bet.user_id);
        });

        Object.keys(statsMap).forEach(gt => {
          statsMap[gt].profit = statsMap[gt].total_volume - statsMap[gt].total_payout;
          statsMap[gt].player_count = playerMap[gt].size;
        });

        setGameStats(Object.values(statsMap));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGameEnabled = async (gameType: string, currentState: boolean) => {
    setUpdatingGame(gameType);
    try {
      const { error } = await supabase
        .from('game_admin_settings')
        .update({ is_enabled: !currentState })
        .eq('game_type', gameType);

      if (error) throw error;

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_admin_audit_logs').insert({
          admin_id: user.id,
          action: !currentState ? 'enable_game' : 'disable_game',
          game_type: gameType,
          old_value: { is_enabled: currentState },
          new_value: { is_enabled: !currentState },
        });
      }

      setGameSettings(prev =>
        prev.map(g =>
          g.game_type === gameType ? { ...g, is_enabled: !currentState } : g
        )
      );

      toast.success(`${gameType.toUpperCase()} ${!currentState ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      console.error('Error toggling game:', error);
      toast.error('Failed to update game status');
    } finally {
      setUpdatingGame(null);
    }
  };

  const toggleMaintenance = async (gameType: string, currentState: boolean) => {
    setUpdatingGame(gameType);
    try {
      const { error } = await supabase
        .from('game_admin_settings')
        .update({ maintenance_mode: !currentState })
        .eq('game_type', gameType);

      if (error) throw error;

      setGameSettings(prev =>
        prev.map(g =>
          g.game_type === gameType ? { ...g, maintenance_mode: !currentState } : g
        )
      );

      toast.success(`${gameType.toUpperCase()} maintenance mode ${!currentState ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast.error('Failed to update maintenance mode');
    } finally {
      setUpdatingGame(null);
    }
  };

  const getStatsForGame = (gameType: string) => {
    return gameStats.find(s => s.game_type === gameType);
  };

  // Calculate totals
  const totalVolume = gameStats.reduce((sum, g) => sum + g.total_volume, 0);
  const totalProfit = gameStats.reduce((sum, g) => sum + g.profit, 0);
  const totalBets = gameStats.reduce((sum, g) => sum + g.total_bets, 0);
  const totalPlayers = new Set(gameStats.flatMap(g => g.player_count)).size;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex">
        <GameAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <GameAdminSidebar />

      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-purple-400" />
            Game Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Monitor and manage all games from one place</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">24h Volume</p>
                    <p className="text-2xl font-bold text-white">{formatBDT(totalVolume)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-500/30' : 'from-red-500/10 to-pink-500/10 border-red-500/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">24h Profit</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalProfit >= 0 ? '+' : ''}{formatBDT(totalProfit)}
                    </p>
                  </div>
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Bets</p>
                    <p className="text-2xl font-bold text-white">{totalBets.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Games</p>
                    <p className="text-2xl font-bold text-white">
                      {gameSettings.filter(g => g.is_enabled).length}/{gameSettings.length}
                    </p>
                  </div>
                  <Gamepad2 className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {gameSettings.map((game, index) => {
            const stats = getStatsForGame(game.game_type);
            const profit = stats ? stats.profit : 0;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
                  {/* Header with game icon */}
                  <div className={`bg-gradient-to-r ${GAME_COLORS[game.game_type] || 'from-gray-600 to-gray-700'} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{GAME_ICONS[game.game_type] || '🎮'}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white uppercase">{game.game_type}</h3>
                          <div className="flex gap-2 mt-1">
                            {game.is_enabled ? (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" /> Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                Disabled
                              </Badge>
                            )}
                            {game.maintenance_mode && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Maintenance
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">24h Volume</p>
                        <p className="text-lg font-bold text-white">
                          {stats ? formatBDT(stats.total_volume) : '৳0'}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Profit</p>
                        <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{formatBDT(profit)}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Total Bets</p>
                        <p className="text-lg font-bold text-white">
                          {stats?.total_bets || 0}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">House Edge</p>
                        <p className="text-lg font-bold text-purple-400">
                          {game.house_edge_percent}%
                        </p>
                      </div>
                    </div>

                    {/* Bet Limits */}
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Bet Limits</p>
                      <p className="text-sm text-white">
                        ৳{game.min_bet} - ৳{game.max_bet.toLocaleString()}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={game.is_enabled}
                          onCheckedChange={() => toggleGameEnabled(game.game_type, game.is_enabled)}
                          disabled={updatingGame === game.game_type}
                        />
                        <span className="text-sm text-gray-400">
                          {game.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMaintenance(game.game_type, game.maintenance_mode)}
                        disabled={updatingGame === game.game_type}
                        className={game.maintenance_mode ? 'text-yellow-400' : 'text-gray-400'}
                      >
                        {updatingGame === game.game_type ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default GameAdminDashboard;
