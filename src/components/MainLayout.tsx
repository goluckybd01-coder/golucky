import { Outlet, useLocation } from "react-router-dom";
import { useCallback, useState, useEffect, useRef } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "./BottomNav";
import FloatingSupport from "./FloatingSupport";
import AIAssistant from "./AIAssistant";
import NotificationCenter from "./NotificationCenter";
import { PullToRefresh } from "./PullToRefresh";
import GlobalResultModal from "./game/GlobalResultModal";
import Confetti from "./Confetti";
import CoinRain from "./CoinRain";
import Fireworks from "./Fireworks";
import WinAmountDisplay from "./WinAmountDisplay";
import LoseDisplay from "./LoseDisplay";
import VIPUpgradeModal from "./VIPUpgradeModal";
import AgentTierUpgradeModal from "./agent/AgentTierUpgradeModal";
import AgentHighlightBanner from "./AgentHighlightBanner";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useVIPLevel } from "@/hooks/useVIPLevel";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTransactionNotifications } from "@/hooks/useTransactionNotifications";
import { useAgentCommissionNotifications } from "@/hooks/useAgentCommissionNotifications";
import { useAgentSalaryNotifications } from "@/hooks/useAgentSalaryNotifications";
import { useAgentTierUpgrade } from "@/hooks/useAgentTierUpgrade";
import { sendWinNotification } from "@/lib/pushNotificationService";
import type { GlobalGameResultPayload, GameName } from "@/lib/globalGameResult";
import AudioManager from "@/hooks/useAudioManager";

