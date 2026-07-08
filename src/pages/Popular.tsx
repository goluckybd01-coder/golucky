import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Crown, TrendingUp, Flame, Zap, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApiGameControls } from '@/hooks/useApiGameControls';

import crashGameLogo from '@/assets/games/crash-logo.png';
import minesGameLogo from '@/assets/games/mines-logo.png';
import aviatorGameLogo from '@/assets/games/aviator-logo.png';

interface ApiGame {
  id: string;
  game_code: string;
  game_name: string;
  thumbnail_url: string;
  is_featured: boolean;
  is_new: boolean;
  provider_code: string;
}

const Popular = () => {
  const navigate = useNavigate();
  const [apiGames, setApiGames] = useState<ApiGame[]>([]);
  const [loadingGame, setLoadingGame] = useState<string | null>(null);
  const { filterGame } = useApiGameControls();
  const visibleApiGames = apiGames.filter((g) => filterGame(g as any));

  const inHouseGames = [
    { id: 'crash', name: 'Crash Game', route: '/game/crash', logo: crashGameLogo, badge: 'HOT' },
    { id: 'mines', name: 'Mines', route: '/game/mines', logo: minesGameLogo, badge: 'NEW' },
    { id: 'aviator', name: 'Aviator', route: '/game/aviator', logo: aviatorGameLogo, badge: 'TOP' },
    { id: 'wingo', name: 'Win Go', route: '/game/win-go', badge: 'VIP' },
    { id: 'k3', name: 'K3 Lotre', route: '/game/k3' },
    { id: '5d', name: '5D Lotre', route: '/game/5d' },
  ];

  useEffect(() => {
    loadApiGames();
  }, []);

  const loadApiGames = async () => {
    try {
      const { data: providers } = await supabase
        .from('api_game_providers')
        .select('id, provider_code')
        .in('provider_code', ['pg', 'pp', 'am'])
        .eq('is_enabled', true);

      if (!providers) return;

      const providerIds = providers.map(p => p.id);
      const providerMap = Object.fromEntries(providers.map(p => [p.id, p.provider_code]));

      const { data: games } = await supabase
        .from('api_games')
        .select('id, game_code, game_name, thumbnail_url, is_featured, is_new, provider_id, maintenance_mode, vip_only, agent_only')
        .in('provider_id', providerIds)
        .eq('is_enabled', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(60);

      if (games) {
        setApiGames(games.map(g => ({
          ...g,
          provider_code: providerMap[g.provider_id] || 'pg',
          is_featured: g.is_featured || false,
          is_new: g.is_new || false,
          thumbnail_url: g.thumbnail_url || ''
        })));
      }
    } catch (error) {
      console.error('Error loading API games:', error);
    }
  };

  const handleApiGameClick = async (game: ApiGame) => {
    setLoadingGame(game.id);
    const gameWindow = window.open('about:blank', '_blank');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        gameWindow?.close();
        toast.error('Please login to play');
        navigate('/login');
        return;
      }
      
      const { data: result, error } = await supabase.functions.invoke('api-game-launch', {
        body: {
          provider_code: game.provider_code.toUpperCase(),
          game_code: game.game_code,
          lang: 'en',
          lobby_url: `${window.location.origin}/home`,
        },
      });
      
      if (error || !result?.success || !result?.url) {
        gameWindow?.close();
        toast.error(result?.error || 'Failed to launch game');
        return;
      }
      
      if (gameWindow) {
        gameWindow.location.href = result.url;
        toast.success('Game opened!');
      }
    } catch (err) {
      gameWindow?.close();
      toast.error('Failed to launch game');
    } finally {
      setLoadingGame(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-800 to-violet-800 border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors clickable"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="text-yellow-400" size={24} />
            <h1 className="text-xl font-bold text-white">Popular Games</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-yellow-400" size={20} />
              <span className="text-yellow-400 font-bold">Top Rated</span>
            </div>
            <span className="text-white/80 text-sm">1000+ Players Online</span>
          </div>
        </motion.div>

        <div>
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <Flame className="text-orange-400" size={18} />
            GoLucky Games
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {inHouseGames.map((game, i) => (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(game.route)}
                className="relative bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 hover:border-yellow-500/50 hover:scale-105 active:scale-95 transition-all clickable"
              >
                {game.badge && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-[9px] font-bold text-white rounded-full">
                    {game.badge}
                  </span>
                )}
                <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center overflow-hidden">
                  {game.logo ? (
                    <img src={game.logo} alt={game.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Star className="text-yellow-400" size={24} />
                  )}
                </div>
                <h3 className="text-white font-bold text-center text-xs">{game.name}</h3>
              </motion.button>
            ))}
          </div>
        </div>

        {visibleApiGames.length > 0 && (
          <div>
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <Crown className="text-yellow-400" size={18} />
              Provider Games
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {visibleApiGames.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleApiGameClick(game)}
                  disabled={loadingGame === game.id}
                  className="relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-yellow-500/50 hover:scale-105 active:scale-95 transition-all clickable group"
                >
                  {game.is_featured && (
                    <span className="absolute top-1.5 left-1.5 z-10 p-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">
                      <Star size={10} className="text-white" fill="white" />
                    </span>
                  )}
                  {game.is_new && !game.is_featured && (
                    <span className="absolute top-1.5 left-1.5 z-10 p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                      <Zap size={10} className="text-white" />
                    </span>
                  )}
                  <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-[8px] font-bold text-white rounded-full uppercase">
                    {game.provider_code}
                  </span>
                  <div className="aspect-square">
                    <img 
                      src={game.thumbnail_url} 
                      alt={game.game_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f97316" width="100" height="100"/><text x="50" y="55" text-anchor="middle" font-size="40">🎰</text></svg>';
                      }}
                    />
                    {loadingGame === game.id && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-white font-bold text-center text-[10px] line-clamp-1 uppercase">{game.game_name}</h3>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;
