import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Users, X } from "lucide-react";

interface StudentSummary {
  id: string;
  full_name: string;
  avatar_image_url?: string;
  major?: string;
}

interface PageStudentsData {
  yearbook_id: string;
  year: number;
  page_students: Record<number, StudentSummary[]>;
}

interface StudentSidebarProps {
  year: number;
  currentPage: number;
  totalPages: number;
}

export default function StudentSidebar({ year, currentPage, totalPages }: StudentSidebarProps) {
  const [data, setData] = useState<PageStudentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API_URL}/api/v1/flipbook/${year}/students`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  // Auto-expand the current page's student list when page changes
  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      prevPageRef.current = currentPage;
      setExpandedPages((prev) => {
        const next = new Set(prev);
        next.add(currentPage);
        return next;
      });
    }
  }, [currentPage]);

  const togglePage = useCallback((page: number) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }, []);

  if (collapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={() => setCollapsed(false)}
          className="bg-white/10 backdrop-blur-xl border border-white/10 border-r-0 rounded-l-lg px-2 py-4 hover:bg-white/20 transition-colors"
          title="Show student list"
        >
          <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
        </button>
      </div>
    );
  }

  const pageStudents = data?.page_students || {};
  const currentPageStudents = pageStudents[currentPage] || [];
  const allPages = Object.keys(pageStudents).map(Number).sort((a, b) => a - b);

  return (
    <div className="fixed right-0 top-0 h-full z-30 w-72 flex flex-col bg-black/40 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#e94560]" />
          <span className="text-sm font-semibold text-white">Students</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          title="Collapse sidebar"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Current page students — always visible at top */}
      {!loading && currentPageStudents.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="text-xs font-medium text-[#e94560] uppercase tracking-wider mb-2">
            Page {currentPage}
          </div>
          <div className="space-y-2">
            {currentPageStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                {s.avatar_image_url ? (
                  <img
                    src={s.avatar_image_url}
                    alt={s.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e94560] to-[#f5c518] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{s.full_name}</div>
                  {s.major && (
                    <div className="text-xs text-white/40 truncate">{s.major}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable page list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allPages.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">No students assigned to pages yet.</p>
          </div>
        ) : (
          <div className="py-1">
            {allPages.map((page) => {
              const students = pageStudents[page] || [];
              const isExpanded = expandedPages.has(page);
              const isCurrent = page === currentPage;

              return (
                <div key={page} className={isCurrent ? "bg-white/5" : ""}>
                  <button
                    onClick={() => togglePage(page)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-3 h-3 text-white/40 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                      <span className={`text-xs font-medium ${isCurrent ? "text-[#e94560]" : "text-white/60"}`}>
                        Page {page}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">{students.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pb-2">
                      {students.map((s) => (
                        <div key={s.id} className="flex items-center gap-2.5 px-4 py-1.5 pl-10">
                          {s.avatar_image_url ? (
                            <img
                              src={s.avatar_image_url}
                              alt={s.full_name}
                              className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#e94560] to-[#f5c518] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                              {s.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs text-white/80 truncate">{s.full_name}</div>
                            {s.major && (
                              <div className="text-[10px] text-white/30 truncate">{s.major}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <div className="text-[10px] text-white/30 text-center">
          {allPages.length} pages with students
        </div>
      </div>
    </div>
  );
}
