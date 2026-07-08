/**
 * ClickDebugOverlay Component
 * Shows a debug overlay that highlights the top element under the cursor
 * Helps detect overlays blocking clicks
 */

import React, { useState, useEffect, useCallback } from "react";
import { Bug, X, Eye, EyeOff } from "lucide-react";

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  zIndex: string;
  pointerEvents: string;
  position: { x: number; y: number };
}

const ClickDebugOverlay: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        setElementInfo({
          tagName: element.tagName.toLowerCase(),
          className: element.className?.toString().slice(0, 50) || "",
          id: element.id || "",
          zIndex: computedStyle.zIndex,
          pointerEvents: computedStyle.pointerEvents,
          position: { x: e.clientX, y: e.clientY },
        });
      }
    },
    [isEnabled]
  );

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener("mousemove", handleMouseMove);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      setElementInfo(null);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isEnabled, handleMouseMove]);

  // Check if debug mode is enabled via query param
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get("debug") === "1";

  // Show in development OR when ?debug=1 is in URL
  if (import.meta.env.PROD && !debugParam) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - Fixed Position */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed top-2 right-2 z-[99999] bg-slate-900 text-white p-2 rounded-lg shadow-lg border border-white/20 hover:bg-slate-800 transition-colors"
        aria-label="Toggle Debug Panel"
      >
        <Bug size={16} />
      </button>

      {/* Debug Panel */}
      {showPanel && (
        <div className="fixed top-12 right-2 z-[99999] bg-slate-900/95 text-white rounded-lg shadow-xl border border-white/20 w-64 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-white/10">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Bug size={12} className="text-orange-400" />
              Click Debug Mode
            </span>
            <button
              onClick={() => setShowPanel(false)}
              className="text-white/60 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Toggle */}
          <div className="p-3 border-b border-white/10">
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isEnabled
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-white/80 hover:bg-slate-600"
              }`}
            >
              {isEnabled ? (
                <>
                  <Eye size={14} />
                  Debug Layer: ON
                </>
              ) : (
                <>
                  <EyeOff size={14} />
                  Debug Layer: OFF
                </>
              )}
            </button>
          </div>

          {/* Element Info */}
          {isEnabled && elementInfo && (
            <div className="p-3 space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-white/60">Element:</span>
                <span className="font-mono text-orange-400">
                  {"<"}
                  {elementInfo.tagName}
                  {">"}
                </span>
              </div>
              {elementInfo.id && (
                <div className="flex justify-between">
                  <span className="text-white/60">ID:</span>
                  <span className="font-mono text-cyan-400">
                    #{elementInfo.id}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">z-index:</span>
                <span
                  className={`font-mono ${
                    elementInfo.zIndex === "auto"
                      ? "text-white/40"
                      : parseInt(elementInfo.zIndex) > 10
                        ? "text-green-400"
                        : "text-yellow-400"
                  }`}
                >
                  {elementInfo.zIndex}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">pointer-events:</span>
                <span
                  className={`font-mono ${
                    elementInfo.pointerEvents === "none"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {elementInfo.pointerEvents}
                </span>
              </div>
              {elementInfo.className && (
                <div className="mt-2">
                  <span className="text-white/60 block mb-1">Classes:</span>
                  <span className="font-mono text-purple-400 text-[8px] break-all">
                    {elementInfo.className.slice(0, 100)}
                    {elementInfo.className.length > 100 && "..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {isEnabled && !elementInfo && (
            <div className="p-3 text-[10px] text-white/50 text-center">
              Move mouse over elements to inspect
            </div>
          )}
        </div>
      )}

      {/* Cursor Label */}
      {isEnabled && elementInfo && (
        <div
          className="fixed z-[99999] pointer-events-none bg-black/90 text-white text-[10px] px-2 py-1 rounded font-mono"
          style={{
            left: elementInfo.position.x + 15,
            top: elementInfo.position.y + 15,
          }}
        >
          {"<"}
          {elementInfo.tagName}
          {">"}
          {elementInfo.pointerEvents === "none" && (
            <span className="text-red-400 ml-1">(blocked)</span>
          )}
        </div>
      )}
    </>
  );
};

export default ClickDebugOverlay;
