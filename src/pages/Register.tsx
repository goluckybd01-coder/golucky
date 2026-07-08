import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  Lock,
  Gift,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Star,
  User as UserIcon,
  AtSign,
  Shield,
  Wallet,
  Headphones,
  Gem,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePasswordSecurity } from "@/lib/passwordSecurity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Seo from "@/components/seo/Seo";
import LuxuryBackground from "@/components/auth-premium/LuxuryBackground";
import GlassCard from "@/components/auth-premium/GlassCard";
import LuxeInput from "@/components/auth-premium/LuxeInput";
import LuxeButton from "@/components/auth-premium/LuxeButton";
import LogoMark3D from "@/components/auth-premium/LogoMark3D";
import PremiumPill from "@/components/auth-premium/PremiumPill";

const validateEmail = (email: string): string | null => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  if (email.length > 255) return "Email is too long";
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  if (phone.length < 10) return "Phone number must be at least 10 digits";
  if (phone.length > 15) return "Phone number is too long";
  if (!/^\d+$/.test(phone)) return "Phone number can only contain digits";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return null;
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const getPasswordStrength = (
  password: string
): { strength: string; color: string; width: string; level: number } => {
  if (!password) return { strength: "", color: "", width: "0%", level: 0 };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2)
    return { strength: "Weak", color: "from-red-500 to-red-400", width: "33%", level: 1 };
  if (score <= 3)
    return { strength: "Medium", color: "from-yellow-500 to-orange-400", width: "66%", level: 2 };
  if (score <= 4)
    return { strength: "Strong", color: "from-emerald-500 to-emerald-400", width: "85%", level: 3 };
  return {
    strength: "Very Strong",
    color: "from-emerald-400 via-yellow-300 to-amber-400",
    width: "100%",
    level: 4,
  };
};

const BENEFITS = [
  { icon: Gift, label: "৳100 Welcome Bonus" },
  { icon: Sparkles, label: "Daily Login Reward" },
  { icon: Gem, label: "VIP Cashback" },
  { icon: Zap, label: "Instant Withdraw" },
  { icon: Wallet, label: "Secure Wallet" },
  { icon: Headphones, label: "24/7 Support" },
];

