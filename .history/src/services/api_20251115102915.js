// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// =============================
// DEBUG LOGGER
// =============================
api.interceptors.request.use((config) => {
  try {
    console.log(
      "API CALL →",
      (config.method || "").toUpperCase(),
      (config.baseURL || "") + (config.url || "")
    );
    console.log("PAYLOAD →", config.data);
  } catch (e) {}
  return config;
});

// =============================
// ADD TOKEN
// =============================
api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem("user");
    if (!raw) return config;

    const user = JSON.parse(raw);
    const token = user?.token;

    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================
// HANDLE 401 UNAUTHORIZED
// =============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// =======================================================
// AUTH API
// =======================================================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),

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

// =======================================================
// STUDENT API
// =======================================================
export const studentAPI = {
  getProfile: () => api.get("/student/profile"),

  updateProfile: (data) => api.put("/student/profile", data),

  getSubjects: (regId, deptId, sem) =>
    api.get("/student/subjects", {
      params: {
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(sem),
      },
    }),

  calculateGPA: (data) => api.post("/student/calculate-gpa", data),

  saveGrades: (data) => api.post("/student/grades", data),

  calculateCGPA: (semesterIds) =>
    api.post("/student/calculate-cgpa", { semesterIds }),

  getHistory: () => api.get("/student/history"),

  generateMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),

  generateCGPASummary: (semesterIds) =>
    api.post(
      "/student/cgpa-summary",
      { semesterIds },
      { responseType: "blob" }
    ),
};

// =======================================================
// ADMIN API
// =======================================================
export const adminAPI = {
  // =======================
  // STUDENTS
  // =======================
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),

  createStudent: (data) => api.post("/admin/create-student", data),

  // =======================
  // DEPARTMENTS (CRUD)
  // =======================
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) =>
    api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  getTotalDepartments: () => api.get("/admin/stats/departments"),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),


  // =======================
  // REGULATIONS (CRUD)
  // =======================
  getRegulations: () => api.get("/admin/regulations"),
  createRegulation: (data) => api.post("/admin/regulations", data),
  updateRegulation: (id, data) =>
    api.put(`/admin/regulations/${id}`, data),
  deleteRegulation: (id) => api.delete(`/admin/regulations/${id}`),

  getTotalRegulations: () => api.get("/admin/stats/regulations"),

  // =======================
  // SUBJECT MANAGEMENT
  // =======================
  // FIXED → only sends valid params
  getSubjects: (regId, deptId, sem) => {
    const params = {};
    if (regId) params.regulationId = Number(regId);
    if (deptId) params.departmentId = Number(deptId);
    if (sem) params.semester = Number(sem);

    return api.get("/admin/subjects", { params });
  },

  addSubject: (data) => api.post("/admin/subjects", data),
  bulkInsertSubjects: (data) => api.post("/admin/subjects/bulk", data),

  // =======================
  // REPORTS
  // =======================
  generateReport: (type, filters) =>
    api.post(
      "/admin/reports",
      { type, filters },
      { responseType: "blob" }
    ),

  getReportsCount: () => api.get("/admin/stats/reports"),

  // =======================
  // DASHBOARD STATS
  // =======================
  getTotalStudents: () => api.get("/admin/stats/students"),
};

export default api;
