import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import StudentSidebar from "../components/StudentSidebar";

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

  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";

        if (!year) {
          const yearsRes = await fetch(`${API_URL}/api/v1/flipbook/years`);
          if (yearsRes.ok) {
            const years = await yearsRes.json();
            if (Array.isArray(years) && years.length > 0) {
              years.sort((a: { year: number }, b: { year: number }) => b.year - a.year);
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

  // Poll the book's currentPage via the DOM buttons and keyboard
  const handlePageChange = useCallback((direction: "next" | "prev") => {
    setCurrentPage((prev) => {
      const pages = data?.pages?.map((p) => p.image_url) || [];
      if (direction === "next") {
        return Math.min(prev + 1, pages.length || 1);
      }
      return Math.max(prev - 1, 1);
    });
  }, [data]);

  // Listen for keyboard page navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        handlePageChange("next");
      }
      if (e.key === "ArrowLeft") {
        handlePageChange("prev");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePageChange]);

  // Override the nav button clicks to also update currentPage
  useEffect(() => {
    const nextBtn = document.querySelector<HTMLButtonElement>(".next-btn");
    const prevBtn = document.querySelector<HTMLButtonElement>(".prev-btn");

    const onNext = () => handlePageChange("next");
    const onPrev = () => handlePageChange("prev");

    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", onPrev);

    return () => {
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
    };
  }, [handlePageChange, loading]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="text-white/50 text-lg">Loading Yearbook...</div>
      </div>
    );
  }

  const pages = data?.pages?.map((p) => p.image_url) || [];
  const yearNum = year ? parseInt(year, 10) : data?.year || 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 text-white font-sans">
      {/* Header */}
      <div className="pointer-events-none absolute top-4 left-0 z-10 w-full text-center">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-[clamp(1.5rem,4vw,3rem)] font-extrabold tracking-[4px]">
          {data?.title || `CLASS OF ${year || "..."}`}
        </h1>
        <p className="mt-1 text-sm opacity-70">Digital Yearbook Memories</p>
      </div>

      {/* 3D Flipbook — full viewport */}
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-white/50">
              Loading 3D Flipbook...
            </div>
          }
        >
          <FlipBookScene pages={pages} />
        </Suspense>
      </div>

      {/* Page indicator */}
      {pages.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-white/40 text-sm">
          Page {currentPage} of {pages.length}
        </div>
      )}

      {/* Right sidebar — student list */}
      {pages.length > 0 && (
        <StudentSidebar
          year={yearNum}
          currentPage={currentPage}
          totalPages={pages.length}
        />
      )}
    </div>
  );
}
