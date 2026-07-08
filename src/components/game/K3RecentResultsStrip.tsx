interface K3RecentResultsStripProps {
  history: Array<{ sum?: number; period?: string | number }>;
}

const K3RecentResultsStrip = ({ history }: K3RecentResultsStripProps) => {
  const items = (history || []).slice(0, 12);
  if (items.length === 0) return null;
  return (
    <div className="mx-3 mt-2">
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 bg-white/80 backdrop-blur rounded-2xl shadow-sm">
        <span className="text-[10px] font-bold text-gray-500 shrink-0 mr-1">Recent</span>
        {items.map((h, idx) => {
          const sum = h.sum ?? 0;
          const isBig = sum >= 11;
          return (
            <div
              key={idx}
              className="shrink-0 wingo-bubble-in flex flex-col items-center"
              style={{ animationDelay: `${idx * 35}ms` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-md"
                style={{
                  background: isBig
                    ? "linear-gradient(135deg,#ef4444,#b91c1c)"
                    : "linear-gradient(135deg,#22c55e,#15803d)",
                  boxShadow: isBig
                    ? "0 2px 6px rgba(239,68,68,0.45)"
                    : "0 2px 6px rgba(34,197,94,0.45)",
                }}
              >
                {sum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default K3RecentResultsStrip;
