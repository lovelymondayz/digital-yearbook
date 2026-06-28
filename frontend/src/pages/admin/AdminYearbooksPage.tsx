import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, BookOpen } from "lucide-react";
import { yearbookAPI } from "../../lib/api";

interface YearbookItem {
  id: string;
  title: string;
  year: number;
  status: string;
  slug: string;
}

export default function AdminYearbooksPage() {
  const [yearbooks, setYearbooks] = useState<YearbookItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", year: new Date().getFullYear(), description: "" });

  const refreshList = async () => {
    try {
      const res = await yearbookAPI.list();
      setYearbooks(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await yearbookAPI.create({
        university_id: "00000000-0000-0000-0000-000000000001",
        year: form.year,
        title: form.title,
        description: form.description,
      });
      setShowCreate(false);
      setForm({ title: "", year: new Date().getFullYear(), description: "" });
      await refreshList();
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Yearbooks</h1>
            <p className="text-white/50">Manage your university yearbooks</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Yearbook
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="card mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Create New Yearbook</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
              <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} className="input" required />
              <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" className="btn-primary text-sm">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.form>
        )}

        {/* Yearbooks list */}
        <div className="space-y-4">
          {yearbooks.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No yearbooks yet. Create your first one!</p>
            </div>
          ) : (
            yearbooks.map((yb) => (
              <div key={yb.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{yb.title}</h3>
                  <p className="text-white/50 text-sm">{yb.year} · {yb.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
