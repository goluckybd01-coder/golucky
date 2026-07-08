/**
 * Home-shaped skeleton shown while auth is being verified, before any redirect
 * to /login lands. Renders the mobile 430px shell on <lg and a 12-col desktop
 * dashboard shape on ≥lg — so users never see a full-screen black gap on any
 * viewport.
 */
const shimmer =
  "relative overflow-hidden bg-white/[0.04] before:absolute before:inset-0 before:-translate-x-full before:animate-[hs_1.4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent";

const Block = ({ className = "" }: { className?: string }) => (
  <div className={`${shimmer} rounded-xl ${className}`} />
);

const HomeSkeleton = () => (
  <div
    data-testid="home-skeleton"
    className="min-h-screen w-full"
    style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#1a1f35 100%)" }}
    aria-busy="true"
    aria-label="Loading home"
  >
    <style>{`@keyframes hs { 100% { transform: translateX(100%) } }`}</style>

    <div className="lg:hidden w-full flex justify-center">
      <div className="w-full max-w-[430px] px-3 pt-3 pb-8 space-y-2">
        <div className="flex items-center gap-2">
          <Block className="h-10 w-10" />
          <Block className="h-6 w-28" />
          <div className="flex-1" />
          <Block className="h-10 w-10 rounded-xl" />
          <Block className="h-10 w-10 rounded-xl" />
          <Block className="h-10 w-10 rounded-full" />
        </div>
        <div
          className={`${shimmer} h-40 rounded-2xl border border-amber-400/20`}
          style={{ boxShadow: "0 20px 50px -25px rgba(184,134,47,0.55)" }}
        />
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-14" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Block key={i} className="h-16" />
          ))}
        </div>
        <Block className="h-10" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="h-14" />
          ))}
        </div>
        <Block className="h-20" />
      </div>
    </div>

    <div className="hidden lg:block max-w-[1600px] mx-auto px-6 xl:px-10 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Block className="h-11 w-11" />
        <Block className="h-8 w-40" />
        <div className="flex-1" />
        <Block className="h-10 w-24 rounded-lg" />
        <Block className="h-10 w-24 rounded-lg" />
        <Block className="h-10 w-10 rounded-full" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div
            className={`${shimmer} h-56 rounded-2xl border border-amber-400/20`}
            style={{ boxShadow: "0 24px 60px -30px rgba(184,134,47,0.55)" }}
          />
          <div className="grid grid-cols-4 xl:grid-cols-8 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Block key={i} className="h-24" />
            ))}
          </div>
          <Block className="h-24" />
          <Block className="h-11" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} className="h-24" />
            ))}
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} className="h-16" />
            ))}
          </div>
          <Block className="h-28" />
          <Block className="h-32" />
          <Block className="h-28" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Block key={i} className="h-20" />
            ))}
          </div>
          <Block className="h-14" />
        </aside>

        <div className="col-span-12">
          <Block className="h-24" />
        </div>
      </div>
    </div>
  </div>
);

export default HomeSkeleton;
