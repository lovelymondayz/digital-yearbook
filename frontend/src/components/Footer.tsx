import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + Arjism promotion */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-primary">Digital Yearbook</span>
            </div>
            <p className="text-text-muted text-sm max-w-md mb-4">
              A production-grade platform for universities to create, manage, and
              preserve digital yearbooks. Built to last 10+ years.
            </p>
            <a
              href="https://arjism.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Powered by arjism.com
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
                <Link to="/search" className="hover:text-text transition-colors duration-base">
                  Search
                </Link>
              </li>
              <li>
                <a
                  href="https://arjism.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text transition-colors duration-base"
                >
                  About arjism.com
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/lovelymondayz/digital-yearbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text transition-colors duration-base"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-subtle">
            © {new Date().getFullYear()} arjism.com — All rights reserved.
          </p>
          <p className="text-xs text-text-subtle flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary" /> by arjism.com
          </p>
        </div>
      </div>
    </footer>
  );
}
