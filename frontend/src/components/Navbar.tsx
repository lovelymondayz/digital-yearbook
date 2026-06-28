import { Link, useLocation } from "react-router-dom";
import { BookOpen, Search, User, Menu, X, Bookmark } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/auth";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const links = [
    { to: "/", label: "Home", icon: BookOpen },
    { to: "/search", label: "Search", icon: Search },
    ...(isAuthenticated
      ? [
          { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
          { to: "/dashboard", label: "Dashboard", icon: User },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e94560] to-[#f5c518] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#e94560] to-[#f5c518] bg-clip-text text-transparent hidden sm:block">
              Yearbook
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive(link.to)
                    ? "bg-[#e94560]/20 text-[#e94560]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">
                  {user?.full_name}
                </span>
                <button
                  onClick={logout}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 border border-white/10 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="w-1" />
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/5 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(link.to)
                  ? "bg-[#e94560]/20 text-[#e94560]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
