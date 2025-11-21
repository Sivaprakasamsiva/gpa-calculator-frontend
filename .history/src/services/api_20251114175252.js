// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// =============================
// DEBUG LOGGER (IMPORTANT)
// =============================
api.interceptors.request.use((config) => {
  try {
    console.log(
      "API CALL →",
      (config.method || "").toUpperCase(),
      (config.baseURL || "") + (config.url || "")
    );
    console.log("PAYLOAD →", config.data);
  } catch (e) {
    /* ignore logging errors */
  }
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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================
// HANDLE 401
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
    api.post("/student/cgpa-summary", { semesterIds }, { responseType: "blob" }),
};

// =======================================================
// ADMIN API
// =======================================================
export const adminAPI = {
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),

  getRegulations: () => api.get("/admin/regulations"),

  getDepartments: () => api.get("/admin/departments"),

  addSubject: (data) => api.post("/admin/subjects", data),

  bulkInsertSubjects: (data) => api.post("/admin/subjects/bulk", data),

  getSubjects: (regId, deptId, sem) =>
    api.get("/admin/subjects", {
      params: {
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(sem),
      },
    }),

  generateReport: (type, filters) =>
    api.post("/admin/reports", { type, filters }, { responseType: "blob" }),

  // <-- NEW: create student (used by Admin UI)
  createStudent: (data) => api.post("/admin/create-student", data),

  // optional admin stats endpoints (if you created them)
  getTotalStudents: () => api.get("/admin/stats/students"),
  getTotalDepartments: () => api.get("/admin/stats/departments"),
  getTotalRegulations: () => api.get("/admin/stats/regulations"),
  getReportsCount: () => api.get("/admin/stats/reports"),
};

export default api;
