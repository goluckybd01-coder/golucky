import { ReactNode } from "react";
import DesktopSidebar from "./DesktopSidebar";
import DesktopTopBar from "./DesktopTopBar";

/**
 * AppShell — desktop dashboard chrome (sidebar + top bar).
 * Renders the chrome only on lg+; on mobile/tablet it is a transparent passthrough
 * so the existing mobile shell (MobileContainer + BottomNav) is untouched.
 */
const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className="gl-app-shell flex min-h-screen w-full"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(247,181,0,0.06), transparent 60%)," +
          "radial-gradient(1000px 600px at 100% 100%, rgba(23,199,132,0.06), transparent 60%)," +
          "linear-gradient(180deg, #07111F 0%, #0A1729 100%)",
      }}
    >
      <DesktopSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <DesktopTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
