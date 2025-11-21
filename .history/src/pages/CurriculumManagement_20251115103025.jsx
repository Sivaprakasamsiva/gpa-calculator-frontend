// src/pages/CurriculumManagement.jsx
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
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const [regId, setRegId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [semester, setSemester] = useState("");

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Add Subject modal
  const [showAdd, setShowAdd] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    credits: 3,
    type: "THEORY", // or PRACTICAL
    regulationId: "",
    departmentId: "",
    semester: 1,
  });

  useEffect(() => {
    loadFilters();

    // listen for departments changes (dispatched by DepartmentManagement)
    const handler = () => loadFilters();
    window.addEventListener("departmentsChanged", handler);
    return () => window.removeEventListener("departmentsChanged", handler);
  }, []);

  // whenever all filters are chosen, load subjects
  useEffect(() => {
    if (regId && deptId && semester) {
      loadSubjects();
    } else {
      setSubjects([]); // clear subjects when filters incomplete
    }
  }, [regId, deptId, semester]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const regs = await adminAPI.getRegulations();
      const deps = await adminAPI.getDepartments();
      setRegulations(regs.data || []);
      setDepartments(deps.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load regulations or departments");
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await adminAPI.getSubjects(regId, deptId, semester);
      setSubjects(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Add Subject
  const openAddModal = () => {
    setSubjectForm({
      code: "",
      name: "",
      credits: 3,
      type: "THEORY",
      regulationId: regId,
      departmentId: deptId,
      semester: semester || 1,
    });
    setShowAdd(true);
  };

  const submitAddSubject = async (e) => {
    e.preventDefault();
    // validate
    if (!subjectForm.code || !subjectForm.name) {
      toast.error("Code and Name are required");
      return;
    }
    if (!subjectForm.regulationId || !subjectForm.departmentId || !subjectForm.semester) {
      toast.error("Please select Regulation, Department and Semester first");
      return;
    }

    try {
      // build payload - backend expects SubjectRequest; adjust fields if necessary
      const payload = {
        code: subjectForm.code,
        name: subjectForm.name,
        credits: Number(subjectForm.credits),
        type: subjectForm.type,
        regulationId: Number(subjectForm.regulationId),
        departmentId: Number(subjectForm.departmentId),
        semester: Number(subjectForm.semester),
      };

      await adminAPI.addSubject(payload);
      toast.success("Subject added");
      setShowAdd(false);
      // reload subjects
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Failed to add subject");
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Regulation</label>
              <select
                className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg"
                value={regId}
                onChange={(e) => setRegId(e.target.value)}
                disabled={loadingFilters}
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
                disabled={loadingFilters}
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
                disabled={loadingFilters}
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
            <div className="flex items-center bg-white dark:bg-gray-800 border p-3 rounded-lg w-1/2">
              <Search className="text-gray-500 dark:text-gray-300 mr-3" />
              <input
                type="text"
                placeholder="Search subjects..."
                className="bg-transparent outline-none dark:text-white w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700"
              onClick={openAddModal}
              disabled={!regId || !deptId || !semester}
              title={!regId || !deptId || !semester ? "Choose regulation, department & semester to add subject" : "Add Subject"}
            >
              <Plus className="mr-2" size={16} />
              Add Subject
            </button>
          </div>

          {/* Subjects table */}
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
                {loadingSubjects ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center">Loading...</td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((sb) => (
                    <tr key={sb.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">{sb.code}</td>
                      <td className="p-3">{sb.name}</td>
                      <td className="p-3">{sb.credits}</td>
                      <td className="p-3">{sb.type}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No subjects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <td className="p-3">
    <button
      onClick={() => openEditModal(sb)}
      className="px-2 py-1 bg-yellow-500 text-white rounded mr-2"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(sb.id)}
      className="px-2 py-1 bg-red-600 text-white rounded"
    >
      Delete
    </button>
</td>

          </div>
        </main>
      </div>

      {/* Add Subject Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl mb-4">Add Subject</h2>

            <form onSubmit={submitAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm">Code</label>
                <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm">Name</label>
                <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full p-2 border rounded" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm">Credits</label>
                  <input type="number" min="1" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} className="w-full p-2 border rounded" />
                </div>

                <div>
                  <label className="block text-sm">Type</label>
                  <select value={subjectForm.type} onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })} className="w-full p-2 border rounded">
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm">Semester</label>
                  <select value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })} className="w-full p-2 border rounded">
                    {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;
