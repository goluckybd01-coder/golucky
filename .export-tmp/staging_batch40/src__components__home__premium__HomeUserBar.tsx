import { motion } from "framer-motion";
import { Bell, ChevronDown, Crown, Menu, Wallet as WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";

interface Props {
  luckyCoin: number;
  walletBalance?: number;
  vipLevel: number;
  onMenuClick?: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HomeUserBar({ luckyCoin, walletBalance = 0, vipLevel, onMenuClick }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("Lucky Player");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [notifCount] = useState(8);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("nickname, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        const p = data as any;
        setName(p.nickname || p.full_name || "Lucky Player");
        setAvatar(p.avatar_url || null);
      }
    })();
  }, []);

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1280px] px-3 md:px-6 pt-3">
      <div className="pointer-events-none absolute inset-x-6 -top-6 h-36 blur-3xl opacity-80"
        style={{ background: "radial-gradient(50% 80% at 15% 50%, rgba(16,185,129,0.38), transparent 60%), radial-gradient(45% 80% at 88% 50%, rgba(212,175,55,0.30), transparent 60%), radial-gradient(40% 80% at 50% 50%, rgba(6,95,70,0.22), transparent 70%)" }}
      />
      <div
        className="relative flex items-center gap-2 md:gap-3 rounded-[26px] px-2.5 md:px-3.5 py-2.5 border border-white/10 backdrop-blur-2xl shadow-[0_18px_60px_-18px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.10)]"
        style={{ background: "linear-gradient(135deg, rgba(6,22,18,0.78) 0%, rgba(4,12,22,0.70) 50%, rgba(20,14,4,0.70) 100%)" }}
      >
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
        <button
          type="button"
          onClick={onMenuClick ?? (() => navigate("/account"))}
          aria-label="Menu"
          className="clickable w-11 h-11 shrink-0 rounded-2xl grid place-items-center border border-white/10 backdrop-blur-xl hover:border-emerald-300/30 transition"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(16,185,129,0.14))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 18px -10px rgba(16,185,129,0.4)" }}
        >
          <Menu size={19} className="text-amber-100" strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="clickable relative flex flex-col items-start shrink-0 pl-1 pr-2 py-0.5 rounded-2xl"
          aria-label="GoLucky home"
        >
          <span className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-80"
            style={{ background: "radial-gradient(60% 80% at 50% 50%, rgba(212,175,55,0.55), rgba(16,185,129,0.25) 60%, transparent 75%)" }} />
          <img src={goluckyTextLogo} alt="GoLucky" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_2px_14px_rgba(212,175,55,0.55)]" />
          <span className="hidden sm:block text-[8px] font-black tracking-[0.32em] mt-0.5 ml-1"
            style={{ background: "linear-gradient(90deg,#34D399,#FDE68A,#34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PLAY • WIN • EARN
          </span>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 md:gap-2">
          <motion.button
            type="button"
            onClick={() => navigate("/wallet")}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            className="clickable group relative flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-2xl border border-amber-300/30 backdrop-blur-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(40,28,4,0.7), rgba(20,14,2,0.7))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 20px -8px rgba(212,175,55,0.45)" }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_-20%,rgba(255,255,255,0.18),transparent_60%)]" />
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 grid place-items-center shadow-[0_4px_14px_-2px_rgba(212,175,55,0.7)] ring-1 ring-amber-200/50">
              <span className="text-[10px] font-black text-[#1a0f00] leading-none">৳</span>
            </div>
            <div className="text-left leading-none hidden sm:block">
              <div className="text-[9px] uppercase tracking-wider text-amber-200/70 font-bold">Lucky Coin</div>
              <div className="text-[12px] font-black gl-gold-text gl-num mt-0.5">{fmt(luckyCoin)}</div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/wallet")}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            className="clickable group relative hidden xs:flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-2xl border border-emerald-300/30 backdrop-blur-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(4,30,22,0.75), rgba(2,16,12,0.75))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 20px -8px rgba(16,185,129,0.4)" }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_-20%,rgba(16,185,129,0.18),transparent_60%)]" />
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-700 grid place-items-center shadow-[0_4px_14px_-2px_rgba(16,185,129,0.7)] ring-1 ring-emerald-200/40">
              <WalletIcon size={13} className="text-[#04120c]" strokeWidth={2.6} />
            </div>
            <div className="text-left leading-none hidden sm:block">
              <div className="text-[9px] uppercase tracking-wider text-emerald-200/70 font-bold">Wallet Balance</div>
              <div className="text-[12px] font-black gl-emerald-text gl-num mt-0.5">৳ {fmt(walletBalance)}</div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/notifications")}
            whileTap={{ scale: 0.94 }}
            className="clickable relative w-10 h-10 rounded-2xl grid place-items-center border border-white/10 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(16,185,129,0.08))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
          >
            <Bell size={16} className="text-amber-200" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-rose-500 to-red-600 grid place-items-center text-[9px] font-black text-white shadow-lg shadow-rose-500/50 ring-2 ring-[#04120c]">
                {notifCount}
              </span>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/account")}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            className="clickable flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-2xl border border-amber-300/25 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(212,175,55,0.12))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 20px -10px rgba(212,175,55,0.4)" }}
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-amber-300/70 bg-gradient-to-br from-emerald-400 via-amber-300 to-amber-600">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-[12px] font-black text-[#1a0f00]">
                  {name[0]?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="flex items-center gap-1 text-[11px] font-black gl-text truncate max-w-[110px]">
                {name}
                <Crown size={11} className="text-amber-300 shrink-0" />
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full text-[8px] font-black tracking-wider"
                style={{ background: "linear-gradient(90deg,#047857,#D4AF37)", color: "#04120c" }}>
                VIP {vipLevel}
              </div>
            </div>
            <ChevronDown size={14} className="text-amber-200/70 hidden sm:block" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
