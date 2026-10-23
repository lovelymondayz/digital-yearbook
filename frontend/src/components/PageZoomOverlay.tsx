import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface PageZoomOverlayProps {
  src: string | null;
  page: number;
  total: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

/**
 * Full-screen viewer for reading a single page at full resolution.
 * Supports wheel zoom, drag-to-pan, zoom buttons, keyboard +/- and Escape.
 */
export default function PageZoomOverlay({
  src,
  page,
  total,
  onClose,
}: PageZoomOverlayProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Fit a newly opened page
  useEffect(() => {
    reset();
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  const clampOffset = (x: number, y: number) => {
    // Keep at least part of the image on screen.
    const limit = 400 * zoom;
    return {
      x: Math.max(-limit, Math.min(limit, x)),
      y: Math.max(-limit, Math.min(limit, y)),
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${page} zoomed view`}
    >
      {/* Toolbar */}
      <div className="z-10 flex items-center justify-between gap-2 px-4 py-3 text-white">
        <span className="text-sm text-white/80">
          Page {page} of {total} — {Math.round(zoom * 100)}%
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={reset}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title="Fit to screen"
            aria-label="Fit to screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title="Close (Esc)"
            aria-label="Close zoom view"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pannable / zoomable image */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ cursor: zoom > 1 ? "grab" : "default" }}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => {
            const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.002));
            if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
            return next;
          });
        }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag) return;
          const next = clampOffset(
            drag.baseX + (e.clientX - drag.startX),
            drag.baseY + (e.clientY - drag.startY)
          );
          setOffset(next);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <img
          src={src}
          alt={`Page ${page} zoomed`}
          draggable={false}
          className="max-h-full max-w-full select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: dragRef.current ? "none" : "transform 120ms ease-out",
          }}
        />
      </div>

      <p className="px-4 py-3 text-center text-xs text-white/60">
        Scroll to zoom, drag to pan, Esc to close
      </p>
    </div>
  );
}
