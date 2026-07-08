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

const FloatingParticle = (_props: any) => null;
