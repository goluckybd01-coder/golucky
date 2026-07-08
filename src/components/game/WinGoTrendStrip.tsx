interface WinGoTrendStripProps {
  history: Array<{ number: number; period?: string | number }>;
}

const numberBg = (n: number) => {
  if (n === 0) return "linear-gradient(135deg,#ef4444 50%,#a855f7 50%)";
  if (n === 5) return "linear-gradient(135deg,#22c55e 50%,#a855f7 50%)";
  return [1, 3, 7, 9].includes(n)
    ? "linear-gradient(135deg,#22c55e,#15803d)"
    : "linear-gradient(135deg,#ef4444,#b91c1c)";
};

const WinGoTrendStrip = ({ history }: WinGoTrendStripProps) => {
  const items = (history || []).slice(0, 24);
  if (items.length === 0) return null;
  const last20 = items.slice(0, 20);
  const big = last20.filter((h) => h.number >= 5).length;
  const small = last20.length - big;
  const bigPct = Math.round((big / Math.max(last20.length, 1)) * 100);
  const smallPct = 100 - bigPct;
  return (
    <div className="mt-2 mb-3">
      <div className="rounded-2xl p-3 space-y-3" style={{ background: "transparent" }}>
        {/* Bubble strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {items.map((h, idx) => {
            const isBig = h.number >= 5;
            return (
              <div
                key={idx}
                className="shrink-0 flex flex-col items-center wingo-bubble-in"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold"
                  style={{
                    background: numberBg(h.number),
                    boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                  }}
                >
                  {h.number}
                </div>
                <span className="text-[8px] font-semibold mt-0.5 text-slate-400">
                  {isBig ? "Big" : "Small"}·{h.number % 2 === 0 ? "E" : "O"}
                </span>
              </div>
            );
          })}
        </div>
        {/* Big vs Small bar */}
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-red-500">Big {bigPct}%</span>
            <span className="text-gray-400">Last {last20.length}</span>
            <span className="text-green-600">Small {smallPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-slate-700/50 flex">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${bigPct}%`, background: "linear-gradient(90deg,#ef4444,#b91c1c)" }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${smallPct}%`, background: "linear-gradient(90deg,#15803d,#22c55e)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinGoTrendStrip;
