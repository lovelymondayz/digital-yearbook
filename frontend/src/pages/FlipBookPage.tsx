import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowLeft, ZoomIn, LayoutGrid, Search } from "lucide-react";
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
    original_file_name?: string;
    width?: number;
    height?: number;
  }[];
}

export default function FlipBookPage() {
  const { year } = useParams<{ year: string }>();
  const [data, setData] = useState<FlipbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Lightweight in-yearbook page search by filename.
  const filteredPages = useMemo(() => {
    if (!data?.pages) return [];
    if (!searchQuery.trim()) return data.pages;
    const q = searchQuery.toLowerCase();
    return data.pages.filter((p) =>
      (p.original_file_name || "").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Memoized so the URL list keeps a stable identity. FlipBookScene's effect
  // depends on this array; without memoizing, every render produced a new
  // array and the book's sheets were rebuilt (and the open-spread position
  // re-applied) on each render. Must stay above the early returns so hook
  // order never changes between renders.
  const pages = useMemo(
    () => (searchQuery.trim() ? filteredPages : data?.pages || []).map((p) => p.image_url),
    [data, filteredPages, searchQuery]
  );

  // Jump to the first match as the user types.
  useEffect(() => {
    if (searchQuery.trim() && filteredPages.length > 0) {
      const first = filteredPages[0].page_number;
      if (first !== currentPage) {
        jumpToPage(first);
      }
    }
  }, [searchQuery, filteredPages, currentPage, jumpToPage]);

  // Fetch flipbook data
  useEffect(() => {
    setSearchQuery("");
  }, [year]);

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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-text-muted text-lg">Loading Yearbook...</div>
      </div>
    );
  }

  const yearNum = year ? parseInt(year, 10) : data?.year || 0;

  return (
    <div className="fixed inset-0 z-50 bg-surface text-text font-sans">
      <div className="pointer-events-none absolute top-4 left-0 z-10 w-full text-center">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="pointer-events-auto mt-3 flex justify-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages by filename..."
              className="rounded-full bg-surface-alt/90 border border-border pl-9 pr-4 py-1.5 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>
      </div>

      {/* Yearbook view — 3D spread on desktop, single page on mobile.
          Tapping the page opens the zoom overlay. A drag is ignored so
          touch/scroll gestures don't trigger it. */}
      <div
        className="absolute inset-0"
        style={{ touchAction: "none", cursor: "zoom-in" }}
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
          className="fixed top-4 right-16 z-20 p-2 rounded-lg bg-surface-alt/80 hover:bg-surface-alt border border-border transition-all duration-300 opacity-100"
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
          className="fixed top-4 right-28 z-20 p-2 rounded-lg bg-surface-alt/80 hover:bg-surface-alt border border-border transition-all duration-300 opacity-100"
          title="View all pages"
          aria-label="View all pages"
        >
          <LayoutGrid className="w-5 h-5 text-text-muted" />
        </button>
      )}

      {/* Page indicator */}
      {pages.length > 0 && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-text-subtle text-sm transition-opacity duration-500 opacity-100"
        >
          Page {currentPage} of {pages.length}
        </div>
      )}

      {/* Page turn controls */}
      <button
        onClick={goPrev}
        className="prev-btn fixed bottom-6 left-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 opacity-100"
      >
        Previous
      </button>
      <button
        onClick={goNext}
        className="next-btn fixed bottom-6 right-4 z-20 rounded-full bg-surface-alt px-4 py-2 text-sm hover:bg-border transition-all duration-300 sm:px-5 sm:py-2.5 opacity-100"
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
