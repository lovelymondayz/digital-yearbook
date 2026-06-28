import { motion } from "framer-motion";
import { BarChart3, Eye, Users, BookOpen, TrendingUp } from "lucide-react";

export default function AdminAnalyticsPage() {
  const stats = [
    { label: "Total Views", value: "0", icon: Eye, change: "+0%" },
    { label: "Unique Visitors", value: "0", icon: Users, change: "+0%" },
    { label: "Yearbooks Viewed", value: "0", icon: BookOpen, change: "+0%" },
    { label: "Avg. Session", value: "0m", icon: TrendingUp, change: "+0%" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/50">Track engagement and performance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-white/40" />
                <span className="text-xs text-green-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="card text-center py-16">
          <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 text-lg mb-2">No data yet</p>
          <p className="text-white/30 text-sm">Analytics will appear here once your yearbook gets views.</p>
        </div>
      </div>
    </div>
  );
}
