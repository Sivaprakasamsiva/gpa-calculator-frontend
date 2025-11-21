import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { BookOpen, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";

const CurriculumManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Filters
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);

  const [regId, setRegId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [semester, setSemester] = useState("");

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (regId && deptId && semester) {
      loadSubjects();
    }
  }, [regId, deptId, semester]);

  // Load Regulation + Department lists
  const loadFilters = async () => {
    try {
      const regs = await adminAPI.getRegulations();
      const deps = await adminAPI.getDepartments();

      setRegulations(regs.data);
      setDepartments(deps.data);
    } catch (err) {
      toast.error("Failed to load filters");
    }
  };

  // Fetch subjects after filter selection
  const loadSubjects = async () => {
    try {
      const res = await adminAPI.getSubjects(regId, deptId, semester);
      setSubjects(res.data);
    } catch (e) {
      toast.error("Failed to load subjects");
    }
  };

  const filtered = subjects.filter(
    (sb) =>
      sb.name.toLowerCase().includes(search.toLowerCase()) ||
      sb.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Curriculum Management
          </h1>

          {/* Filter section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Regulation</label>
              <select
                className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg"
                value={regId}
                onChange={(e) => setRegId(e.target.value)}
              >
                <option value="">Select Regulation</option>
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Department</label>
              <select
                className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg"
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Semester</label>
              <select
                className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search + Add */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white dark:bg-gray-800 border p-3 rounded-lg">
              <Search className="text-gray-500 dark:text-gray-300 mr-3" />
              <input
                type="text"
                placeholder="Search subjects..."
                className="bg-transparent outline-none dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700">
              <Plus className="mr-2" size={18} />
              Add Subject
            </button>
          </div>

          {/* Subject Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Credits</th>
                  <th className="p-3 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sb) => (
                  <tr
                    key={sb.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3">{sb.code}</td>
                    <td className="p-3">{sb.name}</td>
                    <td className="p-3">{sb.credits}</td>
                    <td className="p-3">{sb.type}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No subjects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CurriculumManagement;
