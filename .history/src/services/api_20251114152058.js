// =======================================================
// ADMIN API (FIXED)
// =======================================================
export const adminAPI = {
  getStudents: (page = 0, size = 10) =>
    api.get("/admin/students", { params: { page, size } }),

  getStudentDetails: (id) => api.get(`/admin/students/${id}`),

  getRegulations: () => api.get("/admin/regulations"),

  getDepartments: () => api.get("/admin/departments"),

  addSubject: (data) => api.post("/admin/subjects", data),

  bulkInsertSubjects: (data) => api.post("/admin/subjects/bulk", data),

  // FIXED: send params ONLY when provided
  getSubjects: (regId, deptId, sem) =>
    api.get("/admin/subjects", {
      params:
        regId && deptId && sem
          ? {
              regulationId: Number(regId),
              departmentId: Number(deptId),
              semester: Number(sem),
            }
          : {},
    }),

  // NEW: backend supports GET /admin/reports
  getReports: () => api.get("/admin/reports"),

  // FIXED: backend requires type in query param ?type=
  generateReport: (type, filters) =>
    api.post(`/admin/reports?type=${encodeURIComponent(type)}`, filters, {
      responseType: "blob",
    }),
};
