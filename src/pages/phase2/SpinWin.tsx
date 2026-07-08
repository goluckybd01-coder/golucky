import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Segment { label: string; reward: number; weight: number; color: string; }
interface Wheel { id: string; name: string; daily_free_spins: number; segments: Segment[]; }

export default function SpinWin() {
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [used, setUsed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const { data: w } = await supabase
        .from("p2_spin_wheels" as never)
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      setWheel(w as Wheel | null);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && w) {
        const today = new Date().toISOString().slice(0, 10);
        const { count } = await supabase
          .from("p2_spin_spins" as never)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("wheel_id", (w as Wheel).id)
          .eq("spin_date", today);
        setUsed(count ?? 0);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!wheel || !canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d")!;
    const size = c.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const n = wheel.segments.length;
    const arc = (Math.PI * 2) / n;
    ctx.clearRect(0, 0, size, size);
    wheel.segments.forEach((s, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, i * arc, (i + 1) * arc);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * arc + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.fillText(s.label, r - 12, 5);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [wheel]);

  const spin = async () => {
    if (!wheel || spinning) return;
    setSpinning(true);
    const { data, error } = await (supabase.rpc as any)("p2_execute_spin", { p_wheel_id: wheel.id });
    if (error) {
      setSpinning(false);
      return toast.error(error.message.replace(/_/g, " "));
    }
    const res = data as { segment_index: number; label: string; reward_amount: number };
    const n = wheel.segments.length;
    const segAngle = 360 / n;
    const target = 360 * 6 + (360 - (res.segment_index * segAngle + segAngle / 2));
    setRotation(target);
    setTimeout(() => {
      toast.success(`You won ${res.label}!`, { duration: 4000 });
      setSpinning(false);
      setUsed(u => u + 1);
    }, 4200);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!wheel) return <div className="min-h-screen flex items-center justify-center text-white/60">No active wheel</div>;

  const spinsLeft = Math.max(0, wheel.daily_free_spins - used);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-slate-950 to-slate-900 text-white p-4 pb-24">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold pt-4 bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
          <Sparkles className="inline w-7 h-7 mr-1 text-amber-400" />
          Spin & Win
        </h1>
        <p className="text-white/60 text-sm mt-1 mb-6">Free daily spin — win up to ৳1,000</p>

        <div className="relative mx-auto" style={{ width: 320, height: 340 }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-400 z-10" />
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="mt-4"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          />
        </div>

        <button
          onClick={spin}
          disabled={spinning || spinsLeft === 0}
          className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition"
        >
          {spinning ? "Spinning..." : spinsLeft === 0 ? "Come back tomorrow" : `SPIN ( ${spinsLeft} left )`}
        </button>
      </div>
    </div>
  );
}
