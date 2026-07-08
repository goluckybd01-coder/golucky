import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, History, TrendingUp, TrendingDown, Clock, Gamepad2, Sparkles, Trophy, Target, Zap, Star, Crown, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BetDetailsModal, BetDetails } from "@/components/game/BetDetailsModal";

// Enhanced floating particle with glow
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Floating sparkle with glow
const FloatingSparkle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0.5, 1, 0.5],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      duration: 2, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Sparkles size={12} className="text-cyan-400" />
  </motion.div>
);

// Glowing orb with pulse animation
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div 
    className={`absolute rounded-full blur-3xl ${className}`} 
    style={{ background: color }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3]
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Premium holographic shine effect
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
  />
);

// Premium 3D glass card component
const Premium3DCard = ({ 
  children, 
  className = "",
  delay = 0,
  glowColor = "rgba(20,184,166,0.2)"
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  glowColor?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, rotateX: -10 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
    whileHover={{ 
      scale: 1.01,
      rotateX: 2,
      boxShadow: `0 25px 50px -12px ${glowColor}`
    }}
    className={`relative backdrop-blur-2xl bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.04] border border-white/15 rounded-3xl overflow-hidden ${className}`}
    style={{
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
      transformStyle: "preserve-3d",
      perspective: "1000px"
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    <motion.div
      className="absolute inset-0 rounded-3xl opacity-40"
      style={{
        background: `linear-gradient(45deg, transparent 30%, ${glowColor} 50%, transparent 70%)`,
        backgroundSize: "200% 200%"
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
      }}
      transition={{ duration: 6, repeat: Infinity }}
    />
    <HolographicShine />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const StatCard3D = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  delay = 0 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string; 
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
    transition={{ delay, duration: 0.5, type: "spring" }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="relative"
    style={{ transformStyle: "preserve-3d" }}
  >
    <Premium3DCard className="p-4" delay={delay}>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}
          style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="text-white/50 text-xs font-medium">{label}</p>
          <motion.p className="text-white text-xl font-bold" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            {value}
          </motion.p>
        </div>
      </div>
    </Premium3DCard>
  </motion.div>
);

