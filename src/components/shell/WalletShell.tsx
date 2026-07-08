import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet as WalletIcon,
  Gift,
  Crown,
  CalendarCheck,
  Ticket,
  Repeat,
  Coins,
  Trophy,
  History as HistoryIcon,
  BookOpen,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import crownLogo from "@/assets/golucky-crown-logo.png.asset.json";

type Item = { title: string; url: string; icon: LucideIcon; badge?: string };

const items: Item[] = [
  { title: "Wallet Centre", url: "/wallet", icon: WalletIcon },
  { title: "Dashboard", url: "/wallet/analytics", icon: LayoutDashboard },
  { title: "Rewards", url: "/promotion", icon: Gift },
  { title: "Exclusives", url: "/vip", icon: Crown, badge: "VIP" },
  { title: "Daily Rewards", url: "/activity", icon: CalendarCheck },
  { title: "Gift Code", url: "/promotion?tab=gift", icon: Ticket, badge: "NEW" },
  { title: "Redeem", url: "/promotion?tab=redeem", icon: Repeat },
  { title: "Cashback", url: "/vip?tab=rebate", icon: Coins },
  { title: "Bonuses", url: "/promotion?tab=bonus", icon: Sparkles },
  { title: "Leaderboard", url: "/promotion?tab=leaderboard", icon: Trophy },
  { title: "History", url: "/wallet/history", icon: HistoryIcon },
  { title: "How to Earn", url: "/promotion?tab=guide", icon: BookOpen },
  { title: "Security Center", url: "/wallet/security", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

const WalletShell = ({ children }: { children: ReactNode }) => {
  const { pathname, search } = useLocation();
  const activeHref = pathname + search;

  return (
    <div className="gl-wallet-shell min-h-screen w-full text-white"
      style={{
        background:
          "radial-gradient(1000px 500px at 15% 0%, rgba(245,158,11,0.10), transparent 60%)," +
          "radial-gradient(900px 500px at 100% 100%, rgba(16,185,129,0.08), transparent 60%)," +
          "linear-gradient(180deg,#05060a 0%,#0a0d15 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="hidden lg:flex sticky top-0 h-screen w-[76px] xl:w-[240px] shrink-0 flex-col gap-3 border-r border-white/5 bg-black/40 px-3 xl:px-4 py-4">
          <NavLink to="/home" className="flex items-center gap-2 px-1 py-1">
            <img
              src={crownLogo.url}
              alt="GoLucky"
              className="h-9 w-9 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]"
            />
            <div className="hidden xl:flex flex-col leading-none">
              <div className="text-[18px] font-black tracking-tight">
                <span className="text-amber-300">Go</span>
                <span className="text-emerald-400">Lucky</span>
              </div>
              <div className="text-[7px] font-black tracking-[0.28em] text-amber-300/90 mt-0.5">
                PLAY · INVEST · EARN
              </div>
            </div>
          </NavLink>

          <nav className="mt-2 flex flex-col gap-1 overflow-y-auto pr-1">
            {items.map(({ title, url, icon: Icon, badge }) => {
              const active = activeHref === url || (url === "/wallet" && pathname === "/wallet");
              return (
                <NavLink
                  key={title}
                  to={url}
                  title={title}
                  className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 border transition-colors ${
                    active
                      ? "bg-gradient-to-r from-amber-500/15 to-transparent border-amber-400/40 text-amber-200"
                      : "border-transparent text-white/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-amber-300" : "text-white/70 group-hover:text-white"}`} />
                  <span className="hidden xl:inline text-[12.5px] font-bold truncate">{title}</span>
                  {badge && (
                    <span className="hidden xl:inline ml-auto rounded-md border border-amber-400/50 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black text-amber-200">
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden xl:block mt-auto rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1a1204] to-black p-3 shadow-[0_0_20px_-8px_rgba(245,158,11,0.55)]">
            <div className="text-[10px] font-black tracking-[0.2em] text-amber-300/90">GoLucky</div>
            <div className="text-[14px] font-black text-amber-100 leading-tight">ULTRA WALLET</div>
            <div className="text-[9px] text-amber-300/80 mb-2">PREMIUM</div>
            <button className="w-full rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 py-1.5 text-[11px] font-black text-black">
              Explore Ultra Wallet →
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default WalletShell;
