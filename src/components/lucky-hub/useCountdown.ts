import { useEffect, useState } from "react";

export function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return { d: 0, h: 0, m: 0, s: 0, done: true, label: "—" };
  const diff = Math.max(0, new Date(target).getTime() - now);
  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / 60000) % 60;
  const h = Math.floor(diff / 3600000) % 24;
  const d = Math.floor(diff / 86400000);
  const label = d > 0 ? `${d}d ${h}h ${m}m` : `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return { d, h, m, s, done: diff === 0, label };
}
