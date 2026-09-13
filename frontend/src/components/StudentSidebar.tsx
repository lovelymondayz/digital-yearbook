import { useState, useEffect, useRef, useCallback, useMemo } from react;
import { ChevronRight, Users, X, Menu } from lucide-react;

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || ;
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

  const pageStudents = data?.page_students || {};
  const currentPageStudents = pageStudents[currentPage] || [];
  const allPages = useMemo(() => Object.keys(pageStudents).map(Number).sort((a, b) => a - b), [pageStudents]);

  // Mobile: bottom sheet toggle button
  if (!collapsed && mobileOpen) {
    return (
      <div className=fixed inset-0 z-40 md:hidden>
        <div className=absolute inset-0 bg-surface-alt/50 onClick={() => setMobileOpen(false)} />
        <div className=absolute bottom-0 left-0 right-0 max-h-[70vh] bg-surface  border-t border-border rounded-t-2xl flex flex-col>
          <div className=flex items-center justify-between px-4 py-3 border-b border-border shrink-0>
            <div className=flex items-center gap-2>
              <Users className=w-4 h-4 text-primary />
              <span className=text-sm font-semibold text-text>Students</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className=p-1 rounded hover:bg-surface-alt transition-colors
            >
              <X className=w-4 h-4 text-text-muted />
            </button>
          </div>
          <div className=flex-1 overflow-y-auto>
            {!loading && currentPageStudents.length > 0 && (
              <div className=px-4 py-3 border-b border-border>
                <div className=text-xs font-medium text-primary uppercase tracking-wide mb-2>
                  Page {currentPage}
                </div>
                <div className=space-y-2>
                  {currentPageStudents.map((s) => (
                    <div key={s.id} className=flex items-center gap-2.5>
                      {s.avatar_image_url ? (
                        <img src={s.avatar_image_url} alt={s.full_name} className=w-7 h-7 rounded-full object-cover border border-border-strong shrink-0 />
                      ) : (
                        <div className=w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-text shrink-0>
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className=min-w-0>
                        <div className=text-sm text-text truncate>{s.full_name}</div>
                        {s.major && <div className=text-xs text-text-subtle truncate>{s.major}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loading ? (
              <div className=flex items-center justify-center py-8>
                <div className=w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin />
              </div>
            ) : allPages.length === 0 ? (
              <div className=px-4 py-8 text-center>
                <Users className=w-8 h-8 text-text-subtle mx-auto mb-2 />
                <p className=text-xs text-text-subtle>No students assigned to pages yet.</p>
              </div>
            ) : (
              <div className=py-1>
                {allPages.map((page) => {
                  const students = pageStudents[page] || [];
                  const isExpanded = expandedPages.has(page);
                  const isCurrent = page === currentPage;
                  return (
                    <div key={page} className={isCurrent ? bg-surface-alt : }>
                      <button onClick={() => togglePage(page)} className=w-full flex items-center justify-between px-4 py-2 hover:bg-surface-alt transition-colors>
                        <div className=flex items-center gap-2>
                          <ChevronRight className={`w-3 h-3 text-text-subtle transition-transform ${isExpanded ? rotate-90 : }`} />
                          <span className={`text-xs font-medium ${isCurrent ? text-primary : text-text-muted}`}>Page {page}</span>
                        </div>
                        <span className=text-xs text-text-subtle>{students.length}</span>
                      </button>
                      {isExpanded && (
                        <div className=pb-2>
                          {students.map((s) => (
                            <div key={s.id} className=flex items-center gap-2.5 px-4 py-1.5 pl-10>
                              {s.avatar_image_url ? (
                                <img src={s.avatar_image_url} alt={s.full_name} className=w-5 h-5 rounded-full object-cover border border-border-strong shrink-0 />
                              ) : (
                                <div className=w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-text shrink-0>
                                  {s.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className=min-w-0>
                                <div className=text-xs text-text truncate>{s.full_name}</div>
                                {s.major && <div className=text-xs text-text-subtle truncate>{s.major}</div>}
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
          <div className=px-4 py-2 border-t border-border shrink-0>
            <div className=text-xs text-text-subtle text-center>{allPages.length} pages with students</div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: floating button to open sidebar
  if (!collapsed) {
    return (
      <>
        {/* Mobile floating button */}
        <button
          onClick={() => setMobileOpen(true)}
          className=md:hidden fixed bottom-20 right-4 z-30 bg-primary text-text rounded-full p-3 shadow-lg shadow-md hover:bg-primary-active transition-colors
          title=Show students
        >
          <Menu className=w-5 h-5 />
        </button>

        {/* Desktop sidebar */}
        <div className=hidden md:flex fixed right-0 top-0 h-full z-30 w-72 flex-col bg-surface-alt  border-l border-border>
          <div className=flex items-center justify-between px-4 py-3 border-b border-border shrink-0>
            <div className=flex items-center gap-2>
              <Users className=w-4 h-4 text-primary />
              <span className=text-sm font-semibold text-text>Students</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className=p-1 rounded hover:bg-surface-alt transition-colors
              title=Collapse sidebar
            >
              <X className=w-4 h-4 text-text-muted />
            </button>
          </div>

          {!loading && currentPageStudents.length > 0 && (
            <div className=px-4 py-3 border-b border-border shrink-0>
              <div className=text-xs font-medium text-primary uppercase tracking-wide mb-2>
                Page {currentPage}
              </div>
              <div className=space-y-2>
                {currentPageStudents.map((s) => (
                  <div key={s.id} className=flex items-center gap-2.5>
                    {s.avatar_image_url ? (
                      <img src={s.avatar_image_url} alt={s.full_name} className=w-7 h-7 rounded-full object-cover border border-border-strong shrink-0 />
                    ) : (
                      <div className=w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-text shrink-0>
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className=min-w-0>
                      <div className=text-sm text-text truncate>{s.full_name}</div>
                      {s.major && <div className=text-xs text-text-subtle truncate>{s.major}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className=flex-1 overflow-y-auto>
            {loading ? (
              <div className=flex items-center justify-center py-8>
                <div className=w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin />
              </div>
            ) : allPages.length === 0 ? (
              <div className=px-4 py-8 text-center>
                <Users className=w-8 h-8 text-text-subtle mx-auto mb-2 />
                <p className=text-xs text-text-subtle>No students assigned to pages yet.</p>
              </div>
            ) : (
              <div className=py-1>
                {allPages.map((page) => {
                  const students = pageStudents[page] || [];
                  const isExpanded = expandedPages.has(page);
                  const isCurrent = page === currentPage;
                  return (
                    <div key={page} className={isCurrent ? bg-surface-alt : }>
                      <button onClick={() => togglePage(page)} className=w-full flex items-center justify-between px-4 py-2 hover:bg-surface-alt transition-colors>
                        <div className=flex items-center gap-2>
                          <ChevronRight className={`w-3 h-3 text-text-subtle transition-transform ${isExpanded ? rotate-90 : }`} />
                          <span className={`text-xs font-medium ${isCurrent ? text-primary : text-text-muted}`}>Page {page}</span>
                        </div>
                        <span className=text-xs text-text-subtle>{students.length}</span>
                      </button>
                      {isExpanded && (
                        <div className=pb-2>
                          {students.map((s) => (
                            <div key={s.id} className=flex items-center gap-2.5 px-4 py-1.5 pl-10>
                              {s.avatar_image_url ? (
                                <img src={s.avatar_image_url} alt={s.full_name} className=w-5 h-5 rounded-full object-cover border border-border-strong shrink-0 />
                              ) : (
                                <div className=w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-text shrink-0>
                                  {s.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className=min-w-0>
                                <div className=text-xs text-text truncate>{s.full_name}</div>
                                {s.major && <div className=text-xs text-text-subtle truncate>{s.major}</div>}
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

          <div className=px-4 py-2 border-t border-border shrink-0>
            <div className=text-xs text-text-subtle text-center>{allPages.length} pages with students</div>
          </div>
        </div>
      </>
    );
  }

  // Collapsed state: show expand button
  return (
    <div className=fixed right-0 top-1/2 -translate-y-1/2 z-30>
      <button
        onClick={() => setCollapsed(false)}
        className=bg-surface-alt  border border-border border-r-0 rounded-l-lg px-2 py-4 hover:bg-border transition-colors
        title=Show student list
      >
        <ChevronRight className=w-4 h-4 text-text-muted rotate-180 />
      </button>
    </div>
  );
}
