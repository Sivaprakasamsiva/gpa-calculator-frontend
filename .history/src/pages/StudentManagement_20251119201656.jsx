// ===============================
// StudentManagement.jsx (UPDATED WITH SEMESTER DETAIL VIEW)
// ===============================

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

  // Create student modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    regulationId: "",
    departmentId: "",
  });

  // VIEW modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);

  // NEW: Semester Details modal
  const [showSemModal, setShowSemModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterSubjects, setSemesterSubjects] = useState([]);

  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // LOAD STUDENTS
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  // LOAD meta
  const loadMeta = async () => {
  try {
    const [regsRes, deptsRes] = await Promise.all([
      adminAPI.getRegulations(),
      adminAPI.getDepartments(),
    ]);

    setRegulations(regsRes.data || []);
    setDepartments(deptsRes.data || []);
  } catch (e) {
    console.warn("First metadata load failed, retrying...");
    // Retry once
    setTimeout(async () => {
      try {
        const [regsRes2, deptsRes2] = await Promise.all([
          adminAPI.getRegulations(),
          adminAPI.getDepartments(),
        ]);

        setRegulations(regsRes2.data || []);
        setDepartments(deptsRes2.data || []);
      } catch (err) {
        console.error("Metadata final fail:", err);
        toast.error("Failed to load metadata");
      }
    }, 500);
  }
};

  // VIEW History
  const openViewModal = async (student) => {
    try {
      const res = await adminAPI.getStudentHistory(student.id);

      setViewData({
        student,
        history: res.data || [],
      });

      setShowViewModal(true);
    } catch (err) {
      toast.error("Failed to load history");
    }
  };

  // ============================
  // NEW: OPEN SEMESTER DETAILS
  // ============================
  const openSemesterDetails = async (semester, studentId) => {
  try {
    const res = await adminAPI.getSemesterReport(studentId, semester);

    setSemesterSubjects(res.data.subjects || []);
    setSelectedSemester(semester);
    setShowSemModal(true);
  } catch (err) {
    console.error("semester fetch error:", err);
    toast.error(err.response?.data || "Failed to load semester data");
  }
};

  // DOWNLOAD PDF
  const handleDownloadPDF = async (studentId) => {
    const sem = prompt("Enter Semester Number:");
    if (!sem) return;

    try {
      const res = await adminAPI.downloadStudentMarksheet(studentId, Number(sem));

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `student-${studentId}-sem-${sem}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  // SEARCH FILTER
  const filtered = students.filter((st) => {
    const q = search.trim().toLowerCase();
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
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Student Management</h1>

              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <UserPlus size={18} /> Add Student
              </button>
            </div>

            {/* SEARCH */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded border mb-6">
              <div className="flex items-center">
                <Search className="mr-2" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Department</th>
                    <th className="p-3 text-left">Regulation</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((st) => (
                    <tr key={st.id} className="border-b dark:border-gray-700">
                      <td className="p-3">{st.name}</td>
                      <td className="p-3">{st.email}</td>
                      <td className="p-3">{st.department?.name}</td>
                      <td className="p-3">{st.regulation?.name}</td>

                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openViewModal(st)}
                          className="px-3 py-1 bg-green-600 text-white rounded"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(st.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center p-4">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* VIEW STUDENT HISTORY MODAL */}
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
                      <td className="p-2">{h.gpa.toFixed(2)}</td>
                      <td className="p-2 text-blue-600 underline cursor-pointer"
                        onClick={() => openSemesterDetails(h.semester, viewData.student.id)}>
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

            <button
              onClick={() => setShowViewModal(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================== */}
      {/* NEW — SEMESTER DETAILS MODAL */}
      {/* ========================== */}
      {showSemModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">
              Semester {selectedSemester} – Subject Details
            </h2>

            <table className="w-full border text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Credits</th>
                  <th className="p-2">Grade</th>
                  <th className="p-2">Points</th>
                </tr>
              </thead>

              <tbody>
                {semesterSubjects.map((s, idx) => (
                  <tr key={idx}>
                    <td className="p-2">{s.courseCode}</td>
                    <td className="p-2">{s.courseTitle}</td>
                    <td className="p-2">{s.credits}</td>
                    <td className="p-2">{s.grade}</td>
                    <td className="p-2">{s.gradePoint}</td>
                  </tr>
                ))}

                {semesterSubjects.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-4">
                      No subject data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              onClick={() => setShowSemModal(false)}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
