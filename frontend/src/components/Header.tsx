import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/thamrin-logo.png"
            alt="Thamrin University"
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-semibold text-slate-900 tracking-wide group-hover:text-primary transition-colors">
            Thamrin Digital Yearbook
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <a
            href="https://www.thamrin.ac.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Thamrin.ac.id
          </a>
        </nav>
      </div>
    </header>
  );
}
