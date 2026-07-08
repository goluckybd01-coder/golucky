import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Trophy, Crown, Flame, TrendingUp, 
  Medal, Star, Zap, Users, ChevronRight, Sparkles, Gem,
  RefreshCw, Clock, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { VIP_LEVELS } from "@/hooks/useVIPLevel";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/auth/GlassCard";

// Floating particle component
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Floating sparkle
const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180, 360]
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
  </motion.div>
);

// Glowing orb
const GlowingOrb = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Holographic shine
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
  />
);

// Premium section card
const PremiumCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={`relative rounded-2xl overflow-hidden ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
  >
    <div 
      className="absolute -inset-[1px] rounded-2xl opacity-40 pointer-events-none"
      style={{
        background: "linear-gradient(135deg, rgba(251,146,60,0.3) 0%, rgba(168,85,247,0.2) 50%, rgba(6,182,212,0.2) 100%)",
        filter: "blur(2px)",
      }}
    />
    <div 
      className="relative backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      }}
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <HolographicShine />
      {children}
    </div>
  </motion.div>
);

interface LeaderboardEntry {
  profile_id: string;
  display_name: string;
  vip_level: number;
  avatar_url: string | null;
  total_win: number;
  total_bet: number;
}

interface ActivePlayer {
  user_id: string;
  display_name: string;
  vip_level: number;
  avatar_url: string | null;
  weekly_games: number;
  weekly_wagered: number;
  weekly_won: number;
}

// Generate dynamic mock data with large amounts
const generateMockWinners = (): LeaderboardEntry[] => {
  const names = ["Rah***23", "Kar***89", "Sha***12", "Moh***67", "Ami***34", "Nas***78", "Tan***56", "Hab***90", "Fai***23", "Asa***45"];
  const baseAmounts = [2500000, 1850000, 1420000, 980000, 756000, 625000, 498000, 387000, 312000, 275000];
  
  return names.map((name, i) => ({
    profile_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 3),
    avatar_url: null,
    total_win: baseAmounts[i] + Math.floor(Math.random() * 50000),
    total_bet: baseAmounts[i] * 3 + Math.floor(Math.random() * 100000),
  }));
};

const generateMockVIPPlayers = (): LeaderboardEntry[] => {
  const names = ["Kin***88", "Rah***23", "Kar***89", "Sha***12", "Moh***67", "Ami***34", "Nas***78", "Tan***56", "Hab***90", "Fai***23"];
  const baseAmounts = [5200000, 3800000, 2650000, 1920000, 1580000, 1250000, 980000, 756000, 625000, 498000];
  
  return names.map((name, i) => ({
    profile_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 4),
    avatar_url: null,
    total_win: baseAmounts[i] + Math.floor(Math.random() * 100000),
    total_bet: baseAmounts[i] * 4 + Math.floor(Math.random() * 200000),
  }));
};

const generateMockActivePlayers = (): ActivePlayer[] => {
  const names = ["Pro***99", "Gam***55", "Win***77", "Luc***33", "Hot***11", "Ace***22", "Bet***44", "Cha***66", "Max***88", "Sma***00"];
  const baseGames = [3250, 2890, 2475, 2120, 1850, 1580, 1320, 1180, 920, 780];
  const baseWagered = [1850000, 1420000, 1180000, 920000, 756000, 625000, 498000, 387000, 312000, 275000];
  
  return names.map((name, i) => ({
    user_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 2),
    avatar_url: null,
    weekly_games: baseGames[i] + Math.floor(Math.random() * 100),
    weekly_wagered: baseWagered[i] + Math.floor(Math.random() * 50000),
    weekly_won: Math.floor(baseWagered[i] * (0.8 + Math.random() * 0.4)) + Math.floor(Math.random() * 30000),
  }));
};
