// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

// ===== axios instance =====
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ===== Request Logger =====
api.interceptors.request.use((config) => {
  const url = (config.baseURL || "") + (config.url || "");
  console.log(`API → ${config.method?.toUpperCase()} ${url}`);
  if (config.params) console.log("PARAMS →", config.params);
  if (config.data) console.log("BODY →", config.data);
  return config;
});

// ===== Attach JWT token =====
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  if (raw) {
    const user = JSON.parse(raw);
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ===== Handle unauthorized response =====
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

// =============================
// AUTH API
// =============================
export const authAPI = {
  login: (body) => api.post("/auth/login", body),
  register: (body) => api.post("/auth/register", body),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }),
};

// =============================
// STUDENT API
// =============================
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

  calculateGPA: (body) => api.post("/student/calculate-gpa", body),
  saveGrades: (body) => api.post("/student/grades", body),
  calculateCGPA: (semesterIds) =>
    api.post("/student/calculate-cgpa", { semesterIds }),
  getHistory: () => api.get("/student/history"),
  getMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),
  getCGPASummary: (semesterIds) =>
    api.post("/student/cgpa-summary", { semesterIds }, { responseType: "blob" }),
};

// =============================
// ADMIN API
// =============================
export const adminAPI = {
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),
  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  createStudent: (body) => api.post("/admin/create-student", body),

  // Departments
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (body) => api.post("/admin/departments", body),
  updateDepartment: (id, body) => api.put(`/admin/departments/${id}`, body),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  // Regulations
  getRegulations: () => api.get("/admin/regulations"),

  // Semesters
  getSemesters: (regId, deptId) =>
    api.get("/admin/semesters", {
      params: { regulationId: Number(regId), departmentId: Number(deptId) },
    }),

  // Subjects
  getSubjects: (rid, did, sem) =>
    api.get("/admin/subjects", {
      params: {
        regulationId: Number(rid),
        departmentId: Number(did),
        semester: Number(sem),
      },
    }),
};

export default api;
