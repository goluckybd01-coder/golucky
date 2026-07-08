import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Inbox, ArrowLeftRight, BarChart3,
  Users, Share2, TrendingUp, Bell, ChevronRight, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props { userId: string | null }

const QUICK = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/agent/dashboard',                color: 'text-amber-300',   tint: 'from-amber-400/25 to-amber-600/5' },
  { icon: Wallet,          label: 'Agent Wallet', path: '/agent/dashboard?tab=wallet',     color: 'text-emerald-300', tint: 'from-emerald-400/25 to-emerald-600/5' },
  { icon: Inbox,           label: 'Deposit Reqs', path: '/agent/dashboard?tab=requests',   color: 'text-cyan-300',    tint: 'from-cyan-400/25 to-blue-600/5' },
  { icon: ArrowLeftRight,  label: 'Transfer',     path: '/agent/dashboard?tab=transfer',   color: 'text-violet-300',  tint: 'from-violet-400/25 to-fuchsia-600/5' },
  { icon: BarChart3,       label: 'Commission',   path: '/agent/dashboard?tab=commission', color: 'text-pink-300',    tint: 'from-pink-400/25 to-rose-600/5' },
  { icon: Users,           label: 'Team Stats',   path: '/agent/dashboard?tab=team',       color: 'text-sky-300',     tint: 'from-sky-400/25 to-indigo-600/5' },
  { icon: Share2,          label: 'Referrals',    path: '/agent/dashboard?tab=referrals',  color: 'text-teal-300',    tint: 'from-teal-400/25 to-emerald-600/5' },
  { icon: TrendingUp,      label: 'Earnings',     path: '/agent/dashboard?tab=earnings',   color: 'text-lime-300',    tint: 'from-lime-400/25 to-green-600/5' },
  { icon: Bell,            label: 'Notifications',path: '/agent/dashboard?tab=alerts',     color: 'text-orange-300',  tint: 'from-orange-400/25 to-red-600/5' },
];

export default function AgentConsoleCard({ userId }: Props) {
  const navigate = useNavigate();
  const [isAgent, setIsAgent] = useState(false);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('agent_status, agent_tier')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.agent_status === 'approved') {
        setIsAgent(true);
        setTier((data as any)?.agent_tier ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!isAgent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#0D1830]/90 via-[#0a1428]/80 to-[#07111F]/90 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(247,181,0,0.35)]"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" />

      <button
        onClick={() => navigate('/agent/dashboard')}
        className="relative w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
            <Crown className="w-6 h-6 text-[#07111F]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Agent Console</h3>
            <p className="text-[11px] text-amber-300/80 font-medium tracking-wider uppercase">
              {tier ? `Tier ${tier}` : 'Approved Partner'} · Live
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60" />
      </button>

      <div className="relative px-5 pb-5 grid grid-cols-3 gap-2.5">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => navigate(q.path)}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${q.tint} p-3 backdrop-blur-md hover:border-white/20 transition`}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <q.icon className={`w-4 h-4 ${q.color}`} />
              </div>
              <span className="text-[10.5px] font-semibold text-white/90 leading-tight text-center">
                {q.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
