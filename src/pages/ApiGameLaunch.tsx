import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw, Home, Wallet, Info, AlertCircle, Loader2, Play, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface GameProvider {
  id: string;
  provider_name: string;
  provider_code: string;
  logo_url: string | null;
  is_test_mode: boolean;
}

interface ApiGame {
  id: string;
  provider_id: string;
  game_name: string;
  game_code: string;
  game_type: string;
  thumbnail_url: string | null;
  rtp_percent: number | null;
  launch_url: string | null;
  demo_url: string | null;
  min_bet: number | null;
  max_bet: number | null;
}

const ApiGameLaunch = () => {
  const { providerId, gameCode } = useParams<{ providerId: string; gameCode: string }>();
  const navigate = useNavigate();
  const { balance } = useWallet();
  
  const [provider, setProvider] = useState<GameProvider | null>(null);
  const [game, setGame] = useState<ApiGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-launch game when URL is available
  useEffect(() => {
    if (gameUrl && !isLoading) {
      console.log('[GameLaunch] Auto-launching game in new window:', gameUrl);
      const newWindow = window.open(gameUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Pop-up blocked! Please allow pop-ups for this site.');
      }
    }
  }, [gameUrl, isLoading]);

  useEffect(() => {
    loadGame();
  }, [providerId, gameCode]);

  const loadGame = async () => {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || authError) {
        toast.error('Please login to play');
        navigate('/login');
        return;
      }

      // Load provider (provider_code is stored in lowercase in DB)
      const { data: providerData } = await supabase
        .from('api_game_providers')
        .select('*')
        .eq('provider_code', providerId?.toLowerCase())
        .eq('is_enabled', true)
        .single();

      if (!providerData) {
        setError('Provider not available');
        setIsLoading(false);
        return;
      }
      setProvider(providerData);

      // Load game
      const { data: gameData } = await supabase
        .from('api_games')
        .select('*')
        .eq('provider_id', providerData.id)
        .eq('game_code', gameCode)
        .eq('is_enabled', true)
        .single();

      if (!gameData) {
        setError('Game not available');
        setIsLoading(false);
        return;
      }
      setGame(gameData);

      // Get session for API call
      // Call the backend game launch function (auth is handled automatically)
      console.log(`[GameLaunch] Launching game: ${providerId}/${gameCode}`);

      const { data: result, error: launchError } = await supabase.functions.invoke('api-game-launch', {
        body: {
          provider_code: providerId?.toUpperCase(),
          game_code: gameCode,
          lang: 'en',
          lobby_url: `${window.location.origin}/home`,
        },
      });

      if (launchError) {
        console.error('[GameLaunch] Function invoke error:', launchError);
        setError(launchError.message || 'Failed to launch game');
        setIsLoading(false);
        return;
      }

      console.log('[GameLaunch] API response:', result);

      if (!result?.success || !result?.url) {
        console.error('[GameLaunch] Error:', result);
        setError(result?.error || result?.message || 'Failed to launch game');
        setIsLoading(false);
        return;
      }

      // Set the game URL from API response
      setGameUrl(result.url);
      console.log('[GameLaunch] Game URL set:', result.url);

    } catch (error) {
      console.error('Error loading game:', error);
      setError('Failed to load game');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (!document.fullscreenElement) {
      iframe?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRefresh = () => {
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-white">Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Game Unavailable</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => navigate('/home')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/games/${providerId}`)}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {provider?.logo_url && (
              <img src={provider.logo_url} alt="" className="h-6 w-6 rounded" />
            )}
            <div>
              <h1 className="text-white font-medium text-sm">{game?.game_name}</h1>
              <p className="text-gray-400 text-xs">{provider?.provider_name}</p>
            </div>
          </div>
          {provider?.is_test_mode && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Demo Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Balance */}
          <div className="bg-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-400" aria-hidden="true" />
            <span className="text-white font-medium">৳{balance?.toFixed(2) || '0.00'}</span>
          </div>

          {/* Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(true)}
            className="text-gray-400 hover:text-white"
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="text-gray-400 hover:text-white"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Game Launch Area - Direct launch instead of iframe */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        {gameUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 max-w-md w-full"
          >
            {/* Game Thumbnail with Glow Effect */}
            {game?.thumbnail_url && (
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 blur-3xl rounded-full scale-150" />
                <img 
                  src={game.thumbnail_url} 
                  alt={game.game_name}
                  className="w-40 h-40 mx-auto rounded-2xl object-cover shadow-2xl border-4 border-green-500/50 relative z-10"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-20">
                  <Play className="h-7 w-7 text-white" fill="white" />
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-white mb-1 mt-4">{game?.game_name}</h2>
            <p className="text-gray-400 text-sm mb-5">{provider?.provider_name}</p>
            
            {/* Main Launch Button - Large & Prominent */}
            <motion.button
              onClick={() => {
                const newWindow = window.open(gameUrl, '_blank', 'noopener,noreferrer');
                if (newWindow) {
                  toast.success('গেম ওপেন হয়েছে! ✓');
                } else {
                  toast.error('Pop-up blocked! Browser settings চেক করুন');
                }
              }}
              className="w-full py-5 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold text-xl rounded-2xl shadow-2xl transform transition-all duration-300 flex items-center justify-center gap-3 mb-3"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="h-7 w-7" fill="white" />
              🎮 এখনই খেলুন
            </motion.button>
            
            {/* Copy URL Button - For blocked cases */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(gameUrl);
                toast.success('Game URL copied! Browser-এ paste করুন');
              }}
              className="w-full py-3 px-4 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-sm rounded-xl border border-gray-600 transition-all"
            >
              📋 URL কপি করুন (Block থাকলে)
            </button>
            
            <p className="text-gray-500 text-xs mt-3">
              💡 Pop-up block থাকলে URL কপি করে নতুন ট্যাবে পেস্ট করুন
            </p>
            
            {/* Game Info Cards */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              {game?.rtp_percent && (
                <div className="bg-gray-800/60 rounded-xl p-3 border border-green-500/20">
                  <p className="text-gray-400 text-[10px] uppercase">RTP</p>
                  <p className="text-green-400 font-bold text-lg">{game.rtp_percent}%</p>
                </div>
              )}
              <div className="bg-gray-800/60 rounded-xl p-3 border border-amber-500/20">
                <p className="text-gray-400 text-[10px] uppercase">Provider</p>
                <p className="text-amber-400 font-bold text-lg">{provider?.provider_code?.toUpperCase()}</p>
              </div>
            </div>
            
            {provider?.is_test_mode && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                <p className="text-yellow-400 text-xs">
                  ⚠️ Demo Mode - শুধুমাত্র বিনোদনের জন্য
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center p-6">
            <AlertCircle className="h-14 w-14 text-yellow-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">গেম লোড হচ্ছে না</p>
            <p className="text-gray-400 text-sm mb-4">অনুগ্রহ করে আবার চেষ্টা করুন</p>
            <button
              onClick={() => loadGame()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all"
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>

      {/* Game Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Game Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {game?.thumbnail_url && (
              <img 
                src={game.thumbnail_url} 
                alt={game.game_name}
                className="w-full h-40 object-cover rounded-lg"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Game Name</p>
                <p className="text-white font-medium">{game?.game_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Provider</p>
                <p className="text-white font-medium">{provider?.provider_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Game Type</p>
                <p className="text-white font-medium capitalize">{game?.game_type}</p>
              </div>
              {game?.rtp_percent && (
                <div>
                  <p className="text-gray-400 text-sm">RTP</p>
                  <p className="text-white font-medium">{game.rtp_percent}%</p>
                </div>
              )}
              {game?.min_bet && (
                <div>
                  <p className="text-gray-400 text-sm">Min Bet</p>
                  <p className="text-white font-medium">৳{game.min_bet}</p>
                </div>
              )}
              {game?.max_bet && (
                <div>
                  <p className="text-gray-400 text-sm">Max Bet</p>
                  <p className="text-white font-medium">৳{game.max_bet}</p>
                </div>
              )}
            </div>
            {provider?.is_test_mode && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ This game is running in demo mode. Winnings are for entertainment only.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiGameLaunch;
