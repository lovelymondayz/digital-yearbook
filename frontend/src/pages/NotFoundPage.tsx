import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
        <p className="text-xl text-white/60 mb-8">Page not found</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link to="/search" className="btn-secondary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
