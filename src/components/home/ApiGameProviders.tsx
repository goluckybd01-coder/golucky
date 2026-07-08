import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Gamepad2, Star, Zap, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useApiGameControls } from '@/hooks/useApiGameControls';

interface GameProvider {
  id: string;
  provider_name: string;
  provider_code: string;
  logo_url: string | null;
  description: string | null;
  game_count?: number;
}

interface ApiGame {
  id: string;
  provider_id: string;
  game_name: string;
  game_code: string;
  game_type: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_new: boolean;
  provider?: GameProvider;
}

const PROVIDER_COLORS: Record<string, string> = {
  jili: 'from-yellow-500 to-amber-600',
  pg: 'from-purple-500 to-indigo-600',
  pragmatic: 'from-blue-500 to-cyan-600',
  fc: 'from-cyan-500 to-teal-600',
  cq9: 'from-red-500 to-orange-600',
  jdb: 'from-pink-500 to-rose-600',
  spade: 'from-gray-600 to-gray-800',
  bng: 'from-fuchsia-500 to-purple-600',
  default: 'from-primary to-purple-600',
};

export const ApiGameProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<GameProvider[]>([]);
  const [featuredGames, setFeaturedGames] = useState<ApiGame[]>([]);
  const [newGames, setNewGames] = useState<ApiGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filterGame, filterProvider } = useApiGameControls();
  const visibleProviders = providers.filter((p) => filterProvider(p as any));
  const visibleFeatured = featuredGames.filter((g) => filterGame(g as any));
  const visibleNew = newGames.filter((g) => filterGame(g as any));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: providersData } = await supabase
        .from('api_game_providers')
        .select('*')
        .eq('is_enabled', true)
        .order('provider_name');

      if (providersData) {
        const { data: gamesData } = await supabase
          .from('api_games')
          .select('provider_id')
          .eq('is_enabled', true);

        const gameCounts: Record<string, number> = {};
        gamesData?.forEach(g => {
          gameCounts[g.provider_id] = (gameCounts[g.provider_id] || 0) + 1;
        });

        const providersWithCounts = providersData.map(p => ({
          ...p,
          game_count: gameCounts[p.id] || 0,
        }));

        setProviders(providersWithCounts);
      }

      const { data: featuredData } = await supabase
        .from('api_games')
        .select(`
          *,
          api_game_providers (
            provider_name,
            provider_code,
            logo_url
          )
        `)
        .eq('is_enabled', true)
        .eq('is_featured', true)
        .limit(10);

      if (featuredData) {
        setFeaturedGames(featuredData.map(g => ({
          ...g,
          provider: g.api_game_providers as unknown as GameProvider
        })));
      }

      const { data: newData } = await supabase
        .from('api_games')
        .select(`
          *,
          api_game_providers (
            provider_name,
            provider_code,
            logo_url
          )
        `)
        .eq('is_enabled', true)
        .eq('is_new', true)
        .limit(10);

      if (newData) {
        setNewGames(newData.map(g => ({
          ...g,
          provider: g.api_game_providers as unknown as GameProvider
        })));
      }
    } catch (error) {
      console.error('Error loading API games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || (providers.length === 0 && featuredGames.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {visibleProviders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Game Providers
            </h2>
            <span className="text-gray-400 text-sm">{visibleProviders.length} Active</span>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {visibleProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`relative w-32 h-24 overflow-hidden cursor-pointer bg-gradient-to-br ${PROVIDER_COLORS[provider.provider_code] || PROVIDER_COLORS.default} border-0 hover:scale-105 transition-transform`}
                    onClick={() => navigate(`/games/${provider.provider_code}`)}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative h-full flex flex-col items-center justify-center p-2">
                      {provider.logo_url ? (
                        <img 
                          src={provider.logo_url} 
                          alt={provider.provider_name}
                          className="h-8 w-8 rounded-lg object-cover mb-1"
                        />
                      ) : (
                        <div className="text-2xl mb-1">🎮</div>
                      )}
                      <p className="text-white font-bold text-sm text-center truncate w-full">
                        {provider.provider_name}
                      </p>
                      <p className="text-white/70 text-xs">
                        {provider.game_count} games
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {visibleFeatured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Featured Games
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary"
              onClick={() => navigate('/games/all')}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {visibleFeatured.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  onClick={() => navigate(`/game/api/${game.provider?.provider_code}/${game.game_code}`)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {visibleNew.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-400" />
              New Games
            </h2>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {visibleNew.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  isNew
                  onClick={() => navigate(`/game/api/${game.provider?.provider_code}/${game.game_code}`)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

interface GameCardProps {
  game: ApiGame;
  index: number;
  isNew?: boolean;
  onClick: () => void;
}

const GameCard = ({ game, index, isNew, onClick }: GameCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="relative w-36 overflow-hidden cursor-pointer bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all group"
        onClick={onClick}
      >
        <div className="aspect-[4/3] overflow-hidden">
          {game.thumbnail_url ? (
            <img
              src={game.thumbnail_url}
              alt={game.game_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <span className="text-3xl">🎮</span>
            </div>
          )}
          
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            {isNew && (
              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
            )}
            {game.is_featured && (
              <Badge className="bg-yellow-500 text-black text-[10px] px-1.5 py-0">
                <Star className="h-2.5 w-2.5" />
              </Badge>
            )}
          </div>
        </div>
        
        <div className="p-2">
          <p className="text-white text-sm font-medium truncate">{game.game_name}</p>
          <p className="text-gray-400 text-xs truncate">{game.provider?.provider_name}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default ApiGameProviders;
