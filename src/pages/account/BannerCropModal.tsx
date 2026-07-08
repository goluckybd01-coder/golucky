import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, Move, Loader2, Smartphone, Monitor, RotateCcw } from "lucide-react";

const DEFAULT_MOBILE = { x: 0.5, y: 0.35 };
const DEFAULT_DESKTOP = { x: 0.5, y: 0.35 };
const DEFAULT_ZOOM = 1;

interface Props {
  file: File;
  uploading?: boolean;
  onCancel: () => void;
  onConfirm: (result: {
    file: File;
    mobile: { x: number; y: number };
    desktop: { x: number; y: number };
    zoom: number;
  }) => void;
}

type Pos = { x: number; y: number }; // 0..1 focal point in original image

/**
 * BannerCropModal — pick independent mobile & desktop focal framing for the
 * hero banner. Emits the original file plus normalized focal points and zoom
 * so AccountOverview can render each breakpoint with its own background-size /
 * background-position values (no per-device image duplication).
 */
export default function BannerCropModal({ file, uploading, onCancel, onConfirm }: Props) {
  const [imgUrl, setImgUrl] = useState("");
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [mobile, setMobile] = useState<Pos>(DEFAULT_MOBILE);
  const [desktop, setDesktop] = useState<Pos>(DEFAULT_DESKTOP);
  const [active, setActive] = useState<"mobile" | "desktop">("desktop");
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resetFraming = () => {
    setZoom(DEFAULT_ZOOM);
    setMobile(DEFAULT_MOBILE);
    setDesktop(DEFAULT_DESKTOP);
  };

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const current = active === "mobile" ? mobile : desktop;
  const setCurrent = (p: Pos) => (active === "mobile" ? setMobile(p) : setDesktop(p));

  const bgFor = (pos: Pos): React.CSSProperties => ({
    backgroundImage: `url(${imgUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${zoom * 100}%`,
    backgroundPosition: `${pos.x * 100}% ${pos.y * 100}%`,
    filter: "contrast(1.05) saturate(1.08) brightness(0.78) sepia(0.14)",
  });

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.x) / rect.width;
    const dy = (e.clientY - dragRef.current.y) / rect.height;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setCurrent({
      x: Math.max(0, Math.min(1, current.x - dx / zoom)),
      y: Math.max(0, Math.min(1, current.y - dy / zoom)),
    });
  };
  const onPointerUp = () => (dragRef.current = null);

  const handleConfirm = () => {
    onConfirm({ file, mobile, desktop, zoom });
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-amber-400/40 bg-[#050505] p-5 shadow-[0_0_40px_rgba(255,193,7,0.25)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-white">Position your banner</h3>
          <button onClick={onCancel} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Device tabs */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(["mobile", "desktop"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black uppercase tracking-wider transition ${
                active === k
                  ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {k === "mobile" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
              {k}
            </button>
          ))}
        </div>

        {/* Draggable editor — aspect matches the active target */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="mx-auto w-full cursor-grab touch-none overflow-hidden rounded-2xl border-2 border-emerald-400/50 bg-black active:cursor-grabbing"
          style={{ ...bgFor(current), aspectRatio: active === "mobile" ? "16 / 11" : "16 / 5" }}
          role="application"
          aria-label={`Drag to reposition ${active} banner`}
        />
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/60">
          <Move className="h-3 w-3" /> Drag to reposition • editing <span className="font-bold text-emerald-300">{active}</span>
        </div>

        {/* Zoom (shared) + Reset */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <ZoomIn className="h-3 w-3" /> Zoom
            </label>
            <button
              type="button"
              onClick={resetFraming}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/70 hover:border-emerald-400/60 hover:text-emerald-300"
            >
              <RotateCcw className="h-3 w-3" /> Reset to auto
            </button>
          </div>
          <input
            type="range" min={1} max={2.5} step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>


        {/* Live previews for both devices */}
        <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Live previews</div>
          <div className="space-y-2">
            <div>
              <div className="mb-1 flex items-center gap-1 text-[10px] text-white/50">
                <Smartphone className="h-3 w-3" /> Mobile
              </div>
              <div
                className="w-full overflow-hidden rounded-xl border border-white/10"
                style={{ ...bgFor(mobile), aspectRatio: "16 / 11" }}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1 text-[10px] text-white/50">
                <Monitor className="h-3 w-3" /> Desktop
              </div>
              <div
                className="w-full overflow-hidden rounded-xl border border-white/10"
                style={{ ...bgFor(desktop), aspectRatio: "16 / 5" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-bold text-white/80 hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading || !imgSize.w}
            className="flex-1 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 py-2.5 text-sm font-black text-black shadow-[0_6px_20px_rgba(0,230,118,0.5)] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Encode/decode framing into the stored URL as a hash fragment so we don't
 *  need a schema migration. Format: `#b=mx,my,dx,dy,z` (all floats 0..2.5). */
export function encodeBannerFraming(url: string, m: Pos, d: Pos, zoom: number) {
  const base = url.split("#")[0];
  const f = (n: number) => Math.round(n * 1000) / 1000;
  return `${base}#b=${f(m.x)},${f(m.y)},${f(d.x)},${f(d.y)},${f(zoom)}`;
}

export function decodeBannerFraming(url: string | null | undefined) {
  if (!url) return null;
  const hash = url.split("#")[1];
  if (!hash?.startsWith("b=")) return null;
  const parts = hash.slice(2).split(",").map(Number);
  if (parts.length !== 5 || parts.some((n) => !Number.isFinite(n))) return null;
  const [mx, my, dx, dy, z] = parts;
  return { mobile: { x: mx, y: my }, desktop: { x: dx, y: dy }, zoom: z };
}
