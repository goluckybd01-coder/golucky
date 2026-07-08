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
