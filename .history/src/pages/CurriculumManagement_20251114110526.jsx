import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { BookOpen, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";

const CurriculumManagement = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await adminAPI.getSubjects();
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

          {/* Search + Add */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-lg">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
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
