import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowLeft, Maximize, Minimize, ZoomIn, LayoutGrid } from "lucide-react";
import { playPageFlip } from "../lib/sound";
import type { FlipBookController } from "../components/FlipBookScene";

const FlipBookScene = lazy(() => import("../components/FlipBookScene"));
const FlipBookMobile = lazy(() => import("../components/FlipBookMobile"));
const PageZoomOverlay = lazy(() => import("../components/PageZoomOverlay"));
const PageGridView = lazy(() => import("../components/PageGridView"));

interface FlipbookData {
  yearbook_id: string;
  year: number;
  title: string;
  pages: {
    page_number: number;
    image_url: string;
    width?: number;
    height?: number;
  }[];
}

export default function FlipBookPage() {
  const { year } = useParams<{ year: string }>();
  const [data, setData] = useState<FlipbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const swipeRef = useRef(false);

  // Desktop (>= 768px) shows a 2-page spread; mobile shows a single page.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  // Populated by whichever view is active so the shared buttons and keyboard
  // handler can drive it.
  const controllerRef = useRef<FlipBookController | null>(null);

  const goNext = useCallback(() => controllerRef.current?.next(), []);
  const goPrev = useCallback(() => controllerRef.current?.prev(), []);
  // Jump to a 1-based page chosen from the grid overview.
  const jumpToPage = useCallback(
    (page: number) => {
      controllerRef.current?.jumpTo(page);
      setGridOpen(false);
    },
    []
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // While the zoom overlay is open it owns the keyboard.
      if (zoomPage !== null) return;
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, zoomPage]);

  // Memoized so the URL list keeps a stable identity. FlipBookScene's effect
  // depends on this array; without memoizing, every render produced a new
  // array and the book's sheets were rebuilt (and the open-spread position
  // re-applied) on each render. Must stay above the early returns so hook
  // order never changes between renders.
  const pages = useMemo(
    () => data?.pages?.map((p) => p.image_url) || [],
    [data]
  );

  // Fetch flipbook data
  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";

        if (!year) {
          const yearsRes = await fetch(`${API_URL}/api/v1/flipbook/years`);
          if (yearsRes.ok) {
            const years = await yearsRes.json();
            if (Array.isArray(years) && years.length > 0) {
              years.sort(
                (a: { year: number }, b: { year: number }) => b.year - a.year
              );
              const latestYear = years[0].year;
              const res = await fetch(`${API_URL}/api/v1/flipbook/${latestYear}`);
              if (res.ok) {
                setData(await res.json());
              }
            }
          }
        } else {
          const res = await fetch(`${API_URL}/api/v1/flipbook/${year}`);
          if (res.ok) {
            setData(await res.json());
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  // Handle page change from 3D book
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    playPageFlip(0.3);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setControlsVisible(true);
      }).catch(() => {});
    }
  }, []);

  // Listen for fullscreen exit (Escape key)
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setControlsVisible(true);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Idle-hide controls in fullscreen
  const resetIdleTimer = useCallback(() => {
    if (!isFullscreen) return;
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = () => resetIdleTimer();
    document.addEventListener("mousemove", handler);
    document.addEventListener("keydown", handler);
    resetIdleTimer();
    return () => {
      document.removeEventListener("mousemove", handler);
      document.removeEventListener("keydown", handler);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isFullscreen, resetIdleTimer]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-text-muted text-lg">Loading Yearbook...</div>
      </div>
    );
  }

  const yearNum = year ? parseInt(year, 10) : data?.year || 0;

  return (
    <div className={`fixed inset-0 z-50 bg-surface text-text font-sans ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Header — the title stays visible at all times. It previously faded
          out with the controls after 3s idle in fullscreen, which made the
          yearbook title disappear on this route. */}
      <div className="pointer-events-none absolute top-4 left-0 z-10 w-full text-center">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-text">
          {data?.title || `CLASS OF ${year || "..."}`}
        </h1>
        <p className="mt-1 text-sm text-text-muted">Digital Yearbook Memories</p>
      </div>

      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        className={`fixed top-4 right-4 z-20 p-2 rounded-lg bg-surface-alt/80 hover:bg-surface-alt border border-border transition-all duration-300 ${
          isFullscreen && !controlsVisible ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize className="w-5 h-5 text-text-muted" />
        ) : (
          <Maximize className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {/* Yearbook view — 3D spread on desktop, single page on mobile.
          Tapping the page opens the zoom overlay. A drag is ignored so
          touch/scroll gestures don't trigger it. */}
      <div
        className="absolute inset-0"
        onPointerDown={(e) => {
          pointerDownRef.current = { x: e.clientX, y: e.clientY };
          swipeRef.current = false;
        }}
        onPointerUp={(e) => {
          const down = pointerDownRef.current;
          pointerDownRef.current = null;
          if (!down) return;
          const dx = e.clientX - down.x;
          const dy = e.clientY - down.y;
          const dist = Math.hypot(dx, dy);
          // Horizontal swipe on mobile → flip page
          if (
            !isDesktop &&
            dist > 30 &&
            Math.abs(dx) > Math.abs(dy) * 1.2
          ) {
            swipeRef.current = true;
            if (dx < 0) goNext();
            else goPrev();
          }
        }}
        onClick={(e) => {
          if (swipeRef.current) {
            swipeRef.current = false;
            return;
          }
          const down = pointerDownRef.current;
          pointerDownRef.current = null;
          if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
          if (currentPage >= 1) setZoomPage(currentPage);
        }}
        style={{ cursor: "zoom-in" }}
      >
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              Loading yearbook...
            </div>
          }
        >
          {isDesktop ? (
            <FlipBookScene
              pages={pages}
              onPageChange={handlePageChange}
              spread
              controllerRef={controllerRef}
            />
          ) : (
            <FlipBookMobile
              pages={pages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              controllerRef={controllerRef}
            />
          )}
        </Suspense>
      </div>

      {/* Zoom button — discoverable alternative to clicking the page */}
      {pages.length > 0 && currentPage >= 1 && (
        <button
          onClick={() => setZoomPage(currentPage)}
          className={`fixed top-4 right-16 z-20 p-2 rounded-lg bg-surface-alt/80 hover:bg-surface-alt border border-border transition-all duration-300 ${
            isFullscreen && !controlsVisible ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          title="Zoom into this page"
          aria-label="Zoom into this page"
        >
          <ZoomIn className="w-5 h-5 text-text-muted" />
        </button>
      )}

      {/* Grid overview — see every page at once */}
      {pages.length > 0 && (
        <button
          onClick={() => setGridOpen(true)}
          className={`fixed top-4 right-28 z-20 p-2 rounded-lg bg-surface-alt/80 hover:bg-surface-alt border border-border transition-all duration-300 ${
            isFullscreen && !controlsVisible ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          title="View all pages"
          aria-label="View all pages"
        >
          <LayoutGrid className="w-5 h-5 text-text-muted" />
        </button>
      )}

      {/* Page indicator */}
      {pages.length > 0 && (
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-text-subtle text-sm transition-opacity duration-500 ${
            isFullscreen && !controlsVisible ? "opacity-0" : "opacity-100"
          }`}
        >
          Page {currentPage} of {pages.length}
        </div>
      )}

      {/* Page turn controls */}
      <button
        onClick={goPrev}
        className={`prev-btn fixed bottom-6 left-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 ${
          isFullscreen && !controlsVisible
            ? "opacity-0 pointer-events-none translate-y-2"
            : "opacity-100"
        }`}
      >
        Previous
      </button>
      <button
        onClick={goNext}
        className={`next-btn fixed bottom-6 right-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 ${
          isFullscreen && !controlsVisible
            ? "opacity-0 pointer-events-none translate-y-2"
            : "opacity-100"
        }`}
      >
        Next
      </button>

      {/* Tap-to-zoom overlay */}
      {zoomPage !== null && (
        <Suspense fallback={null}>
          <PageZoomOverlay
            src={pages[Math.min(Math.max(zoomPage - 1, 0), pages.length - 1)] ?? null}
            page={zoomPage}
            total={pages.length}
            onClose={() => setZoomPage(null)}
          />
        </Suspense>
      )}

      {/* All-pages grid overview */}
      {gridOpen && (
        <Suspense fallback={null}>
          <PageGridView
            pages={pages}
            currentPage={currentPage}
            title={data?.title || `Class of ${year || "..."}`}
            onSelect={jumpToPage}
            onClose={() => setGridOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
