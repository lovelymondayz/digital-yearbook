import { Link } from "react-router-dom";
import { BookOpen, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">Thamrin Digital Yearbook</span>
            </div>
            <p className="text-text-muted text-sm max-w-md mb-4">
              A production-grade platform for universities to create, manage, and
              preserve digital yearbooks. Built to last 10+ years.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-text mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <Link to="/" className="hover:text-text transition-colors duration-base">
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="https://www.thamrin.ac.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text transition-colors duration-base"
                >
                  Thamrin University
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-subtle">
            © {new Date().getFullYear()} Thamrin University — All rights reserved.
          </p>
          <p className="text-xs text-text-subtle flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary" /> by Thamrin University
          </p>
        </div>
      </div>
    </footer>
  );
}
