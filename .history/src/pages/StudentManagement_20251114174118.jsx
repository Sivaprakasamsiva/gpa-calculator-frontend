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

  // Modal / form state
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

  useEffect(() => {
    loadStudents();
    loadMeta();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      // adminAPI.getStudents returns list (array) per earlier fixes
      setStudents(res.data || []);
    } catch (e) {
      console.error("loadStudents error:", e);
      toast.error("Failed to load students");
    }
  };

  const loadMeta = async () => {
    try {
      const [regsRes, deptsRes] = await Promise.all([
        adminAPI.getRegulations(),
        adminAPI.getDepartments(),
      ]);
      setRegulations(regsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (e) {
      console.error("loadMeta error:", e);
      toast.error("Failed to load regulations/departments");
    }
  };

  const handleCreate = async () => {
    // basic validation
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

      // expects adminAPI.createStudent to exist
      const res = await adminAPI.createStudent(payload);

      toast.success("Student created successfully!");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", regulationId: "", departmentId: "" });
      loadStudents();
    } catch (err) {
      console.error("create student error:", err);
      // Try to extract message reliably
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

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
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

            {/* Search Bar */}
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
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-gray-500 dark:text-gray-400">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Student Modal */}
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

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 mr-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
