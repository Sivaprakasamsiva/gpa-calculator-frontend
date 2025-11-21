// src/pages/StudentManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Students
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // Create Student Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });

  const [loadingCreate, setLoadingCreate] = useState(false);

  // Meta
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Semester Modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterModalStudent, setSemesterModalStudent] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSemesterHistory, setLoadingSemesterHistory] = useState(false);
  const [loadingSemesterSubjects, setLoadingSemesterSubjects] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // -------------------------
  // Load Students
  // -------------------------
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  // -------------------------
  // Load Regulations + Departments
  // -------------------------
  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const [regs, depts] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regs.data || []);
      setDepartments(depts.data || []);
    } catch (err) {
      toast.error("Failed to load metadata");
    } finally {
      setLoadingMeta(false);
    }
  };

  // -------------------------
  // Create student
  // -------------------------
  const handleCreate = async () => {
    const { name, email, password, regulationId, departmentId } = form;

    if (!name || !email || !password || !regulationId || !departmentId) {
      toast.error("Please fill all fields");
      return;
    }

    setLoadingCreate(true);

    try {
      await adminAPI.createStudent({
        name,
        email,
        password,
        regulationId: Number(regulationId),
        departmentId: Number(departmentId),
      });
      toast.success("Student created");
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
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to create student"
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  // -------------------------
  // Open Semester Modal
  // -------------------------
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
      toast.error("Failed to fetch history");
    } finally {
      setLoadingSemesterHistory(false);
    }
  };

  // -------------------------
  // Load Subjects for semester
  // -------------------------
  const loadSemesterSubjects = async (studentId, sem) => {
    if (!sem) return;

    setLoadingSemesterSubjects(true);
    setSemesterSubjects([]);

    try {
      const res = await adminAPI.getSemesterReport(studentId, Number(sem));
      const data = res.data || {};
      setSelectedSemester(data.semester ?? sem);
      setSemesterSubjects(data.subjects || []);
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSemesterSubjects(false);
    }
  };

  // -------------------------
  // Download PDF
  // -------------------------
  const handleDownloadStudentPdf = async (studentId, sem) => {
    if (!sem) {
      toast.error("Select a semester first");
      return;
    }

    setDownloadingPdf(true);

    try {
      const res = await adminAPI.downloadStudentMarksheet(studentId, Number(sem));
      const blob = new Blob([res.data], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-${studentId}-sem-${sem}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // -------------------------
  // Search filter
  // -------------------------
  const filteredStudents = students.filter((st) => {
    const q = search.toLowerCase();
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Student Management</h1>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white flex items-center px-4 py-2 rounded-lg"
              >
                <UserPlus size={18} className="mr-2" />
                Add Student
              </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 border">
              <div className="flex items-center">
                <Search className="text-gray-500 mr-3" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Table */}
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
                      <td colSpan="5" className="p-6 text-center">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{st.name}</td>
                        <td className="p-3">{st.email}</td>
                        <td className="p-3">{st.department?.name}</td>
                        <td className="p-3">{st.regulation?.name}</td>

                        <td className="p-3">
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
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>

            <input
              className="w-full px-3 py-2 mb-3 border rounded"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full px-3 py-2 mb-3 border rounded"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="w-full px-3 py-2 mb-3 border rounded"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              value={form.regulationId}
              onChange={(e) => setForm({ ...form, regulationId: e.target.value })}
              className="w-full px-3 py-2 mb-3 border rounded"
            >
              <option value="">Select Regulation</option>
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="w-full px-3 py-2 mb-3 border rounded"
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
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">
                {semesterModalStudent.name} — Semester Details
              </h2>
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

            {/* SELECT SEMESTER */}
            <div className="mt-4">
              <label className="text-sm font-medium">Select Semester</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={selectedSemester}
                onChange={(e) =>
                  loadSemesterSubjects(semesterModalStudent.id, e.target.value)
                }
              >
                <option value="">Choose...</option>

                {loadingSemesterHistory ? (
                  <option>Loading...</option>
                ) : semesterHistory.length > 0 ? (
                  semesterHistory.map((h) => (
                    <option key={h.semester} value={h.semester}>
                      Semester {h.semester} — GPA {h.gpa?.toFixed(2)}
                    </option>
                  ))
                ) : (
                  <option>No history</option>
                )}
              </select>
            </div>

            {/* SUBJECT TABLE */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Subject Details</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
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
                          Loading...
                        </td>
                      </tr>
                    ) : semesterSubjects.length > 0 ? (
                      semesterSubjects.map((s, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{s.courseCode}</td>
                          <td className="p-2">{s.courseTitle}</td>
                          <td className="p-2">{s.credits}</td>
                          <td className="p-2">{s.grade}</td>
                          <td className="p-2">{s.gradePoint}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center">
                          No subjects found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DOWNLOAD PDF */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() =>
                  handleDownloadStudentPdf(
                    semesterModalStudent.id,
                    selectedSemester
                  )
                }
                disabled={downloadingPdf}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {downloadingPdf ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
