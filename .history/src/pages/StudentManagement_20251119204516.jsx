// src/pages/StudentManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI, studentAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

/**
 * StudentManagement.jsx
 *
 * - All original behaviors kept (create student modal, metadata load, search)
 * - Removed the old "View" action button (which previously opened history)
 * - Renamed the "PDF" button to "View" (it now opens a Semester Detail modal)
 * - Semester Detail modal:
 *    * Fetches student's history (semesters + GPA)
 *    * Shows a dropdown of available history semesters
 *    * On semester selection, fetches semester subjects (course code, title, credits, grade, points)
 *    * Allows "Download PDF" which downloads the server-generated marksheet for that student+semester
 *
 * Note: This file expects adminAPI to provide the following endpoints:
 *   - adminAPI.getStudents()
 *   - adminAPI.createStudent(payload)
 *   - adminAPI.getRegulations()
 *   - adminAPI.getDepartments()
 *   - adminAPI.getStudentHistory(studentId)             -> GET /api/admin/student-history/{id}
 *   - adminAPI.getSemesterReport(studentId, semester)   -> GET /api/admin/student/{studentId}/semester-report/{semester} OR custom
 *   - adminAPI.downloadStudentMarksheet(studentId, sem) -> GET /api/admin/marksheet/{studentId}/{semester} (responseType: blob)
 *
 * If your adminAPI names differ, map those functions in src/services/api.js accordingly.
 */

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // student list + filter
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // create student modal/form
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });
  const [loadingCreate, setLoadingCreate] = useState(false);

  // meta (regulations + depts)
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // VIEW student history modal (kept, but not triggered by table anymore)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyViewData, setHistoryViewData] = useState(null);

  // NEW: Semester Selector modal (triggered by 'View' button in student row)
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterModalStudent, setSemesterModalStudent] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]); // [{semester, gpa}, ...]
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSemesterSubjects, setLoadingSemesterSubjects] = useState(false);
  const [loadingSemesterHistory, setLoadingSemesterHistory] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // initial load
  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // ============================
  // Load students (admin)
  // ============================
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents(); // expects array
      setStudents(res.data || []);
    } catch (err) {
      console.error("loadStudents error:", err);
      toast.error("Failed to load students");
    }
  };

  // ============================
  // Load regulations + departments (meta)
  // ============================
  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.error("loadMeta initial error:", err);
      // Try one retry (sometimes backend starts slow)
      try {
        const [regsRes2, deptsRes2] = await Promise.all([
          adminAPI.getRegulations(),
          adminAPI.getDepartments(),
        ]);
        setRegulations(regsRes2.data || []);
        setDepartments(deptsRes2.data || []);
      } catch (err2) {
        console.error("loadMeta retry failed:", err2);
        toast.error("Failed to load metadata");
      }
    } finally {
      setLoadingMeta(false);
    }
  };

  // ============================
  // Create student
  // ============================
  const handleCreate = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.regulationId ||
      !form.departmentId
    ) {
      toast.error("Please fill all fields");
      return;
    }

    setLoadingCreate(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        regulationId: Number(form.regulationId),
        departmentId: Number(form.departmentId),
      };

      await adminAPI.createStudent(payload);
      toast.success("Student created!");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", regulationId: "", departmentId: "" });
      await loadStudents();
    } catch (err) {
      console.error("create student error:", err);
      // extract message safely
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to create student";
      toast.error(msg);
    } finally {
      setLoadingCreate(false);
    }
  };

  // ============================
  // VIEW student history (kept)
  // Note: Not used in table rows anymore but left in file intact.
  // ============================
  const openHistoryModal = async (student) => {
    try {
      const res = await adminAPI.getStudentHistory(student.id);
      setHistoryViewData({
        student,
        history: res.data || [],
      });
      setShowHistoryModal(true);
    } catch (err) {
      console.error("openHistoryModal error:", err);
      toast.error("Failed to load student history");
    }
  };

  // ============================
  // NEW: Open Semester Modal (replaces previous PDF prompt)
  // - This is now the single "View" action available in the table.
  // - It fetches the student's GPA history (semesters) and allows the admin
  //   to select a semester and view subject-level grade/point details and download
  //   the PDF for that semester.
  // ============================
  const openSemesterModal = async (student) => {
    // Open modal and fetch history (semesters)
    setSemesterModalStudent(student);
    setShowSemesterModal(true);
    setSelectedSemester("");
    setSemesterSubjects([]);
    setSemesterHistory([]);
    setLoadingSemesterHistory(true);

    try {
      // adminAPI.getStudentHistory should return list [{semester, gpa}, ...]
      const res = await adminAPI.getStudentHistory(student.id);
      setSemesterHistory(res.data || []);
    } catch (err) {
      console.error("openSemesterModal history fetch:", err);
      toast.error("Failed to fetch student history");
      setSemesterHistory([]);
    } finally {
      setLoadingSemesterHistory(false);
    }
  };

  // ============================
  // Fetch semester subjects for the selected student + semester
  // ============================
  const loadSemesterSubjects = async (studentId, sem) => {
    if (!studentId || !sem) return;
    setLoadingSemesterSubjects(true);
    setSemesterSubjects([]);
    try {
      // adminAPI.getSemesterReport(studentId, sem) should return:
      // { semester, gpa, totalCredits, totalPoints, subjects: [{ courseCode, courseTitle, credits, grade, gradePoint }, ...] }
      const res = await adminAPI.getSemesterReport(studentId, Number(sem));
      const data = res.data || {};
      setSemesterSubjects(data.subjects || []);
      // Keep selectedSemester updated
      setSelectedSemester(data.semester ?? sem);
    } catch (err) {
      console.error("loadSemesterSubjects error:", err);
      const msg = err?.response?.data || err?.message || "Failed to fetch semester subjects";
      toast.error(msg);
      setSemesterSubjects([]);
    } finally {
      setLoadingSemesterSubjects(false);
    }
  };

  // ============================
  // Download marksheet PDF for studentId + semester
  // ============================
  const handleDownloadStudentPdf = async (studentId, sem) => {
    if (!studentId || !sem) {
      toast.error("Select a semester first");
      return;
    }

    setDownloadingPdf(true);
    try {
      // adminAPI.downloadStudentMarksheet should call backend route returning PDF blob
      const res = await adminAPI.downloadStudentMarksheet(studentId, Number(sem));
      // Response must be { data: blob } with responseType: 'blob' in api wrapper
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-${studentId}-sem-${sem}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("handleDownloadStudentPdf error:", err);
      const msg = err?.response?.data || err?.message || "Failed to download PDF";
      toast.error(msg);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ============================
  // Filter students by search
  // ============================
  const filteredStudents = students.filter((st) => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (st.name || "").toLowerCase().includes(q) ||
      (st.email || "").toLowerCase().includes(q) ||
      (st.department?.name || "").toLowerCase().includes(q) ||
      (st.regulation?.name || "").toLowerCase().includes(q)
    );
  });

  // ============================
  // UI Render
  // ============================
  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>

              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white flex items-center px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <UserPlus size={18} className="mr-2" />
                Add Student
              </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-6">
              <div className="flex items-center">
                <Search className="text-gray-500 dark:text-gray-300 mr-3" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Student Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">Name</th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">Email</th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">Department</th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">Regulation</th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">No students found</td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 text-gray-900 dark:text-white">{st.name}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.email}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.department?.name}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.regulation?.name}</td>

                        {/* ACTIONS: Remove old "View" (history) button. Keep single "View" which opens Semester modal */}
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => openSemesterModal(st)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Optional: small footer actions could go here */}
          </div>
        </main>
      </div>

      {/* ============================ */}
      {/* Create Student Modal */}
      {/* ============================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>

            <input
              className="w-full px-3 py-2 mb-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full px-3 py-2 mb-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="w-full px-3 py-2 mb-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              value={form.regulationId}
              onChange={(e) => setForm({ ...form, regulationId: e.target.value })}
              className="w-full px-3 py-2 mb-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="">Select Regulation</option>
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.year ? `(${r.year})` : ""}
                </option>
              ))}
            </select>

            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="w-full px-3 py-2 mb-3 border dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>

            <div className="flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 border rounded mr-2">Cancel</button>
              <button onClick={handleCreate} disabled={loadingCreate} className="px-3 py-2 bg-blue-600 text-white rounded">
                {loadingCreate ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================ */}
      {/* History Modal (kept but not linked in table) */}
      {/* ============================ */}
      {showHistoryModal && historyViewData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{historyViewData.student.name} – Academic History</h2>

            <table className="w-full border text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="p-2">Semester</th>
                  <th className="p-2">GPA</th>
                </tr>
              </thead>

              <tbody>
                {historyViewData.history.length > 0 ? (
                  historyViewData.history.map((h) => (
                    <tr key={h.semester}>
                      <td className="p-2">Semester {h.semester}</td>
                      <td className="p-2">{(h.gpa || 0).toFixed ? h.gpa.toFixed(2) : Number(h.gpa || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="p-3 text-center">No history found</td>
                  </tr>
                )}
              </tbody>
            </table>

            <button onClick={() => setShowHistoryModal(false)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Close</button>
          </div>
        </div>
      )}

      {/* ============================ */}
      {/* Semester Modal (this opens when clicking "View" in student row) */}
      {/* ============================ */}
      {showSemesterModal && semesterModalStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-12 p-6 z-50 overflow-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {semesterModalStudent.name} — Semesters & Subjects
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Select a semester to see subject grades and download its PDF.
                </div>
              </div>

              <div>
                <button onClick={() => {
                  setShowSemesterModal(false);
                  setSemesterModalStudent(null);
                  setSemesterHistory([]);
                  setSelectedSemester("");
                  setSemesterSubjects([]);
                }} className="px-3 py-1 bg-gray-300 rounded">Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500">Available Semesters</label>
                <select
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                  value={selectedSemester}
                  onChange={(e) => {
                    const s = e.target.value;
                    setSelectedSemester(s);
                    // load subjects for that semester
                    loadSemesterSubjects(semesterModalStudent.id, s);
                  }}
                >
                  <option value="">Select Semester</option>
                  {/* show semesters from semesterHistory */}
                  {loadingSemesterHistory ? (
                    <option>Loading...</option>
                  ) : semesterHistory.length > 0 ? (
                    semesterHistory.map((hh) => (
                      <option key={hh.semester} value={hh.semester}>
                        Semester {hh.semester} — GPA: {hh.gpa != null ? (hh.gpa.toFixed ? hh.gpa.toFixed(2) : Number(hh.gpa).toFixed(2)) : "-"}
                      </option>
                    ))
                  ) : (
                    <option value="">No semesters (history-only)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!selectedSemester) {
                        toast.error("Select a semester first");
                        return;
                      }
                      // Download the server-generated PDF for this student and semester
                      handleDownloadStudentPdf(semesterModalStudent.id, selectedSemester);
                    }}
                    disabled={downloadingPdf}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {downloadingPdf ? "Downloading..." : "Download PDF"}
                  </button>

                  <button
                    onClick={() => {
                      // Refresh the semester subjects for the currently selected semester
                      if (!selectedSemester) {
                        toast.error("Select a semester to refresh");
                        return;
                      }
                      loadSemesterSubjects(semesterModalStudent.id, selectedSemester);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Refresh Subjects
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 text-xs text-gray-500 mt-1">
                <em>
                  Note: If the student has only history (gpa saved) but no grade entries for a semester, the "No subject data" message will display.
                </em>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Subject Details</h3>

              <div className="mt-6">
  <h3 className="text-lg font-semibold mb-3">Subject Details</h3>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-100 dark:bg-gray-700">
        <tr>
          <th className="p-2 text-left">Code</th>
          <th className="p-2 text-left">Subject</th>
          <th className="p-2 text-left">Credits</th>
          <th className="p-2 text-left">Grade</th>
          <th className="p-2 text-left">Points</th>
        </tr>
      </thead>

      <tbody>
        {loadingSemesterSubjects ? (
          <tr>
            <td colSpan="5" className="p-4 text-center">
              Loading subjects...
            </td>
          </tr>
        ) : semesterSubjects.length > 0 ? (
          semesterSubjects.map((s, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">{s.courseCode || "-"}</td>
              <td className="p-2">{s.courseTitle || "-"}</td>
              <td className="p-2">{s.credits ?? "-"}</td>
              <td className="p-2">{s.grade || "-"}</td>
              <td className="p-2">{s.gradePoint ?? "-"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="p-4 text-center text-gray-500">
              No subject data found for selected semester
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  </div>

        </div>
      )}
    </div>
  );
};

export default StudentManagement;
