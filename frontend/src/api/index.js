import api from "./client";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  register: (data) => api.post("/api/auth/register", data),
  registerUniversity: (data) => api.post("/api/auth/register/university", data),
  getUniversities: () => api.get("/api/auth/universities"),
  getMe: () => api.get("/api/auth/me"),
  updateProfile: (data) => api.put("/api/auth/me", data),
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (message, session_id = null) =>
    api.post("/api/chat/", { message, session_id }),
  getSessions: () => api.get("/api/chat/sessions"),
  getSession: (id) => api.get(`/api/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/api/chat/sessions/${id}`),
  getSuggestedQuestions: () => api.get("/api/chat/suggested-questions"),
};

// ─── Documents ───────────────────────────────────────────────────────────────
export const docsAPI = {
  list: () => api.get("/api/documents/"),
  open: (id) => api.get(`/api/documents/${id}/file`, { responseType: "blob" }),
  upload: (formData) =>
    api.post("/api/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/api/documents/${id}`),
};

// ─── Notices ─────────────────────────────────────────────────────────────────
export const noticesAPI = {
  list: () => api.get("/api/notices/"),
  create: (data) => api.post("/api/notices/", data),
  delete: (id) => api.delete(`/api/notices/${id}`),
};

// ─── FAQs ────────────────────────────────────────────────────────────────────
export const faqsAPI = {
  list: () => api.get("/api/faqs/"),
  create: (data) => api.post("/api/faqs/", data),
  delete: (id) => api.delete(`/api/faqs/${id}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get("/api/admin/dashboard"),
  getUsers: () => api.get("/api/admin/users"),
  getStudent: (id) => api.get(`/api/admin/users/${id}`),
  setStudentActive: (id, isActive) =>
    api.patch(`/api/admin/users/${id}/status`, { is_active: isActive }),
  getAccounts: () => api.get("/api/admin/accounts"),
  deleteAccount: (id) => api.delete(`/api/admin/accounts/${id}`),
};
