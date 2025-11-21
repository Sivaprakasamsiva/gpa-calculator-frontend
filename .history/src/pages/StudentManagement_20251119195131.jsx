// ===============================
// StudentManagement.jsx (FULL WORKING)
// ===============================

import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // Modal for create student
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

  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  // ===========================
  // LOAD STUDENTS
  // ===========================
  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data || []);
    } catch (e) {
      console.error("loadStudents error:", e);
      toast.error("Failed to load students");
    }
  };

  // ===========================
  // LOAD REGS + DEPARTMENTS
  // ===========================
  const loadMeta = async () => {
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);

      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (e) {
      toast.error("Failed to load metadata");
    }
  };

  // ===========================
  // CREATE STUDENT
  // ===========================
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

      loadStudents();
    } catch (err) {
      console.error("create student error:", err);
      toast.error("Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // VIEW STUDENT HISTORY
  // ===========================
  const openViewModal = async (student) => {
    try {
      const res = await adminAPI.getStudentHistory(student.id);

      setViewData({
        student,
        history: res.data || [],
      });

      setShowViewModal(true);
    } catch (err) {
      console.error("view error:", err);
      toast.error("Failed to load student history");
    }
  };

  // ===========================
  // ADMIN DOWNLOAD PDF
  // ===========================
  const handleDownloadPDF = async (studentId) => {
    const sem = prompt("Enter Semester Number:");
    if (!sem) return;

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
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to download PDF");
    }
  };

  // ===========================
  // SEARCH
  // ===========================
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

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
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

            {/* SEARCH */}
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

            {/* TABLE */}
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
                      <td colSpan="5" className="p-6 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => (
                      <tr
                        key={st.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3">{st.name}</td>
                        <td className="p-3">{st.email}</td>
                        <td className="p-3">{st.department?.name}</td>
                        <td className="p-3">{st.regulation?.name}</td>

                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => openViewModal(st)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            View
                          </button>

                          <button
                            onClick={() => handleDownloadPDF(st.id)}
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

      {/* ======================== */}
      {/* CREATE STUDENT MODAL */}
      {/* ======================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg">
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
              onChange={(e) =>
                setForm({ ...form, regulationId: e.target.value })
              }
              className="w-full px-3 py-2 mb-3 border rounded"
            >
              <option value="">Select Regulation</option>
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.year})
                </option>
              ))}
            </select>

            <select
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
              className="w-full px-3 py-2 mb-3 border rounded"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
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
                disabled={loading}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* VIEW STUDENT HISTORY MODAL */}
      {/* ======================== */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {viewData.student.name} – Academic History
            </h2>

            <table className="w-full border">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="p-2">Semester</th>
                  <th className="p-2">GPA</th>
                </tr>
              </thead>

              <tbody>
                {viewData.history.length > 0 ? (
                  viewData.history.map((h) => (
                    <tr key={h.semester}>
                      <td className="p-2">Semester {h.semester}</td>
                      <td className="p-2">{h.gpa.toFixed(2)}</td>
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
              onClick={() => setShowViewModal(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
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
