/**
 * Decorative aurora blobs for hero sections. Non-interactive.
 * Drop into any relative-positioned container.
 */
const AuroraBackdrop = ({ intensity = 1 }: { intensity?: number }) => (
  <div
    className="pointer-events-none absolute inset-0 overflow-hidden decorative"
    style={{ zIndex: 0, opacity: Math.max(0.3, Math.min(1, intensity)) }}
    aria-hidden
  >
    <div
      className="gl-aurora absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full"
      style={{ background: "radial-gradient(closest-side, rgba(23,199,132,0.45), transparent 70%)", filter: "blur(70px)" }}
    />
    <div
      className="gl-aurora absolute -bottom-24 -right-16 w-[460px] h-[460px] rounded-full"
      style={{ background: "radial-gradient(closest-side, rgba(247,181,0,0.40), transparent 70%)", filter: "blur(75px)", animationDelay: "1.6s" }}
    />
    <div
      className="gl-aurora absolute top-1/3 left-1/3 w-[340px] h-[340px] rounded-full"
      style={{ background: "radial-gradient(closest-side, rgba(15,27,61,0.55), transparent 70%)", filter: "blur(60px)", animationDelay: "2.8s" }}
    />
  </div>
);

export default AuroraBackdrop;
