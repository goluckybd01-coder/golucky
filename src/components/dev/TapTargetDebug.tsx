import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Mode = "full" | "viewport" | "area";

/**
 * Dev-only floating toggle for the tap-target debug overlay.
 * Enable by adding <TapTargetDebug /> to a page, or auto-on via ?debug=tap.
 * Adds/removes `debug-tap-targets` class on <body>; CSS rules live in index.css.
 *
 * Export modes:
 *  - Full page: entire scrollable document
 *  - Viewport: only what's currently visible
 *  - Area: drag to select a rectangle, then it exports that crop
 */
export default function TapTargetDebug() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [csvBusy, setCsvBusy] = useState<"failures" | "all" | null>(null);
  const [csvStatus, setCsvStatus] = useState("");
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const auto = new URLSearchParams(window.location.search).get("debug") === "tap";
    if (auto) setOn(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("debug-tap-targets", on);
    if (!on) return;
    const nodes = document.querySelectorAll<HTMLElement>('button, a, [role="button"]');
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      el.setAttribute("data-tap-size", `${w}×${h}`);
      if (w >= 44 && h >= 44) el.setAttribute("data-tap-ok", "1");
      else el.removeAttribute("data-tap-ok");
    });
    return () => {
      nodes.forEach((el) => {
        el.removeAttribute("data-tap-size");
        el.removeAttribute("data-tap-ok");
      });
    };
  }, [on]);

  if (!import.meta.env.DEV && new URLSearchParams(window.location.search).get("debug") !== "tap") {
    return null;
  }

  const capture = async (mode: Mode, rect?: { x: number; y: number; w: number; h: number }) => {
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const opts: Parameters<typeof html2canvas>[1] = {
        useCORS: true,
        backgroundColor: null,
        ignoreElements: (el) => el.hasAttribute("data-tap-debug-ui"),
      };
      if (mode === "viewport") {
        opts.x = window.scrollX;
        opts.y = window.scrollY;
        opts.width = window.innerWidth;
        opts.height = window.innerHeight;
        opts.windowWidth = document.documentElement.scrollWidth;
        opts.windowHeight = document.documentElement.scrollHeight;
      } else if (mode === "area" && rect) {
        opts.x = rect.x;
        opts.y = rect.y;
        opts.width = rect.w;
        opts.height = rect.h;
        opts.windowWidth = document.documentElement.scrollWidth;
        opts.windowHeight = document.documentElement.scrollHeight;
      } else {
        opts.windowWidth = document.documentElement.scrollWidth;
        opts.windowHeight = document.documentElement.scrollHeight;
      }
      const canvas = await html2canvas(document.body, opts);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `tap-debug-${mode}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  const startAreaSelect = () => {
    setSelecting(true);
    let startX = 0, startY = 0;
    let box: HTMLDivElement | null = null;
    const layer = document.createElement("div");
    layer.setAttribute("data-tap-debug-ui", "");
    layer.style.cssText =
      "position:fixed;inset:0;z-index:99999;cursor:crosshair;background:rgba(0,0,0,0.25)";

    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      box = document.createElement("div");
      box.style.cssText =
        "position:fixed;border:2px dashed #34d399;background:rgba(52,211,153,0.15);pointer-events:none";
      box.style.left = `${startX}px`;
      box.style.top = `${startY}px`;
      layer.appendChild(box);
    };
    const onMove = (e: PointerEvent) => {
      if (!box) return;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
    };
    const cleanup = () => {
      layer.removeEventListener("pointerdown", onDown);
      layer.removeEventListener("pointermove", onMove);
      layer.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      layer.remove();
      setSelecting(false);
    };
    const onUp = async (e: PointerEvent) => {
      if (!box) return cleanup();
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      cleanup();
      if (w < 8 || h < 8) return;
      await capture("area", { x: x + window.scrollX, y: y + window.scrollY, w, h });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cleanup();
    };

    layer.addEventListener("pointerdown", onDown);
    layer.addEventListener("pointermove", onMove);
    layer.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    document.body.appendChild(layer);
    overlayRef.current = layer;
  };

  const btn =
    "tap-compact rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur bg-black/80";

  const cssPath = (el: Element): string => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === 1 && parts.length < 5 && node !== document.body) {
      let seg = node.tagName.toLowerCase();
      const cls = (node.getAttribute("class") || "")
        .trim()
        .split(/\s+/)
        .filter((c) => c && !c.startsWith("hover:") && !c.startsWith("data-"))
        .slice(0, 2)
        .map((c) => `.${CSS.escape(c)}`)
        .join("");
      seg += cls;
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
        if (sameTag.length > 1) seg += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(seg);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };

  const exportCsv = async (scope: "failures" | "all") => {
    if (csvBusy === scope) return;
    const label = scope === "failures" ? "failures" : "all tap targets";
    setCsvBusy(scope);
    setCsvStatus(`Starting CSV export for ${label}…`);
    await new Promise((r) => setTimeout(r, 50));
    let errored = false;
    try {
      const injectedConfig = (window as unknown as {
        __TAP_DEBUG_AXE_CONFIG__?: Record<string, string | number | boolean>;
      }).__TAP_DEBUG_AXE_CONFIG__;
      const rows: string[] = [];
      if (injectedConfig && typeof injectedConfig === "object") {
        const parts = Object.entries(injectedConfig)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join("; ");
        rows.push(`# axe-config: ${parts}`);
      }
      rows.push(
        "selector,tagName,id,classes,role,type,href,name,text,ariaLabel,left,top,right,bottom,width,height,pageX,pageY,passes",
      );

      const nodes = document.querySelectorAll<HTMLElement>('button, a, [role="button"]');
      nodes.forEach((el) => {
        if (el.hasAttribute("data-tap-debug-ui") || el.closest("[data-tap-debug-ui]")) return;
        const r = el.getBoundingClientRect();
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        if (w === 0 && h === 0) return;
        const passes = w >= 44 && h >= 44;
        if (scope === "failures" && passes) return;
        const esc = (s: string) => `"${(s || "").replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`;
        rows.push(
          [
            esc(cssPath(el)),
            esc(el.tagName),
            esc(el.id || ""),
            esc(el.getAttribute("class") || ""),
            esc(el.getAttribute("role") || ""),
            esc(el.getAttribute("type") || ""),
            esc(el.getAttribute("href") || ""),
            esc(el.getAttribute("name") || ""),
            esc((el.textContent || "").slice(0, 80)),
            esc(el.getAttribute("aria-label") || ""),
            String(Math.round(r.left)),
            String(Math.round(r.top)),
            String(Math.round(r.right)),
            String(Math.round(r.bottom)),
            String(w),
            String(h),
            String(Math.round(r.left + window.scrollX)),
            String(Math.round(r.top + window.scrollY)),
            passes ? "1" : "0",
          ].join(","),
        );
      });
      const nonDataRows = rows.filter((r) => r.startsWith("#") || r.startsWith("selector,")).length;
      const count = rows.length - nonDataRows;
      if (count === 0) {
        toast.warning(`No ${scope === "failures" ? "failing" : ""} tap targets found — nothing to export`);
        setCsvStatus(`CSV export for ${label} finished with 0 rows.`);
        return;
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
      if (blob.size === 0) throw new Error("Generated CSV blob is empty");
      const url = URL.createObjectURL(blob);
      const filename = `tap-debug-${scope}-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(
        `Exported ${count} ${scope === "failures" ? "failing" : "tap-target"} row${count === 1 ? "" : "s"}`,
        { description: filename },
      );
      setCsvStatus(`CSV export for ${label} finished — ${count} row${count === 1 ? "" : "s"} saved as ${filename}.`);
    } catch (err) {
      errored = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[TapTargetDebug] CSV export failed:", err);
      toast.error("CSV export failed", { description: msg });
      setCsvStatus(`CSV export for ${label} failed: ${msg}`);
    } finally {
      setCsvBusy(null);
      if (!errored) {
        queueMicrotask(() => setCsvStatus(""));
      }
    }
  };

  return (
    <div
      data-tap-debug-ui
      className="fixed bottom-24 right-3 z-[9999] flex flex-col items-end gap-2"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {csvStatus}
      </div>
      {on && !selecting && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => capture("full")}
            className={`${btn} border-amber-400/60 text-amber-300 disabled:opacity-50`}
            data-tap-ok="1"
          >
            Export: Full Page
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => capture("viewport")}
            className={`${btn} border-sky-400/60 text-sky-300 disabled:opacity-50`}
            data-tap-ok="1"
          >
            Export: Viewport
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={startAreaSelect}
            className={`${btn} border-fuchsia-400/60 text-fuchsia-300 disabled:opacity-50`}
            data-tap-ok="1"
          >
            Export: Select Area
          </button>
          <button
            type="button"
            disabled={csvBusy === "failures"}
            aria-busy={csvBusy === "failures"}
            aria-disabled={csvBusy === "failures"}
            onClick={() => exportCsv("failures")}
            className={`${btn} border-lime-400/60 text-lime-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5`}
            data-tap-ok="1"
          >
            {csvBusy === "failures" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            {csvBusy === "failures" ? "Exporting…" : "Export: CSV (failures)"}
          </button>
          <button
            type="button"
            disabled={csvBusy === "all"}
            aria-busy={csvBusy === "all"}
            aria-disabled={csvBusy === "all"}
            onClick={() => exportCsv("all")}
            className={`${btn} border-emerald-300/60 text-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5`}
            data-tap-ok="1"
          >
            {csvBusy === "all" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            {csvBusy === "all" ? "Exporting…" : "Export: CSV (all)"}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={`${btn} border-emerald-400/60 text-emerald-300`}
        data-tap-ok="1"
      >
        {on ? "Tap Debug: ON" : "Tap Debug"}
      </button>
    </div>
  );
}
