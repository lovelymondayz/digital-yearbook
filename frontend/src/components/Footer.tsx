import { Link } from "react-router-dom";
import { BookOpen, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e94560] to-[#f5c518] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Digital Yearbook</span>
            </div>
            <p className="text-white/50 text-sm max-w-md">
              A production-grade platform for universities to create, manage, and
              preserve digital yearbooks. Built to last 10+ years.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-semibold text-white mb-4">Technology</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>Go + Chi</li>
              <li>React + TypeScript</li>
              <li>PostgreSQL</li>
              <li>Docker</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Digital Yearbook. MIT License.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/lovelymondayz/digital-yearbook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <span className="text-sm text-white/40 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-[#e94560]" /> by OWL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
