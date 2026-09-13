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
    <nav className="sticky top-0 z-50 bg-surface-alt  border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[primary] to-[primary] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-text" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[primary] to-[primary] text-primary hidden sm:block">
              Yearbook
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-base flex items-center gap-2 ${
                  isActive(link.to)
                    ? "bg-primary-subtle text-primary"
                    : "text-text/70 hover:text-text hover:bg-surface-alt"
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
                <span className="text-sm text-text/60">
                  {user?.full_name}
                </span>
                <button
                  onClick={logout}
                  className="bg-surface-alt hover:bg-border text-text font-medium py-2 px-4 rounded-md transition-colors duration-base border border-border text-sm"
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
            className="md:hidden p-2 rounded-lg hover:bg-surface-alt transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-alt  border-t border-border px-4 py-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(link.to)
                  ? "bg-primary-subtle text-primary"
                  : "text-text/70 hover:text-text hover:bg-surface-alt"
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
