import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Copy, Share2, Check, Shield, Mail, Phone, Fingerprint,
  Smartphone, KeyRound, ScanFace, Globe, Bell, Eye, Palette, Gamepad2, TrendingUp,
  Wallet as WalletIcon, Users, Crown, Sparkles, Save, RotateCcw, X, Star,
  CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type VerStatus = "verified" | "pending" | "rejected";

const VIP_THRESHOLDS = [0, 1000, 5000, 20000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000];

const fmtBDT = (n: number) =>
  "৳ " + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function PersonalInformation() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  // ---------- state ----------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string>("");

  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [lastSignIn, setLastSignIn] = useState<string>("");

  const [profile, setProfile] = useState({
    username: "",
    avatar_url: "",
    phone: "",
    referral_code: "",
    display_user_id: "",
    agent_display_id: "",
    agent_status: "" as string,
    vip_level: 0,
    vip_exp: 0,
    is_suspended: false,
    is_frozen: false,
  });

  // Extended (localStorage) — backend has no columns yet
  const [ext, setExt] = useState({
    full_name: "",
    dob: "",
    gender: "",
    country: "Bangladesh",
    state: "",
    city: "",
    language: "English",
    timezone: "Asia/Dhaka",
    theme: "Dark",
    currency: "BDT",
    notif_email: true,
    notif_push: true,
    notif_sms: false,
    privacy_public: false,
    marketing: true,
  });

  const [initial, setInitial] = useState<any>(null);

  const [wallet, setWallet] = useState({
    total_deposit: 0, total_withdraw: 0, total_bet: 0, total_win: 0,
    total_commission_earned: 0,
  });
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [referralIncome, setReferralIncome] = useState(0);

  // ---------- load ----------
  useEffect(() => { (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav("/auth"); return; }
      setUserId(user.id);
      setEmail(user.email || "");
      setEmailVerified(!!user.email_confirmed_at);
      setPhoneVerified(!!(user as any).phone_confirmed_at);
      setCreatedAt(user.created_at || "");
      setLastSignIn((user as any).last_sign_in_at || "");

      const { data: p } = await supabase.from("profiles")
        .select("username,avatar_url,phone,referral_code,display_user_id,agent_display_id,agent_status,vip_level,vip_exp,is_suspended,is_frozen")
        .eq("user_id", user.id).maybeSingle();
      if (p) setProfile((s) => ({ ...s, ...(p as any) }));

      const { data: w } = await supabase.from("wallets")
        .select("total_deposit,total_withdraw,total_bet,total_win,total_commission_earned")
        .eq("user_id", user.id).maybeSingle();
      if (w) setWallet(w as any);

      const { count: gp } = await supabase.from("game_bets")
        .select("*", { count: "exact", head: true }).eq("user_id", user.id);
      if (gp != null) setGamesPlayed(gp);

      const { data: ri } = await supabase.from("referral_commissions")
        .select("commission_amount").eq("referrer_id", user.id);
      if (ri) setReferralIncome(ri.reduce((a: number, r: any) => a + Number(r.commission_amount || 0), 0));

      const raw = localStorage.getItem(`pi_ext_${user.id}`);
      if (raw) setExt((s) => ({ ...s, ...JSON.parse(raw) }));

      setInitial({ profile: p, ext: raw ? JSON.parse(raw) : null });
    } catch (e: any) {
      toast.error(e.message || "Failed to load profile");
    } finally { setLoading(false); }
  })(); }, [nav]);

  // ---------- derived ----------
  const vipNext = VIP_THRESHOLDS[Math.min(profile.vip_level + 1, VIP_THRESHOLDS.length - 1)];
  const vipBase = VIP_THRESHOLDS[profile.vip_level] || 0;
  const vipPct = Math.max(0, Math.min(100,
    ((Number(profile.vip_exp) - vipBase) / Math.max(1, vipNext - vipBase)) * 100));

  const trustScore = useMemo(() => {
    let s = 40;
    if (emailVerified) s += 15;
    if (phoneVerified) s += 15;
    if (profile.avatar_url) s += 5;
    if (profile.vip_level >= 3) s += 10;
    if (gamesPlayed > 20) s += 5;
    if (wallet.total_deposit > 0) s += 10;
    return Math.min(100, s);
  }, [emailVerified, phoneVerified, profile, gamesPlayed, wallet]);

  const winRate = wallet.total_bet > 0
    ? Math.round((wallet.total_win / wallet.total_bet) * 100) : 0;

  const accountStatus: VerStatus =
    profile.is_suspended || profile.is_frozen ? "rejected" : "verified";

  // ---------- actions ----------
  const copy = async (val: string, label: string) => {
    if (!val) return toast.error(`No ${label} to copy`);
    try { await navigator.clipboard.writeText(val); toast.success(`${label} copied`); }
    catch { toast.error("Copy failed"); }
  };

  const share = async () => {
    const url = `${window.location.origin}/register?ref=${profile.referral_code || profile.display_user_id}`;
    try {
      if (navigator.share) await navigator.share({ title: "GoLucky", text: "Join me on GoLucky", url });
      else { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
    } catch {}
  };

  const onAvatar = async (f: File) => {
    if (!f || !userId) return;
    if (f.size > 3 * 1024 * 1024) return toast.error("Max 3MB");
    const path = `${userId}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((s) => ({ ...s, avatar_url: publicUrl }));
    toast.success("Avatar updated — remember to save");
  };

  const save = async () => {
    const errs = validatePersonal({
      full_name: ext.full_name,
      username: profile.username,
      phone: profile.phone,
      dob: ext.dob,
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const { data: updated, error } = await supabase.from("profiles").update({
        username: profile.username.trim(),
        phone: profile.phone.trim(),
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId).select("username,avatar_url,phone,referral_code,display_user_id,agent_display_id,agent_status,vip_level,vip_exp,is_suspended,is_frozen").maybeSingle();
      if (error) throw error;
      const freshProfile = updated ? { ...profile, ...updated } : profile;
      setProfile(freshProfile);
      localStorage.setItem(`pi_ext_${userId}`, JSON.stringify(ext));
      setInitial({ profile: { ...freshProfile }, ext: { ...ext } });
      setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800);
      toast.success("Changes saved");
    } catch (e: any) {
      const msg = e?.message || "Save failed. Please try again.";
      const fieldErrors = mapServerErrorToFields(e, msg);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        toast.error("Please fix the highlighted fields");
      } else {
        setSaveError(msg);
        toast.error(msg);
      }
    }
    finally { setSaving(false); }
  };

  const reset = () => {
    if (!initial) return;
    if (initial.profile) setProfile((s) => ({ ...s, ...initial.profile }));
    if (initial.ext) setExt((s) => ({ ...s, ...initial.ext }));
    toast.message("Reverted to last saved");
  };

  // ---------- UI ----------
  const isAgent = profile.agent_status === "approved";

  if (loading) {
    return (
      <div className="min-h-screen w-full grid place-items-center" style={{ background: "#03060c" }}>
        <div className="text-white/70 text-sm">Loading your identity…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pb-32" style={{
      background:
        "radial-gradient(1200px 800px at 10% -10%, rgba(16,185,129,.18), transparent 60%)," +
        "radial-gradient(900px 700px at 110% 10%, rgba(201,168,76,.16), transparent 60%)," +
        "linear-gradient(180deg,#020308 0%, #04070f 60%, #060a14 100%)",
    }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-2xl border-b border-white/10"
        style={{ background: "rgba(4,7,15,0.65)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-3 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-white font-extrabold text-[16px] leading-tight">Personal Information</h1>
            <p className="text-white/55 text-[11px]">Manage your GoLucky Digital Identity securely.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 pt-4 space-y-4">
        {/* ===== SECTION 1: DIGITAL IDENTITY CARD ===== */}
        <Glass className="p-4 sm:p-6">
          <div className="grid lg:grid-cols-[auto,1fr,auto] gap-5 items-center">
            {/* Avatar */}
            <div className="relative mx-auto lg:mx-0">
              <div className="h-28 w-28 rounded-3xl p-[2px]"
                style={{ background: "linear-gradient(135deg,#10b981,#c9a84c,#0f1b3d)" }}>
                <div className="h-full w-full rounded-3xl overflow-hidden bg-black grid place-items-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-white">
                      {(profile.username || email || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-2xl border border-white/20"
                style={{ background: "linear-gradient(135deg,#10b981,#0d7a5f)" }}>
                <Camera className="h-4 w-4 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
            </div>

            {/* Info */}
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white text-xl font-extrabold truncate">
                  {ext.full_name || profile.username || "GoLucky Member"}
                </h2>
                {emailVerified && <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Verified</Badge>}
                <Badge tone="gold" icon={<Crown className="h-3 w-3" />}>VIP {profile.vip_level}</Badge>
                <Badge tone={accountStatus === "verified" ? "emerald" : "red"}>
                  {accountStatus === "verified" ? "Active" : "Restricted"}
                </Badge>
              </div>
              <div className="text-white/60 text-[12px]">@{profile.username || "username"} · Member since {fmtDate(createdAt)}</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <IdRow label="User ID" value={profile.display_user_id || userId.slice(0, 12)} onCopy={() => copy(profile.display_user_id || userId, "User ID")} />
                <IdRow label="Referral Code" value={profile.referral_code || "—"} onCopy={() => copy(profile.referral_code, "Referral code")} />
                {isAgent && (
                  <IdRow label="Agent ID" value={profile.agent_display_id || "—"} onCopy={() => copy(profile.agent_display_id, "Agent ID")} />
                )}
              </div>

              {/* Trust + VIP progress */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <ProgressTile label="GoLucky Trust Score" value={`${trustScore}/100`} pct={trustScore} tint="#10b981" />
                <ProgressTile label={`VIP ${profile.vip_level} → ${profile.vip_level + 1}`}
                  value={`${Math.round(vipPct)}%`} pct={vipPct} tint="#c9a84c" />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex lg:flex-col gap-2 justify-center">
              <QAct icon={<Sparkles className="h-4 w-4" />} label="Edit" onClick={() => document.getElementById("pi-details")?.scrollIntoView({ behavior: motionScrollBehavior() })} />
              <QAct icon={<Share2 className="h-4 w-4" />} label="Share" onClick={share} />
              <QAct icon={<Copy className="h-4 w-4" />} label="User ID" onClick={() => copy(profile.display_user_id || userId, "User ID")} />
              <QAct icon={<Copy className="h-4 w-4" />} label="Referral" onClick={() => copy(profile.referral_code, "Referral code")} />
            </div>
          </div>
        </Glass>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
          {/* ===== SECTION 2: PERSONAL DETAILS ===== */}
          <Glass id="pi-details" className="p-4 lg:col-span-2">
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Personal Details" />
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <FieldEx label="Full Name" value={ext.full_name} error={errors.full_name} onChange={(v) => { setExt({ ...ext, full_name: v }); if (errors.full_name) setErrors({ ...errors, full_name: "" }); }} />
              <FieldEx label="Username" value={profile.username} error={errors.username} onChange={(v) => { setProfile({ ...profile, username: v }); if (errors.username) setErrors({ ...errors, username: "" }); }} />
              <Field label="Email" value={email} readOnly />
              <FieldEx label="Phone Number" value={profile.phone} error={errors.phone} onChange={(v) => { setProfile({ ...profile, phone: v }); if (errors.phone) setErrors({ ...errors, phone: "" }); }} />
              <FieldEx label="Date of Birth" type="date" value={ext.dob} error={errors.dob} onChange={(v) => { setExt({ ...ext, dob: v }); if (errors.dob) setErrors({ ...errors, dob: "" }); }} />
              <Select label="Gender" value={ext.gender} onChange={(v) => setExt({ ...ext, gender: v })}
                options={["", "Male", "Female", "Other", "Prefer not to say"]} />
              <Field label="Country" value={ext.country} onChange={(v) => setExt({ ...ext, country: v })} />
              <Field label="State" value={ext.state} onChange={(v) => setExt({ ...ext, state: v })} />
              <Field label="City" value={ext.city} onChange={(v) => setExt({ ...ext, city: v })} />
              <Select label="Language" value={ext.language} onChange={(v) => setExt({ ...ext, language: v })}
                options={["English", "বাংলা", "हिन्दी", "العربية"]} />
              <Select label="Timezone" value={ext.timezone} onChange={(v) => setExt({ ...ext, timezone: v })}
                options={["Asia/Dhaka", "Asia/Kolkata", "Asia/Dubai", "UTC", "Europe/London"]} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10">
              <ReadOnly label="Registration Date" value={fmtDate(createdAt)} />
              <ReadOnly label="Last Login" value={fmtDate(lastSignIn)} />
              <ReadOnly label="IP Region" value={ext.country} />
            </div>
            {saveError && (
              <div role="alert" className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-[12px] text-red-300">
                  <div className="font-bold">Couldn't save changes</div>
                  <div className="opacity-90">{saveError}</div>
                </div>
              </div>
            )}
          </Glass>

          {/* ===== SECTION 3: ACCOUNT VERIFICATION ===== */}
          <Glass className="p-4">
            <SectionTitle icon={<Shield className="h-4 w-4" />} title="Account Verification" />
            <div className="space-y-2 mt-3">
              <VerRow icon={<Mail className="h-4 w-4" />} label="Email" status={emailVerified ? "verified" : "pending"} />
              <VerRow icon={<Phone className="h-4 w-4" />} label="Phone" status={phoneVerified ? "verified" : "pending"} />
              <VerRow icon={<ScanFace className="h-4 w-4" />} label="Identity" status="pending" />
              <VerRow icon={<Shield className="h-4 w-4" />} label="KYC" status="pending" />
              <VerRow icon={<Star className="h-4 w-4" />} label="Security Score" status={trustScore >= 70 ? "verified" : "pending"} extra={`${trustScore}/100`} />
              <VerRow icon={<Smartphone className="h-4 w-4" />} label="Device" status="verified" />
            </div>
          </Glass>

          {/* ===== SECTION 4: SECURITY CENTER ===== */}
          <Glass className="p-4 lg:col-span-2">
            <SectionTitle icon={<KeyRound className="h-4 w-4" />} title="Security Center" />
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              <ActionRow icon={<KeyRound className="h-4 w-4" />} label="Login Password" sub="Change your password" onClick={() => nav("/settings")} />
              <ActionRow icon={<Shield className="h-4 w-4" />} label="Transaction PIN" sub="Protect withdrawals" onClick={() => nav("/settings")} />
              <ActionRow icon={<Smartphone className="h-4 w-4" />} label="Google Authenticator" sub="2-step verification" onClick={() => toast.message("2FA coming soon")} />
              <ActionRow icon={<ScanFace className="h-4 w-4" />} label="Face ID" sub="Biometric login" onClick={() => toast.message("Biometric coming soon")} />
              <ActionRow icon={<Fingerprint className="h-4 w-4" />} label="Fingerprint" sub="Quick unlock" onClick={() => toast.message("Biometric coming soon")} />
              <ActionRow icon={<Smartphone className="h-4 w-4" />} label="Login Devices" sub="Active sessions" onClick={() => nav("/settings")} />
              <ActionRow icon={<Clock className="h-4 w-4" />} label="Recent Activity" sub={`Last: ${fmtDate(lastSignIn)}`} onClick={() => nav("/settings")} />
              <ActionRow icon={<CheckCircle2 className="h-4 w-4" />} label="Trusted Devices" sub="Manage devices" onClick={() => nav("/settings")} />
            </div>
          </Glass>

          {/* ===== SECTION 5: ACCOUNT PREFERENCES ===== */}
          <Glass className="p-4">
            <SectionTitle icon={<Palette className="h-4 w-4" />} title="Preferences" />
            <div className="space-y-2 mt-3">
              <Select label="Theme" value={ext.theme} onChange={(v) => setExt({ ...ext, theme: v })} options={["Dark", "Light", "Auto"]} />
              <Select label="Currency" value={ext.currency} onChange={(v) => setExt({ ...ext, currency: v })} options={["BDT", "USD", "INR"]} />
              <Toggle label="Notifications" desc="Push, email & in-app alerts" checked={ext.notif_push} onChange={(v) => setExt({ ...ext, notif_push: v })} icon={<Bell className="h-4 w-4" />} />
              <Toggle label="Public Profile" desc="Show your wins on leaderboard" checked={ext.privacy_public} onChange={(v) => setExt({ ...ext, privacy_public: v })} icon={<Eye className="h-4 w-4" />} />
              <Toggle label="Marketing" desc="Receive promo offers" checked={ext.marketing} onChange={(v) => setExt({ ...ext, marketing: v })} icon={<Sparkles className="h-4 w-4" />} />
            </div>
          </Glass>

          {/* ===== SECTION 6: ACCOUNT STATISTICS ===== */}
          <Glass className="p-4 lg:col-span-2">
            <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Account Statistics" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <Stat icon={<Gamepad2 className="h-4 w-4" />} tint="#10b981" label="Games Played" value={gamesPlayed.toLocaleString()} />
              <Stat icon={<TrendingUp className="h-4 w-4" />} tint="#c9a84c" label="Win Rate" value={`${winRate}%`} />
              <Stat icon={<WalletIcon className="h-4 w-4" />} tint="#3b6fa0" label="Total Deposit" value={fmtBDT(wallet.total_deposit)} />
              <Stat icon={<WalletIcon className="h-4 w-4" />} tint="#a78bfa" label="Total Withdraw" value={fmtBDT(wallet.total_withdraw)} />
              <Stat icon={<Sparkles className="h-4 w-4" />} tint="#22d3ee" label="Total Rewards" value={fmtBDT(wallet.total_win)} />
              <Stat icon={<Users className="h-4 w-4" />} tint="#f472b6" label="Referral Income" value={fmtBDT(referralIncome)} />
              {isAgent && <Stat icon={<Crown className="h-4 w-4" />} tint="#facc15" label="Commission" value={fmtBDT(wallet.total_commission_earned)} />}
              <Stat icon={<Crown className="h-4 w-4" />} tint="#c9a84c" label="VIP Progress" value={`${Math.round(vipPct)}%`} />
            </div>
          </Glass>

          {/* ===== SECTION 7: CONNECTED ACCOUNTS ===== */}
          <Glass className="p-4">
            <SectionTitle icon={<Globe className="h-4 w-4" />} title="Connected Accounts" />
            <div className="space-y-2 mt-3">
              {[
                { k: "telegram", label: "Telegram" },
                { k: "whatsapp", label: "WhatsApp" },
                { k: "google", label: "Google" },
                { k: "apple", label: "Apple" },
                { k: "facebook", label: "Facebook" },
              ].map((p) => (
                <ActionRow key={p.k} icon={<Globe className="h-4 w-4" />} label={p.label} sub="Not connected"
                  onClick={() => toast.message(`${p.label} integration coming soon`)} />
              ))}
            </div>
          </Glass>
        </div>
      </div>

      {/* ===== SECTION 8: SAVE PANEL (sticky bottom) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 backdrop-blur-2xl"
        style={{ background: "rgba(3,6,12,0.85)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-white/70 text-[12px] hidden sm:block">Changes are saved securely to your GoLucky account.</div>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => nav(-1)} className="h-10 px-3 rounded-xl border border-white/15 bg-white/5 text-white/80 text-[13px] flex items-center gap-1">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button onClick={reset} className="h-10 px-3 rounded-xl border border-white/15 bg-white/5 text-white/80 text-[13px] flex items-center gap-1">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={save} disabled={saving} aria-busy={saving}
              className="h-10 px-5 rounded-xl text-[13px] font-bold text-black flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#10b981,#c9a84c)" }}>
              {saving ? (
                <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Success animation */}
      <AnimatePresence>
        {savedFlash && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
            <div className="rounded-3xl border border-emerald-400/40 px-6 py-5 backdrop-blur-2xl"
              style={{ background: "rgba(16,185,129,0.15)" }}>
              <div className="grid place-items-center mb-2">
                <div className="h-12 w-12 rounded-full grid place-items-center"
                  style={{ background: "linear-gradient(135deg,#10b981,#c9a84c)" }}>
                  <Check className="h-7 w-7 text-black" />
                </div>
              </div>
              <div className="text-white font-extrabold text-center">Saved Successfully</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================ Subcomponents ============================ */

function Glass({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.div id={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-white/10 backdrop-blur-2xl ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 20px 60px -30px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg text-emerald-300"
        style={{ background: "rgba(16,185,129,0.12)" }}>{icon}</span>
      <h3 className="text-white font-extrabold text-[14px]">{title}</h3>
    </div>
  );
}

function Badge({ children, tone, icon }: { children: React.ReactNode; tone: "emerald" | "gold" | "red"; icon?: React.ReactNode }) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    gold: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    red: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${styles[tone]}`}>
      {icon}{children}
    </span>
  );
}

function IdRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5">
      <div className="text-[9px] font-semibold text-white/55 uppercase tracking-wide">{label}</div>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[12px] font-extrabold text-white">{value}</span>
        <button onClick={onCopy} className="text-white/55 hover:text-emerald-300"><Copy className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function ProgressTile({ label, value, pct, tint }: { label: string; value: string; pct: number; tint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-white/70">{label}</span>
        <span className="text-[12px] font-extrabold" style={{ color: tint }}>{value}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/8 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${tint}, #fff3)` }} />
      </div>
    </div>
  );
}

function QAct({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="h-9 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
      {icon}{label}
    </button>
  );
}

function Field({ label, value, onChange, readOnly, type = "text" }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; type?: string }) {
  return <FieldEx label={label} value={value} onChange={onChange} readOnly={readOnly} type={type} />;
}

function validatePersonal(v: { full_name?: string; username?: string; phone?: string; dob?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  const name = (v.full_name || "").trim();
  if (name && (name.length < 2 || name.length > 60)) e.full_name = "Full name must be 2–60 characters";
  const u = (v.username || "").trim();
  if (!u) e.username = "Username is required";
  else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(u)) e.username = "3–20 chars; letters, numbers, _ or .";
  const p = (v.phone || "").trim();
  if (p && !/^\+?[0-9\s\-]{7,15}$/.test(p)) e.phone = "Enter a valid phone number";
  if (v.dob) {
    const d = new Date(v.dob);
    if (isNaN(d.getTime())) e.dob = "Invalid date";
    else {
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) e.dob = "You must be 18 or older";
      else if (age > 120) e.dob = "Invalid date of birth";
    }
  }
  return e;
}

