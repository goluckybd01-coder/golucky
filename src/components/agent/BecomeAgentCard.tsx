import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Percent, Users, Wallet, BadgeCheck, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  userId: string | null;
}

type AgentState = 'loading' | 'none' | 'pending' | 'rejected' | 'approved';

const FEATURES = [
  { icon: Percent, label: 'Commission Benefits', tint: 'from-emerald-400/30 to-emerald-600/10', color: 'text-emerald-300' },
  { icon: Users, label: 'Team Building', tint: 'from-cyan-400/30 to-blue-600/10', color: 'text-cyan-300' },
  { icon: Wallet, label: 'Agent Wallet', tint: 'from-amber-400/30 to-amber-600/10', color: 'text-amber-300' },
  { icon: BadgeCheck, label: 'Premium Badge', tint: 'from-violet-400/30 to-fuchsia-600/10', color: 'text-violet-300' },
];

export default function BecomeAgentCard({ userId }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<AgentState>('loading');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('agent_status')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled) return;
        const s = (profile?.agent_status as string) || 'none';
        if (s === 'approved') setState('approved');
        else if (s === 'pending') setState('pending');
        else if (s === 'rejected') setState('rejected');
        else setState('none');
      } catch {
        if (!cancelled) setState('none');
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Hide entirely if approved (Agent UI elsewhere)
  if (state === 'approved' || state === 'loading') return null;

  const isPending = state === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0D1830]/90 via-[#0a1428]/80 to-[#07111F]/90 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(247,181,0,0.25)]"
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Sparkles className="w-6 h-6 text-[#07111F]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Become an Agent</h3>
              <p className="text-[11px] text-amber-300/80 font-medium tracking-wider uppercase">
                GoLucky Premium Partner
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/20 border border-amber-400/30 text-amber-200">
            VIP
          </span>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${f.tint} p-3 backdrop-blur-md`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <span className="text-[12px] font-semibold text-white/90 leading-tight">
                  {f.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA / Status */}
        {isPending ? (
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center"
              >
                <Clock className="w-5 h-5 text-amber-300" />
              </motion.div>
              <div className="flex-1">
                <p className="text-amber-100 font-semibold text-sm">
                  Your Agent Application is Under Review
                </p>
                <p className="text-amber-200/70 text-[11px] mt-0.5">
                  We'll notify you once approved.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/agent/apply')}
            className="w-full relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/40 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2 text-[#07111F] font-bold">
              <span>{state === 'rejected' ? 'Apply Again' : 'Apply Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
