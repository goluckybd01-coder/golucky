import { useEffect, useState } from "react";
import HomeMobile from "./HomeMobile";
import HomeDesktop from "./HomeDesktop";
import HomeErrorBoundary from "@/components/home/HomeErrorBoundary";

/**
 * Ultra Premium 2026 Home
 * - <1024px: mobile 430px shell (HomeMobile)
 * - ≥1024px: dedicated desktop layout (HomeDesktop) — 12-col, 2-column
 *   composition. Not a stacked mirror of mobile.
 */
const LG_BREAKPOINT = 1024;

const Home = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= LG_BREAKPOINT : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (isDesktop)
    return (
      <HomeErrorBoundary>
        <HomeDesktop />
      </HomeErrorBoundary>
    );

  return (
    <HomeErrorBoundary>
      <div className="min-h-screen w-full flex justify-center bg-[#050A14]">
        <div className="w-full max-w-[430px]">
          <HomeMobile />
        </div>
      </div>
    </HomeErrorBoundary>
  );
};

export default Home;