function mapServerErrorToFields(e: any, fallbackMsg: string): Record<string, string> {
  const out: Record<string, string> = {};
  const details: any[] = Array.isArray(e?.errors) ? e.errors
    : Array.isArray(e?.details) ? e.details
    : e?.fieldErrors && typeof e.fieldErrors === "object" ? Object.entries(e.fieldErrors).map(([field, message]) => ({ field, message }))
    : [];
  for (const d of details) {
    const field = d?.field || d?.path || d?.column;
    const message = d?.message || d?.msg || fallbackMsg;
    if (field && typeof field === "string") out[field] = String(message);
  }
  const msg = String(e?.message || fallbackMsg).toLowerCase();
  const code = String(e?.code || "");
  if (!Object.keys(out).length) {
    if (code === "23505" && msg.includes("username")) out.username = "Username is already taken";
    else if (code === "23505" && msg.includes("phone")) out.phone = "Phone number is already in use";
    else if (msg.includes("username")) out.username = e?.message || fallbackMsg;
    else if (msg.includes("phone")) out.phone = e?.message || fallbackMsg;
  }
  return out;
}

function FieldEx({ label, value, onChange, readOnly, type = "text", error }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold text-white/55 uppercase tracking-wide mb-1">{label}</span>
      <input type={type} value={value || ""} readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={!!error}
        className={`w-full h-10 rounded-xl border px-3 text-[13px] text-white outline-none ${error ? "border-red-400/70 focus:border-red-400" : "border-white/10 focus:border-emerald-400/50"} ${readOnly ? "opacity-70" : ""}`}
        style={{ background: "rgba(0,0,0,0.35)" }} />
      {error && <span className="mt-1 block text-[11px] font-medium text-red-400">{error}</span>}
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold text-white/55 uppercase tracking-wide mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-white/10 px-3 text-[13px] text-white outline-none focus:border-emerald-400/50"
        style={{ background: "rgba(0,0,0,0.35)" }}>
        {options.map((o) => <option key={o} value={o} className="bg-[#04070f]">{o || "—"}</option>)}
      </select>
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[10px] font-semibold text-white/55 uppercase">{label}</div>
      <div className="text-[13px] font-bold text-white truncate">{value || "—"}</div>
    </div>
  );
}

