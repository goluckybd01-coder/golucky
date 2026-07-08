import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  CheckCircle, Clock, XCircle, ArrowRight, Shield, Loader2, ArrowLeft, Rocket, Crown,
  BadgeCheck, Coins, Lock, Wallet, Users, BarChart3, LayoutDashboard, Gem, LifeBuoy,
  ArrowLeftRight, Gift, Share2, Copy, QrCode, Facebook, Send, MessageCircle,
  TrendingUp, Sparkles, Activity, Star, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { AGENT_TIERS, AgentTier, AGENT_STATUS_CONFIG } from '@/lib/agentConfig';

const BDT_PER_USD = 130;
const genAppRef = () =>
  `APP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

interface ExistingApplication {
  id: string;
  tier_requested: AgentTier;
  status: string;
  admin_note: string | null;
  submitted_at: string;
}

const TIER_LABEL: Record<AgentTier, string> = {
  starter: 'Tier 1 · Starter',
  bronze: 'Tier 2 · Basic',
  silver: 'Tier 3 · Pro',
  gold: 'Tier 4 · Advanced',
  diamond: 'Tier 5 · Elite',
  elite: 'Tier 6 · Master',
  master: 'Tier 7 · Supreme',
};

const fmtBDT = (n: number) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  return n.toLocaleString('en-IN');
};

export default function AgentApply() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingApplication | null>(null);
  const [confirmTier, setConfirmTier] = useState<AgentTier | null>(null);

  useEffect(() => {
    check();
  }, []);

  // Realtime: auto-transition to dashboard the moment admin approves
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`agent-status-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload?.new?.agent_status === 'approved') {
            toast.success('🎉 Application approved! Redirecting…');
            setTimeout(() => navigate('/agent/dashboard?welcome=1', { replace: true }), 800);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, navigate]);

  const check = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/agent/register', { replace: true }); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles').select('agent_status').eq('user_id', user.id).maybeSingle();
      if (profile?.agent_status === 'approved') { navigate('/agent/dashboard?welcome=1', { replace: true }); return; }

      const { data: app } = await supabase
        .from('agent_applications').select('*')
        .eq('user_id', user.id).order('submitted_at', { ascending: false })
        .limit(1).maybeSingle();
      if (app) setExisting(app as ExistingApplication);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };


  const handleApply = async () => {
    if (!confirmTier || !userId) return;
    const cfg = AGENT_TIERS.find(t => t.tier === confirmTier);
    if (!cfg) return;
    setSubmitting(true);
    try {
      const usdtAmount = Math.ceil(cfg.minDeposit / BDT_PER_USD);
      const appRef = genAppRef();

      const { data: inserted, error } = await supabase.from('agent_applications').insert({
        user_id: userId,
        tier_requested: confirmTier,
        required_deposit: cfg.minDeposit,
        deposit_method: 'usdt',
        deposit_tx_ref: appRef,
        status: 'pending',
      }).select('id').single();
      if (error) throw error;
      await supabase.from('profiles').update({ agent_status: 'pending' }).eq('user_id', userId);

      toast.success(`Application created (${appRef}) — Complete USDT payment`);
      setConfirmTier(null);
      navigate(`/agent/payment/${inserted.id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit application');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-7 h-7 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans">
      {/* Ambient obsidian aurora */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-emerald-600/[0.08] blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-[#d4af37]/[0.07] blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-32">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300/90 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            Partner Network · Live
          </div>
        </div>

        {existing && existing.status === 'pending' ? (
          <PendingApplicationCard app={existing} />
        ) : (
          <>
            {existing && existing.status === 'rejected' && <StatusBanner app={existing} />}

            {/* ═════════ Compact header ═════════ */}
            <div id="tiers" className="mt-2 mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#e6c15c] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                <Crown className="w-3 h-3" /> Become a GoLucky Agent
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                Choose Your{' '}
                <span className="bg-gradient-to-r from-[#f5d97a] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
                  Elite Tier
                </span>
              </h1>
              <p className="text-xs md:text-sm text-white/50 mt-2 max-w-lg mx-auto">
                Pick one of seven partner categories. USDT (TRC-20) only · 1 USDT ≈ ৳{BDT_PER_USD}
              </p>
            </div>

            {/* ═════════ 7 PREMIUM CATEGORY CARDS ═════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {AGENT_TIERS.map((t, idx) => (
                <TierCard
                  key={t.tier}
                  tier={t}
                  idx={idx}
                  disabled={false}
                  onApply={() => setConfirmTier(t.tier)}
                />
              ))}
            </div>
          </>
        )}
      </div>


      {/* Confirm modal */}
      <Dialog open={!!confirmTier} onOpenChange={(o) => !o && setConfirmTier(null)}>
        <DialogContent className="bg-[#0a0a0a] border-[#d4af37]/20 text-white max-w-md rounded-3xl">
          {confirmTier && (() => {
            const cfg = AGENT_TIERS.find(t => t.tier === confirmTier)!;
            const usdt = Math.ceil(cfg.minDeposit / BDT_PER_USD);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl">{cfg.icon}</span> Confirm {TIER_LABEL[confirmTier]}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    A pending application will be created and you'll be routed to the USDT gateway with the amount pre-filled. Admin review follows on-chain confirmation.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                  <Row label="Tier" value={cfg.name} />
                  <Row label="Required BDT" value={`৳${fmtBDT(cfg.minDeposit)}`} highlight />
                  <Row label="USDT Equivalent" value={`≈ ${usdt.toLocaleString()} USDT`} />
                  <Row label="Payment Network" value="USDT · TRC-20 only" />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="border-white/15 bg-transparent rounded-xl" onClick={() => setConfirmTier(null)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={submitting}
                    onClick={handleApply}
                    className="bg-gradient-to-r from-[#d4af37] via-[#f5d97a] to-[#b8860b] text-black font-bold rounded-xl shadow-[0_10px_30px_-10px_rgba(212,175,55,0.7)]"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue to USDT <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

/* ═════════════════════════ HERO ═════════════════════════ */

function HeroBanner({ onCTA, onDashboard }: { onCTA: () => void; onDashboard: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-[#d4af37]/15 mb-8
                 bg-gradient-to-br from-[#0a0a0a] via-[#080808] to-[#050505]
                 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)]"
    >
      {/* animated aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/[0.12] blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[300px] bg-[#d4af37]/[0.1] blur-[100px] rounded-full" />
      </div>
      <FloatingCoins />

      <div className="relative p-6 sm:p-8 md:p-12 lg:p-14 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#f5d97a] text-[10px] font-bold uppercase tracking-[0.25em] mb-6"
        >
          <Shield className="w-3 h-3" /> International Partner Program · 2026
        </motion.div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-5">
          <span className="block bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent">
            Become a Professional
          </span>
          <span className="block bg-gradient-to-r from-[#f5d97a] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
            GoLucky Partner
          </span>
        </h1>

        <p className="text-sm md:text-lg text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
          Grow Your Team <span className="text-[#d4af37] mx-1.5">•</span>
          Earn Unlimited Commission <span className="text-[#d4af37] mx-1.5">•</span>
          Build Your Business
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button
            size="lg" onClick={onCTA}
            className="bg-gradient-to-r from-[#d4af37] via-[#f5d97a] to-[#b8860b] text-black font-bold h-12 px-7 rounded-2xl shadow-[0_15px_50px_-15px_rgba(212,175,55,0.8)] hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,1)] hover:-translate-y-0.5 transition-all"
          >
            <Rocket className="w-4 h-4 mr-2" /> Explore Membership Tiers
          </Button>
          <Button
            size="lg" variant="outline" onClick={onDashboard}
            className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] h-12 px-6 rounded-2xl backdrop-blur-xl"
          >
            <Crown className="w-4 h-4 mr-2" /> Partner Dashboard
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 md:gap-3 justify-center text-[11px] text-white/50">
          <Pill icon={<BadgeCheck className="w-3 h-3 text-emerald-400" />} text="On-chain Verified" />
          <Pill icon={<Lock className="w-3 h-3 text-[#d4af37]" />} text="USDT TRC-20 Only" />
          <Pill icon={<Star className="w-3 h-3 text-[#f5d97a]" />} text="7 Elite Tiers" />
          <Pill icon={<Activity className="w-3 h-3 text-emerald-400" />} text="Instant Settlements" />
        </div>
      </div>
    </motion.section>
  );
}

/* ═════════════════════════ QUICK ACTIONS ═════════════════════════ */

function QuickActions({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const items = [
    { icon: ArrowLeftRight, label: 'Transfer', to: '/wallet', tone: 'text-emerald-400' },
    { icon: Users, label: 'My Team', to: '/agent/dashboard', tone: 'text-[#d4af37]' },
    { icon: Coins, label: 'Commission', to: '/agent/dashboard', tone: 'text-emerald-400' },
    { icon: Share2, label: 'Invite', to: '/agent/dashboard', tone: 'text-[#d4af37]' },
    { icon: BarChart3, label: 'Reports', to: '/agent/dashboard', tone: 'text-emerald-400' },
    { icon: LifeBuoy, label: 'Support', to: '/support?type=agent', tone: 'text-[#d4af37]' },
    { icon: Wallet, label: 'Withdraw', to: '/withdraw', tone: 'text-emerald-400' },
  ];
  return (
    <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-3 md:p-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 gap-2">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.button
              key={it.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => navigate(it.to)}
              className="group flex flex-col items-center gap-2 py-3 rounded-2xl hover:bg-white/[0.04] transition-all"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:border-[#d4af37]/40 group-hover:bg-[#d4af37]/[0.06] group-hover:-translate-y-0.5 transition-all">
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${it.tone}`} />
              </div>
              <span className="text-[10px] md:text-[11px] font-semibold text-white/60 group-hover:text-white">{it.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ═════════════════════════ COMMISSION DASHBOARD ═════════════════════════ */

function CommissionDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="md:col-span-3 relative overflow-hidden rounded-[2rem] border border-[#d4af37]/15 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-black p-5 sm:p-6 md:p-8"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-[#d4af37]/10 blur-[100px] rounded-full" />
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Commission Wallet</div>
            <div className="flex items-baseline gap-3">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-b from-[#f5d97a] to-[#b8860b] bg-clip-text text-transparent tabular-nums">
                <Counter to={412050} prefix="৳" />
              </div>
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5%
              </div>
            </div>
            <div className="text-[11px] text-white/40 mt-1">Lifetime earnings · demo view</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Today', value: 1240, prefix: '৳' },
            { label: 'This Week', value: 8922, prefix: '৳' },
            { label: 'This Month', value: 34120, prefix: '৳' },
            { label: 'Commission Rate', value: 15, suffix: '%' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 hover:border-[#d4af37]/30 hover:bg-white/[0.05] transition-all">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{s.label}</div>
              <div className="text-lg md:text-xl font-black text-white tabular-nums">
                <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════ TEAM DASHBOARD ═════════════════════════ */

function TeamDashboard() {
  const bars = [40, 62, 55, 78, 90, 72, 95];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
      className="md:col-span-2 relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-5 sm:p-6 md:p-7"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Team Growth</div>
          <div className="text-2xl font-black text-white tabular-nums">
            <Counter to={14208} />
          </div>
          <div className="text-[11px] text-white/40">Total members</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Volume</div>
          <div className="text-lg font-black text-emerald-400 tabular-nums">$1.2M</div>
        </div>
      </div>
      <div className="h-20 sm:h-28 md:h-32 flex items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }} whileInView={{ height: `${h}%` }}
            viewport={{ once: true }} transition={{ delay: 0.05 * i, duration: 0.6 }}
            className={`flex-1 rounded-t-md ${i === 4 ? 'bg-gradient-to-t from-[#d4af37] to-[#f5d97a] shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
        <div>
          <div className="text-[10px] text-white/40 uppercase">Active</div>
          <div className="text-sm font-black text-white">8,412</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase">Deposits</div>
          <div className="text-sm font-black text-emerald-400">৳820K</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase">Withdraws</div>
          <div className="text-sm font-black text-[#d4af37]">৳410K</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════ FEATURE GRID (7 cards) ═════════════════════════ */

const FEATURES = [
  {
    icon: Users, title: 'Team Management', accent: 'emerald',
    desc: 'Build your own referral network and monitor every team member from one command center.',
    stat: '14.2K', statLabel: 'Members',
    points: ['Total Team Members', 'Active Members', 'New Registrations', 'Referral Tree'],
  },
  {
    icon: Wallet, title: 'Commission Wallet', accent: 'gold',
    desc: 'Track all commissions in real time with instant earnings updates and daily settlement.',
    stat: '৳412K', statLabel: 'Lifetime',
    points: ["Today's Commission", 'Weekly & Monthly', 'Pending Balance', 'Instant Payouts'],
  },
  {
    icon: ArrowLeftRight, title: 'Transfer Centre', accent: 'emerald',
    desc: 'Move balance securely between Agent Wallet and User Wallet in a single tap.',
    stat: '<1s', statLabel: 'Settlement',
    points: ['Agent → User', 'User → Agent', 'Internal Transfer', 'Zero Fees'],
  },
  {
    icon: BarChart3, title: 'Agent Analytics', accent: 'gold',
    desc: 'Monitor complete business performance with advanced analytics and cohort insights.',
    stat: '98%', statLabel: 'Accuracy',
    points: ['Team Volume', 'Deposit Statistics', 'Profit Report', 'Conversion Rate'],
  },
  {
    icon: Gift, title: 'Rewards & Bonus', accent: 'emerald',
    desc: "Unlock exclusive rewards based on your team's performance and monthly milestones.",
    stat: 'Tier 5', statLabel: 'Elite',
    points: ['VIP Bonus', 'Milestone Rewards', 'Cashback', 'Festival Bonus'],
  },
  {
    icon: Share2, title: 'Referral System', accent: 'gold',
    desc: 'Share your referral link and earn unlimited commissions from every successful signup.',
    stat: '4.8x', statLabel: 'Conv. Rate',
    points: ['Referral Link', 'QR Code', 'Social Share', 'Referral Statistics'],
  },
  {
    icon: LifeBuoy, title: 'Support Center', accent: 'emerald',
    desc: 'Receive dedicated Partner Support whenever you need assistance — 24/7 priority line.',
    stat: '24/7', statLabel: 'Priority',
    points: ['Live Chat', 'Ticket System', 'WhatsApp & Telegram', 'Dedicated Manager'],
  },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
      {FEATURES.map((f, i) => {
        const isGold = f.accent === 'gold';
        const glow = isGold ? 'rgba(212,175,55,0.35)' : 'rgba(52,211,153,0.35)';
        const iconBg = isGold ? 'from-[#d4af37]/20 to-[#b8860b]/10 border-[#d4af37]/30' : 'from-emerald-500/20 to-emerald-700/10 border-emerald-400/30';
        const iconColor = isGold ? 'text-[#f5d97a]' : 'text-emerald-300';
        const Icon = f.icon;
        // Make card #7 span both columns on md
        const span = i === 6 ? 'md:col-span-2 lg:col-span-3' : '';
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-2xl p-6 md:p-7 overflow-hidden hover:-translate-y-1.5 transition-all duration-500 ${span}`}
            style={{ boxShadow: `0 20px 60px -30px ${glow}` }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: glow }}
            />
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} border flex items-center justify-center mb-5 shadow-inner`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h4 className="text-lg md:text-xl font-black tracking-tight">{f.title}</h4>
              <div className="text-right shrink-0">
                <div className={`text-xl font-black tabular-nums ${isGold ? 'text-[#f5d97a]' : 'text-emerald-300'}`}>{f.stat}</div>
                <div className="text-[9px] uppercase text-white/40 tracking-wider">{f.statLabel}</div>
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed mb-4">{f.desc}</p>
            <div className={`flex flex-wrap gap-1.5 ${i === 6 ? 'md:max-w-2xl' : ''}`}>
              {f.points.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-white/70 font-medium">
                  <span className={`w-1 h-1 rounded-full ${isGold ? 'bg-[#d4af37]' : 'bg-emerald-400'}`} />
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═════════════════════════ BENEFITS ═════════════════════════ */

const BENEFITS_LIST = [
  'Unlimited Referral Income',
  'Daily Commission Settlement',
  'Secure Wallet Transfer',
  'Advanced Team Analytics',
  'Instant Notifications',
  'Dedicated Partner Support',
  'Exclusive VIP Benefits',
  'Promotional Resources',
];

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
      {BENEFITS_LIST.map((b, i) => (
        <motion.div
          key={b}
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.04 }}
          className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 hover:border-[#d4af37]/30 hover:bg-white/[0.05] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[13px] font-semibold text-white/85 leading-snug">{b}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═════════════════════════ REFERRAL CARD ═════════════════════════ */

function ReferralCard() {
  const link = 'https://golucky.win/agent/register?ref=GLA-2026-ELITE';
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true); toast.success('Referral link copied');
      setTimeout(() => setCopied(false), 1600);
    });
  };
  const socials = [
    { icon: Facebook, name: 'Facebook', tone: 'hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-300' },
    { icon: Send, name: 'Telegram', tone: 'hover:bg-sky-500/20 hover:border-sky-400/40 hover:text-sky-300' },
    { icon: MessageCircle, name: 'WhatsApp', tone: 'hover:bg-emerald-500/20 hover:border-emerald-400/40 hover:text-emerald-300' },
    { icon: Share2, name: 'X', tone: 'hover:bg-white/10 hover:border-white/30 hover:text-white' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="mb-16 relative overflow-hidden rounded-[2rem] border border-[#d4af37]/20 bg-gradient-to-br from-[#0b0b0b] via-black to-[#0b0b0b] p-6 md:p-10"
    >
      <div className="pointer-events-none absolute -top-24 right-1/4 w-72 h-72 bg-[#d4af37]/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="relative grid lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold mb-2">Referral Code</div>
          <div className="text-3xl md:text-4xl font-black tracking-widest bg-gradient-to-r from-[#f5d97a] to-[#b8860b] bg-clip-text text-transparent mb-4">
            GLA-2026-ELITE
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-2 mb-4">
            <code className="flex-1 text-xs md:text-sm font-mono text-white/70 truncate">{link}</code>
            <Button size="sm" onClick={copy} className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl">
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-white/50 mr-1">Share to:</span>
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.name}
                  className={`w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/60 transition-all ${s.tone}`}
                  aria-label={s.name}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#d4af37] to-[#b8860b] opacity-30 blur-xl" />
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-3xl bg-white p-3 flex items-center justify-center">
              <QrCode className="w-full h-full text-black" strokeWidth={1} />
            </div>
            <div className="mt-3 text-center text-[11px] text-white/50 font-semibold uppercase tracking-widest">Scan to Join</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════ SHARED PRIMITIVES ═════════════════════════ */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6 md:mb-8 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
        <Sparkles className="w-3 h-3" /> {eyebrow}
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2">
        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{title}</span>
      </h2>
      <p className="text-xs md:text-sm text-white/50">{subtitle}</p>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur">
      {icon}{text}
    </span>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className={highlight ? 'font-extrabold text-[#f5d97a]' : 'font-semibold text-white'}>{value}</span>
    </div>
  );
}

function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    const n = Math.round(v);
    return `${prefix}${n.toLocaleString('en-IN')}${suffix}`;
  });
  useEffect(() => {
    if (inView) {
      const c = animate(mv, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
      return () => c.stop();
    }
  }, [inView, to, mv]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function PendingApplicationCard({ app }: { app: ExistingApplication }) {
  const tier = AGENT_TIERS.find(t => t.tier === app.tier_requested);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-[#d4af37]/20
                 bg-gradient-to-br from-[#0a0a0a] via-[#080808] to-[#050505]
                 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[#d4af37]/[0.12] blur-[110px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-500/[0.10] blur-[100px] rounded-full" />
      </div>
      <div className="relative p-8 sm:p-12 md:p-16 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
          className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#d4af37]/20 to-emerald-500/10 border border-[#d4af37]/30 flex items-center justify-center mb-6 shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]"
        >
          <Clock className="w-9 h-9 text-[#f5d97a] animate-pulse" />
        </motion.div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#f5d97a] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
          <Sparkles className="w-3 h-3" /> Application Submitted
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight mb-3">
          <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Pending </span>
          <span className="bg-gradient-to-r from-[#f5d97a] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">Review</span>
        </h1>
        <p className="text-sm md:text-base text-white/60 max-w-md mx-auto leading-relaxed mb-6">
          Your <span className="text-[#f5d97a] font-semibold">{tier?.name ?? app.tier_requested}</span> application is being reviewed by our team. You'll be automatically upgraded to the Agent Dashboard as soon as it's approved.
        </p>
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5 text-left">
          <Row label="Application" value={`#${app.id.slice(0, 8).toUpperCase()}`} />
          <Row label="Tier" value={tier?.name ?? app.tier_requested} highlight />
          <Row label="Status" value="Pending Review" />
          <Row label="Submitted" value={new Date(app.submitted_at).toLocaleString()} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/45">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refresh enabled · You'll be notified instantly
        </div>
      </div>
    </motion.div>
  );
}

function StatusBanner({ app }: { app: ExistingApplication }) {
  const cfg = AGENT_STATUS_CONFIG[app.status as keyof typeof AGENT_STATUS_CONFIG] || AGENT_STATUS_CONFIG.pending;
  const tier = AGENT_TIERS.find(t => t.tier === app.tier_requested);
  const tone =
    app.status === 'approved' ? 'from-emerald-400 to-emerald-600' :
    app.status === 'rejected' ? 'from-rose-400 to-rose-600' :
    'from-[#f5d97a] to-[#b8860b]';
  const Icon = app.status === 'approved' ? CheckCircle : app.status === 'rejected' ? XCircle : Clock;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
    >
      <div className={`h-1 bg-gradient-to-r ${tone}`} />
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">
              {tier?.name ?? app.tier_requested} · {cfg?.label ?? app.status}
            </div>
            <div className="text-[11px] text-white/50">
              Submitted {new Date(app.submitted_at).toLocaleString()}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="border-white/20 text-white/80 uppercase text-[10px]">
          {app.status}
        </Badge>
      </div>
      {app.admin_note && (
        <div className="px-4 pb-4 text-xs text-white/70">
          <span className="text-white/50">Admin note: </span>{app.admin_note}
        </div>
      )}
    </motion.div>
  );
}

/* ═════════════════════════ TIER CARD ═════════════════════════ */

function TierCard({
  tier, idx, disabled, onApply,
}: {
  tier: typeof AGENT_TIERS[number]; idx: number; disabled: boolean; onApply: () => void;
}) {
  const usdt = Math.ceil(tier.minDeposit / BDT_PER_USD);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-[#d4af37]/40 via-transparent to-emerald-500/30 opacity-20 blur-lg group-hover:opacity-50 transition duration-500" />
      <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-black backdrop-blur-2xl p-6 h-full flex flex-col hover:-translate-y-1 transition-all duration-500 hover:border-[#d4af37]/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold">
              {TIER_LABEL[tier.tier]}
            </div>
            <div className="text-xl font-black text-white mt-1">
              <span className="mr-1">{tier.icon}</span>
              <span className="bg-gradient-to-r from-[#f5d97a] to-[#b8860b] bg-clip-text text-transparent">{tier.name}</span>
            </div>
          </div>
          <div className="px-2 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#f5d97a] text-[9px] font-bold uppercase tracking-wider">
            USDT
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-4 mb-4">
          <div className="text-[10px] uppercase text-white/40 mb-1 tracking-wider">Required Deposit</div>
          <div className="text-3xl font-black text-white leading-none tabular-nums">৳{fmtBDT(tier.minDeposit)}</div>
          <div className="mt-1 text-[12px] text-emerald-300 font-semibold">≈ {usdt.toLocaleString()} USDT</div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat label="Deposit %" value={`${tier.depositCommissionRate}%`} />
          <Stat label="Betting %" value={`${tier.bettingCommissionRate}%`} />
        </div>

        <ul className="space-y-1.5 mb-5 flex-1">
          {tier.benefits.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-white/70">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /> {b}
            </li>
          ))}
        </ul>

        <Button
          disabled={disabled}
          onClick={onApply}
          className="w-full bg-gradient-to-r from-[#d4af37] via-[#f5d97a] to-[#b8860b] text-black font-bold rounded-2xl h-11 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-40 shadow-[0_10px_30px_-15px_rgba(212,175,55,0.7)]"
        >
          <Coins className="w-4 h-4 mr-1.5" />
          {disabled ? 'Application Pending' : 'Apply with USDT'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <Lock className="w-3 h-3" /> Verified Payment Only
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5 text-center">
      <div className="text-[9px] uppercase text-white/40 tracking-wider">{label}</div>
      <div className="text-sm font-extrabold text-white tabular-nums">{value}</div>
    </div>
  );
}

function FloatingCoins() {
  const coins = Array.from({ length: 8 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {coins.map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#f5d97a] via-[#d4af37] to-[#8b6914] shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center text-[9px] md:text-[10px] font-black text-[#3a2810]"
            style={{ left: `${8 + i * 12}%`, top: `${15 + (i % 4) * 22}%` }}
            animate={{ y: [0, -14, 0], rotate: [0, 12, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          >
            ₮
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
