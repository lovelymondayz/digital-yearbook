import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";

interface YearbookYear {
  year: number;
  title: string;
  page_count: number;
  thumb_url: string;
}

export default function HomePage() {
  const [years, setYears] = useState<YearbookYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API_URL}/api/v1/flipbook/years`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setYears(data);
            return;
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-alt to-surface-alt" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[primary]/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[primary]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-surface-alt border border-border rounded-full px-4 py-2 mb-8">
              <GraduationCap className="w-4 h-4 text-[primary]" />
              <span className="text-sm text-text/70">Thamrin University</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">Digital Yearbook</span>
              <br />
              <span className="text-text">Thamrin</span>
            </h1>

            <p className="text-xl text-text/60 max-w-2xl mx-auto mb-4">
              Relive the memories. Flip through the pages.
            </p>

            <div className="flex items-center justify-center gap-2 text-text/40 text-sm mt-6">
              <Sparkles className="w-4 h-4" />
              <span>Select a year below to open the yearbook</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selection — Big Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-[primary] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-text/20 mx-auto mb-4" />
              <p className="text-text/50 text-lg">No yearbooks available yet.</p>
              <p className="text-text/30 text-sm mt-2">
                Yearbooks will appear here once published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {years.map((y, i) => (
                <motion.div
                  key={y.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/yearbook/${y.year}`}
                    className="group block rounded-lg overflow-hidden bg-surface-alt border border-border hover:border-primary transition-colors duration-base hover:shadow-lg hover:shadow-sm hover:-translate-y-1"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-[surface]">
                      {y.thumb_url ? (
                        <img
                          src={y.thumb_url}
                          alt={y.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-alt">
                          <GraduationCap className="w-16 h-16 text-text/20" />
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Year badge */}
                      <div className="absolute top-4 left-4 bg-[primary] text-text text-sm font-bold px-3 py-1 rounded-full">
                        {y.year}
                      </div>
                      {/* Page count */}
                      {y.page_count > 0 && (
                        <div className="absolute top-4 right-4 bg-black/50 text-text/80 text-xs px-2 py-1 rounded-full ">
                          {y.page_count} pages
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-text group-hover:text-[primary] transition-colors">
                        Class of {y.year}
                      </h3>
                      <p className="text-text/40 text-sm mt-1">{y.title}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium group-hover:text-[primary] transition-colors">
                        <BookOpen className="w-4 h-4" />
                        <span>Open Yearbook</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text/30 text-sm">
            Thamrin University Digital Yearbook Platform
          </p>
        </div>
      </section>
    </div>
  );
}