function VerRow({ icon, label, status, extra }: { icon: React.ReactNode; label: string; status: VerStatus; extra?: string }) {
  const toneMap: Record<VerStatus, { c: string; bg: string; ic: React.ReactNode; t: string }> = {
    verified: { c: "text-emerald-300", bg: "bg-emerald-500/12 border-emerald-400/30", ic: <CheckCircle2 className="h-3 w-3" />, t: "Verified" },
    pending: { c: "text-amber-300", bg: "bg-amber-500/12 border-amber-400/30", ic: <Clock className="h-3 w-3" />, t: "Pending" },
    rejected: { c: "text-rose-300", bg: "bg-rose-500/12 border-rose-400/30", ic: <AlertCircle className="h-3 w-3" />, t: "Rejected" },
  };
  const m = toneMap[status];
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white/70">{icon}</span>
        <span className="text-[13px] font-semibold text-white truncate">{label}</span>
        {extra && <span className="text-[11px] text-white/55">· {extra}</span>}
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${m.c} ${m.bg}`}>{m.ic}{m.t}</span>
    </div>
  );
}

function ActionRow({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/5 px-3 py-2.5 text-left">
      <span className="grid h-9 w-9 place-items-center rounded-xl text-emerald-300" style={{ background: "rgba(16,185,129,0.12)" }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-white truncate">{label}</div>
        <div className="text-[11px] text-white/55 truncate">{sub}</div>
      </div>
    </button>
  );
}

function Toggle({ label, desc, checked, onChange, icon }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl text-emerald-300" style={{ background: "rgba(16,185,129,0.12)" }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-white truncate">{label}</div>
        <div className="text-[11px] text-white/55 truncate">{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-emerald-500" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/60 uppercase">
        <span style={{ color: tint }}>{icon}</span>{label}
      </div>
      <div className="mt-1 text-[15px] font-extrabold tabular-nums" style={{ color: tint }}>{value}</div>
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}
