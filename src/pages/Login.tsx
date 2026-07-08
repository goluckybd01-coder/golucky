import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  Lock,
  Zap,
  Fingerprint,
  QrCode,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Trophy,
  Coins,
  Crown,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

type LoginType = "user" | "agent" | "quick";
type Method = "email" | "phone";

const validateEmail = (v: string) =>
  !v ? null : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email address";
const validatePhone = (v: string) =>
  !v ? null : /^\d{10,15}$/.test(v) ? null : "Enter 10–15 digits";
const validatePassword = (v: string) =>
  !v ? null : v.length < 6 ? "Minimum 6 characters" : null;

const SECURITY_BADGES = [
  { icon: ShieldCheck, label: "SSL Encrypted" },
  { icon: KeyRound, label: "256-bit Security" },
  { icon: Fingerprint, label: "2FA Protected" },
  { icon: Zap, label: "Instant Login" },
];

const LIVE_STATS = [
  { label: "Players Online", value: "42,318", tone: "emerald" as const },
  { label: "Today's Winners", value: "8,742", tone: "gold" as const },
  { label: "Instant Withdraw", value: "৳12.4 Cr", tone: "emerald" as const },
];

const FLOAT_ICONS = [
  { Icon: Trophy, color: "hsl(var(--luxe-gold))", x: "8%", y: "10%", d: 0 },
  { Icon: Coins, color: "hsl(var(--luxe-gold-soft))", x: "78%", y: "22%", d: 0.4 },
  { Icon: Crown, color: "hsl(var(--luxe-gold))", x: "12%", y: "72%", d: 0.8 },
  { Icon: Wallet, color: "hsl(var(--luxe-emerald))", x: "70%", y: "78%", d: 1.2 },
  { Icon: Sparkles, color: "hsl(var(--luxe-emerald-soft))", x: "50%", y: "48%", d: 1.6 },
];

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<LoginType>("user");
  const [method, setMethod] = useState<Method>("email");
  const [countryCode, setCountryCode] = useState("+880");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, phone: false, password: false });

  // Mouse-follow reflection
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const emailErr = touched.email ? validateEmail(email) : null;
  const phoneErr = touched.phone ? validatePhone(phone) : null;
  const passErr = touched.password ? validatePassword(password) : null;

  const isValid =
    !passErr &&
    password.length >= 6 &&
    ((method === "email" && !emailErr && email.length > 0) ||
      (method === "phone" && !phoneErr && phone.length >= 10));

  const routeForRole = async (userId: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const roles = (data ?? []).map((r) => r.role as string);
      if (roles.includes("super_admin") || roles.includes("admin")) return "/admin";
      if (roles.includes("agent")) return "/agent";
      return "/home";
    } catch {
      return "/home";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, phone: true, password: true });
    if (!isValid) return;
    setIsLoading(true);
    try {
      const loginEmail =
        method === "phone"
          ? `${countryCode.replace("+", "")}${phone}@phone.local`
          : email;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) {
        if (/invalid_credentials|Invalid login credentials/.test(error.message)) {
          toast.error("Wrong credentials", { description: "Please try again" });
        } else if (/Email not confirmed/.test(error.message)) {
          toast.warning("Email not confirmed", { description: "Check your inbox" });
        } else if (/Too many requests/.test(error.message)) {
          toast.error("Too many attempts", { description: "Try again shortly" });
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (!data.session || !data.user) {
        toast.warning("Please confirm your email");
        return;
      }

      const destination = await routeForRole(data.user.id);

      if (loginType === "agent" && destination !== "/agent") {
        await supabase.auth.signOut();
        toast.error("Agent account required", {
          description: "This login is for verified agents only.",
        });
        return;
      }

      toast.success("Welcome back to GoLucky 🎉");
      navigate(destination);
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) toast.error("Google sign-in failed");
    } catch {
      toast.error("Google sign-in unavailable");
    }
  };

  const socialSoon = (name: string) =>
    toast.info(`${name} login coming soon`, {
      description: "Rolling out to all regions shortly.",
    });

  const quickLogin = () =>
    toast.info("Device Login ready", {
      description: "Fingerprint / Face ID activation on native app.",
    });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(var(--luxe-black))]">
      <Seo
        title="Sign In · GoLucky — Premium Crypto Gaming"
        description="Access your GoLucky account. Luxury emerald-gold experience, instant withdrawals, VIP club and 24/7 support."
        path="/login"
      />
      <LuxuryBackground />

      {/* Mouse-follow gold reflection */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, hsl(var(--luxe-gold) / 0.08), transparent 60%)`,
        }}
      />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14 max-w-[1400px] mx-auto px-5 sm:px-8 py-8 lg:py-14">
        {/* ============ LEFT — Hero / Illustration ============ */}
        <section className="hidden lg:flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark3D />
              <div>
                <div className="text-xs tracking-[0.4em] text-[hsl(var(--luxe-gold))] font-semibold">
                  PLAY · EARN · WIN
                </div>
                <div className="text-[10px] text-[hsl(var(--luxe-ivory)/0.5)] tracking-widest">
                  GOLUCKY · EST. 2012
                </div>
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mt-10 text-5xl xl:text-6xl font-black leading-[1.05] text-[hsl(var(--luxe-ivory))]"
            >
              Welcome
              <br />
              <span className="luxe-text-gradient">Back to Luxury.</span>
            </motion.h1>

            <p className="mt-5 max-w-md text-[hsl(var(--luxe-ivory)/0.65)] text-base leading-relaxed">
              A cinematic casino & crypto experience — engineered for speed,
              trust and pure elegance. Your luck starts the moment you sign in.
            </p>

            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[hsl(var(--luxe-gold)/0.35)] bg-[hsl(0_0%_100%/0.03)] backdrop-blur"
              style={{ boxShadow: "0 0 30px hsl(var(--luxe-gold) / 0.15)" }}
            >
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--luxe-emerald))] animate-pulse" />
              <span className="text-sm font-semibold text-[hsl(var(--luxe-ivory))]">
                Trusted by <span className="text-[hsl(var(--luxe-gold))]">100,000+</span> premium players
              </span>
            </motion.div>
          </div>

          {/* Floating luxury icons canvas */}
          <div className="relative h-[320px] mt-10">
            {FLOAT_ICONS.map(({ Icon, color, x, y, d }, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: x, top: y, color }}
                animate={{ y: [0, -14, 0], rotate: [0, 6, -4, 0] }}
                transition={{ duration: 6 + i, repeat: Infinity, delay: d, ease: "easeInOut" }}
              >
                <div
                  className="p-4 rounded-2xl backdrop-blur-xl border"
                  style={{
                    borderColor: `${color.replace(")", " / 0.35)")}`,
                    background: `${color.replace(")", " / 0.08)")}`,
                    boxShadow: `0 8px 40px ${color.replace(")", " / 0.25)")}`,
                  }}
                >
                  <Icon size={26} strokeWidth={1.6} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {LIVE_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="rounded-2xl p-4 border backdrop-blur-xl"
                style={{
                  borderColor:
                    s.tone === "gold"
                      ? "hsl(var(--luxe-gold) / 0.3)"
                      : "hsl(var(--luxe-emerald) / 0.3)",
                  background: "hsl(0 0% 100% / 0.03)",
                }}
              >
                <div
                  className="text-xl font-bold"
                  style={{
                    color:
                      s.tone === "gold"
                        ? "hsl(var(--luxe-gold))"
                        : "hsl(var(--luxe-emerald))",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-[11px] text-[hsl(var(--luxe-ivory)/0.55)] mt-1 tracking-wide">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ RIGHT — Login Card ============ */}
        <section className="flex flex-col items-center justify-center w-full">
          {/* Mobile hero */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <LogoMark3D />
            <div className="mt-3 text-[10px] tracking-[0.4em] text-[hsl(var(--luxe-gold))] font-semibold">
              PLAY · EARN · WIN
            </div>
          </div>

          <GlassCard className="w-full max-w-md relative">
            {/* animated gold border shine */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-[32px] pointer-events-none"
              style={{
                padding: 1,
                background:
                  "conic-gradient(from 0deg, hsl(var(--luxe-gold) / 0.6), transparent 30%, hsl(var(--luxe-emerald) / 0.5), transparent 70%, hsl(var(--luxe-gold) / 0.6))",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            <div className="text-center mb-4 relative">
              <h2 className="text-2xl font-bold text-[hsl(var(--luxe-ivory))]">
                Welcome Back
              </h2>
              <p className="text-sm text-[hsl(var(--luxe-ivory)/0.55)] mt-1">
                Your Luck Starts Here
              </p>
            </div>

            {/* Login Type tabs */}
            <div className="grid grid-cols-3 mb-4 rounded-full p-1 bg-[hsl(0_0%_100%/0.04)] border border-[hsl(var(--luxe-border))] relative">
              {(
                [
                  { id: "user", label: "User" },
                  { id: "agent", label: "Agent" },
                  { id: "quick", label: "Quick" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLoginType(t.id)}
                  className={`relative py-2 rounded-full text-xs font-semibold transition-colors ${
                    loginType === t.id
                      ? "text-[hsl(var(--luxe-black))]"
                      : "text-[hsl(var(--luxe-ivory)/0.65)] hover:text-[hsl(var(--luxe-gold))]"
                  }`}
                >
                  {loginType === t.id && (
                    <motion.span
                      layoutId="luxe-type"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "var(--luxe-gradient-primary)",
                        boxShadow: "var(--luxe-glow-button)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t.label} Login</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {loginType === "quick" ? (
                <motion.div
                  key="quick"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="text-center py-4">
                    <div className="text-sm text-[hsl(var(--luxe-ivory)/0.7)]">
                      One-tap secure device login
                    </div>
                    <div className="text-[11px] text-[hsl(var(--luxe-ivory)/0.45)] mt-1">
                      Fingerprint · Face ID · QR (Desktop)
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={quickLogin}
                      className="p-4 rounded-2xl border border-[hsl(var(--luxe-emerald)/0.35)] bg-[hsl(var(--luxe-emerald)/0.08)] hover:bg-[hsl(var(--luxe-emerald)/0.14)] transition-all group"
                    >
                      <Fingerprint className="mx-auto text-[hsl(var(--luxe-emerald))] group-hover:scale-110 transition-transform" size={30} />
                      <div className="mt-2 text-xs font-semibold text-[hsl(var(--luxe-ivory))]">Biometric</div>
                    </button>
                    <button
                      type="button"
                      onClick={quickLogin}
                      className="p-4 rounded-2xl border border-[hsl(var(--luxe-gold)/0.35)] bg-[hsl(var(--luxe-gold)/0.08)] hover:bg-[hsl(var(--luxe-gold)/0.14)] transition-all group"
                    >
                      <QrCode className="mx-auto text-[hsl(var(--luxe-gold))] group-hover:scale-110 transition-transform" size={30} />
                      <div className="mt-2 text-xs font-semibold text-[hsl(var(--luxe-ivory))]">QR Login</div>
                    </button>
                  </div>
                  <LuxeButton
                    type="button"
                    variant="neon"
                    onClick={quickLogin}
                    className="w-full"
                  >
                    <Zap size={18} className="text-[hsl(var(--luxe-emerald))]" />
                    Activate Device Login
                  </LuxeButton>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  {/* Method toggle */}
                  <div className="flex mb-1 rounded-full p-1 bg-[hsl(0_0%_100%/0.04)] border border-[hsl(var(--luxe-border))]">
                    {(
                      [
                        { id: "email", label: "Email", icon: Mail },
                        { id: "phone", label: "Phone", icon: Phone },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMethod(t.id)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                          method === t.id
                            ? "text-[hsl(var(--luxe-black))]"
                            : "text-[hsl(var(--luxe-ivory)/0.65)] hover:text-[hsl(var(--luxe-gold))]"
                        }`}
                      >
                        {method === t.id && (
                          <motion.span
                            layoutId="luxe-method"
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "var(--luxe-gradient-primary)",
                              boxShadow: "var(--luxe-glow-button)",
                            }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <t.icon size={13} className="relative z-10" />
                        <span className="relative z-10">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {method === "phone" ? (
                      <motion.div
                        key="phone"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className="flex gap-2"
                      >
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-24 h-14 rounded-2xl bg-[hsl(0_0%_100%/0.04)] border-[hsl(var(--luxe-border))] text-[hsl(var(--luxe-ivory))]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[hsl(var(--luxe-black-2))] border-[hsl(var(--luxe-border))]">
                            <SelectItem value="+880">🇧🇩 +880</SelectItem>
                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex-1">
                          <LuxeInput
                            label="Phone number"
                            icon={Phone}
                            type="tel"
                            inputMode="numeric"
                            value={phone}
                            onChange={(v) => setPhone(v.replace(/\D/g, ""))}
                            onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                            error={phoneErr}
                            isValid={phone.length >= 10 && !validatePhone(phone)}
                            maxLength={15}
                            disabled={isLoading}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="email"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                      >
                        <LuxeInput
                          label="Email address"
                          icon={Mail}
                          type="email"
                          value={email}
                          onChange={setEmail}
                          onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                          error={emailErr}
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
                    onChange={setPassword}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    error={passErr}
                    isValid={password.length >= 6 && !validatePassword(password)}
                    showPasswordToggle
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-[hsl(var(--luxe-ivory)/0.75)]">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded accent-[hsl(var(--luxe-emerald))]"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="font-semibold text-[hsl(var(--luxe-gold))] hover:text-[hsl(var(--luxe-gold-soft))] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <LuxeButton
                    type="submit"
                    loading={isLoading}
                    disabled={!isValid || isLoading}
                    className="w-full mt-1 group"
                  >
                    Sign In Securely
                    <ArrowRight
                      size={18}
                      className="ml-1 transition-transform group-hover:translate-x-1"
                    />
                  </LuxeButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--luxe-gold)/0.3)] to-transparent" />
              <span className="text-[10px] tracking-[0.28em] text-[hsl(var(--luxe-ivory)/0.4)] font-semibold">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--luxe-gold)/0.3)] to-transparent" />
            </div>

            {/* Social row */}
            <div className="flex items-center justify-center gap-3 pt-3">
              {[
                {
                  name: "Google",
                  onClick: handleGoogle,
                  svg: (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.7 12 .7 7.4.7 3.5 3.3 1.6 7.1l3.7 2.9C6.3 7 8.9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6z" />
                      <path fill="#FBBC05" d="M5.3 14.4C5.1 13.7 5 13 5 12.3s.1-1.4.3-2.1L1.6 7.3C.6 9.3 0 11.7 0 14.3s.6 5 1.6 7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.8-2.9l-3.7-2.9c-1 .7-2.3 1.1-4.1 1.1-3.1 0-5.7-2.1-6.7-4.9l-3.7 2.9C3.5 20.7 7.4 24 12 24z" />
                    </svg>
                  ),
                },
                {
                  name: "Apple",
                  onClick: () => socialSoon("Apple"),
                  svg: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--luxe-ivory))">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  ),
                },
                {
                  name: "Facebook",
                  onClick: () => socialSoon("Facebook"),
                  svg: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12a12 12 0 10-13.87 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.68 4.53-4.68 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0024 12z" />
                    </svg>
                  ),
                },
                {
                  name: "Telegram",
                  onClick: () => socialSoon("Telegram"),
                  svg: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#229ED9">
                      <path d="M9.78 15.53l-.4 5.66c.58 0 .83-.25 1.13-.55l2.71-2.59 5.62 4.11c1.03.57 1.77.27 2.05-.95l3.72-17.42c.36-1.53-.55-2.13-1.56-1.76L1.14 9.42C-.36 10-.34 10.86.88 11.23l5.55 1.73L19.2 4.9c.6-.4 1.15-.18.7.22" />
                    </svg>
                  ),
                },
                {
                  name: "WhatsApp",
                  onClick: () => socialSoon("WhatsApp"),
                  svg: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M20.52 3.48A11.9 11.9 0 0012.06 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.32-1.66a11.9 11.9 0 005.73 1.46h.01c6.56 0 11.89-5.33 11.89-11.9 0-3.18-1.24-6.17-3.43-8.42zM12.06 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.75.98 1-3.65-.23-.37a9.87 9.87 0 01-1.52-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 012.9 7.02c0 5.47-4.45 9.92-9.92 9.92z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <motion.button
                  key={s.name}
                  type="button"
                  onClick={s.onClick}
                  aria-label={`Continue with ${s.name}`}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-[hsl(0_0%_100%/0.04)] border border-[hsl(var(--luxe-border-gold))] hover:border-[hsl(var(--luxe-gold)/0.6)] transition-colors"
                  style={{ boxShadow: "0 4px 20px hsl(var(--luxe-black) / 0.4)" }}
                >
                  {s.svg}
                </motion.button>
              ))}
            </div>

            {/* Bottom links */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
              <button
                onClick={() => navigate("/register")}
                className="text-[hsl(var(--luxe-ivory)/0.7)] hover:text-[hsl(var(--luxe-gold))] transition-colors"
              >
                Don't have an account?{" "}
                <span className="font-bold luxe-text-gradient">Create Account</span>
              </button>
              <button
                onClick={() => navigate("/agent/register")}
                className="font-semibold text-[hsl(var(--luxe-emerald))] hover:text-[hsl(var(--luxe-emerald-soft))] transition-colors inline-flex items-center gap-1"
              >
                <Crown size={14} /> Become an Agent
              </button>
            </div>
          </GlassCard>

          {/* Security badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
            {SECURITY_BADGES.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_100%/0.03)] text-[11px] text-[hsl(var(--luxe-ivory)/0.7)]"
              >
                <b.icon size={12} className="text-[hsl(var(--luxe-emerald))]" />
                {b.label}
              </motion.div>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-[hsl(var(--luxe-ivory)/0.35)] tracking-wider">
            Protected by GoLucky Trust · TLS 1.3 · JWT Session
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
