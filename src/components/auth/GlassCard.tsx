import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  AtSign,
  Mail,
  Phone,
  Globe2,
  Send,
  MessageCircle,
  Lock,
  Shield,
  Gift,
  Wallet,
  Building2,
  Users,
  TrendingUp,
  Rocket,
  Share2,
  Link as LinkIcon,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Sparkles,
  Zap,
  Gem,
  Headphones,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { validatePasswordSecurity } from "@/lib/passwordSecurity";
import Seo from "@/components/seo/Seo";
import LuxuryBackground from "@/components/auth-premium/LuxuryBackground";
import GlassCard from "@/components/auth-premium/GlassCard";
import LuxeInput from "@/components/auth-premium/LuxeInput";
import LuxeButton from "@/components/auth-premium/LuxeButton";
import LogoMark3D from "@/components/auth-premium/LogoMark3D";

const COUNTRIES = [
  { code: "BD", label: "🇧🇩 Bangladesh", dial: "+880" },
  { code: "IN", label: "🇮🇳 India", dial: "+91" },
  { code: "PK", label: "🇵🇰 Pakistan", dial: "+92" },
  { code: "AE", label: "🇦🇪 UAE", dial: "+971" },
  { code: "US", label: "🇺🇸 USA", dial: "+1" },
  { code: "GB", label: "🇬🇧 UK", dial: "+44" },
];

const PAYMENT_METHODS = [
  { id: "usdt", label: "USDT (TRC-20)" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "bank", label: "Bank Transfer" },
];

const TRAFFIC_SOURCES = [
  "Facebook",
  "YouTube",
  "Telegram",
  "TikTok",
  "Instagram",
  "Website / Blog",
  "Word of Mouth",
  "Other",
];

const EXPERIENCE = [
  "New to affiliate marketing",
  "1-2 years experience",
  "3-5 years experience",
  "5+ years experience",
];

const REFERRAL_TIERS = [50, 100, 500, 1000, 5000];

const BENEFITS = [
  { icon: Crown, label: "Up to 70% Commission" },
  { icon: Users, label: "Unlimited Referral Levels" },
  { icon: Zap, label: "Daily Commission Settlement" },
  { icon: Wallet, label: "Instant Withdraw" },
  { icon: Gem, label: "Exclusive Bonuses" },
  { icon: Headphones, label: "VIP Partner Support" },
];

