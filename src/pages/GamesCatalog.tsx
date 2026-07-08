import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Play, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { useApiGameControls } from '@/hooks/useApiGameControls';

import GamesHeroSection from '@/components/games/GamesHeroSection';
import GamesDesktop from './GamesDesktop';
import GamesMobile from './GamesMobile';


interface Provider {
  id: string;
  provider_code: string;
  provider_name: string;
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
  maintenance_mode?: boolean | null;
  vip_only?: boolean | null;
  agent_only?: boolean | null;
}

const TYPE_ICONS: Record<string, string> = {
  slot: '🎰', table: '🃏', live: '🎥', fishing: '🐟',
  arcade: '🕹️', poker: '♠️', sports: '⚽', lottery: '🎱',
};

type CategoryKey = 'all' | 'featured' | 'new' | string;

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '▦' },
  { key: 'featured', label: 'Featured', emoji: '⭐' },
  { key: 'new', label: 'New', emoji: '🆕' },
  { key: 'slot', label: 'Slots', emoji: '🎰' },
  { key: 'live', label: 'Live', emoji: '🎥' },
  { key: 'table', label: 'Table', emoji: '🃏' },
  { key: 'fishing', label: 'Fishing', emoji: '🐟' },
  { key: 'arcade', label: 'Arcade', emoji: '🕹️' },
  { key: 'poker', label: 'Poker', emoji: '♠️' },
  { key: 'sports', label: 'Sports', emoji: '⚽' },
  { key: 'lottery', label: 'Lottery', emoji: '🎱' },
];

const CATEGORY_STORAGE_KEY = 'golucky:games:category';

export default function GamesCatalog() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterGame } = useApiGameControls();

  // Restore saved category on first mount when no `c` param is present.
  useEffect(() => {
    if (params.get('c')) return;
    try {
      const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (saved) {
        const next = new URLSearchParams(params);
        next.set('c', saved);
        setParams(next, { replace: true });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = (params.get('c') as CategoryKey) || 'all';
  const providerCode = params.get('p') || 'all';
  const search = params.get('q') || '';

  // Persist category whenever it changes in the URL.
  useEffect(() => {
    try {
      if (params.get('c')) localStorage.setItem(CATEGORY_STORAGE_KEY, category);
    } catch {}
  }, [category, params]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: provs }, { data: gs }] = await Promise.all([
          supabase
            .from('api_game_providers')
            .select('id, provider_code, provider_name')
            .eq('is_enabled', true)
            .order('provider_name'),
          supabase
            .from('api_games')
            .select(
              'id, provider_id, game_name, game_code, game_type, thumbnail_url, is_featured, is_new, rtp_percent, maintenance_mode, vip_only, agent_only'
            )
            .eq('is_enabled', true)
            .order('is_featured', { ascending: false })
            .order('sort_order'),
        ]);
        setProviders(provs || []);
        setGames(gs || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const providerById = useMemo(() => {
    const m: Record<string, Provider> = {};
    providers.forEach((p) => (m[p.id] = p));
    return m;
  }, [providers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter((g) => {
      if (!filterGame(g as any)) return false;
      if (category === 'featured' && !g.is_featured) return false;
      else if (category === 'new' && !g.is_new) return false;
      else if (!['all', 'featured', 'new'].includes(category) && g.game_type !== category)
        return false;

      if (providerCode !== 'all' && providerById[g.provider_id]?.provider_code !== providerCode)
        return false;

      if (q && !g.game_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [games, category, providerCode, search, providerById, filterGame]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Show catalog only when the user has actively filtered (from hero card, search, or provider)
  const hasFilter =
    params.has('c') || params.has('p') || (params.get('q')?.trim().length ?? 0) > 0;

  return (
    <>
      {/* Desktop: premium Games lobby matching the Home Page design language */}
      <div className="hidden lg:block">
        <GamesDesktop />
      </div>

      {/* Mobile/Tablet: pixel-mirror of the reference Games layout */}
      <div className="lg:hidden">
        <GamesMobile />
      </div>

      {/* Legacy hero + filterable catalog (kept for direct ?c= filter deep links on mobile only) */}
      <div className="hidden">
        <GamesHeroSection
          activeCategory={params.get('c') || undefined}
          onCategorySelect={(key) => {
            const next = new URLSearchParams(params);
            next.set('c', key);
            setParams(next, { replace: true });
          }}
        />
        {hasFilter && (

          <div className="mt-4">
            {/* Filters */}
            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-amber-500/20 px-4 py-3 space-y-3">
              <div className="max-w-7xl mx-auto space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setParam('q', e.target.value)}
                      placeholder="Search games..."
                      className="pl-10 bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <Select value={providerCode} onValueChange={(v) => setParam('p', v)}>
                    <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.provider_code}>
                          {p.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setParams(new URLSearchParams(), { replace: true })}
                    className="border-amber-500/40 text-amber-300"
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((c) => {
                    const active = category === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setParam('c', c.key)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                          active
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-gray-900/60 text-gray-300 border-gray-700 hover:border-amber-500/50'
                        }`}
                      >
                        <span className="mr-1">{c.emoji}</span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4 py-6">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700/60"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900" />
                      <div className="p-2 space-y-2">
                        <div className="h-3 rounded bg-gray-700/70 w-3/4" />
                        <div className="h-2 rounded bg-gray-800 w-1/2" />
                      </div>
                      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  No games match your filters.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filtered.map((game) => {
                    const provider = providerById[game.provider_id];
                    return (
                      <Card
                        key={game.id}
                        onClick={() =>
                          navigate(`/game/api/${provider?.provider_code}/${game.game_code}`)
                        }
                        className="group relative overflow-hidden bg-gray-900/50 border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {game.thumbnail_url ? (
                            <img
                              src={game.thumbnail_url}
                              alt={game.game_name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl">
                              {TYPE_ICONS[game.game_type] || '🎮'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
                              <Play className="h-4 w-4 mr-1" /> Play
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2 flex gap-1">
                            {game.is_new && (
                              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">NEW</Badge>
                            )}
                            {game.is_featured && (
                              <Badge className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5">
                                <Star className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-white text-sm font-medium truncate">{game.game_name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {provider?.provider_name} · {game.game_type}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

