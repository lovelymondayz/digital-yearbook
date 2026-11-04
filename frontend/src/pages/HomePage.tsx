import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, AlertCircle, RefreshCw } from "lucide-react";

interface YearbookYear {
  year: number;
  title: string;
  page_count: number;
  thumb_url: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="aspect-[4/3] bg-surface-alt animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-surface-alt rounded animate-pulse w-24" />
        <div className="h-4 bg-surface-alt rounded animate-pulse w-40" />
        <div className="h-4 bg-surface-alt rounded animate-pulse w-32" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [years, setYears] = useState<YearbookYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_URL}/api/v1/flipbook/years`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }
      setYears(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load yearbooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalPages = years.reduce((sum, y) => sum + (y.page_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-border bg-surface">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary-hover to-transparent" />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary-subtle bg-primary-subtle border border-primary-subtle/30 rounded-md px-3 py-1">
                <BookOpen className="w-3.5 h-3.5" />
                Thamrin University
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight">
              Digital Yearbook
            </h1>
            <p className="mt-3 text-base md:text-lg text-text-muted leading-relaxed max-w-xl">
              Browse class albums and student profiles in an immersive 3D flipbook experience.
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                <BookOpen className="w-4 h-4" />
                {years.length} yearbooks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-subtle">·</span>
              <span className="font-medium text-text">{totalPages.toLocaleString()}</span>
              <span className="text-text-subtle"> pages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-subtle">·</span>
              <span className="font-medium text-text">Class of {years[0]?.year ?? "—"}</span>
              <span className="text-text-subtle"> latest</span>
            </div>
          </div>
        </div>
      </section>

      {/* Year Selection */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-8 rounded-lg border border-danger/20 bg-danger-subtle p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-danger font-medium">Unable to load yearbooks</p>
                <p className="text-sm text-danger/80 mt-1">{error}</p>
                <button
                  onClick={load}
                  className="inline-flex items-center gap-1.5 text-sm text-danger hover:text-danger/80 font-medium transition-colors duration-fast"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <BookOpen className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <p className="text-text-muted text-lg mb-2">No yearbooks available yet.</p>
              <p className="text-text-subtle text-sm">
                Yearbooks will appear here once published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {years.map((y) => (
                <Link
                  key={y.year}
                  to={`/yearbook/${y.year}`}
                  className="group block overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-base border border-border/40 hover:border-primary/30"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
                    {y.thumb_url ? (
                      <img
                        src={y.thumb_url}
                        alt={y.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-slow"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-text-subtle/30">{y.year}</span>
                      </div>
                    )}
                    {/* Year badge */}
                    <div className="absolute top-3 left-3 bg-surface text-text text-sm font-semibold px-2.5 py-1 rounded-lg border border-border/50">
                      {y.year}
                    </div>
                    {/* Page count */}
                    {y.page_count > 0 && (
                      <div className="absolute top-3 right-3 bg-surface/90 text-text-muted text-xs font-medium px-2 py-1 rounded-lg border border-border/50">
                        {y.page_count} pages
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-text mb-1">
                      Class of {y.year}
                    </h3>
                    <p className="text-sm text-text-muted mb-4 truncate">
                      {y.title}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:text-primary-hover transition-colors duration-fast">
                      <span>Open Yearbook</span>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-fast">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
