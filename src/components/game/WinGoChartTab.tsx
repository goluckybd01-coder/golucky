import { useMemo } from "react";
import { CopyablePeriod } from "@/components/game/CopyablePeriod";

interface HistoryRow {
  period: string | number;
  number: number;
}

interface WinGoChartTabProps {
  history: HistoryRow[];
  rowsToShow?: number;
}

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Render a single number badge (filled or outline)
const NumberBadge = ({ num, filled, size = 20 }: { num: number; filled: boolean; size?: number }) => {
  const isSplit = num === 0 || num === 5;
  const primary = num === 0 ? "#ef4444" : num === 5 ? "#22c55e" : [1, 3, 7, 9].includes(num) ? "#22c55e" : "#ef4444";
  const secondary = "#a855f7";

  if (!filled) {
    return (
      <span
        className="rounded-full flex items-center justify-center font-bold"
        style={{
          width: size,
          height: size,
          border: `1px solid #e5e7eb`,
          color: "#9ca3af",
          fontSize: size * 0.5,
          background: "#fff",
        }}
      >
        {num}
      </span>
    );
  }

  if (isSplit) {
    return (
      <span
        className="rounded-full overflow-hidden flex items-center justify-center font-bold relative"
        style={{ width: size, height: size }}
      >
        <span className="absolute inset-0 flex">
          <span style={{ width: "50%", height: "100%", background: primary }} />
          <span style={{ width: "50%", height: "100%", background: secondary }} />
        </span>
        <span className="relative text-white" style={{ fontSize: size * 0.55 }}>{num}</span>
      </span>
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, background: primary, fontSize: size * 0.55 }}
    >
      {num}
    </span>
  );
};

const BSBadge = ({ big }: { big: boolean }) => (
  <span
    className="rounded-full flex items-center justify-center text-white font-extrabold"
    style={{
      width: 20,
      height: 20,
      background: big ? "#f59e0b" : "#3b82f6",
      fontSize: 11,
    }}
  >
    {big ? "B" : "S"}
  </span>
);

const WinGoChartTab = ({ history, rowsToShow = 30 }: WinGoChartTabProps) => {
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const ap = String(a.period);
      const bp = String(b.period);
      if (ap.length !== bp.length) return bp.length - ap.length;
      return bp.localeCompare(ap);
    });
  }, [history]);
  const sample = useMemo(() => sortedHistory.slice(0, 100), [sortedHistory]);
  const rows = useMemo(() => sortedHistory.slice(0, rowsToShow), [sortedHistory, rowsToShow]);

  const stats = useMemo(() => {
    const frequency = Array(10).fill(0);
    const missing = Array(10).fill(0);
    const avgMissing = Array(10).fill(0);
    const maxConsecutive = Array(10).fill(0);
    const nums = sample.map((h) => h.number);
    nums.forEach((n) => { if (n >= 0 && n <= 9) frequency[n]++; });
    for (let n = 0; n < 10; n++) {
      const idx = nums.findIndex((v) => v === n);
      missing[n] = idx === -1 ? nums.length : idx;
    }
    for (let n = 0; n < 10; n++) {
      const positions: number[] = [];
      nums.forEach((v, i) => { if (v === n) positions.push(i); });
      if (positions.length <= 1) {
        avgMissing[n] = positions.length === 0 ? nums.length : 0;
      } else {
        const gaps: number[] = [];
        for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i - 1] - 1);
        avgMissing[n] = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      }
    }
    for (let n = 0; n < 10; n++) {
      let cur = 0;
      let max = 0;
      nums.forEach((v) => {
        if (v === n) { cur++; if (cur > max) max = cur; } else cur = 0;
      });
      maxConsecutive[n] = max;
    }
    return { frequency, missing, avgMissing, maxConsecutive };
  }, [sample]);

  const PERIOD_COL = 110;
  const BADGE = 20;
  const GAP = 4;
  const ROW_H = 30;
  const BS_COL = 28;
  const numbersWidth = NUMBERS.length * BADGE + (NUMBERS.length - 1) * GAP;

  const points = useMemo(() => {
    return rows.map((r, idx) => {
      const n = r.number;
      const x = PERIOD_COL + n * (BADGE + GAP) + BADGE / 2;
      const y = idx * ROW_H + ROW_H / 2;
      return { x, y };
    });
  }, [rows]);

  const svgWidth = PERIOD_COL + numbersWidth + BS_COL + 12;
  const svgHeight = rows.length * ROW_H;

  return (
    <div>
      <div
        className="grid py-2 px-3 text-[11px] font-bold text-white"
        style={{
          gridTemplateColumns: "1fr auto",
          background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
        }}
      >
        <span>Period</span>
        <span className="text-right pr-1">Number</span>
      </div>
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center mb-1.5">
          <span className="text-gray-500 text-[10px] font-semibold" style={{ width: PERIOD_COL }}>Statistic</span>
          <span className="text-gray-400 text-[10px]">(last 100 Periods)</span>
        </div>
        <div className="flex items-center mb-1" style={{ height: ROW_H - 6 }}>
          <span className="text-gray-500 text-[10px]" style={{ width: PERIOD_COL }}>Winning numbers</span>
          <div className="flex" style={{ gap: GAP }}>
            {NUMBERS.map((n) => (
              <NumberBadge key={n} num={n} filled size={BADGE} />
            ))}
          </div>
        </div>
        {[
          { label: "Missing", data: stats.missing },
          { label: "Avg missing", data: stats.avgMissing },
          { label: "Frequency", data: stats.frequency },
          { label: "Max consecutive", data: stats.maxConsecutive },
        ].map((r) => (
          <div key={r.label} className="flex items-center" style={{ height: 18 }}>
            <span className="text-gray-500 text-[10px]" style={{ width: PERIOD_COL }}>{r.label}</span>
            <div className="flex" style={{ gap: GAP }}>
              {r.data.map((v, i) => (
                <span key={i} className="text-center text-gray-500 text-[10px] font-semibold" style={{ width: BADGE }}>{v}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="relative px-3 py-2 overflow-x-auto">
        <div className="relative" style={{ width: svgWidth, minWidth: "100%" }}>
          {points.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight} style={{ zIndex: 5 }}>
              <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          )}
          {rows.map((row, idx) => {
            const big = row.number >= 5;
            return (
              <div key={idx} className="flex items-center" style={{ height: ROW_H, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: PERIOD_COL }}>
                  <CopyablePeriod period={String(row.period)} className="text-gray-500 text-[9px] leading-tight font-mono" />
                </div>
                <div className="flex relative" style={{ gap: GAP }}>
                  {NUMBERS.map((n) => (
                    <NumberBadge key={n} num={n} filled={n === row.number} size={BADGE} />
                  ))}
                </div>
                <div className="ml-3 flex items-center justify-center" style={{ width: BS_COL }}>
                  <BSBadge big={big} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WinGoChartTab;
