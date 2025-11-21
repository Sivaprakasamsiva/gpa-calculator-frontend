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

  // ✅ FIXED REGISTER (correct field names)
register: (formData) =>
  api.post("/auth/register", {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    regulationId: Number(formData.regulation),
    departmentId: Number(formData.department),
  }),

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

  // PDF DOWNLOAD (backend PDF)
  getMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),

  generateMarksheet: (semester) =>
    api.get(`/student/marksheet/${semester}`, { responseType: "blob" }),

  getCGPASummary: (semesterIds) =>
    api.post(
      "/student/cgpa-summary",
      { semesterIds },
      { responseType: "blob" }
    ),

  // JSON APIs (frontend PDF builder)
  getSemesterReport: (semester) =>
    api.get("/student/semester-report", {
      params: { semester: Number(semester) },
    }),

  getCGPAReport: (semesterIds) =>
    api.post("/student/cgpa-report", { semesterIds }),
};

// ========================
// ADMIN API
// ========================
export const adminAPI = {
  // Students
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  createStudent: (data) => api.post("/admin/create-student", data),

  // Regulations
  getRegulations: () => api.get("/admin/regulations"),
  createRegulation: (data) => api.post("/admin/regulations", data),
  updateRegulation: (id, data) => api.put(`/admin/regulations/${id}`, data),
  deleteRegulation: (id) => api.delete(`/admin/regulations/${id}`),

  // Departments
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  // Semesters
  getSemesters: (regId, deptId) =>
    api.get("/admin/semesters", {
      params: {
        regulationId: Number(regId),
        departmentId: Number(deptId),
      },
    }),

  createSemester: (data) => api.post("/admin/semesters", data),
  updateSemester: (id, data) => api.put(`/admin/semesters/${id}`, data),
  deleteSemester: (id) => api.delete(`/admin/semesters/${id}`),

  // Subjects
  getSubjects: (regId, deptId, sem) =>
    api.get("/admin/subjects", {
      params: {
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(sem),
      },
    }),

  addSubject: (data) => api.post("/admin/subjects", data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),

  // Stats
  getTotalStudents: () => api.get("/admin/stats/students"),
  getTotalDepartments: () => api.get("/admin/stats/departments"),
  getTotalRegulations: () => api.get("/admin/stats/regulations"),
  getReportsCount: () => api.get("/admin/stats/reports"),

  // Admin → Student APIs
  getStudentHistory: (id) => api.get(`/admin/student-history/${id}`),

  getSemesterReport: (studentId, semester) =>
    api.get(`/admin/semester-report/${studentId}/${semester}`),

  downloadStudentMarksheet: (studentId, semester) =>
    api.get(`/admin/marksheet/${studentId}/${semester}`, {
      responseType: "blob",
    }),

  getStudentCGPASummary: (studentId, semesterIds) =>
    api.post(
      "/student/cgpa-summary",
      { semesterIds, studentId },
      { responseType: "blob" }
    ),

  // Reports (NEW)
  getReports: () => api.get("/admin/reports"),
  downloadReport: (id) =>
    api.get(`/admin/reports/${id}`, { responseType: "blob" }),
};

export default api;
