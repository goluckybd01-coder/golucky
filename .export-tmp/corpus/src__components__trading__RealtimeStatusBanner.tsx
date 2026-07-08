import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLastRealtimeActivity, subscribeRealtimeActivity } from "@/lib/realtimeActivity";

const MAX_RETRIES = 8;

type Status = "connecting" | "connected" | "disconnected";

function formatAgo(ts: number | null, now: number): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 1) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function RealtimeStatusBanner() {
  const [status, setStatus] = useState<Status>("connecting");
  const [attempt, setAttempt] = useState(0);
  const [lastTs, setLastTs] = useState<number | null>(getLastRealtimeActivity());
  const [now, setNow] = useState(Date.now());
  const [fatal, setFatal] = useState<string | null>(null);
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null);
  const prevStatusRef = useRef<Status>("connecting");
  const exhaustedRef = useRef(false);
  const lastDelayRef = useRef<number>(0);
  const totalBackoffRef = useRef<number>(0);


  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase.channel(`__rt-status-${attempt}-${Math.random().toString(36).slice(2)}`);
      ch.subscribe((s) => {
        try {
          if (s === "SUBSCRIBED") setStatus("connected");
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus("disconnected");
          else setStatus("connecting");
        } catch (err) {
          console.error("[RealtimeStatusBanner] status handler error:", err);
        }
      });
    } catch (err) {
      console.error("[RealtimeStatusBanner] subscribe failed:", err);
      setFatal(err instanceof Error ? err.message : "Realtime unavailable");
    }
    return () => {
      try { if (ch) supabase.removeChannel(ch); } catch (err) { console.error(err); }
    };
  }, [attempt]);


  useEffect(() => subscribeRealtimeActivity((ts) => setLastTs(ts)), []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const reconnect = (manual = false) => {
    setFatal(null);
    setStatus("connecting");
    try {
      const rt = (supabase as unknown as { realtime: any }).realtime;
      rt?.disconnect?.();
      rt?.connect?.();
    } catch (err) {
      console.error("[RealtimeStatusBanner] socket reconnect failed:", err);
    }
    if (manual) {
      exhaustedRef.current = false;
      lastDelayRef.current = 0;
      totalBackoffRef.current = 0;
      setAttempt(1);
    } else {
      setAttempt((n) => n + 1);
    }
  };



  useEffect(() => {
    const prev = prevStatusRef.current;
    if (status === "connected") {
      if (prev !== "connected" && attempt > 0) {
        const lastSec = (lastDelayRef.current / 1000).toFixed(1);
        const totalSec = (totalBackoffRef.current / 1000).toFixed(1);
        toast.success("Realtime reconnected", {
          description: `Restored on attempt ${attempt} after ${lastSec}s backoff (total ${totalSec}s).`,
        });
      }
      exhaustedRef.current = false;
      lastDelayRef.current = 0;
      totalBackoffRef.current = 0;
    }
    prevStatusRef.current = status;
  }, [status, attempt]);

  useEffect(() => {
    if (status !== "disconnected") {
      setNextRetryAt(null);
      return;
    }
    if (attempt >= MAX_RETRIES) {
      setNextRetryAt(null);
      if (!exhaustedRef.current) {
        exhaustedRef.current = true;
        const totalSec = (totalBackoffRef.current / 1000).toFixed(1);
        toast.error("Realtime connection failed", {
          description: `Gave up after ${MAX_RETRIES} attempts and ${totalSec}s of backoff. Tap Reconnect to try again.`,
        });
      }
      return;
    }
    const base = Math.min(60000, 2000 * Math.pow(2, Math.min(attempt, 5)));
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    lastDelayRef.current = delay;
    totalBackoffRef.current += delay;
    setNextRetryAt(Date.now() + delay);
    const id = setTimeout(reconnect, delay);
    return () => clearTimeout(id);
  }, [status, attempt]);

  const isDown = status === "disconnected";
  const updatedLabel = `Updated ${formatAgo(lastTs, now)}`;
  const retryInSec = nextRetryAt ? Math.max(0, Math.ceil((nextRetryAt - now) / 1000)) : null;

  try {
    if (fatal) {
      return (
        <div className="sticky top-0 z-40 w-full bg-zinc-800/80 border-b border-white/10 text-zinc-200 text-[11px]">
          <div className="max-w-3xl mx-auto px-4 py-1 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-3 h-3 text-zinc-400" />
              Realtime unavailable — showing cached data
            </span>
            <button onClick={() => reconnect(true)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20">Retry</button>
          </div>
        </div>
      );
    }

    if (status === "connected") {
      return (
        <div className="sticky top-0 z-40 w-full bg-emerald-950/60 border-b border-emerald-500/20 text-emerald-200 text-[11px]">
          <div className="max-w-3xl mx-auto px-4 py-1 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Live feed
            </span>
            <span className="tabular-nums opacity-80">{updatedLabel}</span>
          </div>
        </div>
      );
    }


    return (

    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={`sticky top-0 z-40 w-full text-[12px] font-semibold ${
          isDown ? "bg-rose-600/90 text-white" : "bg-amber-500/90 text-black"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            {isDown ? <WifiOff className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isDown
              ? `Realtime disconnected${attempt ? ` · attempt ${attempt}` : ""}${
                  retryInSec !== null ? ` · retrying in ${retryInSec}s` : ""
                }`
              : attempt > 0
                ? `Reconnecting to live feed… (attempt ${attempt})`
                : "Connecting to live feed…"}
          </span>
          <span className="flex items-center gap-2">
            <span className="tabular-nums opacity-90 font-normal">{updatedLabel}</span>
            {isDown && (
              <button
                onClick={() => reconnect(true)}
                disabled={retryInSec !== null && retryInSec > 0}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white/15"
              >
                <Wifi className="w-3 h-3" />
                {retryInSec !== null && retryInSec > 0 ? `Retry in ${retryInSec}s` : "Reconnect"}
              </button>
            )}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
    );
  } catch (err) {
    console.error("[RealtimeStatusBanner] render error:", err);
    return (
      <div className="sticky top-0 z-40 w-full bg-zinc-800/80 border-b border-white/10 text-zinc-200 text-[11px] px-4 py-1">
        Realtime status unavailable
      </div>
    );
  }
}
