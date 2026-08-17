import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const FlipBookPage = lazy(() => import("../pages/FlipBookPage"));
const YearbookPage = lazy(() => import("../pages/YearbookPage"));

function LoadingFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Router for /yearbook/:year
 * - If :year is numeric (e.g. /yearbook/2026) → FlipBookPage (full canvas, no Layout)
 * - If :year is a slug (e.g. /yearbook/2026S8) → YearbookPage with Navbar/Footer
 */
export default function FlipBookRouter() {
  const { year } = useParams<{ year: string }>();

  // Check if the param is a numeric year
  const isNumericYear = /^\d+$/.test(year || "");

  if (isNumericYear) {
    // Full-canvas flipbook — no Navbar/Footer
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FlipBookPage />
      </Suspense>
    );
  }

  // Slug-based yearbook — with Navbar/Footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<LoadingFallback />}>
          <YearbookPage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
