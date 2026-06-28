import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { yearbookAPI } from "../lib/api";

interface YearbookData {
  id: string;
  title: string;
  slug: string;
  year: number;
  description?: string;
  cover_image_url?: string;
  status: string;
  pages: Student[];
}

interface Student {
  id: string;
  full_name: string;
  avatar_image_url?: string;
  major?: string;
  quote?: string;
  page_number?: number;
}

export default function YearbookPage() {
  const { slug } = useParams<{ slug: string }>();
  const [yearbook, setYearbook] = useState<YearbookData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const ybRes = await yearbookAPI.getBySlug(slug);
        setYearbook(ybRes.data);
        const stRes = await yearbookAPI.getStudents(ybRes.data.id, 100, 0);
        setStudents(stRes.data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!yearbook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Yearbook not found</h2>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const studentsPerPage = 6;
  const totalPages = Math.ceil(students.length / studentsPerPage);
  const currentStudents = students.slice(
    currentPage * studentsPerPage,
    (currentPage + 1) * studentsPerPage
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-[#1a1a2e] to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-32 h-40 bg-gradient-to-br from-[#e94560]/20 to-[#f5c518]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {yearbook.cover_image_url ? (
                <img src={yearbook.cover_image_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <BookOpen className="w-12 h-12 text-white/30" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{yearbook.title}</h1>
              <div className="flex items-center gap-4 text-white/50">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {yearbook.year}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {students.length} students
                </span>
              </div>
              {yearbook.description && (
                <p className="text-white/60 mt-3 max-w-xl">{yearbook.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flipbook */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-white/50 text-sm">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Student grid */}
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, rotateY: -10 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {currentStudents.map((student) => (
            <Link
              key={student.id}
              to={`/student/${student.id}`}
              className="card group text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e94560]/30 to-[#f5c518]/30 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {student.avatar_image_url ? (
                  <img src={student.avatar_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white/50">
                    {student.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-[#e94560] transition-colors">
                {student.full_name}
              </h3>
              {student.major && (
                <p className="text-white/50 text-sm mt-1">{student.major}</p>
              )}
              {student.quote && (
                <p className="text-white/30 text-sm mt-2 italic line-clamp-2">
                  &ldquo;{student.quote}&rdquo;
                </p>
              )}
            </Link>
          ))}
        </motion.div>

        {students.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No students in this yearbook yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
