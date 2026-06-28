import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yearbook-auth")
    ? JSON.parse(localStorage.getItem("yearbook-auth") || "{}").state?.accessToken
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh
      const auth = JSON.parse(localStorage.getItem("yearbook-auth") || "{}");
      const refreshToken = auth.state?.refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          auth.state.accessToken = access_token;
          auth.state.refreshToken = newRefresh;
          localStorage.setItem("yearbook-auth", JSON.stringify(auth));
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem("yearbook-auth");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post("/auth/register", { email, password, full_name }),
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }),
};

export const yearbookAPI = {
  list: (universityId?: string) =>
    api.get("/yearbooks", { params: { university_id: universityId } }),
  getBySlug: (slug: string) =>
    api.get(`/yearbooks/${slug}`),
  getPages: (id: string) =>
    api.get(`/yearbooks/${id}/pages`),
  getStudents: (id: string, limit = 20, offset = 0) =>
    api.get(`/yearbooks/${id}/students`, { params: { limit, offset } }),
  getStudent: (yearbookId: string, studentId: string) =>
    api.get(`/yearbooks/${yearbookId}/students/${studentId}`),
  create: (data: { university_id: string; year: number; title: string; description?: string }) =>
    api.post("/admin/yearbooks", data),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.put(`/admin/yearbooks/${id}`, data),
  publish: (id: string) =>
    api.post(`/admin/yearbooks/${id}/publish`),
  archive: (id: string) =>
    api.post(`/admin/yearbooks/${id}/archive`),
  delete: (id: string) =>
    api.delete(`/admin/yearbooks/${id}`),
};

export const studentAPI = {
  create: (data: {
    yearbook_id: string;
    full_name: string;
    student_id?: string;
    email?: string;
    phone?: string;
    quote?: string;
    major?: string;
    minor?: string;
    graduation_year?: number;
    department_id?: string;
  }) => api.post("/admin/students", data),
  delete: (id: string) =>
    api.delete(`/admin/students/${id}`),
};

export const searchAPI = {
  search: (params: {
    q?: string;
    year?: number;
    department?: string;
    faculty?: string;
    yearbook_id?: string;
  }) => api.get("/search", { params }),
};

export const bookmarkAPI = {
  list: () => api.get("/bookmarks"),
  create: (data: { yearbook_id: string; yearbook_page_id?: string; student_id?: string }) =>
    api.post("/bookmarks", data),
  delete: (id: string) => api.delete(`/bookmarks/${id}`),
};

export const analyticsAPI = {
  dashboard: () => api.get("/admin/analytics"),
};
