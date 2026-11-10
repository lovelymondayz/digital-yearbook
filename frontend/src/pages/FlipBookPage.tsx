import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowLeft, ZoomIn, LayoutGrid, Search } from "lucide-react";
import { playPageFlip } from "../lib/sound";
import type { FlipBookController } from "../components/FlipBookScene";
import { withSize } from "../lib/assetUrl";
import { preloadBlobs } from "../lib/preload";
import { PageTextureManager } from "../lib/pageTextures";
import YearbookLoader from "../components/YearbookLoader";

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
  const [textureManager, setTextureManager] = useState<PageTextureManager | null>(null);
  const [preload, setPreload] = useState({ loaded: 0, total: 0 });
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

  // Base proxy URLs — the grid overview appends its own thumbnail size.
  const basePages = useMemo(() => filteredPages.map((p) => p.image_url), [
    filteredPages,
  ]);

  // The 3D book, mobile view and zoom overlay render at screen size, so they
  // request the 1440px preview variant instead of the 35 MB original PNG —
  // which also exceeds gl.MAX_TEXTURE_SIZE on many GPUs and rendered blank.
  // Memoized so the array identity is stable: FlipBookScene's effect depends on
  // it, and a fresh array every render would rebuild the book's sheets.
  const bookPages = useMemo(() => basePages.map((url) => withSize(url, "preview")), [
    basePages,
  ]);

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
    // Drop the previous year's book so the loading gate re-arms.
    setLoading(true);
    setTextureManager(null);
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

  // Download every page before mounting the book. quick_flipbook fetches pages
  // two at a time, so without this a page turned to early showed a blank sheet.
  useEffect(() => {
    const pages = data?.pages ?? [];
    if (pages.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const urls = pages.map((p) => withSize(p.image_url, "preview"));

    setPreload({ loaded: 0, total: urls.length });

    preloadBlobs(urls, {
      onProgress: (loaded, total) => {
        if (!cancelled) setPreload({ loaded, total });
      },
      signal: controller.signal,
    })
      .then(async ({ blobs }) => {
        if (cancelled) return;

        const manager = new PageTextureManager(blobs);
        manager.setPageList(urls);

        // Decode the opening spread before revealing the book, so the first
        // paint already shows real pages instead of the blank material.
        await manager.ensureWindow(2);

        if (cancelled) {
          manager.dispose();
          return;
        }
        setTextureManager(manager);
      })
      .catch(() => {
        if (!cancelled) setTextureManager(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [data]);

  useEffect(() => {
    return () => textureManager?.dispose();
  }, [textureManager]);

  // Handle page change from 3D book
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    playPageFlip(0.3);
  }, []);

  const hasPages = (data?.pages.length ?? 0) > 0;

  if (loading || (hasPages && !textureManager)) {
    return (
      <YearbookLoader
        title={data?.title || `Class of ${year || "..."}`}
        loaded={preload.loaded}
        total={preload.total || data?.pages.length || 0}
      />
    );
  }

  const yearNum = year ? parseInt(year, 10) : data?.year || 0;

  return (
    <div className="fixed inset-0 z-50 bg-surface text-text font-sans">
      {/* Minimal top header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/thamrin-logo.png"
              alt="Thamrin University"
              className="h-6 w-auto object-contain"
            />
            <span className="text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors">
              Thamrin Digital Yearbook
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
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
              pages={bookPages}
              textureManager={textureManager}
              onPageChange={handlePageChange}
              spread
              controllerRef={controllerRef}
            />
          ) : (
            <FlipBookMobile
              pages={bookPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              controllerRef={controllerRef}
            />
          )}
        </Suspense>
      </div>

      {/* Bottom toolbar — all controls in one row */}
      {bookPages.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={goPrev}
            className="rounded-full bg-surface-alt/90 hover:bg-surface-alt border border-border px-3 py-2 text-sm transition-colors"
            aria-label="Previous page"
          >
            Previous
          </button>

          <span className="text-text-subtle text-sm tabular-nums min-w-[5rem] text-center">
            Page {currentPage} of {bookPages.length}
          </span>

          <button
            onClick={goNext}
            className="rounded-full bg-surface-alt/90 hover:bg-surface-alt border border-border px-3 py-2 text-sm transition-colors"
            aria-label="Next page"
          >
            Next
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="rounded-full bg-surface-alt/90 border border-border pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-subtle focus:outline-none focus:border-primary w-32"
            />
          </div>

          <button
            onClick={() => setZoomPage(currentPage)}
            className="p-2 rounded-lg bg-surface-alt/90 hover:bg-surface-alt border border-border transition-colors"
            title="Zoom into this page"
            aria-label="Zoom into this page"
          >
            <ZoomIn className="w-4 h-4 text-text-muted" />
          </button>

          <button
            onClick={() => setGridOpen(true)}
            className="p-2 rounded-lg bg-surface-alt/90 hover:bg-surface-alt border border-border transition-colors"
            title="View all pages"
            aria-label="View all pages"
          >
            <LayoutGrid className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      )}

      {/* Tap-to-zoom overlay */}
      {zoomPage !== null && (
        <Suspense fallback={null}>
          <PageZoomOverlay
            src={bookPages[Math.min(Math.max(zoomPage - 1, 0), bookPages.length - 1)] ?? null}
            page={zoomPage}
            total={bookPages.length}
            onClose={() => setZoomPage(null)}
          />
        </Suspense>
      )}

      {/* All-pages grid overview */}
      {gridOpen && (
        <Suspense fallback={null}>
          <PageGridView
            pages={basePages}
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
