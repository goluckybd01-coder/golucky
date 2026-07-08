import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Wallet as WalletIcon, Plus, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formatBDT = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

const DesktopTopBar = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [luckyCoin, setLuckyCoin] = useState(0);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !alive) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("wallets")
        .select("balance, lucky_coin")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive || !data) return;
      const w = data as any;
      setBalance(Number(w.balance ?? 0));
      setLuckyCoin(Number(w.lucky_coin ?? 0));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <header
      className="hidden lg:flex sticky top-0 z-40 h-16 items-center gap-4 px-6 border-b border-white/8"
      style={{
        background:
          "linear-gradient(180deg, rgba(7,17,31,0.85) 0%, rgba(7,17,31,0.7) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="search"
          placeholder="Search games, providers, players..."
          className="clickable w-full h-10 rounded-xl pl-9 pr-4 text-[13px] text-white placeholder:text-white/40 border border-white/10 focus:border-amber-400/40 focus:outline-none transition"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>

      <div className="flex-1" />

      {/* Lucky coin chip */}
      <div
        className="hidden xl:flex items-center gap-2 h-10 px-3 rounded-xl border border-amber-400/20"
        style={{ background: "rgba(247,181,0,0.08)" }}
      >
        <Coins className="w-4 h-4 text-amber-300" />
        <span className="text-[13px] font-bold text-amber-200 tabular-nums">
          {formatBDT(luckyCoin)}
        </span>
      </div>

      {/* Wallet balance chip */}
      <button
        type="button"
        onClick={() => navigate("/wallet")}
        className="clickable flex items-center gap-2 h-10 pl-3 pr-1 rounded-xl border border-emerald-400/25 hover:border-emerald-400/50 transition"
        style={{ background: "rgba(23,199,132,0.08)" }}
      >
        <WalletIcon className="w-4 h-4 text-emerald-300" />
        <span className="text-[13px] font-bold text-emerald-200 tabular-nums">
          ৳{formatBDT(balance)}
        </span>
        <span
          className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #17C784, #0d8a5b)",
            boxShadow: "0 4px 12px -4px rgba(23,199,132,0.6)",
          }}
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={2.8} />
        </span>
      </button>

      {/* Notifications */}
      <button
        type="button"
        onClick={() => navigate("/notifications")}
        className="clickable relative w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/5 transition"
      >
        <Bell className="w-4 h-4 text-white/80" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400" />
      </button>

      {/* Avatar */}
      <button
        type="button"
        onClick={() => navigate("/account")}
        className="clickable flex items-center gap-2 h-10 pl-1 pr-3 rounded-xl border border-white/10 hover:bg-white/5 transition"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black text-black"
          style={{ background: "linear-gradient(135deg, #F7B500, #F5C542)" }}
        >
          {(email?.[0] ?? "G").toUpperCase()}
        </span>
        <span className="text-[12px] font-semibold text-white/80 max-w-[120px] truncate">
          {email || "Account"}
        </span>
      </button>
    </header>
  );
};

export default DesktopTopBar;
