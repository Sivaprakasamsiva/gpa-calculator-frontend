import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Search, UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";

const StudentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data);
    } catch (e) {
      toast.error("Failed to load students");
    }
  };

  const filtered = students.filter(
    (st) =>
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase()) ||
      st.department?.name.toLowerCase().includes(search.toLowerCase())
  );

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
              <button className="bg-blue-600 text-white flex items-center px-4 py-2 rounded-lg hover:bg-blue-700">
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
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-6 text-center text-gray-500 dark:text-gray-400"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentManagement;
