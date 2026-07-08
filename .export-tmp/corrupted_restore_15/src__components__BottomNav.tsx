import { NavLink, useLocation } from "react-router-dom";
import { Home, Gamepad2, Sparkles, Gift, Wallet, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import NavPerfOverlay from "@/components/debug/NavPerfOverlay";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/lucky-hub", label: "Lucky Hub", icon: Sparkles },
  { path: "/rewards", label: "Rewards", icon: Gift },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/account", label: "Profile", icon: User },
];

// GPU-friendly particle: only transform + opacity, no layout reads.
const ActiveParticle = ({ delay }: { delay: number }) => (
  <motion.span
    aria-hidden
    className="absolute left-1/2 top-0 w-1 h-1 rounded-full bg-amber-400"
    style={{ willChange: "transform, opacity", transform: "translate3d(-50%,0,0)" }}
    initial={false}
    animate={{ opacity: [0, 1, 0], y: [-2, -20, -22], scale: [0.4, 1, 0.4] }}
    transition={{ duration: 1.4, delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
  />
);

const BottomNav = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending transaction requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from("transaction_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    // Subscribe to realtime changes (unique channel per mount to avoid
    // "cannot add postgres_changes after subscribe" when reusing names)
    const channel = supabase
      .channel(`pending-requests-count-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transaction_requests',
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
    <NavPerfOverlay />
    <nav
      className="bottom-nav lg:hidden fixed bottom-0 left-0 right-0 w-full backdrop-blur-2xl border-t border-amber-300/25"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 99999,
        pointerEvents: "auto",
        background:
          "linear-gradient(180deg, rgba(4,14,10,0.92) 0%, rgba(2,8,16,0.96) 60%, rgba(0,0,0,0.98) 100%)",
        boxShadow:
          "0 -20px 50px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06), 0 -4px 30px -10px rgba(16,185,129,0.25)",
      }}
    >
      {/* Gold hairline top */}
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      {/* Ambient under-glow */}
      <span className="pointer-events-none absolute inset-x-12 -top-6 h-12 blur-2xl opacity-60 decorative"
        style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(212,175,55,0.35), transparent 70%)" }} />
      {/* 5-column grid for equal distribution */}
      <div 
        className="w-full max-w-[430px] mx-auto py-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0px"
        }}
      >
        {navItems.map((item) => {
          const isActive = item.path === "/"
            ? (location.pathname === "/" || location.pathname === "/home")
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          const showBadge = item.path === "/wallet" && pendingCount > 0;
          
            return (
            <NavLink
              key={item.path}
              to={item.path}
              className="clickable relative flex flex-col items-center justify-center"
              style={{ minHeight: "56px", pointerEvents: "auto", zIndex: 100 }}
            >
              <motion.div
                className={`relative flex flex-col items-center justify-center gap-1 w-full transition-colors duration-300 ${
                  isActive 
                    ? "text-amber-400" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
                whileTap={{ scale: 0.9 }}
                initial={false}
              >
                <AnimatePresence initial={false}>
                  {isActive && (
                    <>
                      {/* Active background glow - decorative, GPU-composited */}
                      <motion.div
                        layoutId="navActiveBackground"
                        className="absolute inset-1 rounded-2xl decorative"
                        style={{
                          pointerEvents: "none",
                          zIndex: 0,
                          willChange: "transform, opacity",
                          transform: "translateZ(0)",
                          background:
                            "linear-gradient(to bottom, rgba(245,158,11,0.20), rgba(245,158,11,0.08) 55%, rgba(16,185,129,0.05))",
                          border: "1px solid rgba(245,158,11,0.30)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />

                      {/* Top indicator line - golden - decorative */}
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -top-1 left-1/2 w-6 h-0.5 rounded-full decorative"
                        style={{
                          background: "linear-gradient(90deg, #fbbf24, #22c55e, #fbbf24)",
                          boxShadow: "0 0 12px rgba(251,191,36,0.55)",
                          pointerEvents: "none",
                          zIndex: 0,
                          willChange: "transform, opacity",
                          transform: "translate3d(-50%,0,0)",
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />

                      {/* Floating particles - decorative, skipped on reduced motion */}
                      {!prefersReducedMotion && (
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 decorative"
                          style={{ pointerEvents: "none", zIndex: 0, contain: "layout paint" }}
                        >
                          <ActiveParticle delay={0} />
                          <ActiveParticle delay={0.5} />
                        </div>
                      )}
                    </>
                  )}
                </AnimatePresence>
                
                {/* Icon container with 3D effect */}
                <motion.div 
                  className="relative z-10"
                  style={{ pointerEvents: "none" }}
                  animate={isActive ? {
                    y: -2,
                    scale: 1.15,
                  } : {
                    y: 0,
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Icon glow - golden - decorative */}
                  {/* Icon glow - static CSS (no per-frame blur repaint) */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full decorative"
                      style={{
                        pointerEvents: "none",
                        zIndex: 0,
                        background:
                          "radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0) 65%)",
                      }}
                    />
                  )}
                  
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 transition-all duration-300 ${
                      isActive ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : ""
                    }`}
                  />
                  
                  {/* Pending requests badge */}
                  {showBadge && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-3 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold rounded-full px-1"
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #f97316)",
                        boxShadow: "0 0 10px rgba(239,68,68,0.6)",
                      }}
                    >
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-white"
                      >
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </motion.span>
                    </motion.span>
                  )}
                </motion.div>
                
                {/* Label - never clipped */}
                <motion.span 
                  className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-visible ${
                    isActive 
                      ? "font-bold text-amber-400" 
                      : "font-medium"
                  }`}
                  style={{
                    fontSize: "11px",
                    lineHeight: "14px",
                  }}
                  animate={isActive ? {
                    textShadow: "0 0 10px rgba(251,191,36,0.5)",
                  } : {
                    textShadow: "none",
                  }}
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
    </>
  );
};

export default BottomNav;
