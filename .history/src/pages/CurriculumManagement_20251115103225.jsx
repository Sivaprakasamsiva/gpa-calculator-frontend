// src/pages/CurriculumManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
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

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Create subject modal
  const [showAdd, setShowAdd] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    credits: 3,
    type: "THEORY",
    isElective: false,
    regulationId: "",
    departmentId: "",
    semester: 1,
  });

  // Edit subject modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    loadFilters();

    // Trigger refresh if departments are changed from other page
    const listen = () => loadFilters();
    window.addEventListener("departmentsChanged", listen);
    return () => window.removeEventListener("departmentsChanged", listen);
  }, []);

  useEffect(() => {
    if (regId && deptId && semester) {
      loadSubjects();
    } else setSubjects([]);
  }, [regId, deptId, semester]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const regs = await adminAPI.getRegulations();
      const deps = await adminAPI.getDepartments();
      setRegulations(regs.data || []);
      setDepartments(deps.data || []);
    } catch (err) {
      toast.error("Failed to load filters");
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
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  // --------------- ADD SUBJECT ----------------
  const openAddModal = () => {
    setSubjectForm({
      code: "",
      name: "",
      credits: 3,
      type: "THEORY",
      isElective: false,
      regulationId: regId,
      departmentId: deptId,
      semester: semester || 1,
    });
    setShowAdd(true);
  };

  const submitAddSubject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...subjectForm,
        credits: Number(subjectForm.credits),
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(subjectForm.semester),
      };
      await adminAPI.addSubject(payload);
      toast.success("Subject added");
      setShowAdd(false);
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data || "Failed to add subject");
    }
  };

  // --------------- EDIT SUBJECT ----------------
  const openEditModal = (sb) => {
    setEditForm({
      id: sb.id,
      code: sb.code,
      name: sb.name,
      credits: sb.credits,
      type: sb.type,
      isElective: sb.isElective,
      regulationId: regId,
      departmentId: deptId,
      semester: sb.semester,
    });
    setShowEdit(true);
  };

  const submitEditSubject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        credits: Number(editForm.credits),
        regulationId: Number(regId),
        departmentId: Number(deptId),
        semester: Number(editForm.semester),
      };
      await adminAPI.updateSubject(editForm.id, payload);
      toast.success("Subject updated");
      setShowEdit(false);
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data || "Update failed");
    }
  };

  // --------------- DELETE SUBJECT ----------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await adminAPI.deleteSubject(id);
      toast.success("Subject deleted");
      loadSubjects();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Search Filter
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
              <label className="text-sm font-medium">Regulation</label>
              <select
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
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
              <label className="text-sm font-medium">Department</label>
              <select
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
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
              <label className="text-sm font-medium">Semester</label>
              <select
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
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
            <div className="flex items-center bg-white dark:bg-gray-800 border p-3 rounded-lg w-1/2">
              <Search className="text-gray-500 dark:text-gray-300 mr-3" />
              <input
                type="text"
                placeholder="Search subjects..."
                className="bg-transparent outline-none w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              disabled={!regId || !deptId || !semester}
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center disabled:bg-gray-400"
            >
              <Plus size={16} className="mr-2" /> Add Subject
            </button>
          </div>

          {/* Subjects table */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Credits</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingSubjects ? (
                  <tr>
                    <td colSpan="5" className="text-center p-5">Loading...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((sb) => (
                    <tr
                      key={sb.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3">{sb.code}</td>
                      <td className="p-3">{sb.name}</td>
                      <td className="p-3">{sb.credits}</td>
                      <td className="p-3">{sb.type}</td>

                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openEditModal(sb)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(sb.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center p-6 text-gray-500 dark:text-gray-400"
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

      {/* ------------------- ADD SUBJECT MODAL ------------------- */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl mb-4">Add Subject</h2>

            <form onSubmit={submitAddSubject} className="space-y-4">
              <div>
                <label className="text-sm">Code</label>
                <input
                  value={subjectForm.code}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, code: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm">Name</label>
                <input
                  value={subjectForm.name}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={subjectForm.credits}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, credits: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm">Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, type: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm">Semester</label>
                  <select
                    value={subjectForm.semester}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, semester: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  >
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- EDIT SUBJECT MODAL ------------------- */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl mb-4">Edit Subject</h2>

            <form onSubmit={submitEditSubject} className="space-y-4">
              <div>
                <label className="text-sm">Code</label>
                <input
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, code: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.credits}
                    onChange={(e) =>
                      setEditForm({ ...editForm, credits: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm">Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        semester: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                  >
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;