const STATS = [
  { value: "100,000+", label: "Active Players" },
  { value: "20,000+", label: "Agents" },
  { value: "99.99%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const validateEmail = (v: string) =>
  !v ? "Email is required" : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email";
const validatePhone = (v: string) =>
  !v ? "Phone is required" : /^\d{10,15}$/.test(v) ? null : "10-15 digits only";
const validatePwd = (v: string) => (v.length < 6 ? "Min 6 characters" : null);

const getStrength = (pwd: string) => {
  if (!pwd) return { level: 0, label: "", color: "from-white/10 to-white/10", width: "0%" };
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 2) return { level: 1, label: "Weak", color: "from-red-500 to-rose-400", width: "30%" };
  if (s <= 3) return { level: 2, label: "Medium", color: "from-amber-500 to-yellow-400", width: "60%" };
  if (s <= 4) return { level: 3, label: "Strong", color: "from-emerald-500 to-emerald-400", width: "85%" };
  return { level: 4, label: "Very Strong", color: "from-emerald-400 via-yellow-300 to-amber-400", width: "100%" };
};

const genAgentId = () => {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `GLA-${rand}`;
};
const genReferral = () => `AG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

interface SuccessData {
  agentId: string;
  referralCode: string;
  referralLink: string;
  emailConfirm: boolean;
}

const AgentRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  // Step 1 — Basic
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("BD");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSecErr, setPwdSecErr] = useState<string | null>(null);

  // Step 2 — Agent info
  const [businessName, setBusinessName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [social, setSocial] = useState("");
  const [experience, setExperience] = useState(EXPERIENCE[0]);
  const [trafficSource, setTrafficSource] = useState(TRAFFIC_SOURCES[0]);
  const [expectedRefs, setExpectedRefs] = useState(100);
  const [payment, setPayment] = useState("usdt");
  const [referralCode, setReferralCode] = useState("");

  // Step 3
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedAffiliate, setAgreedAffiliate] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const emailErr = touched.email ? validateEmail(email) : null;
  const phoneErr = touched.phone ? validatePhone(phone) : null;
  const pwdErr = touched.password ? validatePwd(password) : null;
  const cpwdErr =
    touched.confirmPwd && confirmPwd
      ? password !== confirmPwd
        ? "Passwords do not match"
        : null
      : null;
  const strength = getStrength(password);

  const dial = COUNTRIES.find((c) => c.code === country)?.dial ?? "+880";

  const step1Valid =
    fullName.trim().length >= 2 &&
    username.trim().length >= 3 &&
    !validateEmail(email) &&
    !validatePhone(phone) &&
    !validatePwd(password) &&
    password === confirmPwd &&
    !pwdSecErr;

  const step2Valid =
    businessName.trim().length >= 2 && trafficSource && experience && payment;

  const step3Valid = agreedTerms && agreedPrivacy && agreedAffiliate;

  // Commission calculator (illustrative): ৳ per active player per month × commission %
  const estimatedCommission = useMemo(() => {
    const arpu = 800; // avg BDT per player / month
    const rate = 0.35; // 35% avg partner share
    return Math.round(expectedRefs * arpu * rate);
  }, [expectedRefs]);

  const goNext = async () => {
    if (step === 1) {
      setTouched({
        email: true,
        phone: true,
        password: true,
        confirmPwd: true,
        fullName: true,
        username: true,
      });
      if (!step1Valid) {
        toast.error("Please complete all required fields");
        return;
      }
      // Password breach check
      try {
        const err = await validatePasswordSecurity(password);
        if (err) {
          setPwdSecErr(err);
          toast.error(err);
          return;
        }
      } catch {
        /* fail-open */
      }
      setStep(2);
    } else if (step === 2) {
      if (!step2Valid) {
        toast.error("Please complete business information");
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s));

  const submit = async () => {
    if (!step3Valid) {
      toast.error("Please accept all agreements");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/agent/dashboard`,
          data: {
            full_name: fullName,
            username,
            phone: `${dial}${phone}`,
            country,
            intended_role: "agent",
            referral_code: referralCode || null,
            agent_meta: {
              business_name: businessName,
              telegram,
              whatsapp,
              website,
              social,
              experience,
              traffic_source: trafficSource,
              expected_refs: expectedRefs,
              preferred_payment: payment,
            },
          },
        },
      });
      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "This email is already registered. Try logging in."
            : error.message
        );
        return;
      }

      const agentId = genAgentId();
      const referral = genReferral();
      const link = `${window.location.origin}/register?ref=${referral}`;

      // Best-effort profile update — silently ignore if RLS blocks pre-confirmation
      if (data.user) {
        try {
          await supabase
            .from("profiles")
            .update({
              phone: `${dial}${phone}`,
              agent_status: "pending",
            })
            .eq("user_id", data.user.id);
        } catch {
          /* ignore */
        }
      }

      setSuccess({
        agentId,
        referralCode: referral,
        referralLink: link,
        emailConfirm: !data.session,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // ─── SUCCESS SCREEN ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
        <LuxuryBackground />
        <GlassCard className="relative z-10 w-full max-w-lg text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "var(--luxe-gradient-primary)",
              boxShadow: "var(--luxe-glow-emerald)",
            }}
          >
            <CheckCircle2 size={40} className="text-[hsl(var(--luxe-black))]" />
          </motion.div>
          <h2 className="luxe-text-gradient text-3xl font-black mb-2">
            Registration Successful
          </h2>
          <p className="text-[hsl(var(--luxe-ivory)/0.7)] text-sm mb-6">
            Welcome to the GoLucky Partner Network. Your application is under review.
          </p>

          <div className="space-y-3 text-left">
            <SuccessRow
              label="Agent ID"
              value={success.agentId}
              icon={BadgeCheck}
              onCopy={() => copy(success.agentId, "Agent ID")}
            />
            <SuccessRow
              label="Referral Code"
              value={success.referralCode}
              icon={Gift}
              onCopy={() => copy(success.referralCode, "Referral code")}
            />
            <SuccessRow
              label="Referral Link"
              value={success.referralLink}
              icon={LinkIcon}
              onCopy={() => copy(success.referralLink, "Referral link")}
              small
            />
            <div className="flex items-center gap-2 p-3 rounded-2xl border border-[hsl(var(--luxe-border-gold))] bg-black/30">
              <span
                aria-hidden
                className="w-2 h-2 rounded-full bg-[hsl(var(--luxe-gold))] animate-pulse"
              />
              <span className="text-xs text-[hsl(var(--luxe-ivory)/0.8)] font-semibold uppercase tracking-wider">
                Status: Pending Verification
              </span>
            </div>
          </div>

          {success.emailConfirm && (
            <p className="mt-4 text-xs text-[hsl(var(--luxe-ivory)/0.6)]">
              📧 Please confirm your email address to activate your agent account.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <LuxeButton onClick={() => navigate("/login")} className="w-full">
              Go to Agent Login <ArrowRight size={18} />
            </LuxeButton>
            <button
              onClick={() => navigate("/")}
              className="text-[hsl(var(--luxe-ivory)/0.6)] text-sm hover:text-[hsl(var(--luxe-gold))]"
            >
              Back to Home
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ─── MAIN ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Seo
        title="Become a GoLucky Partner — Agent Registration"
        description="Join the GoLucky Partner network. Up to 70% commission, daily settlement, instant withdrawals, and exclusive partner bonuses."
        path="/agent/register"
      />
      <h1 className="sr-only">GoLucky Agent Registration</h1>
      <LuxuryBackground />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-8 lg:gap-14">
          {/* ── LEFT 40% ── */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col gap-8"
          >
            <div className="flex flex-col items-start gap-4">
              <LogoMark3D tagline="PARTNER PROGRAM" />
              <h2 className="text-4xl font-black leading-tight text-[hsl(var(--luxe-ivory))]">
                Become a{" "}
                <span className="luxe-text-gradient">GoLucky Partner</span>
              </h2>
              <p className="text-lg text-[hsl(var(--luxe-ivory)/0.75)] leading-relaxed">
                Build your team.
                <br />
                <span className="luxe-text-gradient font-bold">
                  Earn unlimited commission.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[hsl(var(--luxe-border))] bg-[hsl(0_0%_100%/0.03)] backdrop-blur-sm hover:border-[hsl(var(--luxe-border-gold))] transition-colors"
                >
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[hsl(var(--luxe-emerald)/0.22)] to-[hsl(var(--luxe-gold)/0.22)] border border-[hsl(var(--luxe-border))]">
                    <b.icon size={18} className="text-[hsl(var(--luxe-gold))]" />
                  </span>
                  <span className="text-sm font-semibold text-[hsl(var(--luxe-ivory))]">
                    {b.label}
                  </span>
                  <CheckCircle2
                    size={16}
                    className="ml-auto text-[hsl(var(--luxe-emerald))]"
                  />
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="text-center px-3 py-4 rounded-2xl border border-[hsl(var(--luxe-border-gold))] bg-black/40 backdrop-blur"
                >
                  <div className="luxe-text-gradient text-2xl font-black tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--luxe-ivory)/0.55)] mt-1">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Commission calculator preview */}
            <div className="p-5 rounded-3xl border border-[hsl(var(--luxe-border-gold))] bg-gradient-to-br from-[hsl(var(--luxe-emerald)/0.08)] to-[hsl(var(--luxe-gold)/0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[hsl(var(--luxe-gold))]" />
                <span className="text-xs uppercase tracking-[0.18em] font-bold text-[hsl(var(--luxe-ivory))]">
                  Live Commission Estimator
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[hsl(var(--luxe-ivory)/0.6)] text-sm">
                  {expectedRefs.toLocaleString()} active players
                </span>
                <ArrowRight size={14} className="text-[hsl(var(--luxe-gold))]" />
              </div>
              <motion.div
                key={estimatedCommission}
                initial={{ scale: 0.9, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                className="luxe-text-gradient text-4xl font-black mt-1"
              >
                ৳{estimatedCommission.toLocaleString("en-IN")}
              </motion.div>
              <div className="text-[11px] text-[hsl(var(--luxe-ivory)/0.55)] mt-1">
                estimated monthly commission
              </div>
            </div>
          </motion.aside>

          {/* ── RIGHT 60% ── */}
          <div className="w-full">
            {/* Mobile brand */}
            <div className="lg:hidden flex flex-col items-center mb-5">
              <LogoMark3D tagline="PARTNER PROGRAM" />
              <h2 className="mt-2 text-2xl font-black text-center luxe-text-gradient">
                Become a Partner
              </h2>
            </div>

            <GlassCard>
              {/* Stepper */}
              <Stepper step={step} />

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-3 mt-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LuxeInput
                        label="Full Name"
                        icon={UserIcon}
                        value={fullName}
                        onChange={setFullName}
                        onBlur={() => touch("fullName")}
                        error={touched.fullName && fullName.trim().length < 2 ? "Required" : null}
                        isValid={fullName.trim().length >= 2}
                        maxLength={80}
                      />
                      <LuxeInput
                        label="Username"
                        icon={AtSign}
                        value={username}
                        onChange={(v) => setUsername(v.toLowerCase().replace(/\s/g, ""))}
                        onBlur={() => touch("username")}
                        error={touched.username && username.length < 3 ? "Min 3 chars" : null}
                        isValid={username.length >= 3}
                        maxLength={30}
                      />
                    </div>

                    <LuxeInput
                      label="Email Address"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      onBlur={() => touch("email")}
                      error={emailErr}
                      isValid={!!email && !validateEmail(email)}
                      maxLength={255}
                    />

                    <div className="grid grid-cols-[130px_1fr] gap-3">
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="h-14 bg-black/40 border border-[hsl(var(--luxe-border-gold))] text-[hsl(var(--luxe-ivory))] rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(var(--luxe-black-2))] border-[hsl(var(--luxe-border-gold))]">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label} {c.dial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <LuxeInput
                        label={`Phone (${dial})`}
                        icon={Phone}
                        type="tel"
                        value={phone}
                        onChange={(v) => setPhone(v.replace(/\D/g, ""))}
                        onBlur={() => touch("phone")}
                        error={phoneErr}
                        isValid={!!phone && !validatePhone(phone)}
                        maxLength={15}
                      />
                    </div>

                    <LuxeInput
                      label="Password"
                      icon={Lock}
                      value={password}
                      onChange={(v) => {
                        setPassword(v);
                        setPwdSecErr(null);
                      }}
                      onBlur={() => touch("password")}
                      error={pwdErr || pwdSecErr}
                      isValid={!!password && !validatePwd(password) && !pwdSecErr}
                      showPasswordToggle
                    />

                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${strength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: strength.width }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span
                            className={
                              strength.level === 1
                                ? "text-red-400"
                                : strength.level === 2
                                  ? "text-amber-400"
                                  : "text-[hsl(var(--luxe-emerald))]"
                            }
                          >
                            {strength.label}
                          </span>
                          <span className="text-[hsl(var(--luxe-ivory)/0.4)] text-[10px] tracking-wide">
                            8+ chars • A-Z • 0-9 • symbol
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <LuxeInput
                      label="Confirm Password"
                      icon={Shield}
                      value={confirmPwd}
                      onChange={setConfirmPwd}
                      onBlur={() => touch("confirmPwd")}
                      error={cpwdErr}
                      isValid={!!confirmPwd && password === confirmPwd}
                      showPasswordToggle
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-3 mt-5"
                  >
                    <LuxeInput
                      label="Business / Team Name"
                      icon={Building2}
                      value={businessName}
                      onChange={setBusinessName}
                      isValid={businessName.trim().length >= 2}
                      maxLength={80}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LuxeInput
                        label="Telegram (optional)"
                        icon={Send}
                        value={telegram}
                        onChange={setTelegram}
                        maxLength={40}
                      />
                      <LuxeInput
                        label="WhatsApp (optional)"
                        icon={MessageCircle}
                        value={whatsapp}
                        onChange={(v) => setWhatsapp(v.replace(/[^\d+]/g, ""))}
                        maxLength={20}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LuxeInput
                        label="Website (optional)"
                        icon={Globe2}
                        value={website}
                        onChange={setWebsite}
                        maxLength={120}
                      />
                      <LuxeInput
                        label="Social handle (optional)"
                        icon={Share2}
                        value={social}
                        onChange={setSocial}
                        maxLength={60}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SelectField
                        label="Marketing Experience"
                        value={experience}
                        onValueChange={setExperience}
                        options={EXPERIENCE}
                        icon={Rocket}
                      />
                      <SelectField
                        label="Primary Traffic Source"
                        value={trafficSource}
                        onValueChange={setTrafficSource}
                        options={TRAFFIC_SOURCES}
                        icon={Users}
                      />
                    </div>

                    <SelectField
                      label="Preferred Payment Method"
                      value={payment}
                      onValueChange={setPayment}
                      options={PAYMENT_METHODS.map((p) => p.label)}
                      valueOptions={PAYMENT_METHODS}
                      icon={Wallet}
                    />

                    {/* Expected referrals selector */}
                    <div className="p-4 rounded-2xl border border-[hsl(var(--luxe-border))] bg-black/30">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp
                          size={16}
                          className="text-[hsl(var(--luxe-gold))]"
                        />
                        <span className="text-xs uppercase tracking-[0.14em] font-bold text-[hsl(var(--luxe-ivory)/0.8)]">
                          Expected Monthly Referrals
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {REFERRAL_TIERS.map((n) => {
                          const active = expectedRefs === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setExpectedRefs(n)}
                              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                                active
                                  ? "bg-gradient-to-r from-[hsl(var(--luxe-emerald))] to-[hsl(var(--luxe-gold))] text-[hsl(var(--luxe-black))] border-transparent shadow-[0_6px_20px_-6px_hsl(var(--luxe-gold)/0.6)]"
                                  : "bg-black/40 border-[hsl(var(--luxe-border))] text-[hsl(var(--luxe-ivory)/0.7)] hover:border-[hsl(var(--luxe-border-gold))]"
                              }`}
                            >
                              {n.toLocaleString()}+
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--luxe-ivory)/0.6)]">
                          Estimated monthly commission
                        </span>
                        <motion.span
                          key={estimatedCommission}
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="luxe-text-gradient font-black text-lg"
                        >
                          ৳{estimatedCommission.toLocaleString("en-IN")}
                        </motion.span>
                      </div>
                    </div>

                    <LuxeInput
                      label="Sponsor Referral Code (optional)"
                      icon={Gift}
                      value={referralCode}
                      onChange={(v) =>
                        setReferralCode(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                      }
                      maxLength={12}
                    />

                    {/* Upload placeholders */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <UploadTile label="Profile Photo" />
                      <UploadTile label="National ID" />
                      <UploadTile label="Business Doc" />
                    </div>
                    <p className="text-[10px] text-[hsl(var(--luxe-ivory)/0.45)] text-center">
                      Documents are optional at signup — you can upload them from the Agent
                      Dashboard after verification.
                    </p>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-4 mt-5"
                  >
                    <div className="p-5 rounded-2xl border border-[hsl(var(--luxe-border-gold))] bg-gradient-to-br from-black/40 to-black/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles
                          size={16}
                          className="text-[hsl(var(--luxe-gold))]"
                        />
                        <span className="text-sm font-bold text-[hsl(var(--luxe-ivory))]">
                          Review Your Application
                        </span>
                      </div>
                      <ReviewRow label="Full Name" value={fullName} />
                      <ReviewRow label="Username" value={`@${username}`} />
                      <ReviewRow label="Email" value={email} />
                      <ReviewRow label="Phone" value={`${dial} ${phone}`} />
                      <ReviewRow label="Country" value={country} />
                      <ReviewRow label="Business" value={businessName || "—"} />
                      <ReviewRow
                        label="Expected Referrals"
                        value={`${expectedRefs.toLocaleString()} / month`}
                      />
                      <ReviewRow label="Experience" value={experience} />
                      <ReviewRow label="Traffic" value={trafficSource} />
                      <ReviewRow
                        label="Payment"
                        value={
                          PAYMENT_METHODS.find((p) => p.id === payment)?.label ??
                          payment
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <AgreementRow
                        id="ag-terms"
                        checked={agreedTerms}
                        onChange={setAgreedTerms}
                        label={
                          <>
                            I accept the{" "}
                            <span className="text-[hsl(var(--luxe-gold))] underline">
                              Terms of Service
                            </span>
                          </>
                        }
                      />
                      <AgreementRow
                        id="ag-privacy"
                        checked={agreedPrivacy}
                        onChange={setAgreedPrivacy}
                        label={
                          <>
                            I agree to the{" "}
                            <span className="text-[hsl(var(--luxe-gold))] underline">
                              Privacy Policy
                            </span>
                          </>
                        }
                      />
                      <AgreementRow
                        id="ag-aff"
                        checked={agreedAffiliate}
                        onChange={setAgreedAffiliate}
                        label={
                          <>
                            I accept the{" "}
                            <span className="text-[hsl(var(--luxe-gold))] underline">
                              Affiliate Agreement
                            </span>
                          </>
                        }
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-6 flex items-center gap-3">
                {step > 1 && (
                  <LuxeButton
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} /> Back
                  </LuxeButton>
                )}
                {step < 3 && (
                  <LuxeButton
                    type="button"
                    onClick={goNext}
                    className="flex-1"
                    disabled={
                      (step === 1 && !step1Valid) || (step === 2 && !step2Valid)
                    }
                  >
                    Continue <ArrowRight size={16} />
                  </LuxeButton>
                )}
                {step === 3 && (
                  <LuxeButton
                    type="button"
                    onClick={submit}
                    loading={submitting}
                    disabled={!step3Valid || submitting}
                    className="flex-1"
                  >
                    <Crown size={18} /> Become an Agent
                  </LuxeButton>
                )}
              </div>

              <div className="mt-5 text-center">
                <span className="text-[hsl(var(--luxe-ivory)/0.55)] text-sm">
                  Already have an agent account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="story-link text-[hsl(var(--luxe-gold))] font-semibold text-sm hover:text-[hsl(var(--luxe-gold-soft))]"
                >
                  Agent Login
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────

const Stepper = ({ step }: { step: 1 | 2 | 3 }) => {
  const steps = ["Basic Info", "Agent Info", "Review & Submit"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex-1 flex items-center gap-2">
            <div className="flex flex-col items-center flex-1">
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  boxShadow: active
                    ? "0 0 24px hsl(var(--luxe-gold) / 0.6)"
                    : "0 0 0 hsl(var(--luxe-gold) / 0)",
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? "bg-[hsl(var(--luxe-emerald))] border-[hsl(var(--luxe-emerald))] text-[hsl(var(--luxe-black))]"
                    : active
                      ? "bg-gradient-to-br from-[hsl(var(--luxe-gold))] to-[hsl(var(--luxe-emerald))] border-transparent text-[hsl(var(--luxe-black))]"
                      : "bg-black/40 border-[hsl(var(--luxe-border))] text-[hsl(var(--luxe-ivory)/0.5)]"
                }`}
              >
                {done ? <CheckCircle2 size={16} /> : num}
              </motion.div>
              <span
                className={`mt-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-center ${
                  active
                    ? "text-[hsl(var(--luxe-gold))]"
                    : "text-[hsl(var(--luxe-ivory)/0.5)]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-gradient-to-r from-[hsl(var(--luxe-border))] to-[hsl(var(--luxe-border-gold))] -mt-4" />
            )}
          </div>
        );
      })}
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onValueChange,
  options,
  valueOptions,
  icon: Icon,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  valueOptions?: { id: string; label: string }[];
  icon?: any;
}) => (
  <div className="luxe-input-wrap flex items-center gap-3 px-4 h-14 relative">
    {Icon && <Icon size={18} className="text-[hsl(var(--luxe-gold))] shrink-0" />}
    <div className="relative flex-1">
      <span className="absolute -top-2 left-0 text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--luxe-gold)/0.85)] font-medium">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-full bg-transparent border-0 text-[hsl(var(--luxe-ivory))] text-sm pt-3 pl-0 focus:ring-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(var(--luxe-black-2))] border-[hsl(var(--luxe-border-gold))]">
          {valueOptions
            ? valueOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))
            : options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const UploadTile = ({ label }: { label: string }) => (
  <label className="group cursor-pointer flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-[hsl(var(--luxe-border-gold))] bg-black/30 hover:bg-black/50 hover:border-[hsl(var(--luxe-gold))] transition-colors">
    <Upload
      size={20}
      className="text-[hsl(var(--luxe-gold))] group-hover:scale-110 transition-transform"
    />
    <span className="text-[11px] font-semibold text-[hsl(var(--luxe-ivory)/0.7)]">
      {label}
    </span>
    <input type="file" className="hidden" accept="image/*,application/pdf" />
  </label>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-sm">
    <span className="text-[hsl(var(--luxe-ivory)/0.55)]">{label}</span>
    <span className="text-[hsl(var(--luxe-ivory))] font-medium max-w-[60%] truncate text-right">
      {value}
    </span>
  </div>
);

const AgreementRow = ({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/30 border border-[hsl(var(--luxe-border))]">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(c) => onChange(c as boolean)}
      className="w-5 h-5 border-[hsl(var(--luxe-border-gold))] data-[state=checked]:bg-[hsl(var(--luxe-emerald))] data-[state=checked]:border-[hsl(var(--luxe-emerald))] rounded mt-0.5"
    />
    <label
      htmlFor={id}
      className="text-xs text-[hsl(var(--luxe-ivory)/0.75)] leading-relaxed cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const SuccessRow = ({
  label,
  value,
  icon: Icon,
  onCopy,
  small,
}: {
  label: string;
  value: string;
  icon: any;
  onCopy: () => void;
  small?: boolean;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl border border-[hsl(var(--luxe-border-gold))] bg-black/40">
    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[hsl(var(--luxe-gold)/0.2)] to-[hsl(var(--luxe-emerald)/0.2)]">
      <Icon size={16} className="text-[hsl(var(--luxe-gold))]" />
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--luxe-ivory)/0.5)]">
        {label}
      </div>
      <div
        className={`font-mono font-bold text-[hsl(var(--luxe-ivory))] truncate ${
          small ? "text-xs" : "text-sm"
        }`}
      >
        {value}
      </div>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className="w-9 h-9 rounded-xl border border-[hsl(var(--luxe-border-gold))] flex items-center justify-center hover:bg-[hsl(var(--luxe-gold)/0.1)] transition-colors"
      aria-label={`Copy ${label}`}
    >
      <Copy size={14} className="text-[hsl(var(--luxe-gold))]" />
    </button>
  </div>
);

export default AgentRegister;
