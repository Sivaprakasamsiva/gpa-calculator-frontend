import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Debug logger
api.interceptors.request.use((config) => {
  console.log("API CALL →", config.method.toUpperCase(), config.baseURL + config.url);
  console.log("PAYLOAD →", config.data);
  return config;
});

// Add token
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  if (raw) {
    const token = JSON.parse(raw)?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// AUTH API
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) =>
    api.post("/auth/register", {
      name: data.name,
      email: data.email,
      password: data.password,
      regulationId: Number(data.regulation),
      departmentId: Number(data.department),
    }),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }),
};

// STUDENT API
export const studentAPI = {
  getProfile: () => api.get("/student/profile"),
  updateProfile: (data) => api.put("/student/profile", data),
  getSubjects: (reg, dept, sem) =>
    api.get("/student/subjects", {
      params: { regulationId: reg, departmentId: dept, semester: sem },
    }),
  calculateGPA: (data) => api.post("/student/calculate-gpa", data),
  calculateCGPA: (ids) => api.post("/student/calculate-cgpa", { semesterIds: ids }),
  getHistory: () => api.get("/student/history"),
};

// ADMIN API
export const adminAPI = {
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  getRegulations: () => api.get("/admin/regulations"),
  getDepartments: () => api.get("/admin/departments"),

  // Stats
  getTotalStudents: () => api.get("/admin/stats/students"),
  getTotalDepartments: () => api.get("/admin/stats/departments"),
  getTotalRegulations: () => api.get("/admin/stats/regulations"),
  getReportsCount: () => api.get("/admin/stats/reports"),

  // Subjects
  addSubject: (data) => api.post("/admin/subjects", data),
  bulkInsertSubjects: (data) => api.post("/admin/subjects/bulk", data),
  getSubjects: (reg, dept, sem) =>
    api.get("/admin/subjects", {
      params: { regulationId: reg, departmentId: dept, semester: sem },
    }),

  // Reports
  listReports: () => api.get("/admin/reports"),
  generateReport: (type, filters) =>
    api.post(`/admin/reports?type=${type}`, filters, { responseType: "blob" }),
};

export default api;
