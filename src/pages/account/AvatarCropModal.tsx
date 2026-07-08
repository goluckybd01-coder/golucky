import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, Move, Loader2 } from "lucide-react";

interface Props {
  file: File;
  uploading?: boolean;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

/**
 * AvatarCropModal — live crop/pan/zoom editor with mobile (120px) and desktop
 * (144px) circular previews that match AccountOverview's hero avatar exactly
 * (same object-position math + gold ring + warm tone filter).
 *
 * Emits a 512×512 JPEG File containing the exact framing the user sees.
 */
export default function AvatarCropModal({ file, uploading, onCancel, onConfirm }: Props) {
  const [imgUrl, setImgUrl] = useState<string>("");
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1); // 1..3
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // normalized -0.5..0.5
  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // shared transform (percentage-based so it maps 1:1 across preview sizes and export canvas)
  const bgStyle: React.CSSProperties = {
    backgroundImage: `url(${imgUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${zoom * 100}%`,
    backgroundPosition: `${50 - offset.x * 100}% ${50 - offset.y * 100}%`,
    filter: "contrast(1.08) saturate(1.05) brightness(0.96) sepia(0.08)",
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - dragging.current.x) / 260; // editor size
    const dy = (e.clientY - dragging.current.y) / 260;
    dragging.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({
      x: Math.max(-0.5, Math.min(0.5, o.x - dx / zoom)),
      y: Math.max(-0.5, Math.min(0.5, o.y - dy / zoom)),
    }));
  };
  const onPointerUp = () => (dragging.current = null);

  const handleConfirm = async () => {
    if (!imgSize.w || !imgSize.h) return;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = imgUrl;
    await new Promise((r) => (img.complete ? r(null) : (img.onload = () => r(null))));

    // Mirror `background-size: zoom*100%` (percentage of container) + center-based offset.
    const cover = Math.max(size / imgSize.w, size / imgSize.h);
    const drawW = imgSize.w * cover * zoom;
    const drawH = imgSize.h * cover * zoom;
    const dx = (size - drawW) / 2 - offset.x * drawW;
    const dy = (size - drawH) / 2 - offset.y * drawH;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, dx, dy, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const out = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
        onConfirm(out);
      },
      "image/jpeg",
      0.92,
    );
  };

  const Preview = ({ px, label }: { px: number; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 p-[3px] shadow-[0_0_24px_rgba(255,193,7,0.5)]"
        style={{ width: px, height: px }}
      >
        <div className="absolute inset-[-6px] rounded-full border-2 border-amber-400/50" />
        <div className="h-full w-full overflow-hidden rounded-full bg-black" style={bgStyle} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/40 bg-[#050505] p-5 shadow-[0_0_40px_rgba(255,193,7,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black text-white">Position your photo</h3>
          <button onClick={onCancel} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Draggable editor */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="mx-auto grid h-[260px] w-[260px] cursor-grab touch-none place-items-center overflow-hidden rounded-full border-2 border-emerald-400/50 bg-black active:cursor-grabbing"
          style={bgStyle}
          role="application"
          aria-label="Drag to reposition"
        />
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/60">
          <Move className="h-3 w-3" /> Drag to reposition
        </div>

        {/* Zoom */}
        <div className="mt-4">
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            <ZoomIn className="h-3 w-3" /> Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        {/* Live previews */}
        <div className="mt-5 flex items-end justify-center gap-8 rounded-2xl border border-white/10 bg-black/40 p-4">
          <Preview px={120} label="Mobile" />
          <Preview px={144} label="Desktop" />
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
            {uploading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
