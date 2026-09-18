import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";
import { playPageFlip } from "../lib/sound";

const FlipBookScene = lazy(() => import("../components/FlipBookScene"));

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

  const pages = data?.pages?.map((p) => p.image_url) || [];
  const yearNum = year ? parseInt(year, 10) : data?.year || 0;

  return (
    <div className={`fixed inset-0 z-50 bg-surface text-text font-sans ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Header — fades out in fullscreen idle */}
      <div
        className={`pointer-events-none absolute top-4 left-0 z-10 w-full text-center transition-opacity duration-500 ${
          isFullscreen && !controlsVisible ? "opacity-0" : "opacity-100"
        }`}
      >
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

      {/* 3D Flipbook — full viewport */}
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              Loading 3D Flipbook...
            </div>
          }
        >
          <FlipBookScene pages={pages} onPageChange={handlePageChange} fullscreen={isFullscreen} controlsVisible={controlsVisible} />
        </Suspense>
      </div>

      {/* Page indicator — fades with controls */}
      {pages.length > 0 && (
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-text-subtle text-sm transition-opacity duration-500 ${
            isFullscreen && !controlsVisible ? "opacity-0" : "opacity-100"
          }`}
        >
          Page {currentPage} of {pages.length}
        </div>
      )}
    </div>
  );
}
