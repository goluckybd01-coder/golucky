import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import MobileSideButtons from "./MobileSideButtons";
import GameDesktopRail from "./GameDesktopRail";
import AppShell from "./shell/AppShell";
import WalletShell from "./shell/WalletShell";
import { useIsDesktop } from "@/hooks/useBreakpoint";

interface MobileContainerProps {
  children: ReactNode;
}

/**
 * MobileContainer - Forces the main app to display in a mobile-like container
 * Even on desktop, the app will be centered and constrained to mobile width
 * EXCEPTION: Admin routes are excluded and displayed in full desktop mode
 */
const MobileContainer = ({ children }: MobileContainerProps) => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/game-admin");
  const isWideGameRoute =
    location.pathname === "/game/crash" ||
    location.pathname === "/game/aviator";
  const gameKey: "crash" | "aviator" | null = isWideGameRoute
    ? (location.pathname.endsWith("aviator") ? "aviator" : "crash")
    : null;
  const isHomeRoute = location.pathname === "/home" || location.pathname === "/";
  const isWalletRoute = location.pathname === "/wallet";
  const isDashboardRoute = [
    "/home",
    "/",
    "/popular",
    "/activity",
    "/account",
  ].includes(location.pathname);
  const isDesktop = useIsDesktop();
  const useDesktopShell = isDesktop && isDashboardRoute && !isAdminRoute;
  const useWalletShell = isDesktop && isWalletRoute && !isAdminRoute;

  // Admin routes: Full desktop mode, no mobile constraints
  if (isAdminRoute) {
    return (
      <div className="admin-desktop-container min-h-screen w-full bg-slate-900">
        {children}
      </div>
    );
  }

  // /wallet desktop: dedicated WalletShell (inner nav rail, no AppShell chrome)
  if (useWalletShell) {
    return <WalletShell>{children}</WalletShell>;
  }

  // Desktop dashboard mode for main app pages: sidebar + topbar + full-width content
  if (useDesktopShell) {
    return (
      <AppShell>
        <div className="gl-dashboard-page mx-auto w-full max-w-[1440px] px-6 xl:px-10 py-6">
          {children}
        </div>
      </AppShell>
    );
  }

  // Main app: Mobile container with centered mobile-width shell
  return (
    <div className="mobile-app-container force-click overflow-x-hidden" style={{ pointerEvents: "auto" }}>
      {/* Background for desktop - decorative layer, MUST NOT block clicks */}
      <div 
        className="hidden md:block fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 decorative"
        style={{ zIndex: -10, pointerEvents: "none" }}
      >
        {/* Decorative elements for desktop background - non-clickable */}
        <div className="absolute inset-0 opacity-10 decorative" style={{ pointerEvents: "none" }}>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl decorative" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl decorative" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center decorative" style={{ pointerEvents: "none" }}>
          <div className="text-gray-700 text-sm font-medium tracking-widest uppercase opacity-50">
            GoLucky Mobile
          </div>
        </div>
      </div>
      
      {/* Mobile container wrapper - centered with max-width */}
      <div 
        className={`mobile-app-wrapper relative overflow-visible force-click ${isWideGameRoute ? "mobile-app-wrapper--wide" : ""} ${isHomeRoute ? "mobile-app-wrapper--home" : ""}`}
        style={{ zIndex: 1, pointerEvents: "auto" }}
      >
        {/* Side buttons - Agent & Spin - positioned relative to container */}
       <div className="absolute inset-0 decorative" style={{ zIndex: 30, pointerEvents: "none" }}>
         <div className="relative w-full h-full" style={{ pointerEvents: "none" }}>
            <MobileSideButtons />
          </div>
        </div>
        
        {/* The actual content area - MUST have pointer-events-auto */}
        {isWideGameRoute && gameKey ? (
          <div
            className="game-desktop-stage force-click page-content"
            style={{ zIndex: 2, pointerEvents: "auto", position: "relative" }}
          >
            <aside className="game-desktop-stage__rail">
              <GameDesktopRail game={gameKey} />
            </aside>
            <div className="game-desktop-stage__shell mobile-app-content pb-20">
              {children}
            </div>
          </div>
        ) : (
          <div
            className={`mobile-app-content pb-20 force-click page-content ${isHomeRoute ? "home-canvas" : ""}`}
            style={{ zIndex: 2, pointerEvents: "auto", position: "relative" }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileContainer;
