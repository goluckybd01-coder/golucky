/**
 * NavPerfOverlay
 * Real-time FPS, dropped-frames, and CLS overlay for mobile BottomNav profiling.
 * Enabled in dev, or on any build via `?perf=1`. Toggle visibility with the `P` key.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const TARGET_FPS = 60;
const FRAME_BUDGET_MS = 1000 / TARGET_FPS; // 16.67ms

const NavPerfOverlay = () => {
  const enabled = (() => {
    if (typeof window === "undefined") return false;
    const qp = new URLSearchParams(window.location.search).get("perf") === "1";
    return import.meta.env.DEV || qp;
  })();

  const [visible, setVisible] = useState(true);
  const [fps, setFps] = useState(0);
  const [dropped, setDropped] = useState(0);
  const [jank, setJank] = useState(0); // frames >2x budget
  const [cls, setCls] = useState(0);
  const [history, setHistory] = useState<number[]>([]); // last 60 samples (~30s @ 500ms)
  const [markers, setMarkers] = useState<{ i: number; path: string }[]>([]); // tab-switch indices into history
  const [warning, setWarning] = useState<
    | {
        metric: "FPS" | "CLS";
        value: string;
        threshold: string;
        seconds: string;
        startedAt: string; // HH:MM:SS.mmm
        samples: number;
        worst: string;
      }
    | null
  >(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const badFpsStreak = useRef(0);
  const badClsStreak = useRef(0);
  const fpsBreachStartRef = useRef<number | null>(null);
  const clsBreachStartRef = useRef<number | null>(null);
  const fpsWorstRef = useRef<number>(Infinity); // lowest fps
  const clsWorstRef = useRef<number>(0); // highest cls
  const location = useLocation();
  const pendingMarkerRef = useRef<string | null>(null);
  const historyLenRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    pendingMarkerRef.current = location.pathname;
  }, [location.pathname, enabled]);


  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const framesRef = useRef<number>(0);
  const droppedRef = useRef<number>(0);
  const jankRef = useRef<number>(0);
  const acc = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p") setVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    lastRef.current = performance.now();

    const tick = (t: number) => {
      const dt = t - lastRef.current;
      lastRef.current = t;
      framesRef.current += 1;
      if (dt > FRAME_BUDGET_MS * 1.5) droppedRef.current += 1;
      if (dt > FRAME_BUDGET_MS * 2) jankRef.current += 1;
      acc.current += dt;
      if (acc.current >= 500) {
        const seconds = acc.current / 1000;
        const nextFps = Math.round(framesRef.current / seconds);
        setFps(nextFps);
        setDropped(droppedRef.current);
        setJank(jankRef.current);
        // Sustained-degradation detection (>2s = 4 consecutive 500ms samples)
        const now = performance.now();
        if (nextFps < 40) {
          badFpsStreak.current += 1;
          if (fpsBreachStartRef.current == null) fpsBreachStartRef.current = now;
          if (nextFps < fpsWorstRef.current) fpsWorstRef.current = nextFps;
        } else {
          badFpsStreak.current = 0;
          fpsBreachStartRef.current = null;
          fpsWorstRef.current = Infinity;
        }
        if (clsValue > 0.25) {
          badClsStreak.current += 1;
          if (clsBreachStartRef.current == null) clsBreachStartRef.current = now;
          if (clsValue > clsWorstRef.current) clsWorstRef.current = clsValue;
        } else {
          badClsStreak.current = 0;
          clsBreachStartRef.current = null;
          clsWorstRef.current = 0;
        }
        const fmtTime = (perfMs: number) => {
          const d = new Date(Date.now() - (performance.now() - perfMs));
          const pad = (n: number, w = 2) => String(n).padStart(w, "0");
          return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
        };
        if (badFpsStreak.current >= 4) {
          setWarning({
            metric: "FPS",
            value: String(nextFps),
            threshold: "< 40",
            seconds: (badFpsStreak.current / 2).toFixed(1),
            startedAt: fmtTime(fpsBreachStartRef.current!),
            samples: badFpsStreak.current,
            worst: String(fpsWorstRef.current),
          });
        } else if (badClsStreak.current >= 4) {
          setWarning({
            metric: "CLS",
            value: clsValue.toFixed(3),
            threshold: "> 0.25",
            seconds: (badClsStreak.current / 2).toFixed(1),
            startedAt: fmtTime(clsBreachStartRef.current!),
            samples: badClsStreak.current,
            worst: clsWorstRef.current.toFixed(3),
          });
        } else {
          setWarning(null);
          setWarnOpen(false);
        }
        setHistory((h) => {
          const shifted = h.length >= 60;
          const next = shifted ? h.slice(1) : h.slice();
          next.push(nextFps);
          historyLenRef.current = next.length;
          if (shifted) {
            setMarkers((ms) => ms.map((m) => ({ ...m, i: m.i - 1 })).filter((m) => m.i >= 0));
          }
          if (pendingMarkerRef.current) {
            const path = pendingMarkerRef.current;
            pendingMarkerRef.current = null;
            setMarkers((ms) => [...ms, { i: next.length - 1, path }].slice(-8));
          }
          return next;
        });
        framesRef.current = 0;
        acc.current = 0;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    let clsValue = 0;
    let po: PerformanceObserver | null = null;
    try {
      po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          // @ts-expect-error layout-shift fields
          if (!entry.hadRecentInput) {
            // @ts-expect-error layout-shift value
            clsValue += entry.value ?? 0;
          }
        }
        setCls(clsValue);
      });
      po.observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
    } catch {
      // layout-shift not supported (Safari); ignore.
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      po?.disconnect();
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  // Color-coded thresholds (green = healthy, amber = warning, red = degraded)
  const GOOD = "#22c55e";
  const WARN = "#f59e0b";
  const BAD = "#ef4444";
  const fpsColor = fps >= 55 ? GOOD : fps >= 40 ? WARN : BAD;
  const dropColor = dropped <= 5 ? GOOD : dropped <= 15 ? WARN : BAD;
  const jankColor = jank === 0 ? GOOD : jank <= 5 ? WARN : BAD;
  const clsColor = cls <= 0.1 ? GOOD : cls <= 0.25 ? WARN : BAD;

  return (
    <div
      className="lg:hidden"
      role="status"
      aria-label="Navigation performance overlay"
      style={{
        position: "fixed",
        left: 8,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
        zIndex: 100000,
        pointerEvents: "none",
        padding: "6px 10px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.72)",
        color: "#e5e7eb",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 10,
        lineHeight: 1.35,
        letterSpacing: 0.2,
        border: "1px solid rgba(251,191,36,0.25)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div>
        FPS <span style={{ color: fpsColor, fontWeight: 700 }}>{fps}</span>
        {"  "}drop <span style={{ color: dropColor, fontWeight: 700 }}>{dropped}</span>
        {"  "}jank <span style={{ color: jankColor, fontWeight: 700 }}>{jank}</span>
      </div>
      <div>
        CLS <span style={{ color: clsColor, fontWeight: 700 }}>{cls.toFixed(3)}</span>
        <span style={{ color: "#9ca3af" }}>  (P to hide)</span>
      </div>
      {(() => {
        const W = 120, H = 24, N = 60;
        const data = history.length ? history : [0];
        const step = W / (N - 1);
        const pts = data
          .map((v, i) => {
            const x = (i + (N - data.length)) * step;
            const y = H - (Math.min(60, Math.max(0, v)) / 60) * H;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
        return (
          <svg width={W} height={H} style={{ display: "block", marginTop: 4 }} aria-label="FPS history (last 30s)">
            <line x1={0} x2={W} y1={H - (55 / 60) * H} y2={H - (55 / 60) * H} stroke="rgba(34,197,94,0.35)" strokeDasharray="2 2" />
            <line x1={0} x2={W} y1={H - (40 / 60) * H} y2={H - (40 / 60) * H} stroke="rgba(239,68,68,0.35)" strokeDasharray="2 2" />
            {markers.map((m, idx) => {
              const x = (m.i + (N - data.length)) * step;
              return (
                <g key={idx}>
                  <line x1={x} x2={x} y1={0} y2={H} stroke="rgba(251,191,36,0.8)" strokeWidth={0.75} />
                  <circle cx={x} cy={2} r={1.5} fill="#fbbf24">
                    <title>{m.path}</title>
                  </circle>
                </g>
              );
            })}
            <polyline fill="none" stroke={fpsColor} strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" points={pts} />
          </svg>
        );
      })()}
      {warning && (
        <div role="alert" aria-live="assertive" style={{ marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setWarnOpen((v) => !v)}
            aria-expanded={warnOpen}
            aria-controls="nav-perf-warning-details"
            aria-label={`Sustained ${warning.metric} degradation: ${warning.value} (threshold ${warning.threshold}) for ${warning.seconds} seconds. Press Enter for details.`}
            title={`Breach start: ${warning.startedAt}\nSamples: ${warning.samples} (~${warning.seconds}s)\nWorst ${warning.metric}: ${warning.worst}\nThreshold: ${warning.threshold}`}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              font: "inherit",
              padding: "3px 6px",
              borderRadius: 6,
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(239,68,68,0.55)",
              color: "#fecaca",
              fontWeight: 700,
              pointerEvents: "auto",
              cursor: "pointer",
              outlineOffset: 2,
            }}
            onFocus={(e) => (e.currentTarget.style.outline = "2px solid #fbbf24")}
            onBlur={(e) => (e.currentTarget.style.outline = "none")}
          >
            <span aria-hidden="true">⚠ </span>
            <span style={{ background: "rgba(239,68,68,0.35)", padding: "0 4px", borderRadius: 3, marginRight: 4 }}>{warning.metric}</span>
            <span style={{ color: "#fff" }}>{warning.value}</span>
            <span style={{ color: "#fca5a5", fontWeight: 500 }}> ({warning.threshold}) · {warning.seconds}s</span>
          </button>
          <div
            id="nav-perf-warning-details"
            hidden={!warnOpen}
            style={{ marginTop: 4, fontWeight: 500, color: "#fde68a", lineHeight: 1.45, padding: "0 6px" }}
          >
            <div>start <span style={{ color: "#fff" }}>{warning.startedAt}</span></div>
            <div>samples <span style={{ color: "#fff" }}>{warning.samples}</span> (~{warning.seconds}s)</div>
            <div>worst <span style={{ color: "#fff" }}>{warning.worst}</span></div>
          </div>
        </div>
      )}
    </div>

  );
};

export default NavPerfOverlay;
