import { THEMES, type Theme } from "../luckyHubThemes";

/**
 * Dev-only swatch preview for LuckyHub card themes.
 * Route: /__dev/lucky-hub-themes  (DEV builds only)
 */
export default function LuckyHubThemePreview() {
  const names = Object.keys(THEMES) as Theme[];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black mb-1">LuckyHub Theme Swatches</h1>
        <p className="text-white/50 text-sm mb-6">
          Source: <code className="text-emerald-300">src/pages/luckyHubThemes.ts</code>. Edit hex values there.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {names.map((name) => {
            const t = THEMES[name];
            return (
              <div
                key={name}
                className={`relative rounded-2xl border ${t.border} bg-gradient-to-b ${t.bg} p-4 overflow-hidden`}
                style={{ boxShadow: `0 0 40px ${t.glow}` }}
              >
                <div
                  aria-hidden
                  className="absolute -inset-8 pointer-events-none opacity-60"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${t.glow}, transparent 60%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-black uppercase tracking-wider ${t.title}`}>{name}</h2>
                    <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                  </div>

                  <button
                    type="button"
                    className={`mt-4 w-full py-2 rounded-lg text-black font-bold text-sm bg-gradient-to-r ${t.btn}`}
                  >
                    Sample Button
                  </button>

                  <dl className="mt-4 text-[11px] font-mono space-y-1.5">
                    {Object.entries(t.hex).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded border border-white/20 shrink-0"
                          style={{ background: v }}
                        />
                        <dt className="text-white/50 w-20">{k}</dt>
                        <dd className="text-white/90">{v}</dd>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-4 h-4 rounded border border-white/20 shrink-0" style={{ background: t.glow }} />
                      <dt className="text-white/50 w-20">glow</dt>
                      <dd className="text-white/90 break-all">{t.glow}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
