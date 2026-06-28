import { motion } from "framer-motion";
import { Users, Upload, Plus } from "lucide-react";

export default function AdminStudentsPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Students</h1>
            <p className="text-white/50">Manage student profiles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className="w-12 h-12 rounded-xl bg-[#e94560]/20 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[#e94560]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Add Individual</h3>
            <p className="text-white/50 text-sm mb-4">Add one student at a time with full profile details.</p>
            <button className="btn-primary text-sm">Add Student</button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="w-12 h-12 rounded-xl bg-[#f5c518]/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-[#f5c518]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bulk Import</h3>
            <p className="text-white/50 text-sm mb-4">Upload a CSV file to import multiple students at once.</p>
            <button className="btn-secondary text-sm">Upload CSV</button>
          </motion.div>
        </div>

        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No students yet. Add your first student to get started.</p>
        </div>
      </div>
    </div>
  );
}
