import { useState } from react;
import { Link, useNavigate } from react-router-dom;
import { motion } from framer-motion;
import { Mail, Lock, User, BookOpen } from lucide-react;
import { authAPI } from ../lib/api;
import { useAuthStore } from ../store/auth;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: , password: , full_name:  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError();
    try {
      const res = await authAPI.register(form.email, form.password, form.full_name);
      setAuth(res.data.user, res.data.tokens.access_token, res.data.tokens.refresh_token);
      navigate(/dashboard);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr?.response?.data?.error?.message || Registration failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=min-h-screen flex items-center justify-center px-4 py-12>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className=w-full max-w-md>
        <div className=text-center mb-8>
          <div className=w-16 h-16 rounded-md bg-primary flex items-center justify-center mx-auto mb-4>
            <BookOpen className=w-8 h-8 text-text />
          </div>
          <h1 className=text-2xl font-bold text-text>Create account</h1>
          <p className=text-text-muted mt-1>Start your yearbook journey</p>
        </div>

        <div className=card>
          {error && (
            <div className=bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4 text-red-400 text-sm>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className=space-y-4>
            <div>
              <label className=block text-sm text-text-muted mb-1>Full Name</label>
              <div className=relative>
                <User className=absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle />
                <input type=text value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder=John Doe className=input pl-11 required />
              </div>
            </div>
            <div>
              <label className=block text-sm text-text-muted mb-1>Email</label>
              <div className=relative>
                <Mail className=absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle />
                <input type=email value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder=you@university.edu className=input pl-11 required />
              </div>
            </div>
            <div>
              <label className=block text-sm text-text-muted mb-1>Password</label>
              <div className=relative>
                <Lock className=absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle />
                <input type=password value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder=Min 8 characters className=input pl-11 required minLength={8} />
              </div>
            </div>
            <button type=submit disabled={loading} className=btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50>
              {loading ? <div className=w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin /> : Create Account}
            </button>
          </form>

          <p className=text-center text-text-muted text-sm mt-6>
            Already have an account?{ }
            <Link to=/login className=text-primary hover:underline>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
