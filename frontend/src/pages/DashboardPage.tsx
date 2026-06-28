import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, BarChart3, Settings, Plus } from "lucide-react";
import { useAuthStore } from "../store/auth";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: "Yearbooks", value: "0", icon: BookOpen, color: "from-[#e94560] to-[#d63851]" },
    { label: "Students", value: "0", icon: Users, color: "from-[#0f3460] to-[#16213e]" },
    { label: "Page Views", value: "0", icon: BarChart3, color: "from-[#f5c518] to-[#e6b800]" },
    { label: "Bookmarks", value: "0", icon: Settings, color: "from-[#e94560] to-[#f5c518]" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/50 mb-8">Welcome back, {user?.full_name}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/yearbooks" className="card group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e94560]/20 flex items-center justify-center group-hover:bg-[#e94560]/30 transition-colors">
                  <Plus className="w-5 h-5 text-[#e94560]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Create Yearbook</p>
                  <p className="text-white/50 text-sm">Start a new yearbook</p>
                </div>
              </div>
            </Link>
            <Link to="/admin/students" className="card group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f5c518]/20 flex items-center justify-center group-hover:bg-[#f5c518]/30 transition-colors">
                  <Users className="w-5 h-5 text-[#f5c518]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Add Students</p>
                  <p className="text-white/50 text-sm">Bulk import students</p>
                </div>
              </div>
            </Link>
            <Link to="/admin/analytics" className="card group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0f3460]/40 flex items-center justify-center group-hover:bg-[#0f3460]/60 transition-colors">
                  <BarChart3 className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="font-semibold text-white">View Analytics</p>
                  <p className="text-white/50 text-sm">Track engagement</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
