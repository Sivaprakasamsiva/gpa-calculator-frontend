// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

// ========================
// AXIOS INSTANCE
// ========================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ========================
// REQUEST LOGGER
// ========================
api.interceptors.request.use((config) => {
  try {
    const url = (config.baseURL || "") + (config.url || "");
    console.log(`🔵 API → ${config.method?.toUpperCase()} ${url}`);
    if (config.params) console.log("🔹 PARAMS →", config.params);
    if (config.data) console.log("🔹 DATA →", config.data);
  } catch {}
  return config;
});

// ========================
// ATTACH JWT TOKEN
// ========================
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.token) config.headers.Authorization = `Bearer ${parsed.token}`;
  }
  return config;
});

// ========================
// TOKEN EXPIRED HANDLING
// ========================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ========================
// AUTH API
// ========================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }),
};

// ========================
// STUDENT API
// ========================
export const studentAPI = {
  getProfile: () => api.get("/student/profile"),

  getSubjects: (regulationId, departmentId, semester) =>
    api.get("/student/subjects", {
      params: {
        regulationId: Number(regulationId),
        departmentId: Number(departmentId),
        semester: Number(semester),
      },
    }),

  // ⭐ NEW IMPORTANT FUNCTION (Required by GPACalculator.jsx)
  getSemesterDetails: (departmentId, regulationId, semester) =>
    api.get("/student/semester-details", {
      params: {
        departmentId: Number(departmentId),
        regulationId: Number(regulationId),
        semester: Number(semester),
      },
    }),

  calculateGPA: (body) => api.post("/student/calculate-gpa", body),
  saveGrades: (body) => api.post("/student/grades", body),

  calculateCGPA: (semesterIds) =>
    api.post("/student/calculate-cgpa", { semesterIds }),

  getHistory: () => api.get("/student/history"),

  // PDF download (ORIGINAL)
  getMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),

  // 🔥 REQUIRED BY GPACalculator.jsx (ALIAS, NOT REPLACEMENT)
  generateMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),

  getCGPASummary: (semesterIds) =>
    api.post("/student/cgpa-summary", { semesterIds }, { responseType: "blob" }),
};

// ========================
// ADMIN API
// ========================
export const adminAPI = {
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  createStudent: (data) => api.post("/admin/create-student", data),

  // Departments
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  // Regulations
  getRegulations: () => api.get("/admin/regulations"),

  // Semesters
  getSemesters: (regId, deptId) =>
    api.get("/admin/semesters", {
      params: { regulationId: Number(regId), departmentId: Number(deptId) },
    }),

  // Subjects
  getSubjects: (regId, deptId, sem) =>
    api.get("/admin/subjects", {
      params: {
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(sem),
      },
    }),
};

export default api;
