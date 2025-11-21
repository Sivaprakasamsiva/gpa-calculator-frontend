// src/pages/StudentManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI, studentAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyViewData, setHistoryViewData] = useState(null);

  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterModalStudent, setSemesterModalStudent] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSemesterSubjects, setLoadingSemesterSubjects] = useState(false);
  const [loadingSemesterHistory, setLoadingSemesterHistory] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch {
      toast.error("Failed to load metadata");
    } finally {
      setLoadingMeta(false);
    }
  };

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
      loadStudents();
    } catch (err) {
      toast.error("Failed to create student");
    } finally {
      setLoadingCreate(false);
    }
  };

  const openHistoryModal = async (student) => {
    try {
      const res = await adminAPI.getStudentHistory(student.id);
      setHistoryViewData({ student, history: res.data || [] });
      setShowHistoryModal(true);
    } catch {
      toast.error("Failed to load student history");
    }
  };

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
    } catch {
      toast.error("Failed to fetch student history");
    } finally {
      setLoadingSemesterHistory(false);
    }
  };

  const loadSemesterSubjects = async (studentId, sem) => {
    if (!studentId || !sem) return;
    setLoadingSemesterSubjects(true);
    setSemesterSubjects([]);

    try {
      const res = await adminAPI.getSemesterReport(studentId, Number(sem));
      const data = res.data || {};
      setSemesterSubjects(data.subjects || []);
      setSelectedSemester(data.semester ?? sem);
    } catch (err) {
      toast.error("Failed to fetch semester subjects");
    } finally {
      setLoadingSemesterSubjects(false);
    }
  };

  const handleDownloadStudentPdf = async (studentId, sem) => {
    if (!studentId || !sem) {
      toast.error("Select a semester first");
      return;
    }

    setDownloadingPdf(true);
    try {
      const res = await adminAPI.downloadStudentMarksheet(studentId, Number(sem));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-${studentId}-sem-${sem}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredStudents = students.filter((st) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      st.name?.toLowerCase().includes(q) ||
      st.email?.toLowerCase().includes(q) ||
      st.department?.name?.toLowerCase().includes(q) ||
      st.regulation?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* header */}
            <div className="flex justify-between mb-6">
              <h1 className="text-3xl font-bold dark:text-white">
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

            {/* search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
              <div className="flex items-center">
                <Search className="text-gray-500 dark:text-gray-300 mr-3" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none dark:text-white"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Department</th>
                    <th className="p-3 text-left">Regulation</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-6">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="border-b dark:border-gray-700">
                        <td className="p-3">{st.name}</td>
                        <td className="p-3">{st.email}</td>
                        <td className="p-3">{st.department?.name}</td>
                        <td className="p-3">{st.regulation?.name}</td>

                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => openSemesterModal(st)}
                            className="px-3 py-1 bg-purple-600 text-white rounded"
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

      {/* CREATE STUDENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>

            <input
              className="w-full px-3 py-2 mb-3 border rounded bg-white dark:bg-gray-700"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full px-3 py-2 mb-3 border rounded bg-white dark:bg-gray-700"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="w-full px-3 py-2 mb-3 border rounded bg-white dark:bg-gray-700"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="w-full px-3 py-2 mb-3 border rounded bg-white dark:bg-gray-700"
              value={form.regulationId}
              onChange={(e) => setForm({ ...form, regulationId: e.target.value })}
            >
              <option value="">Select Regulation</option>
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              className="w-full px-3 py-2 mb-3 border rounded bg-white dark:bg-gray-700"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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

      {/* SEMESTER MODAL */}
      {showSemesterModal && semesterModalStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-12 p-6 z-50 overflow-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl shadow-lg">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {semesterModalStudent.name} — Semesters & Subjects
                </h2>
                <div className="text-sm text-gray-500">
                  Select a semester to see subject grades.
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSemesterModal(false);
                  setSemesterModalStudent(null);
                  setSemesterHistory([]);
                  setSemesterSubjects([]);
                  setSelectedSemester("");
                }}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Close
              </button>
            </div>

            {/* Semester selector */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs">Available Semesters</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedSemester}
                  onChange={(e) => {
                    const sem = e.target.value;
                    setSelectedSemester(sem);
                    loadSemesterSubjects(semesterModalStudent.id, sem);
                  }}
                >
                  <option value="">Select Semester</option>

                  {semesterHistory.map((s) => (
                    <option key={s.semester} value={s.semester}>
                      Semester {s.semester} — GPA {Number(s.gpa).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs">Actions</label>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                    disabled={downloadingPdf}
                    onClick={() =>
                      handleDownloadStudentPdf(
                        semesterModalStudent.id,
                        selectedSemester
                      )
                    }
                  >
                    {downloadingPdf ? "Downloading..." : "Download PDF"}
                  </button>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Subject Details</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Subject</th>
                      <th className="p-2">Credits</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Points</th>
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
                      semesterSubjects.map((sub, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{sub.courseCode}</td>
                          <td className="p-2">{sub.courseTitle}</td>
                          <td className="p-2">{sub.credits}</td>
                          <td className="p-2">{sub.grade}</td>
                          <td className="p-2">{sub.gradePoint}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center">
                          No subject data found
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
