import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const DepartmentManagement = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDepartments();
      setDepartments(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ id: null, name: "", code: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setForm({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.name || !form.code) {
        toast.error("Name and code required");
        return;
      }

      if (form.id) {
        await adminAPI.updateDepartment(form.id, {
          name: form.name,
          code: form.code,
          description: form.description,
        });
        toast.success("Department updated");
      } else {
        await adminAPI.createDepartment({
          name: form.name,
          code: form.code,
          description: form.description,
        });
        toast.success("Department created");
      }

      setShowModal(false);
      loadDepartments();

      // 🔥 Real-time update event
      window.dispatchEvent(new CustomEvent("departmentsChanged"));
    } catch (err) {
      console.error("dept error", err);
      toast.error(err.response?.data || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete department? This will not delete subjects automatically.")) return;

    try {
      await adminAPI.deleteDepartment(id);
      toast.success("Department removed");

      loadDepartments();

      // 🔥 Real-time update event
      window.dispatchEvent(new CustomEvent("departmentsChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Department Management
              </h1>
              <button
                onClick={openCreate}
                className="bg-blue-600 text-white flex items-center px-4 py-2 rounded-lg"
              >
                <Plus size={16} className="mr-2" /> Add Department
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-6">
              {loading ? (
                <p>Loading...</p>
              ) : departments.length === 0 ? (
                <p>No departments found</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3">{d.code}</td>
                        <td className="p-3">{d.name}</td>
                        <td className="p-3">{d.description}</td>
                        <td className="p-3">
                          <button
                            onClick={() => openEdit(d)}
                            className="mr-2 px-2 py-1 rounded bg-yellow-400 text-white"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-xl mb-4">
                    {form.id ? "Edit Department" : "Add Department"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm">Name</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm">Code</label>
                      <input
                        name="code"
                        value={form.code}
                        onChange={(e) =>
                          setForm({ ...form, code: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        {form.id ? "Save" : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <
        </main>
      </div>
    </div>
  );
};

export default DepartmentManagement;