const STATS = [
  { value: "50,000+", label: "Happy Players" },
  { value: "99.98%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"phone" | "email">("email");
  const [countryCode, setCountryCode] = useState("+880");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickRegLoading, setIsQuickRegLoading] = useState(false);
  const [mode, setMode] = useState<"user" | "agent" | "quick">("user");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [leakedPasswordError, setLeakedPasswordError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [touched, setTouched] = useState({
    phone: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      const upperCode = refCode.toUpperCase();
      setInviteCode(upperCode);
      if (upperCode.startsWith("AG-") && upperCode.length === 9) {
        toast.success("Agent code applied! You'll get extra bonus!");
      } else if (upperCode.startsWith("REF-")) {
        toast.success("Referral code applied! You'll get ৳100 bonus!");
      } else {
        toast.success("Invite code applied!");
      }
    }
  }, [searchParams]);

  const emailError = touched.email ? validateEmail(email) : null;
  const phoneError = touched.phone ? validatePhone(phone) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmPasswordError =
    touched.confirmPassword && confirmPassword
      ? password !== confirmPassword
        ? "Passwords do not match"
        : null
      : null;
  const passwordStrength = getPasswordStrength(password);

  const isFormValid =
    activeTab === "email"
      ? email.length > 0 &&
        !validateEmail(email) &&
        password.length >= 6 &&
        !validatePassword(password) &&
        password === confirmPassword &&
        agreedToTerms
      : phone.length >= 10 &&
        !validatePhone(phone) &&
        password.length >= 6 &&
        !validatePassword(password) &&
        password === confirmPassword &&
        agreedToTerms;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ phone: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;
    setIsLoading(true);
    setLeakedPasswordError(null);
    setIsCheckingPassword(true);
    try {
      const securityError = await validatePasswordSecurity(password);
      if (securityError) {
        setLeakedPasswordError(securityError);
        toast.error(securityError, {
          icon: <ShieldAlert className="text-red-500" size={20} />,
          duration: 6000,
        });
        setIsLoading(false);
        setIsCheckingPassword(false);
        return;
      }
    } catch (error) {
      console.error("Password security check error:", error);
    } finally {
      setIsCheckingPassword(false);
    }

    try {
      const registerEmail =
        activeTab === "phone"
          ? `${countryCode.replace("+", "")}${phone}@phone.local`
          : email;
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName || null,
            username: username || null,
            phone: activeTab === "phone" ? `${countryCode}${phone}` : null,
            referral_code: inviteCode || null,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email/phone is already registered. Please login.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        if (inviteCode) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/referral-bonus`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                  newUserId: data.user.id,
                  referralCode: inviteCode,
                }),
              }
            );
            const result = await response.json();
            if (result.success) {
              toast.success(
                `Registration successful! You received ৳${100 + result.newUserBonus} bonus!`
              );
            } else {
              toast.success("Registration successful! Welcome bonus ৳100 added!");
            }
          } catch (err) {
            console.error("Error processing referral:", err);
            toast.success("Registration successful! Welcome bonus ৳100 added!");
          }
        } else {
          toast.success("Registration successful! Welcome bonus ৳100 added!");
        }

        if (activeTab === "phone") {
          await supabase
            .from("profiles")
            .update({ phone: `${countryCode}${phone}` })
            .eq("user_id", data.user.id);
        }

        if (data.session) {
          navigate("/welcome");
        } else {
          toast.success("Registration সফল! 🎉", {
            description:
              "আপনার email-এ একটি confirmation link পাঠানো হয়েছে। Email confirm করার পর login করুন।",
            duration: 8000,
          });
          setRegistrationSuccess(true);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRegister = async () => {
    setIsQuickRegLoading(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString(36);
      const quickEmail = `user_${randomId}${timestamp}@golucky.app`;
      const quickPassword = Math.random().toString(36).substring(2, 14) + "A1!";

      const { data, error } = await supabase.auth.signUp({
        email: quickEmail,
        password: quickPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            is_quick_register: true,
            referral_code: inviteCode || null,
          },
        },
      });

      if (error) {
        toast.error("Quick registration failed. Please try regular signup.");
        return;
      }

      if (data.user && data.session) {
        toast.success("🚀 Quick registration successful! Welcome bonus ৳100 added!");
        navigate("/welcome");
      } else if (data.user) {
        setRegistrationSuccess(true);
      }
    } catch (err) {
      console.error("Quick registration error:", err);
      toast.error("Quick registration failed. Please try again.");
    } finally {
      setIsQuickRegLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple" | "facebook") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Social sign-in unavailable right now.");
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <LuxuryBackground />
        <GlassCard className="relative z-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="luxe-text-gradient text-2xl font-black mb-3">Check Your Email</h2>
          <p className="text-[hsl(var(--luxe-ivory)/0.7)] text-sm mb-6">
            আপনার email-এ একটি confirmation link পাঠানো হয়েছে। Link-এ click করে account confirm করুন।
          </p>
          <LuxeButton onClick={() => navigate("/login")} className="w-full">
            Go to Login →
          </LuxeButton>
          <button
            onClick={() => setRegistrationSuccess(false)}
            className="mt-4 text-[hsl(var(--luxe-gold))] text-sm hover:opacity-80"
          >
            Register again
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Seo
        title="Create your GoLucky Account — ৳100 Welcome Bonus"
        description="Sign up for GoLucky in seconds. Get a ৳100 welcome bonus, daily login rewards, and access to Win Go, K3, 5D, TRX Win and more."
        path="/register"
      />
      <h1 className="sr-only">Create your GoLucky account</h1>

      <LuxuryBackground />

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14 items-center min-h-[calc(100vh-3rem)]">
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col gap-8"
          >
            <div className="flex flex-col items-start gap-4">
              <LogoMark3D />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-light text-[hsl(var(--luxe-ivory)/0.8)] tracking-wide"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Luck Starts Here
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_100%/0.03)] backdrop-blur-sm hover:border-[hsl(var(--luxe-border-gold))] transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[hsl(var(--luxe-emerald)/0.2)] to-[hsl(var(--luxe-gold)/0.2)] border border-[hsl(var(--luxe-border))]">
                    <b.icon size={16} className="text-[hsl(var(--luxe-gold))]" />
                  </span>
                  <span className="text-sm font-medium text-[hsl(var(--luxe-ivory)/0.9)]">
                    {b.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-center px-3 py-4 rounded-2xl border border-[hsl(var(--luxe-border-gold))] bg-[hsl(0_0%_0%/0.35)] backdrop-blur"
                >
                  <div className="luxe-text-gradient text-2xl font-black tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--luxe-ivory)/0.55)] mt-1">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <PremiumPill icon="🔒" label="SSL Protected" delay={1.1} />
              <PremiumPill icon="🛡️" label="Licensed Platform" delay={1.2} />
              <PremiumPill icon="⚡" label="Instant Withdraw" delay={1.3} />
            </div>
          </motion.section>

          <div className="w-full max-w-[520px] mx-auto lg:ml-auto">
            <div className="lg:hidden flex flex-col items-center mb-5">
              <LogoMark3D />
            </div>

            <GlassCard>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {([
                  { id: "user", label: "User", icon: UserIcon },
                  { id: "agent", label: "Agent", icon: Star },
                  { id: "quick", label: "Quick", icon: Zap },
                ] as const).map((opt) => {
                  const active = mode === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === "agent") {
                          navigate("/agent/apply");
                          return;
                        }
                        setMode(opt.id);
                      }}
                      whileTap={{ scale: 0.97 }}
                      aria-pressed={active}
                      className={`relative flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                        active
                          ? "border-[hsl(var(--luxe-border-gold))] bg-gradient-to-b from-[hsl(var(--luxe-gold)/0.18)] to-[hsl(var(--luxe-emerald)/0.1)] text-[hsl(var(--luxe-ivory))] shadow-[0_8px_24px_-8px_hsl(var(--luxe-gold)/0.5)]"
                          : "border-white/10 bg-black/30 text-[hsl(var(--luxe-ivory)/0.55)] hover:text-[hsl(var(--luxe-ivory))] hover:border-[hsl(var(--luxe-border))]"
                      }`}
                    >
                      <opt.icon size={16} />
                      <span>{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="text-center mb-4">
                <h2 className="luxe-text-gradient text-2xl font-black tracking-tight">
                  {mode === "quick" ? "Quick Account" : "Create Your Account"}
                </h2>
                <p className="text-xs text-[hsl(var(--luxe-ivory)/0.5)] mt-1 tracking-wide">
                  Join a world of luxury gaming
                </p>
              </div>

              {mode === "user" && (
                <>
                  <div className="flex mb-4 bg-black/40 rounded-full p-1 border border-white/5">
                    {[
                      { id: "email", label: "Email", icon: Mail },
                      { id: "phone", label: "Phone", icon: Phone },
                    ].map((tab) => {
                      const active = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as "phone" | "email")}
                          whileTap={{ scale: 0.97 }}
                          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-sm transition-colors ${
                            active
                              ? "text-[hsl(var(--luxe-black))]"
                              : "text-[hsl(var(--luxe-ivory)/0.6)] hover:text-[hsl(var(--luxe-ivory))]"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="reg-method-pill"
                              className="absolute inset-0 rounded-full"
                              style={{ background: "var(--luxe-gradient-primary)" }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative flex items-center gap-2">
                            <tab.icon size={16} />
                            {tab.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <LuxeInput
                        label="Full Name"
                        icon={UserIcon}
                        value={fullName}
                        onChange={setFullName}
                        disabled={isLoading}
                        maxLength={80}
                      />
                      <LuxeInput
                        label="Username"
                        icon={AtSign}
                        value={username}
                        onChange={(v) => setUsername(v.replace(/\s/g, "").toLowerCase())}
                        disabled={isLoading}
                        maxLength={30}
                      />
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === "phone" ? (
                        <motion.div
                          key="phone"
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          className="flex gap-2"
                        >
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-28 h-14 bg-black/40 border border-[hsl(var(--luxe-border-gold))] text-[hsl(var(--luxe-ivory))] rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[hsl(var(--luxe-black-2))] border-[hsl(var(--luxe-border-gold))]">
                              <SelectItem value="+880">🇧🇩 +880</SelectItem>
                              <SelectItem value="+91">🇮🇳 +91</SelectItem>
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            <LuxeInput
                              label="Phone Number"
                              icon={Phone}
                              type="tel"
                              value={phone}
                              onChange={(v) => setPhone(v.replace(/\D/g, ""))}
                              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                              error={phoneError}
                              isValid={phone.length >= 10 && !validatePhone(phone)}
                              disabled={isLoading}
                              maxLength={15}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="email"
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                        >
                          <LuxeInput
                            label="Email Address"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={setEmail}
                            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                            error={emailError}
                            isValid={email.length > 0 && !validateEmail(email)}
                            disabled={isLoading}
                            maxLength={255}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <LuxeInput
                      label="Password"
                      icon={Lock}
                      value={password}
                      onChange={(v) => {
                        setPassword(v);
                        setLeakedPasswordError(null);
                      }}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      error={passwordError || leakedPasswordError}
                      isValid={
                        password.length >= 6 && !validatePassword(password) && !leakedPasswordError
                      }
                      disabled={isLoading}
                      showPasswordToggle
                    />

                    {password.length > 0 && !leakedPasswordError && (
                      <motion.div
                        className="space-y-1 -mt-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                      >
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${passwordStrength.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: passwordStrength.width }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs font-semibold ${
                              passwordStrength.level === 1
                                ? "text-red-400"
                                : passwordStrength.level === 2
                                  ? "text-yellow-400"
                                  : passwordStrength.level >= 3
                                    ? "text-[hsl(var(--luxe-emerald))]"
                                    : "text-gray-500"
                            }`}
                          >
                            {passwordStrength.strength}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--luxe-ivory)/0.4)] tracking-wide">
                            8+ chars • A-Z • 0-9 • symbol
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <LuxeInput
                      label="Confirm Password"
                      icon={Shield}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                      error={confirmPasswordError}
                      isValid={confirmPassword.length > 0 && password === confirmPassword}
                      disabled={isLoading}
                      showPasswordToggle
                    />

                    <LuxeInput
                      label="Referral Code (optional)"
                      icon={Gift}
                      value={inviteCode}
                      onChange={(v) => setInviteCode(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                      isValid={inviteCode.length >= 6}
                      disabled={isLoading}
                      maxLength={12}
                    />

                    {inviteCode.startsWith("AG-") && inviteCode.length === 9 && (
                      <p className="text-[hsl(var(--luxe-gold))] text-xs flex items-center gap-1 pl-2">
                        <CheckCircle2 size={12} /> 🏆 Agent referral — extra bonus on signup!
                      </p>
                    )}
                    {inviteCode.startsWith("REF-") && inviteCode.length >= 10 && (
                      <p className="text-[hsl(var(--luxe-emerald))] text-xs flex items-center gap-1 pl-2">
                        <CheckCircle2 size={12} /> 👥 User referral — you'll receive ৳100 bonus!
                      </p>
                    )}

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/30 border border-[hsl(var(--luxe-border))]">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(c) => setAgreedToTerms(c as boolean)}
                        className="w-5 h-5 border-[hsl(var(--luxe-border-gold))] data-[state=checked]:bg-[hsl(var(--luxe-emerald))] data-[state=checked]:border-[hsl(var(--luxe-emerald))] rounded mt-0.5"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="terms"
                        className="text-xs text-[hsl(var(--luxe-ivory)/0.7)] leading-relaxed cursor-pointer"
                      >
                        I agree to the{" "}
                        <span className="text-[hsl(var(--luxe-gold))] hover:underline">
                          Terms of Service
                        </span>{" "}
                        and{" "}
                        <span className="text-[hsl(var(--luxe-gold))] hover:underline">
                          Privacy Policy
                        </span>
                      </label>
                    </div>

                    <LuxeButton
                      type="submit"
                      className="w-full mt-1"
                      loading={isLoading}
                      disabled={!isFormValid || isLoading || !!leakedPasswordError}
                    >
                      <span>
                        {isCheckingPassword ? "Checking security…" : "Create My Account"}
                      </span>
                      <ArrowRight size={18} />
                    </LuxeButton>
                  </form>
                </>
              )}

              {mode === "quick" && (
                <div className="space-y-4">
                  <LuxeInput
                    label="Referral Code (optional)"
                    icon={Gift}
                    value={inviteCode}
                    onChange={(v) => setInviteCode(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                    disabled={isQuickRegLoading}
                    maxLength={12}
                  />
                  <LuxeButton
                    type="button"
                    variant="neon"
                    className="w-full"
                    loading={isQuickRegLoading}
                    onClick={handleQuickRegister}
                  >
                    <Zap size={18} />
                    <span>1-Click Quick Register</span>
                  </LuxeButton>
                  <p className="text-center text-[hsl(var(--luxe-ivory)/0.5)] text-xs">
                    💡 Skip the form — you can add referral code later.
                  </p>
                </div>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--luxe-border-gold))] to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--luxe-ivory)/0.5)]">
                  Continue with
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--luxe-border-gold))] to-transparent" />
              </div>

              <div className="flex items-center justify-center gap-3">
                {[
                  { id: "google", label: "Google", icon: "G", provider: "google" as const },
                  { id: "facebook", label: "Facebook", icon: "f", provider: "facebook" as const },
                  { id: "apple", label: "Apple", icon: "", provider: "apple" as const },
                  { id: "telegram", label: "Telegram", icon: "✈", provider: null },
                  { id: "whatsapp", label: "WhatsApp", icon: "✆", provider: null },
                ].map((s) => (
                  <motion.button
                    key={s.id}
                    type="button"
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      s.provider
                        ? handleSocial(s.provider)
                        : toast.info(`${s.label} sign-in coming soon`)
                    }
                    aria-label={`Continue with ${s.label}`}
                    className="w-11 h-11 rounded-full border border-[hsl(var(--luxe-border-gold))] bg-black/40 backdrop-blur flex items-center justify-center text-[hsl(var(--luxe-ivory))] font-bold hover:border-[hsl(var(--luxe-gold))] hover:shadow-[0_0_20px_hsl(var(--luxe-gold)/0.4)] transition-all"
                  >
                    <span className="text-lg leading-none">{s.icon}</span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-5 text-center">
                <span className="text-[hsl(var(--luxe-ivory)/0.55)] text-sm">
                  Already have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="story-link text-[hsl(var(--luxe-gold))] font-semibold text-sm hover:text-[hsl(var(--luxe-gold-soft))]"
                >
                  Login Now
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
