import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Home,
  Gamepad2,
  Gift,
  Wallet,
  User,
  Headphones,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Crown,
  Dice5,
  Dices,
  Sparkles,
  Hash,
  Trophy,
  Spade,
  Joystick,
  Fish,
  Puzzle,
  Users,
  UserPlus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type NavItem = { path: string; label: string; icon: LucideIcon };
type NavSection = { label: string; icon: LucideIcon; items: NavItem[]; defaultOpen?: boolean };

const topLevel: NavItem[] = [
  { path: "/home", label: "Home", icon: Home },
];

const sections: NavSection[] = [
  {
    label: "Native Games",
    icon: Gamepad2,
    defaultOpen: true,
    items: [
      { path: "/engine/wingo", label: "WinGo", icon: Sparkles },
      { path: "/engine/k3", label: "K3", icon: Dices },
      { path: "/engine/trx", label: "TRX", icon: Hash },
      { path: "/engine/5d", label: "5D", icon: Dice5 },
    ],
  },
  {
    label: "Third-Party Games",
    icon: Joystick,
    items: [
      { path: "/games", label: "All Games", icon: Gamepad2 },
      { path: "/games/lobby", label: "Games Lobby", icon: Joystick },
      { path: "/sports", label: "Sports", icon: Trophy },
      { path: "/games?c=live", label: "Live Casino", icon: Spade },
      { path: "/games?c=slot", label: "Slots", icon: Sparkles },
      { path: "/games?c=fishing", label: "Fishing", icon: Fish },
      { path: "/games?c=arcade", label: "Mini Games", icon: Puzzle },
    ],
  },
  {
    label: "Platform",
    icon: Wallet,
    defaultOpen: true,
    items: [
      { path: "/wallet", label: "NovaFi Wallet", icon: Wallet },
      { path: "/lucky-hub", label: "Lucky Hub", icon: Sparkles },
      { path: "/activity", label: "Rewards", icon: Gift },
      { path: "/invitation-bonus", label: "Referral", icon: UserPlus },
      { path: "/agent/dashboard", label: "Agent System", icon: Users },
      { path: "/vip", label: "VIP Club", icon: Crown },
    ],
  },
  {
    label: "Account",
    icon: User,
    items: [
      { path: "/account", label: "Profile", icon: User },
      { path: "/support", label: "Support", icon: Headphones },
      { path: "/admin", label: "Admin Panel", icon: ShieldCheck },
    ],
  },
];

const STORAGE_KEY = "gl_desktop_sidebar_collapsed";

const DesktopSidebar = () => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const width = collapsed ? 76 : 248;

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-white/8"
      style={{
        width,
        transition: "width 220ms ease",
        background:
          "linear-gradient(180deg, rgba(7,17,31,0.96) 0%, rgba(13,24,48,0.96) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/8">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #F7B500 0%, #F5C542 100%)",
              boxShadow: "0 6px 24px -8px rgba(247,181,0,0.6)",
            }}
          >
            <Crown className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-black tracking-tight text-white truncate">
                GoLucky
              </div>
              <div className="text-[10px] text-amber-300/80 -mt-0.5 truncate">
                Premium Casino
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-3">
        <div className="space-y-1">
          {topLevel.map((item) => (
            <SidebarLink
              key={item.path}
              {...item}
              active={pathname === item.path}
              collapsed={collapsed}
            />
          ))}
        </div>
        {sections.map((section) => (
          <CollapsibleSection
            key={section.label}
            section={section}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="clickable mx-3 mb-4 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/5 transition"
      >
        {collapsed ? (
          <ChevronsRight className="w-4 h-4" />
        ) : (
          <>
            <ChevronsLeft className="w-4 h-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
};

const CollapsibleSection = ({
  section,
  collapsed,
  pathname,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
}) => {
  const hasActive = section.items.some((i) => pathname.startsWith(i.path.split("?")[0]));
  const [open, setOpen] = useState<boolean>(section.defaultOpen ?? hasActive);
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (collapsed) {
    return (
      <div className="space-y-1 pt-2 border-t border-white/5 first:border-0 first:pt-0">
        {section.items.map((item) => (
          <SidebarLink
            key={item.path}
            {...item}
            active={pathname.startsWith(item.path.split("?")[0])}
            collapsed
          />
        ))}
      </div>
    );
  }

  const Icon = section.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="clickable w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] uppercase tracking-[0.18em] text-white/50 font-bold hover:text-white/80 hover:bg-white/5 transition"
      >
        <span className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-amber-300/70" />
          {section.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-2 border-l border-white/8 ml-3">
          {section.items.map((item) => (
            <SidebarLink
              key={item.path}
              {...item}
              active={pathname.startsWith(item.path.split("?")[0])}
              collapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({
  path,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  path: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) => (
  <NavLink
    to={path}
    title={collapsed ? label : undefined}
    className="clickable group relative flex items-center gap-3 h-11 rounded-xl px-3 transition-all"
    style={{
      background: active
        ? "linear-gradient(90deg, rgba(247,181,0,0.18) 0%, rgba(247,181,0,0.04) 100%)"
        : "transparent",
      boxShadow: active
        ? "inset 0 0 0 1px rgba(247,181,0,0.35), 0 8px 24px -16px rgba(247,181,0,0.7)"
        : "none",
    }}
  >
    {active && (
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
        style={{
          background: "linear-gradient(180deg, #F7B500, #17C784)",
          boxShadow: "0 0 12px rgba(247,181,0,0.7)",
        }}
      />
    )}
    <Icon
      className={`w-5 h-5 shrink-0 ${
        active ? "text-amber-300" : "text-white/70 group-hover:text-white"
      }`}
      strokeWidth={active ? 2.4 : 2}
    />
    {!collapsed && (
      <span
        className={`text-[13px] font-semibold truncate ${
          active ? "text-white" : "text-white/80 group-hover:text-white"
        }`}
      >
        {label}
      </span>
    )}
  </NavLink>
);

export default DesktopSidebar;
