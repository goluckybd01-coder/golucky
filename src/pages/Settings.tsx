import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, Lock, Bell, Globe, Shield, Eye, EyeOff, Camera, Save, 
  Check, BellRing, BellOff, Languages, Sparkles, Volume2, Vibrate, Mail,
  Gamepad2, Gift, CreditCard, Settings as SettingsIcon, Zap, Crown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import goluckyTextLogo from "@/assets/golucky-text-logo-2.png";

// Animated floating particle component with enhanced effects
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

// Glowing orb component with pulse
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
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
  />
);

// 3D Floating icon with depth
const Floating3DIcon = ({ icon: Icon, delay = 0 }: { icon: any; delay?: number }) => (
  <motion.div
    className="relative"
    animate={{
      y: [-3, 3, -3],
      rotateY: [-5, 5, -5],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{ transformStyle: "preserve-3d" }}
  >
    <div className="relative">
      <Icon size={18} className="text-cyan-400 drop-shadow-lg" />
      <div className="absolute inset-0 blur-sm">
        <Icon size={18} className="text-cyan-400/50" />
      </div>
    </div>
  </motion.div>
);

// Premium 3D glass card component
const Premium3DCard = ({ 
  children, 
  className = "", 
  delay = 0,
  glowColor = "rgba(20,184,166,0.3)"
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
    className={`relative backdrop-blur-2xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden ${className}`}
    style={{
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
      transformStyle: "preserve-3d",
      perspective: "1000px"
    }}
  >
    {/* Glass reflection */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
    
    {/* Animated border glow */}
    <motion.div
      className="absolute inset-0 rounded-3xl opacity-50"
      style={{
        background: `linear-gradient(45deg, transparent 30%, ${glowColor} 50%, transparent 70%)`,
        backgroundSize: "200% 200%"
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
      }}
      transition={{ duration: 5, repeat: Infinity }}
    />
    
    <HolographicShine />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// Animated Tab Button with 3D effect
const TabButton = ({ 
  isActive, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-medium transition-all overflow-hidden ${
      isActive 
        ? "text-white" 
        : "text-white/60 hover:text-white/80"
    }`}
    style={{
      transformStyle: "preserve-3d",
      perspective: "500px"
    }}
  >
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #0891b2 100%)",
          boxShadow: "0 8px 30px rgba(20,184,166,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
        }}
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    {isActive && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
    )}
    <div className="relative z-10 flex items-center gap-2">
      <motion.div
        animate={isActive ? { 
          rotate: [0, -10, 10, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <Icon size={16} />
      </motion.div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  </motion.button>
);

// Premium Input Component with 3D effect
const PremiumInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  icon: Icon,
  showToggle,
  onToggle,
  isVisible
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  icon?: any;
  showToggle?: boolean;
  onToggle?: () => void;
  isVisible?: boolean;
}) => (
  <motion.div 
    className="space-y-2"
    whileHover={{ scale: 1.01 }}
    transition={{ type: "spring", stiffness: 400 }}
  >
    <Label className="text-white/70 text-sm flex items-center gap-2">
      {Icon && <Icon size={14} className="text-cyan-400" />}
      {label}
    </Label>
    <div className="relative group">
      <motion.div
        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: "linear-gradient(135deg, rgba(20,184,166,0.5), rgba(6,182,212,0.5))",
          filter: "blur(8px)"
        }}
      />
      <Input
        type={showToggle ? (isVisible ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="relative bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-500 focus:ring-cyan-500/20 pr-10 h-14 rounded-2xl backdrop-blur-sm"
      />
      {showToggle && (
        <motion.button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </motion.button>
      )}
    </div>
  </motion.div>
);

// Premium Switch Item with enhanced styling
const SwitchItem = ({ 
  icon: Icon, 
  label, 
  description, 
  checked, 
  onChange,
  status,
  delay = 0,
  accentColor = "cyan"
}: {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  status?: "blocked" | "active" | "inactive";
  delay?: number;
  accentColor?: "cyan" | "amber" | "green" | "purple";
}) => {
  const colors = {
    cyan: { bg: "from-cyan-500/30 to-teal-500/30", icon: "text-cyan-400" },
    amber: { bg: "from-amber-500/30 to-orange-500/30", icon: "text-amber-400" },
    green: { bg: "from-green-500/30 to-emerald-500/30", icon: "text-green-400" },
    purple: { bg: "from-purple-500/30 to-pink-500/30", icon: "text-purple-400" }
  };

  return (
    <motion.div 
      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01, x: 5 }}
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${
            checked ? colors[accentColor].bg : "from-white/5 to-white/10"
          }`}
          animate={checked ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 0.5 }}
          style={{
            boxShadow: checked ? `0 8px 20px rgba(20,184,166,0.3)` : "none"
          }}
        >
          <Icon size={20} className={checked ? colors[accentColor].icon : "text-white/40"} />
        </motion.div>
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-white/40 text-xs">{description}</p>
        </div>
      </div>
      {status === "blocked" ? (
        <motion.span 
          className="text-xs text-red-400 px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/30 font-medium"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Blocked
        </motion.span>
      ) : (
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-teal-500 scale-110"
        />
      )}
    </motion.div>
  );
};

// Avatar option component with 3D effect
const AvatarOption = ({ 
  url, 
  isSelected, 
  onClick, 
  index 
}: { 
  url: string; 
  isSelected: boolean; 
  onClick: () => void;
  index: number;
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
    transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.2, rotate: 10, y: -5 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all ${
      isSelected 
        ? "ring-3 ring-cyan-400 ring-offset-2 ring-offset-slate-900" 
        : "hover:ring-2 hover:ring-white/30"
    }`}
    style={{
      boxShadow: isSelected ? "0 8px 25px rgba(20,184,166,0.4)" : "0 4px 15px rgba(0,0,0,0.2)"
    }}
  >
    <img src={url} alt="Avatar option" className="w-full h-full" />
    {isSelected && (
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-teal-500/40 flex items-center justify-center backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Check size={22} className="text-white drop-shadow-lg" />
        </motion.div>
      </motion.div>
    )}
  </motion.button>
);

// Language card component with enhanced design
const LanguageCard = ({ 
  flag, 
  name, 
  subtitle, 
  isSelected, 
  onClick 
}: { 
  flag: string; 
  name: string; 
  subtitle: string;
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.03, y: -3 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative p-5 rounded-2xl border-2 transition-all overflow-hidden ${
      isSelected 
        ? "border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-teal-500/20" 
        : "border-white/10 bg-white/5 hover:border-white/20"
    }`}
    style={{
      boxShadow: isSelected ? "0 15px 40px rgba(20,184,166,0.3)" : "none"
    }}
  >
    {isSelected && <HolographicShine />}
    <div className="relative z-10 flex items-center gap-4">
      <motion.span 
        className="text-4xl"
        animate={isSelected ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {flag}
      </motion.span>
      <div className="text-left">
        <p className="text-white font-bold">{name}</p>
        <p className="text-white/50 text-xs">{subtitle}</p>
      </div>
      {isSelected && (
        <motion.div 
          className="ml-auto"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Check size={16} className="text-white" />
          </div>
        </motion.div>
      )}
    </div>
  </motion.button>
);

// Premium action button
const PremiumButton = ({ 
  children, 
  onClick, 
  disabled, 
  loading,
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
}) => (
  <motion.div 
    whileHover={!disabled ? { scale: 1.02, y: -2 } : {}} 
    whileTap={!disabled ? { scale: 0.98 } : {}}
  >
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-600 hover:via-teal-600 hover:to-cyan-700 text-white font-bold rounded-2xl relative overflow-hidden disabled:opacity-50 border-0"
      style={{
        boxShadow: "0 10px 30px rgba(20,184,166,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
      }}
    >
      <HolographicShine />
      <div className="relative z-10 flex items-center gap-3">
        {loading ? (
          <motion.div 
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            {Icon && <Icon size={20} />}
            {children}
          </>
        )}
      </div>
    </Button>
  </motion.div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Preferences state
  const { language, setLanguage: setGlobalLanguage } = useLanguage();
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    promotions: true,
    gameUpdates: true,
    transactions: true,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Push notifications hook
  const { 
    pushEnabled, 
    permission, 
    togglePush, 
    requestPermission 
  } = usePushNotifications();

  useEffect(() => {
    fetchProfile();
    loadPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setUsername(profile.username || "");
        setPhone(profile.phone || "");
        setAvatarUrl(profile.avatar_url || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadPreferences = () => {
    const savedPrefs = localStorage.getItem("user_preferences");
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setNotifications(prefs.notifications || notifications);
      setSoundEnabled(prefs.soundEnabled ?? true);
      setVibrationEnabled(prefs.vibrationEnabled ?? true);
    }
  };

  const savePreferences = () => {
    const prefs = {
      language,
      notifications,
      soundEnabled,
      vibrationEnabled,
    };
    localStorage.setItem("user_preferences", JSON.stringify(prefs));
    toast({
      title: "✨ Preferences saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "✨ Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "🔐 Password changed",
        description: "Your password has been updated successfully.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
  ];

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "preferences", label: "Preferences", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 50%)
          `
        }} />
      </div>

      {/* Animated floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.5} 
            size={Math.random() * 10 + 6}
            left={`${Math.random() * 100}%`}
            duration={Math.random() * 6 + 10}
          />
        ))}
      </div>

      {/* Floating sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <FloatingSparkle
            key={i}
            delay={i * 0.8}
            x={`${10 + Math.random() * 80}%`}
            y={`${10 + Math.random() * 80}%`}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <GlowingOrb className="w-[500px] h-[500px] -top-64 -right-64" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
      <GlowingOrb className="w-80 h-80 top-1/3 -left-40" color="radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" />
      <GlowingOrb className="w-96 h-96 bottom-10 right-0" color="radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)" />

      {/* Premium Header */}
      <div className="relative pt-6 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 via-teal-600/10 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative z-10 flex items-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            style={{
              boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
            }}
          >
            <ArrowLeft size={22} />
          </motion.button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  boxShadow: "0 8px 25px rgba(20,184,166,0.4)"
                }}
              >
                <SettingsIcon size={20} className="text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
            
            {/* Premium Text Logo with 3D Motion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.img
                src={goluckyTextLogo}
                alt="GoLucky"
                className="h-8 w-auto object-contain"
                style={{
                  filter: "drop-shadow(0 0 15px rgba(20, 184, 166, 0.6)) drop-shadow(0 0 30px rgba(6, 182, 212, 0.4)) brightness(1.15) contrast(1.1)"
                }}
                animate={{
                  rotateY: [0, 8, 0, -8, 0],
                  rotateX: [0, 3, 0, -3, 0],
                  scale: [1, 1.02, 1, 1.02, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
          <motion.div
            animate={{ 
              y: [-3, 3, -3],
              rotate: [0, 360]
            }}
            transition={{ 
              y: { duration: 2, repeat: Infinity },
              rotate: { duration: 8, repeat: Infinity, ease: "linear" }
            }}
          >
            <Sparkles size={24} className="text-cyan-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Premium Animated Tabs */}
      <div className="px-4 py-3">
        <Premium3DCard className="p-2" delay={0.1}>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
        </Premium3DCard>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-2">
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Avatar Section */}
              <Premium3DCard delay={0.1} className="p-6">
                <h3 className="text-white font-bold mb-5 flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Camera size={18} className="text-cyan-400" />
                  </motion.div>
                  Choose Avatar
                </h3>
                
                <div className="flex items-center gap-5 mb-6">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <motion.div 
                      className="w-24 h-24 rounded-3xl bg-gradient-to-r from-cyan-500 to-teal-500 p-1"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(20,184,166,0.4)",
                          "0 0 40px rgba(20,184,166,0.6)",
                          "0 0 20px rgba(20,184,166,0.4)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-full h-full rounded-3xl bg-slate-900 flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-white/40" />
                        )}
                      </div>
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center cursor-pointer"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        boxShadow: "0 5px 15px rgba(20,184,166,0.4)"
                      }}
                    >
                      <Camera size={16} className="text-white" />
                    </motion.div>
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm">Select from presets or enter custom URL</p>
                    <p className="text-cyan-400 text-xs mt-1 flex items-center gap-1">
                      <Sparkles size={10} />
                      Premium avatars available
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-4 mb-5">
                  {avatarOptions.map((url, index) => (
                    <AvatarOption
                      key={index}
                      url={url}
                      isSelected={avatarUrl === url}
                      onClick={() => setAvatarUrl(url)}
                      index={index}
                    />
                  ))}
                </div>
                
                <PremiumInput
                  label="Custom Avatar URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  icon={Globe}
                />
              </Premium3DCard>

              {/* Personal Info Section */}
              <Premium3DCard delay={0.2} className="p-6 space-y-5">
                <h3 className="text-white font-bold flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center"
                    animate={{ 
                      y: [-2, 2, -2],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <User size={18} className="text-cyan-400" />
                  </motion.div>
                  Personal Information
                </h3>
                
                <PremiumInput
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  icon={User}
                />
                
                <PremiumInput
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                />

                <PremiumButton
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  loading={isSavingProfile}
                  icon={Save}
                >
                  Save Profile
                </PremiumButton>
              </Premium3DCard>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Change Password Section */}
              <Premium3DCard delay={0.1} className="p-6 space-y-5">
                <h3 className="text-white font-bold flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Shield size={18} className="text-cyan-400" />
                  </motion.div>
                  Change Password
                </h3>

                <PremiumInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  icon={Lock}
                  showToggle
                  isVisible={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                />

                <PremiumInput
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  icon={Lock}
                  showToggle
                  isVisible={showNewPassword}
                  onToggle={() => setShowNewPassword(!showNewPassword)}
                />

                <PremiumInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  icon={Lock}
                  showToggle
                  isVisible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <PremiumButton
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  loading={isChangingPassword}
                  icon={Lock}
                >
                  Change Password
                </PremiumButton>
              </Premium3DCard>

              {/* 2FA Section */}
              <Premium3DCard delay={0.2} className="p-6" glowColor="rgba(245,158,11,0.3)">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center"
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Shield size={22} className="text-amber-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold">Two-Factor Authentication</h3>
                      <p className="text-white/50 text-xs">Add extra security layer</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 rounded-xl border border-amber-500/50 text-amber-400 text-sm font-bold hover:bg-amber-500/10 transition-all flex items-center gap-2"
                  >
                    <Zap size={14} />
                    Coming Soon
                  </motion.button>
                </div>
              </Premium3DCard>

              {/* Security Tips */}
              <Premium3DCard delay={0.3} className="p-5" glowColor="rgba(34,197,94,0.2)">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Star size={18} className="text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">Security Tips</h4>
                    <ul className="space-y-1.5 text-white/50 text-xs">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-green-400" />
                        Use a strong, unique password
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-green-400" />
                        Never share your credentials
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-green-400" />
                        Enable 2FA when available
                      </li>
                    </ul>
                  </div>
                </div>
              </Premium3DCard>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Language Section */}
              <Premium3DCard delay={0.1} className="p-6">
                <h3 className="text-white font-bold mb-5 flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Languages size={18} className="text-cyan-400" />
                  </motion.div>
                  App Language
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <LanguageCard
                    flag="🇺🇸"
                    name="English"
                    subtitle="Default"
                    isSelected={language === 'en'}
                    onClick={() => setGlobalLanguage('en')}
                  />
                  <LanguageCard
                    flag="🇧🇩"
                    name="বাংলা"
                    subtitle="Bengali"
                    isSelected={language === 'bn'}
                    onClick={() => setGlobalLanguage('bn')}
                  />
                </div>
                
                <motion.div 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-2xl border border-cyan-500/20"
                  animate={{ 
                    borderColor: ["rgba(20,184,166,0.2)", "rgba(20,184,166,0.4)", "rgba(20,184,166,0.2)"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Globe className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <p className="text-cyan-300 text-xs">
                    {language === 'en' 
                      ? 'Language applies to all games including Mines, WinGo, K3, 5D, TrxWin, and Crash'
                      : 'ভাষা Mines, WinGo, K3, 5D, TrxWin এবং Crash সহ সমস্ত গেমে প্রযোজ্য হবে'}
                  </p>
                </motion.div>
              </Premium3DCard>

              {/* Notifications Section */}
              <Premium3DCard delay={0.2} className="p-6">
                <h3 className="text-white font-bold mb-5 flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bell size={18} className="text-cyan-400" />
                  </motion.div>
                  Notifications
                </h3>
                
                <div className="space-y-3">
                  <SwitchItem
                    icon={pushEnabled ? BellRing : BellOff}
                    label="Browser Push Notifications"
                    description={
                      permission === "granted" 
                        ? (pushEnabled ? "Receiving VIP, commission & offer alerts" : "Push disabled")
                        : permission === "denied" 
                          ? "Blocked in browser settings" 
                          : "Enable to receive important alerts"
                    }
                    checked={pushEnabled}
                    onChange={async () => {
                      if (!pushEnabled && permission !== "granted") {
                        await requestPermission();
                      } else {
                        await togglePush();
                      }
                    }}
                    status={permission === "denied" ? "blocked" : undefined}
                    delay={0}
                  />
                  
                  <SwitchItem
                    icon={Bell}
                    label="In-App Notifications"
                    description="Show notification center alerts"
                    checked={notifications.push}
                    onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                    delay={0.05}
                  />
                  
                  <SwitchItem
                    icon={Mail}
                    label="Email Notifications"
                    description="Receive email updates"
                    checked={notifications.email}
                    onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    delay={0.1}
                    accentColor="purple"
                  />
                  
                  <SwitchItem
                    icon={Gift}
                    label="Promotions"
                    description="Receive promotional offers"
                    checked={notifications.promotions}
                    onChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                    delay={0.15}
                    accentColor="amber"
                  />
                  
                  <SwitchItem
                    icon={Gamepad2}
                    label="Game Updates"
                    description="New games and features"
                    checked={notifications.gameUpdates}
                    onChange={(checked) => setNotifications({ ...notifications, gameUpdates: checked })}
                    delay={0.2}
                    accentColor="green"
                  />
                  
                  <SwitchItem
                    icon={CreditCard}
                    label="Transactions"
                    description="Deposit & withdrawal alerts"
                    checked={notifications.transactions}
                    onChange={(checked) => setNotifications({ ...notifications, transactions: checked })}
                    delay={0.25}
                  />
                </div>
              </Premium3DCard>

              {/* App Settings Section */}
              <Premium3DCard delay={0.3} className="p-6">
                <h3 className="text-white font-bold mb-5 flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <SettingsIcon size={18} className="text-purple-400" />
                  </motion.div>
                  App Settings
                </h3>
                
                <div className="space-y-3">
                  <SwitchItem
                    icon={Volume2}
                    label="Sound Effects"
                    description="Game sounds and alerts"
                    checked={soundEnabled}
                    onChange={setSoundEnabled}
                    delay={0}
                    accentColor="green"
                  />
                  
                  <SwitchItem
                    icon={Vibrate}
                    label="Vibration"
                    description="Haptic feedback"
                    checked={vibrationEnabled}
                    onChange={setVibrationEnabled}
                    delay={0.05}
                    accentColor="purple"
                  />
                </div>
              </Premium3DCard>

              <PremiumButton
                onClick={savePreferences}
                icon={Check}
              >
                Save Preferences
              </PremiumButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;
