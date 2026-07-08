/**
 * WalletSecurity — /wallet/security
 * Security score dial + capability list + login activity entry point.
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Fingerprint, UserCheck, Clock, KeyRound, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  WalletCanvas, SubHeader, GlassCard, GoldButton, fadeUp, stagger,
} from "@/components/wallet/premium/shared";

const CHECKS: { label: string; status: string; ok: boolean }[] = [
  { label: "Two-Factor Auth",       status: "Enabled",  ok: true },
  { label: "Transaction Password",  status: "Enabled",  ok: true },
  { label: "KYC Verification",      status: "Verified", ok: true },
  { label: "Phone Verified",        status: "Verified", ok: true },
  { label: "Email Verified",        status: "Verified", ok: true },
];

const SETTINGS = [
  { icon: KeyRound,    title: "Two-Factor Authentication", sub: "Google Authenticator", value: "Enabled",  color: "emerald" },
  { icon: Lock,        title: "Transaction Password",      sub: "6-digit PIN",          value: "Enabled",  color: "emerald" },
  { icon: Fingerprint, title: "Biometric Login",           sub: "Face ID / Fingerprint", value: "Enabled", color: "emerald" },
  { icon: UserCheck,   title: "KYC Verification",          sub: "NID + Selfie",         value: "Verified", color: "emerald" },
  { icon: Clock,       title: "Login Activity",            sub: "Recent devices & IPs", value: "View All", color: "sky" },
] as const;

function Ring({ score }: { score: number }) {
  const r = 42, c = 2 * Math.PI * r;
  const dash = c * (score / 100);
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 100 100" className="rotate-[-90deg] h-full w-full">
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="50" cy="50" r={r} strokeWidth="8" fill="none" strokeLinecap="round"
          stroke="url(#ringGrad)"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <ShieldCheck className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
        <div className="mt-1 text-[20px] font-black tabular-nums">{score}%</div>
        <div className="text-[10px] font-bold text-emerald-300">Very Strong</div>
      </div>
    </div>
  );
}

export default function WalletSecurity() {
  const nav = useNavigate();
  return (
    <>
      <Helmet><title>Security Center · GoLucky Wallet</title></Helmet>
      <WalletCanvas>
        <SubHeader title="Security Center" />
        <motion.div initial="hidden" animate="show" variants={stagger}
          className="max-w-md mx-auto px-4 py-4 pb-28 space-y-4">
          <motion.div variants={fadeUp}>
            <GlassCard glow="emerald" className="p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.22),transparent_60%)]" />
              <div className="relative flex items-center gap-4">
                <Ring score={95} />
                <div className="flex-1 space-y-1.5">
                  <div className="text-[12px] font-black text-white/85 mb-1">Security Score</div>
                  {CHECKS.map((c) => (
                    <div key={c.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/75">{c.label}</span>
                      <span className={c.ok ? "text-emerald-300 font-black" : "text-rose-400 font-black"}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-2">
            {SETTINGS.map((s) => {
              const Icon = s.icon;
              const isView = s.color === "sky";
              return (
                <button key={s.title}
                  onClick={() => s.title === "Login Activity" && nav("/settings")}
                  className="w-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md p-3 flex items-center gap-3 hover:border-white/20 transition"
                >
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${isView ? "border-sky-500/40 bg-sky-500/15 text-sky-300" : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[13px] font-black text-white">{s.title}</div>
                    <div className="text-[11px] text-white/60 truncate">{s.sub}</div>
                  </div>
                  <span className={`text-[11px] font-black ${isView ? "text-sky-300" : "text-emerald-300"}`}>{s.value}</span>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-black/70 border-t border-white/[0.06]">
          <div className="max-w-md mx-auto px-4 py-3">
            <GoldButton onClick={() => nav("/settings")}>SECURITY SETTINGS</GoldButton>
          </div>
        </div>
      </WalletCanvas>
    </>
  );
}
