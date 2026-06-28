import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, X, BookOpen } from "lucide-react";
import { searchAPI } from "../lib/api";

interface StudentResult {
  id: string;
  full_name: string;
  avatar_image_url?: string;
  major?: string;
  quote?: string;
  yearbook_id: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    year: "",
    department: "",
    faculty: "",
  });

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (query) params.q = query;
      if (filters.year) params.year = parseInt(filters.year);
      if (filters.department) params.department = filters.department;
      if (filters.faculty) params.faculty = filters.faculty;

      const res = await searchAPI.search(params);
      setResults(res.data.students || []);
      setTotal(res.data.total || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query, ...filters });
    doSearch();
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center text-gradient">
          Search Students
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, major, or quote..."
                className="input pl-12"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? "bg-[#e94560]/20 border-[#e94560]/30" : ""}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4"
            >
              <input
                type="number"
                placeholder="Graduation year"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="input"
              />
              <input
                type="text"
                placeholder="Department"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="input"
              />
              <input
                type="text"
                placeholder="Faculty"
                value={filters.faculty}
                onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
                className="input"
              />
            </motion.div>
          )}
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-white/50 text-sm mb-4">{total} results found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((student) => (
                <Link
                  key={student.id}
                  to={`/student/${student.id}`}
                  className="card flex items-center gap-4 group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e94560]/30 to-[#f5c518]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {student.avatar_image_url ? (
                      <img src={student.avatar_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white/50">
                        {student.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-[#e94560] transition-colors truncate">
                      {student.full_name}
                    </h3>
                    {student.major && (
                      <p className="text-white/50 text-sm truncate">{student.major}</p>
                    )}
                    {student.quote && (
                      <p className="text-white/30 text-xs truncate italic mt-1">
                        &ldquo;{student.quote}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : query || filters.year || filters.department || filters.faculty ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No students found matching your search.</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Start typing to search for students.</p>
          </div>
        )}
      </div>
    </div>
  );
}
