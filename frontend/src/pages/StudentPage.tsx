import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Quote, Mail, Phone, GraduationCap, Bookmark, ExternalLink } from "lucide-react";

export default function StudentPage() {
  const { id } = useParams<{ id: string }>();

  // Placeholder — in production this would fetch from API
  const student = {
    id: id || "",
    full_name: "Student Name",
    major: "Computer Science",
    quote: "The best is yet to come.",
    email: "student@university.edu",
    phone: "+62 812 3456 7890",
    graduation_year: 2026,
    avatar_image_url: undefined,
    honors_awards: ["Dean's List 2025", "Best Thesis Award"],
    social_links: { linkedin: "https://linkedin.com/in/student" },
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to=".."
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Yearbook
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#e94560]/30 to-[#f5c518]/30 flex items-center justify-center mb-4 overflow-hidden">
              {student.avatar_image_url ? (
                <img src={student.avatar_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white/50">
                  {student.full_name.charAt(0)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{student.full_name}</h1>
            {student.major && (
              <p className="text-white/60 mt-1 flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {student.major}
              </p>
            )}
            {student.graduation_year && (
              <p className="text-white/40 text-sm mt-1">Class of {student.graduation_year}</p>
            )}
          </div>

          {/* Quote */}
          {student.quote && (
            <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
              <Quote className="w-6 h-6 text-[#e94560]/50 mx-auto mb-2" />
              <p className="text-white/70 italic text-lg">&ldquo;{student.quote}&rdquo;</p>
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {student.email && (
              <div className="flex items-center gap-3 text-white/60">
                <Mail className="w-4 h-4 text-[#e94560]" />
                <span className="text-sm">{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3 text-white/60">
                <Phone className="w-4 h-4 text-[#e94560]" />
                <span className="text-sm">{student.phone}</span>
              </div>
            )}
          </div>

          {/* Awards */}
          {student.honors_awards && student.honors_awards.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                Honors & Awards
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.honors_awards.map((award: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[#f5c518]/10 text-[#f5c518] text-sm"
                  >
                    {award}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <Bookmark className="w-4 h-4" />
              Bookmark
            </button>
            {student.social_links?.linkedin && (
              <a
                href={student.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
