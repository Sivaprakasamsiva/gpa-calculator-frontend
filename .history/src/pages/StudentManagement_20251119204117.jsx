// src/pages/StudentManagement.jsx
// FULL — Student Management with View history + PDF modal (history-only semesters)
// NOTE: Uses adminAPI.getStudents, adminAPI.getStudentHistory(studentId), adminAPI.getSemesterReport(studentId, semester)
// and adminAPI.downloadStudentMarksheet(studentId, semester).
// Keep this file complete — no functions removed.

import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

/**
 * StudentManagement
 *
 * - List students
 * - Add student modal
 * - View student academic history modal (semesters + GPA)
 * - PDF modal: when clicking PDF on a student row this opens a modal populated
 *   from that student's **history** (only semesters present in history). You can:
 *     • Select a semester from a dropdown (history-only)
 *     • Fetch & view subject detail table for that semester
 *     • Download backend-generated PDF for that student+semester
 *
 * This file intentionally preserves full features from your previous working file.
 */

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Students list + search
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // Create student modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });

  // View history modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null); // { student, history: [...] }

  // PDF modal (history-only semesters)
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfStudent, setPdfStudent] = useState(null); // student object for which PDF modal is opened
  const [pdfSemesters, setPdfSemesters] = useState([]); // from adminAPI.getStudentHistory(studentId)
  const [selectedPdfSemester, setSelectedPdfSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]); // subjects for selected semester (detailed)
  const [pdfLoading, setPdfLoading] = useState(false);

  // Meta data for create student
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false); // general loading for create
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([loadStudents(), loadMeta()]);
    } finally {
      setInitialLoading(false);
    }
  };

  // -------------------------
  // Load students
  // -------------------------
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents(); // expects array in res.data
      setStudents(res.data || []);
    } catch (err) {
      console.error("loadStudents error:", err);
      toast.error("Failed to load students");
    }
  };

  // -------------------------
  // Load regulations + departments (for Add Student)
  // -------------------------
  const loadMeta = async () => {
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.warn("Failed loading metadata:", err);
      // try once more with gentle fallback
      try {
        const [regsRes2, deptsRes2] = await Promise.all([
          adminAPI.getRegulations(),
          adminAPI.getDepartments(),
        ]);
        setRegulations(regsRes2.data || []);
        setDepartments(deptsRes2.data || []);
      } catch (err2) {
        console.error("Final meta load failed:", err2);
        toast.error("Failed to load metadata");
      }
    }
  };

  // -------------------------
  // Create student
  // -------------------------
  const handleCreate = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.regulationId ||
      !form.departmentId
    ) {
      return toast.error("Please fill all fields");
    }

    setLoading(true);
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

      setForm({
        name: "",
        email: "",
        password: "",
        regulationId: "",
        departmentId: "",
      });

      await loadStudents();
    } catch (err) {
      console.error("create student error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to create student";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // View student history (used by "View" button)
  // -------------------------
  const openViewModal = async (student) => {
    try {
      const res = await adminAPI.getStudentHistory(student.id); // expects JSON array of { semester, gpa }
      setViewData({
        student,
        history: res.data || [],
      });
      setShowViewModal(true);
    } catch (err) {
      console.error("view error:", err);
      const msg =
        err?.response?.data || err?.message || "Failed to load student history";
      toast.error(msg);
    }
  };

  // -------------------------
  // PDF modal — open and populate semester list (history-only)
  // -------------------------
  const openPdfModal = async (student) => {
    try {
      setPdfStudent(student);
      setSelectedPdfSemester("");
      setSemesterSubjects([]);
      setPdfSemesters([]);
      setShowPdfModal(true);

      // fetch student's GPA history (history-only semantics)
      const res = await adminAPI.getStudentHistory(student.id); // expects [{semester:1,gpa:...}, ...]
      const history = Array.isArray(res.data) ? res.data : [];

      // sort descending (optional) so latest first
      history.sort((a, b) => b.semester - a.semester);

      setPdfSemesters(history);
      if (history.length === 0) {
        toast.info("No saved GPA history for this student. PDF download not available from history.");
      }
    } catch (err) {
      console.error("openPdfModal error:", err);
      toast.error("Failed to open PDF modal");
    }
  };

  // -------------------------
  // When semester selected in PDF modal -> fetch detailed subject rows
  // Use adminAPI.getSemesterReport(studentId, semester) if available
  // If that endpoint doesn't exist backend might return 404/400 — handle gracefully
  // -------------------------
  const handleSelectPdfSemester = async (semester) => {
    setSelectedPdfSemester(semester);
    setSemesterSubjects([]);
    if (!semester || !pdfStudent) return;

    try {
      setPdfLoading(true);
      // attempt to fetch semester detail JSON (subjects + grade + points)
      // Expected shape: { semester: n, gpa, totalCredits, totalPoints, subjects: [{ courseCode, courseTitle, credits, grade, gradePoint }] }
      const res = await adminAPI.getSemesterReport(pdfStudent.id, Number(semester));
      const data = res.data || {};
      const subjects = Array.isArray(data.subjects) ? data.subjects : [];
      setSemesterSubjects(subjects);
    } catch (err) {
      console.error("fetch semester details error:", err);
      // Backend might not have a JSON semester-report admin endpoint; show a helpful message
      const msg =
        err?.response?.data ||
        err?.response?.statusText ||
        err?.message ||
        "Failed to fetch semester details";
      toast.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  // -------------------------
  // Download PDF from backend (admin marksheet endpoint)
  // adminAPI.downloadStudentMarksheet(studentId, semester) expected to return blob
  // -------------------------
  const handleDownloadPdfForStudent = async () => {
    if (!pdfStudent) return toast.error("No student selected");
    if (!selectedPdfSemester) return toast.error("Select a semester to download");

    try {
      setPdfLoading(true);
      const res = await adminAPI.downloadStudentMarksheet(
        pdfStudent.id,
        Number(selectedPdfSemester)
      );

      // res.data should be a Blob (axios response with responseType: 'blob')
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pdfStudent.name || "student"}-sem-${selectedPdfSemester}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF download started");
    } catch (err) {
      console.error("PDF download error:", err);
      const msg =
        err?.response?.data ||
        err?.response?.statusText ||
        err?.message ||
        "Failed to download PDF";
      toast.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  // -------------------------
  // Filter students by search
  // -------------------------
  const filtered = students.filter((st) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (st.name || "").toLowerCase().includes(q) ||
      (st.email || "").toLowerCase().includes(q) ||
      (st.department?.name || "").toLowerCase().includes(q) ||
      (st.regulation?.name || "").toLowerCase().includes(q)
    );
  });

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Student Management
              </h1>

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

            {/* Students table */}
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => (
                      <tr key={st.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 text-gray-900 dark:text-white">{st.name}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.email}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.department?.name}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{st.regulation?.name}</td>
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => openViewModal(st)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openPdfModal(st)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ========================= */}
      {/* Add Student Modal */}
      {/* ========================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{form.id ? "Edit Student" : "Add New Student"}</h2>

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

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 mr-2 border rounded">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* View Student History Modal */}
      {/* ========================= */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {viewData.student.name} – Academic History
            </h2>

            <table className="w-full border text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="p-2">Semester</th>
                  <th className="p-2">GPA</th>
                  <th className="p-2">View</th>
                </tr>
              </thead>
              <tbody>
                {viewData.history.length > 0 ? (
                  viewData.history.map((h) => (
                    <tr key={h.semester}>
                      <td className="p-2">Semester {h.semester}</td>
                      <td className="p-2">{typeof h.gpa === "number" ? h.gpa.toFixed(2) : h.gpa}</td>
                      <td
                        className="p-2 text-blue-600 underline cursor-pointer"
                        onClick={() => {
                          // open semester details modal (reuse PDF modal's details fetch)
                          // prepare pdfStudent so the details function can reuse it
                          setPdfStudent(viewData.student);
                          handleSelectPdfSemester(h.semester);
                          setShowSemViewFromHistory(true);
                        }}
                      >
                        Details
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-3 text-center">
                      No history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-red-600 text-white rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* PDF Modal (history-only semesters) */}
      {/* ========================= */}
      {showPdfModal && pdfStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold mb-2">
                {pdfStudent.name} — Generate Marksheet (History Semesters)
              </h2>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfStudent(null);
                  setPdfSemesters([]);
                  setSelectedPdfSemester("");
                  setSemesterSubjects([]);
                }}
                className="text-gray-600"
                title="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Pick a semester from the student's saved GPA history (only saved semesters appear).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-4">
              <select
                className="col-span-2 p-2 border rounded bg-white dark:bg-gray-700"
                value={selectedPdfSemester}
                onChange={(e) => handleSelectPdfSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                {pdfSemesters.length === 0 && (
                  <option value="" disabled>
                    No saved semesters
                  </option>
                )}
                {pdfSemesters.map((s) => (
                  <option key={s.semester} value={s.semester}>
                    Semester {s.semester} — GPA:{" "}
                    {typeof s.gpa === "number" ? s.gpa.toFixed(2) : s.gpa}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdfForStudent}
                  disabled={!selectedPdfSemester || pdfLoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
                >
                  {pdfLoading ? "Downloading..." : "Download PDF"}
                </button>

                <button
                  onClick={() => {
                    // Refresh semester details if already selected
                    if (selectedPdfSemester && pdfStudent) {
                      handleSelectPdfSemester(selectedPdfSemester);
                    }
                  }}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                >
                  Refresh Details
                </button>
              </div>
            </div>

            {/* Semester subject details preview */}
            <div className="overflow-auto max-h-80 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2">Credits</th>
                    <th className="p-2">Grade</th>
                    <th className="p-2">Points</th>
                  </tr>
                </thead>

                <tbody>
                  {semesterSubjects.length > 0 ? (
                    semesterSubjects.map((s, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{s.courseCode ?? s.code ?? "-"}</td>
                        <td className="p-2">{s.courseTitle ?? s.name ?? "-"}</td>
                        <td className="p-2">{s.credits ?? s.credits ?? "-"}</td>
                        <td className="p-2">{s.grade ?? "-"}</td>
                        <td className="p-2">{s.gradePoint ?? s.points ?? "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        {selectedPdfSemester
                          ? pdfLoading
                            ? "Loading..."
                            : "No subject details available for this semester."
                          : "Select a semester to view details."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfStudent(null);
                  setPdfSemesters([]);
                  setSelectedPdfSemester("");
                  setSemesterSubjects([]);
                }}
                className="px-3 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleDownloadPdfForStudent}
                disabled={!selectedPdfSemester || pdfLoading}
                className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
              >
                {pdfLoading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
