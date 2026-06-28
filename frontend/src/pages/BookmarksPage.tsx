import { motion } from "framer-motion";
import { Bookmark, BookOpen } from "lucide-react";

export default function BookmarksPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Bookmarks</h1>
          <p className="text-white/50 mb-8">Your saved pages and profiles</p>

          <div className="card text-center py-16">
            <Bookmark className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg mb-2">No bookmarks yet</p>
            <p className="text-white/30 text-sm">
              Browse yearbooks and bookmark your favorite pages and student profiles.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
