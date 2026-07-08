import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Star, Zap, Loader2, Play, Info, Filter, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';
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
  rtp_percent: number | null;
  launch_url: string | null;
  demo_url: string | null;
}

const GAME_TYPE_ICONS: Record<string, string> = {
  slot: '🎰',
  table: '🃏',
  live: '🎥',
  fishing: '🐟',
  arcade: '🕹️',
  poker: '♠️',
  sports: '⚽',
  lottery: '🎱',
};

const PROVIDER_COLORS: Record<string, string> = {
  jili: 'from-yellow-500 to-amber-600',
  pg: 'from-purple-500 to-indigo-600',
  pragmatic: 'from-blue-500 to-cyan-600',
  fc: 'from-cyan-500 to-teal-600',
  cq9: 'from-red-500 to-orange-600',
  jdb: 'from-pink-500 to-rose-600',
  spade: 'from-gray-600 to-gray-800',
  bng: 'from-fuchsia-500 to-purple-600',
};

const ProviderGames = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAllProviders = providerId === 'all';
  
  const [provider, setProvider] = useState<GameProvider | null>(null);
  const [allProviders, setAllProviders] = useState<GameProvider[]>([]);
  const [games, setGames] = useState<ApiGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [gameTypes, setGameTypes] = useState<string[]>([]);
  const { filterGame, filterProvider } = useApiGameControls();

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    try {
      // /games/all -> show all providers (and let user open each provider's games)
      if (isAllProviders) {
        setProvider(null);
        setGames([]);
        setGameTypes([]);
        setSelectedType('all');

        const { data: providersData } = await supabase
          .from('api_game_providers')
          .select('*')
          .eq('is_enabled', true)
          .order('provider_name');

        const { data: gamesData } = await supabase
          .from('api_games')
          .select('provider_id')
          .eq('is_enabled', true);

        const gameCounts: Record<string, number> = {};
        gamesData?.forEach((g) => {
          gameCounts[g.provider_id] = (gameCounts[g.provider_id] || 0) + 1;
        });

        const providersWithCounts = (providersData || []).map((p) => ({
          ...p,
          game_count: gameCounts[p.id] || 0,
        }));

        setAllProviders(providersWithCounts);
        return;
      }

      // Load provider
      const { data: providerData } = await supabase
        .from('api_game_providers')
        .select('*')
        .eq('provider_code', providerId)
        .eq('is_enabled', true)
        .single();

      if (!providerData) {
        navigate('/home');
        return;
      }

      setProvider(providerData);

      // Load games
      const { data: gamesData } = await supabase
        .from('api_games')
        .select('*')
        .eq('provider_id', providerData.id)
        .eq('is_enabled', true)
        .order('is_featured', { ascending: false })
        .order('sort_order');

      if (gamesData) {
        setGames(gamesData);
        // Extract unique game types
        const types = [...new Set(gamesData.map(g => g.game_type))];
        setGameTypes(types);
      }
    } catch (error) {
      console.error('Error loading provider games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    if (!filterGame(game as any)) return false;
    const matchesSearch = game.game_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || game.game_type === selectedType;
    return matchesSearch && matchesType;
  });
  const visibleAllProviders = allProviders.filter((p) => filterProvider(p as any));

  const featuredGames = filteredGames.filter(g => g.is_featured);
  const regularGames = filteredGames.filter(g => !g.is_featured);

  const handlePlayGame = (game: ApiGame) => {
    navigate(`/game/api/${provider?.provider_code}/${game.game_code}`);
  };

  const gradientClass = provider ? PROVIDER_COLORS[provider.provider_code] || 'from-purple-500 to-indigo-600' : 'from-purple-500 to-indigo-600';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // /games/all view
  if (isAllProviders) {
    const filteredProviders = visibleAllProviders.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.provider_name.toLowerCase().includes(q) ||
        p.provider_code.toLowerCase().includes(q)
      );
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black pb-24">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-primary/70 py-6 px-4">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">All Game Providers</h1>
                <p className="text-white/70 text-sm">{visibleAllProviders.length} Providers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search providers..."
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No providers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredProviders.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    layout
                  >
                    <Card
                      className={`group relative overflow-hidden bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all cursor-pointer`}
                      onClick={() => navigate(`/games/${p.provider_code}`)}
                    >
                      <div className="p-4 flex items-center gap-3">
                        {p.logo_url ? (
                          <img
                            src={p.logo_url}
                            alt={p.provider_name}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                            🎮
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold truncate">{p.provider_name}</p>
                          <p className="text-xs text-gray-400 truncate">{p.game_count || 0} games</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black pb-24">
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${gradientClass} py-6 px-4`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {provider?.logo_url ? (
                <img 
                  src={provider.logo_url} 
                  alt={provider.provider_name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  🎮
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{provider?.provider_name}</h1>
                <p className="text-white/70 text-sm">{games.length} Games Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
          
          {gameTypes.length > 1 && (
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList className="bg-gray-800/50 w-full flex overflow-x-auto">
                <TabsTrigger value="all" className="flex-shrink-0">
                  All
                </TabsTrigger>
                {gameTypes.map(type => (
                  <TabsTrigger key={type} value={type} className="flex-shrink-0 capitalize">
                    {GAME_TYPE_ICONS[type] || '🎮'} {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Featured Games
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {featuredGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    onPlay={() => handlePlayGame(game)}
                    featured
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* All Games */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {selectedType === 'all' ? 'All Games' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Games`}
            <Badge variant="secondary" className="ml-2">{regularGames.length}</Badge>
          </h2>
          
          {regularGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No games found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {regularGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    onPlay={() => handlePlayGame(game)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

interface GameCardProps {
  game: ApiGame;
  index: number;
  onPlay: () => void;
  featured?: boolean;
}

const GameCard = ({ game, index, onPlay, featured }: GameCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      layout
    >
      <Card 
        className={`group relative overflow-hidden bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all cursor-pointer ${featured ? 'ring-2 ring-yellow-500/30' : ''}`}
        onClick={onPlay}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {game.thumbnail_url ? (
            <img
              src={game.thumbnail_url}
              alt={game.game_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <span className="text-4xl">{GAME_TYPE_ICONS[game.game_type] || '🎮'}</span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4 mr-1" />
              Play Now
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {game.is_new && (
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">NEW</Badge>
            )}
            {featured && (
              <Badge className="bg-yellow-500 text-black text-xs px-1.5 py-0.5">
                <Star className="h-3 w-3" />
              </Badge>
            )}
          </div>

          {/* RTP */}
          {game.rtp_percent && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-black/60">
                RTP {game.rtp_percent}%
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2">
          <h3 className="font-medium text-white text-sm truncate">{game.game_name}</h3>
          <p className="text-xs text-gray-400 capitalize">{game.game_type}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProviderGames;