const MainLayout = () => {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const prevPathRef = useRef(location.pathname);
  
  // Global result modal state
  const [showGlobalResult, setShowGlobalResult] = useState(false);
  const [globalResultData, setGlobalResultData] = useState<GlobalGameResultPayload | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [showWinAmount, setShowWinAmount] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [showLoseDisplay, setShowLoseDisplay] = useState(false);
  const [winIntensity, setWinIntensity] = useState<"small" | "medium" | "big">("medium");
  
  // Big win modal state
  const [showBigWinModal, setShowBigWinModal] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  const [bigWinGame, setBigWinGame] = useState<string>("");
  
  // Sound and wallet for global celebrations
  const { playResultSound, playConfettiBurst, playDrumRoll, playRevealClimax, playWinFanfare, playWin, playLose, playEpicJackpot } = useGameSounds(true);
  const { claimWinnings } = useWalletDB();
  
  // VIP level tracking with automatic upgrades
  const { showUpgradeModal, setShowUpgradeModal, newLevel } = useVIPLevel();
  
  // Push notifications system
  const { refresh: refreshNotifications } = usePushNotifications();
  
  // Real-time transaction request notifications
  useTransactionNotifications();
  
  // Agent commission notifications (only activates for approved agents)
  useAgentCommissionNotifications();
  
  // Agent salary status notifications (only activates for approved agents)
  useAgentSalaryNotifications();
  
  // Agent tier upgrade tracking
  const { 
    showUpgradeModal: showAgentUpgrade, 
    setShowUpgradeModal: setShowAgentUpgrade, 
    oldTier, 
    newTier 
  } = useAgentTierUpgrade();

  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Trigger re-render by updating key
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Hard-stop any game audio when user leaves a game route
  // (prevents looping engine/ambient sounds continuing after navigation)
  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;

    const wasInGame = prev.startsWith("/game");
    const isInGame = curr.startsWith("/game");

    if (wasInGame && !isInGame) {
      // Aggressively stop ALL sounds
      const manager = AudioManager.getInstance();
      manager.stopLoop('engine');
      manager.stopLoop('waiting');
      manager.stopLoop('countdown');
      manager.stopAllSounds();
      
      // Also try to close/reset any lingering AudioContext
      try {
        const ctx = manager.getContext();
        if (ctx && ctx.state === 'running') {
          ctx.suspend().catch(() => {});
        }
      } catch {}
    }

    prevPathRef.current = curr;
  }, [location.pathname]);

  // ============= GLOBAL GAME RESULT LISTENER =============
  // ONE listener for ALL games at root level
  // This is the ONLY place that handles result events - no per-page listeners
  useEffect(() => {
    const handleGlobalGameResult = (e: Event) => {
      const detail = (e as CustomEvent<GlobalGameResultPayload>).detail;
      if (!detail) return;
      
      console.log(`[MainLayout] GLOBAL_GAME_RESULT received: ${detail.game} ${detail.duration}min ${detail.outcome}`);
      
      // Show global result modal
      setGlobalResultData(detail);
      setShowGlobalResult(true);
      
      // Sound will be played by WinAmountDisplay/LoseDisplay onShow callbacks
        // Handle win: claim winnings + confetti + win amount display
        if (detail.outcome === "WIN" && detail.payout > 0) {
          // Map game names for wallet
          const gameNameMap: Record<GameName, string> = {
            K3: "K3",
            WinGo: "winGo",
            "5D": "5D",
            TrxWin: "trxWin",
          };
          claimWinnings(detail.payout, gameNameMap[detail.game] || detail.game, detail.tradeId);
          
          // Send push notification for win
          sendWinNotification(detail.payout, detail.game);
          refreshNotifications();
          
          // Determine intensity based on win amount
          const intensity: "small" | "medium" | "big" = 
            detail.payout >= 5000 ? "big" : 
            detail.payout >= 500 ? "medium" : "small";
          setWinIntensity(intensity);
          
          // 🎉 Celebration vibration pattern based on win intensity
          if (navigator.vibrate) {
            if (intensity === "big") {
              // Big win: Long celebratory pattern - "ta-da-da-DAAAA!"
              navigator.vibrate([100, 50, 100, 50, 100, 100, 300, 100, 500]);
            } else if (intensity === "medium") {
              // Medium win: Happy pattern - "da-da-da!"
              navigator.vibrate([80, 50, 80, 50, 150, 100, 200]);
            } else {
              // Small win: Quick celebration - "ding-ding!"
              navigator.vibrate([50, 30, 50, 50, 100]);
            }
          }
          
          // Set win amount for big display
          setWinAmount(detail.payout);
          setShowWinAmount(true);
          
          // Trigger confetti + coin rain celebration with sound
          setShowConfetti(true);
          setShowCoinRain(true);
          playConfettiBurst();
          
          // Quick duration for effects (max 2.5s)
          const effectDuration = intensity === "big" ? 2500 : intensity === "medium" ? 2000 : 1500;
          setTimeout(() => {
            setShowConfetti(false);
            setShowCoinRain(false);
          }, effectDuration);
          
          // Show big win modal for ৳1000+ wins (auto-close after 5s) + play EPIC sound + fireworks
          if (detail.payout >= 1000) {
            setBigWinAmount(detail.payout);
            setBigWinGame(detail.game);
            setShowBigWinModal(true);
            setShowFireworks(true);
            playEpicJackpot(); // Epic jackpot sound for big win modal!
            
            // Extra celebration vibration for big win modal
            setTimeout(() => {
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 400]);
              }
            }, 1000);
            
            setTimeout(() => {
              setShowBigWinModal(false);
              setShowFireworks(false);
            }, 5000);
          }
        } else if (detail.outcome === "LOSE") {
          // Sad vibration for lose
          if (navigator.vibrate) {
            navigator.vibrate([150, 100, 80]);
          }
          // Show lose display animation
          setShowLoseDisplay(true);
        }
      
      // Dispatch a custom event to notify game pages to refresh their history
      // This allows game pages to update their UI without having their own result listeners
      window.dispatchEvent(new CustomEvent("REFRESH_GAME_HISTORY", { 
        detail: { game: detail.game, duration: detail.duration } 
      }));
    };
    
    window.addEventListener("GLOBAL_GAME_RESULT", handleGlobalGameResult);
    return () => window.removeEventListener("GLOBAL_GAME_RESULT", handleGlobalGameResult);
  }, [playResultSound, playConfettiBurst, claimWinnings]);

  const handleCloseGlobalResult = useCallback(() => {
    setShowGlobalResult(false);
    setGlobalResultData(null);
  }, []);

  // Pages where we don't show floating agent banner (agent pages, home has its own banner, wallet matches reference)
  const hideFloatingAgentBanner = [
    '/agent/apply', 
    '/agent/dashboard', 
    '/home', 
    '/',
    '/wallet',
    '/vip',
    '/fixed-deposits',
    '/game/win-go',
    '/game/k3',
    '/game/5d',
    '/game/trx-win',
    '/game/crash',
    '/game/mines',
    '/game/aviator',
    '/game/lucky-spinner'
  ].some(path => location.pathname === path || location.pathname.startsWith('/game/'));

  const hideFloatingSupport = location.pathname === '/wallet';

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-gray-100 force-click page-content" style={{ pointerEvents: "auto", position: "relative", zIndex: 1 }}>
      <PullToRefresh 
        onRefresh={handleRefresh}
        className="min-h-screen pb-20 force-click"
      >
        <Outlet key={refreshKey} />
      </PullToRefresh>
      <AIAssistant />
      {!hideFloatingSupport && <FloatingSupport />}
      
      {/* Floating Agent Recruit Banner - Shows on non-game/non-agent pages */}
      {!hideFloatingAgentBanner && (
        <AgentHighlightBanner variant="floating" />
      )}
      
      <BottomNav />
      
      {/* Global Result Modal - ONE modal for ALL games */}
      <GlobalResultModal
        isOpen={showGlobalResult}
        result={globalResultData}
        onClose={handleCloseGlobalResult}
        onPlayDrumRoll={playDrumRoll}
        onPlayRevealClimax={playRevealClimax}
        onPlayWinFanfare={playWinFanfare}
      />
      
      {/* Global Confetti - ONE confetti for ALL games */}
      <Confetti isActive={showConfetti} intensity={winIntensity} />
      
      {/* Global Coin Rain - Shows on WIN */}
      <CoinRain 
        active={showCoinRain} 
        duration={winIntensity === "big" ? 2500 : winIntensity === "medium" ? 2000 : 1500} 
        coinCount={winIntensity === "big" ? 30 : winIntensity === "medium" ? 20 : 10}
        intensity={winIntensity}
      />
      
      {/* Big Win Amount Display - Shows on WIN with sound */}
      <WinAmountDisplay 
        amount={winAmount} 
        show={showWinAmount} 
        intensity={winIntensity}
        onShow={() => playWin(winAmount)}
        onComplete={() => {
          setShowWinAmount(false);
          setShowConfetti(false);
          setShowCoinRain(false);
        }} 
      />
      
      {/* Lose Display - Shows on LOSE with sound */}
      <LoseDisplay 
        show={showLoseDisplay} 
        onShow={() => playLose()}
        onComplete={() => setShowLoseDisplay(false)} 
      />
      
      {/* Fireworks Animation for Big Win */}
      <Fireworks active={showFireworks} duration={4500} />
      
      {/* Big Win Celebration Modal */}
      {showBigWinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center modal-backdrop" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="relative mx-4 max-w-sm w-full modal-content" style={{ pointerEvents: "auto" }}>
            {/* Glowing background effect - decorative */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-xl opacity-50 animate-pulse decorative" style={{ pointerEvents: "none" }} />
            
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
              {/* Sparkle effects */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: "0.3s" }} />
              <div className="absolute bottom-12 left-8 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: "0.6s" }} />
              <div className="absolute bottom-8 right-12 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: "0.9s" }} />
              
              {/* Trophy Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="text-7xl animate-bounce">🏆</div>
                  <div className="absolute -top-2 -right-2 text-2xl animate-spin" style={{ animationDuration: "3s" }}>✨</div>
                  <div className="absolute -bottom-1 -left-2 text-xl animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>⭐</div>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-2">
                🎊 বিশাল জয়! 🎊
              </h2>
              <p className="text-center text-gray-400 text-sm mb-4">অভিনন্দন! আপনি {bigWinGame} গেমে বড় জিতেছেন!</p>
              
              {/* Win Amount */}
              <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl p-4 mb-4 border border-yellow-500/30">
                <p className="text-center text-gray-400 text-xs mb-1">মোট জয়ের পরিমাণ</p>
                <p className="text-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  ৳{bigWinAmount.toFixed(2)}
                </p>
              </div>
              
              {/* Celebration emojis */}
              <div className="flex justify-center gap-2 mb-4 text-2xl">
                <span className="animate-bounce" style={{ animationDelay: "0s" }}>🎉</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>💰</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>🎊</span>
                <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>💎</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>🎉</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Share Button */}
                <button
                  onClick={async () => {
                    const shareText = `🏆 আমি ${bigWinGame} গেমে ৳${bigWinAmount.toFixed(2)} জিতেছি! 🎉\n\n💰 বড় জয়ের জন্য আজই খেলুন!\n🎮 GoLucky - সেরা গেমিং প্ল্যাটফর্ম`;
                    
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: '🏆 বিশাল জয়! - GoLucky',
                          text: shareText,
                          url: window.location.origin
                        });
                        toast.success("শেয়ার সফল হয়েছে!");
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          await navigator.clipboard.writeText(shareText);
                          toast.success("টেক্সট কপি হয়েছে!");
                        }
                      }
                    } else {
                      await navigator.clipboard.writeText(shareText);
                      toast.success("টেক্সট কপি হয়েছে!");
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  <Share2 className="w-5 h-5" />
                  শেয়ার করুন
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowBigWinModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)" }}
                >
                  ✨ অসাধারণ! ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* VIP Level Up Modal - Shows when user levels up */}
      <VIPUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        newLevel={newLevel || 1}
      />
      
      {/* Agent Tier Upgrade Modal - Shows when agent upgrades tier */}
      <AgentTierUpgradeModal
        open={showAgentUpgrade}
        onOpenChange={setShowAgentUpgrade}
        oldTier={oldTier}
        newTier={newTier}
      />
    </div>
  );
};

export default MainLayout;
