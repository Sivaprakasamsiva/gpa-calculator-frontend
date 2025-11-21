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
 *    * On semester selection, fetches subject-level grade/point details and download PDF
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

  // meta
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyViewData, setHistoryViewData] = useState(null);

  // semester modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterModalStudent, setSemesterModalStudent] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSemesterSubjects, setLoadingSemesterSubjects] =
    useState(false);
  const [loadingSemesterHistory, setLoadingSemesterHistory] =
    useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // ==========================
  // Load Students
  // ==========================
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  // ==========================
  // Load meta
  // ==========================
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
      toast.error("Failed to load metadata");
    } finally {
      setLoadingMeta(false);
    }
  };

  // ==========================
  // Create Student
  // ==========================
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

      setForm({
        name: "",
        email: "",
        password: "",
        regulationId: "",
        departmentId: "",
      });

      await loadStudents();
    } catch (err) {
      toast.error(err?.response?.data || "Failed to create student");
    } finally {
      setLoadingCreate(false);
    }
  };

  // ==========================
  // Open Semester Modal
  // ==========================
  const openSemesterModal = async (student) => {
    setSemesterModalStudent(student);
    setShowSemesterModal(true);
    setSelectedSemester("");
    setSemesterSubjects([]);
    setSemesterHistory([]);

    setLoadingSemesterHistory(true);
    try {
      const res = await adminAPI.getStudentHistory(student.id);
      setSemesterHistory(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch student history");
    } finally {
      setLoadingSemesterHistory(false);
    }
  };

  // ==========================
  // Load subjects for semester
  // ==========================
  const loadSemesterSubjects = async (studentId, sem) => {
    if (!studentId || !sem) return;

    setLoadingSemesterSubjects(true);
    try {
      const res = await adminAPI.getSemesterReport(studentId, Number(sem));
      const data = res.data || {};

      setSemesterSubjects(data.subjects || []);
      setSelectedSemester(data.semester ?? sem);
    } catch (err) {
      toast.error(err?.response?.data || "Failed to fetch subjects");
      setSemesterSubjects([]);
    } finally {
      setLoadingSemesterSubjects(false);
    }
  };

  // ==========================
  // Download PDF
  // ==========================
  const handleDownloadStudentPdf = async (studentId, sem) => {
    if (!studentId || !sem) {
      toast.error("Select a semester first");
      return;
    }

    setDownloadingPdf(true);
    try {
      const res = await adminAPI.downloadStudentMarksheet(
        studentId,
        Number(sem)
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `student-${studentId}-sem-${sem}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==========================
  // Filter Students
  // ==========================
  const filteredStudents = students.filter((st) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      st.name?.toLowerCase().includes(q) ||
      st.email?.toLowerCase().includes(q) ||
      st.department?.name?.toLowerCase().includes(q) ||
      st.regulation?.name?.toLowerCase().includes(q)
    );
  });

  // ==========================
  // UI Render
  // ==========================
  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
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

            {/* Student Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">
                      Name
                    </th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">
                      Email
                    </th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">
                      Department
                    </th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">
                      Regulation
                    </th>
                    <th className="p-3 text-left text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-gray-500 dark:text-gray-400"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr
                        key={st.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3 text-gray-900 dark:text-white">
                          {st.name}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {st.email}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {st.department?.name}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {st.regulation?.name}
                        </td>

                        {/* ACTIONS */}
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
          </div>
        </main>
      </div>

      {/* ===================================================== */}
      {/* CREATE STUDENT MODAL */}
      {/* ===================================================== */}
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
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
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
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 border rounded mr-2"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={loadingCreate}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                {loadingCreate ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* HISTORY MODAL - (KEPT BUT NOT USED IN TABLE) */}
      {/* ===================================================== */}
      {showHistoryModal && historyViewData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {historyViewData.student.name} – Academic History
            </h2>

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
                      <td className="p-2">
                        {(h.gpa || 0).toFixed
                          ? h.gpa.toFixed(2)
                          : Number(h.gpa || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="p-3 text-center">
                      No history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* ===================================================== */}
      {/* SEMESTER MODAL — FIXED SELECT CSS + SUBJECT TABLE */}
      {/* ===================================================== */}
      {showSemesterModal && semesterModalStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-12 p-6 z-50 overflow-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl shadow-lg">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {semesterModalStudent.name} — Semesters & Subjects
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Select a semester to see subject grades and download PDF.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSemesterModal(false);
                  setSemesterModalStudent(null);
                  setSemesterHistory([]);
                  setSelectedSemester("");
                  setSemesterSubjects([]);
                }}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>

            {/* Select Semester + Actions */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* FIXED SELECT DROPDOWN STYLING */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  Available Semesters
                </label>

                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    const sem = e.target.value;
                    setSelectedSemester(sem);
                    loadSemesterSubjects(semesterModalStudent.id, sem);
                  }}
                  className="
                    w-full p-2 rounded 
                    bg-gray-100 dark:bg-gray-700 
                    text-gray-900 dark:text-white
                    border border-gray-300 dark:border-gray-600
                    focus:ring-2 focus:ring-purple-500 focus:outline-none
                    transition-all
                  "
                >
                  <option value="">Select Semester</option>

                  {loadingSemesterHistory ? (
                    <option>Loading...</option>
                  ) : semesterHistory.length > 0 ? (
                    semesterHistory.map((h) => (
                      <option key={h.semester} value={h.semester}>
                        Semester {h.semester} — GPA:{" "}
                        {h.gpa != null
                          ? Number(h.gpa).toFixed(2)
                          : "-"}
                      </option>
                    ))
                  ) : (
                    <option>No history found</option>
                  )}
                </select>
              </div>

              {/* ACTION BUTTONS */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  Actions
                </label>

                <div className="flex gap-2 mt-1">
                  {/* Download PDF */}
                  <button
                    onClick={() => {
                      if (!selectedSemester)
                        return toast.error("Select a semester");
                      handleDownloadStudentPdf(
                        semesterModalStudent.id,
                        selectedSemester
                      );
                    }}
                    disabled={downloadingPdf}
                    className="
                      px-3 py-2 
                      bg-blue-600 text-white 
                      rounded hover:bg-blue-700 
                      disabled:opacity-50
                    "
                  >
                    {downloadingPdf ? "Downloading..." : "Download PDF"}
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={() => {
                      if (!selectedSemester)
                        return toast.error("Select a semester");
                      loadSemesterSubjects(
                        semesterModalStudent.id,
                        selectedSemester
                      );
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                <em>
                  Note: If a semester has GPA saved but no subjects,  
                  "No subject data found" will be shown.
                </em>
              </div>
            </div>

            {/* SUBJECT TABLE */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Subject Details
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border dark:border-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
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
                      semesterSubjects.map((s, i) => (
                        <tr
                          key={i}
                          className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="p-2  dark:text-white">{s.courseCode}</td>
                          <td className="p-2 dark:text-white">{s.courseTitle}</td>
                          <td className="p-2 dark:text-white">{s.credits}</td>
                          <td className="p-2 dark:text-white">{s.grade}</td>
                          <td className="p-2 dark:text-white">{s.gradePoint}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-4 text-center text-gray-500"
                        >
                          No subject data found for selected semester
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
