import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { studentAPI } from "../services/api";
import { Search, UserPlus, FileText, Eye } from "lucide-react";
import { toast } from "react-toastify";

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // Add Student modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });

  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // === NEW STATE FOR VIEWING STUDENT HISTORY ===
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [history, setHistory] = useState([]);

  // === NEW STATE FOR VIEWING SUBJECT DETAILS OF ONE SEMESTER ===
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [semesterDetails, setSemesterDetails] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (e) {
      toast.error("Failed to load students");
    }
  };

  const loadMeta = async () => {
    try {
      const [regs, deps] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regs.data || []);
      setDepartments(deps.data || []);
    } catch (e) {
      toast.error("Failed to load metadata");
    }
  };

  // ================================================================
  // CREATE STUDENT HANDLER
  // ================================================================
  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.regulationId || !form.departmentId) {
      toast.error("Please fill all fields");
      return;
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
      setForm({ name: "", email: "", password: "", regulationId: "", departmentId: "" });
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // OPEN HISTORY MODAL FOR SELECTED STUDENT
  // ================================================================
  const openHistory = async (student) => {
    try {
      setSelectedStudent(student);
      const res = await adminAPI.getStudentDetails(student.id);

      // If backend returns history differently, adjust here
      const h = await adminAPI.getStudentDetails(student.id);
      const historyRes = await fetch(`/api/student/history?studentId=${student.id}`);
      let historyResponse;
      try {
        historyResponse = await historyRes.json();
      } catch {
        historyResponse = [];
      }

      setHistory(historyResponse || []);
      setShowHistoryModal(true);
    } catch (err) {
      toast.error("Failed to load history");
    }
  };

  // ================================================================
  // OPEN SEMESTER DETAILS MODAL
  // ================================================================
  const openSemesterDetails = async (semesterNumber) => {
    try {
      const res = await studentAPI.getSemesterReport(semesterNumber, {
        params: { studentId: selectedStudent.id },
      });

      setSemesterDetails(res.data.subjects || []);
      setSelectedSemester(semesterNumber);
      setShowSemesterModal(true);
    } catch (e) {
      toast.error("Failed to load semester details");
    }
  };

  // ================================================================
  // DOWNLOAD PDF USING BACKEND
  // ================================================================
  const downloadPDF = async (studentId, semester) => {
    try {
      const res = await fetch(`/api/student/marksheet/${semester}?studentId=${studentId}`);

      if (!res.ok) throw new Error("Failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `student-${studentId}-sem-${semester}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("PDF download failed");
    }
  };

  // ================================================================
  // FILTER STUDENTS
  // ================================================================
  const filtered = students.filter((st) => {
    const q = search.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      (st.department?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Student Management</h1>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-6">
            <div className="flex items-center">
              <Search className="text-gray-500 dark:text-gray-300 mr-3" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center">No students found</td>
                  </tr>
                ) : (
                  filtered.map((st) => (
                    <tr key={st.id} className="border-b dark:border-gray-700">
                      <td className="p-3">{st.name}</td>
                      <td className="p-3">{st.email}</td>
                      <td className="p-3">{st.department?.name}</td>
                      <td className="p-3">{st.regulation?.name}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openHistory(st)}
                          className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                        >
                          <Eye size={16} /> View
                        </button>

                        <button
                          onClick={() => downloadPDF(st.id, 1)}
                          className="px-3 py-1 bg-purple-600 text-white rounded flex items-center gap-1"
                        >
                          <FileText size={16} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* HISTORY MODAL */}
          {showHistoryModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-[420px]">
                <h2 className="text-xl font-bold mb-4">
                  {selectedStudent.name} – Academic History
                </h2>

                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Semester</th>
                      <th className="text-left py-2">GPA</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-gray-500">
                          No history found
                        </td>
                      </tr>
                    ) : (
                      history.map((h) => (
                        <tr key={h.semester} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <td className="py-2">{h.semester}</td>
                          <td className="py-2">{h.gpa.toFixed(2)}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => openSemesterDetails(h.semester)}
                              className="text-blue-600 underline text-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* SEMESTER DETAILS MODAL */}
          {showSemesterModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-[600px]">
                <h2 className="text-xl font-bold mb-4">
                  Semester {selectedSemester} – Subject Details
                </h2>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Code</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Credits</th>
                      <th className="py-2 text-left">Grade</th>
                      <th className="py-2 text-left">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterDetails.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center">No data</td>
                      </tr>
                    ) : (
                      semesterDetails.map((s, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{s.courseCode}</td>
                          <td className="py-2">{s.courseTitle}</td>
                          <td className="py-2">{s.credits}</td>
                          <td className="py-2">{s.grade}</td>
                          <td className="py-2">{s.gradePoint}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="text-right mt-4">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded"
                    onClick={() => setShowSemesterModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default StudentManagement;
