// src/pages/CurriculumManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "react-toastify";

/**
 * CurriculumManagement page
 * - Regulation / Department / Semester CRUD (semester includes elective_count & mandatory_count)
 * - Subjects split into Mandatory (CORE|LAB) and Elective
 * - Linked dropdowns: Regulation -> Departments -> Semesters
 * - Subject operations (create/edit/delete) work with semester number (backend expects semester number)
 */

const CurriculumManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // filters & lists
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // selected (ids)
  const [regId, setRegId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  // subjects
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  // loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // modals and forms
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ id: null, name: "", year: new Date().getFullYear(), description: "" });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ id: null, name: "", code: "", description: "" });

  const [showSemModal, setShowSemModal] = useState(false);
  const [semForm, setSemForm] = useState({
    id: null,
    number: 1,
    description: "",
    regulationId: "",
    departmentId: "",
    mandatory_count: 0,
    elective_count: 0,
  });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    id: null,
    code: "",
    name: "",
    credits: 3,
    type: "CORE",
    isElective: false,
    regulationId: "",
    departmentId: "",
    semester: 1,
  });

  // initial load
  useEffect(() => {
    loadFilters();
    const handler = () => loadFilters();
    window.addEventListener("dataChanged", handler);
    return () => window.removeEventListener("dataChanged", handler);
  }, []);

  // when reg or dept changes, fetch semesters and clear semester selection
  useEffect(() => {
    setSemesterId("");
    if (regId && deptId) {
      loadSemesters(regId, deptId);
    } else {
      setSemesters([]);
      setSubjects([]);
    }
  }, [regId, deptId]);

  // when semester selection changes (id), load subjects for the chosen semester number
  useEffect(() => {
    if (regId && deptId && semesterId) {
      loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [semesterId, regId, deptId]);

  // ---------- Loaders ----------
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

  const loadSemesters = async (rId, dId) => {
    try {
      const res = await adminAPI.getSemesters(rId, dId);
      // expected res.data = [{ id, number, description, regulationId, departmentId, mandatory_count, elective_count }, ...]
      setSemesters(res.data || []);
    } catch (err) {
      console.error(err);
      setSemesters([]);
      toast.error("Failed to load semesters");
    }
  };

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      // convert semesterId (id) -> semesterNumber
      const semObj = semesters.find(s => s.id === Number(semesterId));
      const semNumber = semObj ? semObj.number : null;
      const res = await adminAPI.getSubjects(regId, deptId, semNumber);
      setSubjects(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ---------- Regulations CRUD ----------
  const openAddReg = () => setRegForm({ id: null, name: "", year: new Date().getFullYear(), description: "" }) || setShowRegModal(true);
  const openEditReg = (r) => { setRegForm({ id: r.id, name: r.name, year: r.year, description: r.description || "" }); setShowRegModal(true); };

  const submitReg = async (e) => {
    e.preventDefault();
    try {
      if (!regForm.name) return toast.error("Name required");
      if (regForm.id) {
        await adminAPI.updateRegulation(regForm.id, regForm);
        toast.success("Regulation updated");
      } else {
        await adminAPI.createRegulation(regForm);
        toast.success("Regulation created");
      }
      setShowRegModal(false);
      await loadFilters();
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Failed to save regulation");
    }
  };

  const deleteReg = async (id) => {
    if (!window.confirm("Delete regulation? This will affect related semesters/subjects.")) return;
    try {
      await adminAPI.deleteRegulation(id);
      toast.success("Regulation removed");
      await loadFilters();
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // ---------- Departments CRUD ----------
  const openAddDept = () => { setDeptForm({ id: null, name: "", code: "", description: "" }); setShowDeptModal(true); };
  const openEditDept = (d) => { setDeptForm({ id: d.id, name: d.name, code: d.code, description: d.description || "" }); setShowDeptModal(true); };

  const submitDept = async (e) => {
    e.preventDefault();
    try {
      if (!deptForm.name || !deptForm.code) return toast.error("Name & Code required");
      if (deptForm.id) {
        await adminAPI.updateDepartment(deptForm.id, deptForm);
        toast.success("Department updated");
      } else {
        await adminAPI.createDepartment(deptForm);
        toast.success("Department created");
      }
      setShowDeptModal(false);
      await loadFilters();
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Failed to save department");
    }
  };

  const deleteDept = async (id) => {
    if (!window.confirm("Delete department? This will affect related semesters/subjects.")) return;
    try {
      await adminAPI.deleteDepartment(id);
      toast.success("Department removed");
      await loadFilters();
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // ---------- Semesters CRUD ----------
  const openAddSem = () => {
    setSemForm({
      id: null,
      number: 1,
      description: "",
      regulationId: regId || "",
      departmentId: deptId || "",
      mandatory_count: 0,
      elective_count: 0
    });
    setShowSemModal(true);
  };
  const openEditSem = (s) => {
    setSemForm({
      id: s.id,
      number: s.number,
      description: s.description || "",
      regulationId: s.regulationId,
      departmentId: s.departmentId,
      mandatory_count: s.mandatory_count || 0,
      elective_count: s.elective_count || 0
    });
    setShowSemModal(true);
  };

  const submitSem = async (e) => {
    e.preventDefault();
    try {
      if (!semForm.regulationId || !semForm.departmentId) return toast.error("Choose Regulation & Department");
      const payload = {
        number: Number(semForm.number),
        description: semForm.description,
        regulationId: Number(semForm.regulationId),
        departmentId: Number(semForm.departmentId),
        mandatory_count: Number(semForm.mandatory_count || 0),
        elective_count: Number(semForm.elective_count || 0)
      };
      if (semForm.id) {
        await adminAPI.updateSemester(semForm.id, payload);
        toast.success("Semester updated");
      } else {
        await adminAPI.createSemester(payload);
        toast.success("Semester created");
      }
      setShowSemModal(false);
      await loadSemesters(payload.regulationId, payload.departmentId);
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Failed to save semester");
    }
  };

  const deleteSem = async (id) => {
    if (!window.confirm("Delete semester? This will remove subjects for that semester.")) return;
    try {
      await adminAPI.deleteSemester(id);
      toast.success("Semester removed");
      if (regId && deptId) await loadSemesters(regId, deptId);
      setSubjects([]);
      window.dispatchEvent(new Event("dataChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // ---------- Subjects CRUD ----------
  const openAddSubject = () => {
    if (!regId || !deptId || !semesterId) {
      toast.error("Choose regulation, department & semester first");
      return;
    }
    const sem = semesters.find(s => s.id === Number(semesterId));
    setSubjectForm({
      id: null,
      code: "",
      name: "",
      credits: 3,
      type: "CORE",
      isElective: false,
      regulationId: regId,
      departmentId: deptId,
      semester: sem ? sem.number : 1
    });
    setShowSubjectModal(true);
  };

  const openEditSubject = (s) => {
    setSubjectForm({
      id: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type,
      isElective: !!s.isElective,
      regulationId: regId,
      departmentId: deptId,
      semester: s.semester
    });
    setShowSubjectModal(true);
  };

  const submitSubject = async (e) => {
    e.preventDefault();
    try {
      if (!subjectForm.code || !subjectForm.name) return toast.error("Code & Name required");
      const payload = {
        code: subjectForm.code,
        name: subjectForm.name,
        credits: Number(subjectForm.credits),
        type: subjectForm.type,
        isElective: !!subjectForm.isElective,
        regulationId: Number(subjectForm.regulationId),
        departmentId: Number(subjectForm.departmentId),
        semester: Number(subjectForm.semester)
      };
      if (subjectForm.id) {
        await adminAPI.updateSubject(subjectForm.id, payload);
        toast.success("Subject updated");
      } else {
        await adminAPI.addSubject(payload);
        toast.success("Subject created");
      }
      setShowSubjectModal(false);
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Failed to save subject");
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete subject?")) return;
    try {
      await adminAPI.deleteSubject(id);
      toast.success("Subject removed");
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // split subjects for UI
  const mandatorySubjects = subjects.filter(s => !s.isElective);
  const electiveSubjects = subjects.filter(s => !!s.isElective);

  // search filter
  const filteredMandatory = mandatorySubjects.filter(sb =>
    sb.name?.toLowerCase().includes(search.toLowerCase()) ||
    sb.code?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredElective = electiveSubjects.filter(sb =>
    sb.name?.toLowerCase().includes(search.toLowerCase()) ||
    sb.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Curriculum Management</h1>

          {/* Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Regulation */}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Regulation</label>
              <div className="flex">
                <select className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg" value={regId} onChange={e => setRegId(e.target.value)}>
                  <option value="">All Regulations</option>
                  {regulations.map(r => <option key={r.id} value={r.id}>{r.name} - {r.year}</option>)}
                </select>
                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddReg} className="px-2 py-2 bg-green-500 text-white rounded">+</button>
                  {regId && <button onClick={() => openEditReg(regulations.find(x => x.id === Number(regId)))} className="px-2 py-2 bg-yellow-500 text-white rounded">Edit</button>}
                  {regId && <button onClick={() => deleteReg(Number(regId))} className="px-2 py-2 bg-red-600 text-white rounded">Del</button>}
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Department</label>
              <div className="flex">
                <select className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg" value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
                </select>
                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddDept} className="px-2 py-2 bg-green-500 text-white rounded">+</button>
                  {deptId && <button onClick={() => openEditDept(departments.find(x => x.id === Number(deptId)))} className="px-2 py-2 bg-yellow-500 text-white rounded">Edit</button>}
                  {deptId && <button onClick={() => deleteDept(Number(deptId))} className="px-2 py-2 bg-red-600 text-white rounded">Del</button>}
                </div>
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Semester</label>
              <div className="flex">
                <select className="w-full p-3 bg-white dark:bg-gray-800 border rounded-lg" value={semesterId} onChange={e => setSemesterId(e.target.value)}>
                  <option value="">All Semesters</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.number} ({s.mandatory_count || 0} M, {s.elective_count || 0} E)</option>)}
                </select>
                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddSem} className="px-2 py-2 bg-green-500 text-white rounded">+</button>
                  {semesterId && <button onClick={() => openEditSem(semesters.find(x => x.id === Number(semesterId)))} className="px-2 py-2 bg-yellow-500 text-white rounded">Edit</button>}
                  {semesterId && <button onClick={() => deleteSem(Number(semesterId))} className="px-2 py-2 bg-red-600 text-white rounded">Del</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Search + view subjects */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white dark:bg-gray-800 border p-3 rounded-lg w-1/2">
              <Search className="text-gray-500 dark:text-gray-300 mr-3" />
              <input type="text" placeholder="Search subjects..." className="bg-transparent outline-none dark:text-white w-full" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div>
              <button
                onClick={() => {
                  // act like "View Subjects" -> ensures load
                  if (!regId || !deptId || !semesterId) return toast.error("Choose regulation, department & semester");
                  loadSubjects();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700"
              >
                <Plus className="mr-2" size={16} /> View Subjects
              </button>
              <button
                onClick={openAddSubject}
                className="ml-3 px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center hover:bg-indigo-700"
                disabled={!regId || !deptId || !semesterId}
                title={!regId || !deptId || !semesterId ? "Choose regulation, department & semester to add subject" : "Add Subject"}
              >
                Add Subject
              </button>
            </div>
          </div>

          {/* Subjects area - two separate tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mandatory (CORE/LAB) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Mandatory Subjects</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">{filteredMandatory.length} items</div>
              </div>
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
                    <tr><td colSpan="5" className="p-6 text-center">Loading...</td></tr>
                  ) : filteredMandatory.length > 0 ? (
                    filteredMandatory.map(sb => (
                      <tr key={sb.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3">{sb.code}</td>
                        <td className="p-3">{sb.name}</td>
                        <td className="p-3">{sb.credits}</td>
                        <td className="p-3">{sb.type}</td>
                        <td className="p-3">
                          <button onClick={() => openEditSubject(sb)} className="mr-2 px-2 py-1 rounded bg-yellow-400 text-white"><Edit2 size={14} /></button>
                          <button onClick={() => deleteSubject(sb.id)} className="px-2 py-1 rounded bg-red-600 text-white"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">No mandatory subjects found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Electives */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Elective Subjects</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">{filteredElective.length} items</div>
              </div>
              <table className="w-full">
                <thead className="bg-blue-50 dark:bg-blue-900/30">
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
                    <tr><td colSpan="5" className="p-6 text-center">Loading...</td></tr>
                  ) : filteredElective.length > 0 ? (
                    filteredElective.map(sb => (
                      <tr key={sb.id} className="border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-800/20">
                        <td className="p-3">{sb.code}</td>
                        <td className="p-3">{sb.name}</td>
                        <td className="p-3">{sb.credits}</td>
                        <td className="p-3">{sb.type}</td>
                        <td className="p-3">
                          <button onClick={() => openEditSubject(sb)} className="mr-2 px-2 py-1 rounded bg-yellow-400 text-white"><Edit2 size={14} /></button>
                          <button onClick={() => deleteSubject(sb.id)} className="px-2 py-1 rounded bg-red-600 text-white"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">No elective subjects found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showRegModal && (
        <Modal onClose={() => setShowRegModal(false)}>
          <h2 className="text-xl mb-3">{regForm.id ? "Edit Regulation" : "Add Regulation"}</h2>
          <form onSubmit={submitReg} className="space-y-3">
            <input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />
            <input type="number" value={regForm.year} onChange={(e) => setRegForm({ ...regForm, year: Number(e.target.value) })} placeholder="Year" className="w-full p-2 border rounded" />
            <textarea value={regForm.description} onChange={(e) => setRegForm({ ...regForm, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowRegModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {showDeptModal && (
        <Modal onClose={() => setShowDeptModal(false)}>
          <h2 className="text-xl mb-3">{deptForm.id ? "Edit Department" : "Add Department"}</h2>
          <form onSubmit={submitDept} className="space-y-3">
            <input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="Code" className="w-full p-2 border rounded" />
            <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />
            <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowDeptModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {showSemModal && (
        <Modal onClose={() => setShowSemModal(false)}>
          <h2 className="text-xl mb-3">{semForm.id ? "Edit Semester" : "Add Semester"}</h2>
          <form onSubmit={submitSem} className="space-y-3">
            <select value={semForm.regulationId} onChange={(e) => setSemForm({ ...semForm, regulationId: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Regulation</option>
              {regulations.map(r => <option key={r.id} value={r.id}>{r.name} - {r.year}</option>)}
            </select>
            <select value={semForm.departmentId} onChange={(e) => setSemForm({ ...semForm, departmentId: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
            </select>
            <input type="number" min="1" value={semForm.number} onChange={(e) => setSemForm({ ...semForm, number: Number(e.target.value) })} placeholder="Semester number (1..n)" className="w-full p-2 border rounded" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" value={semForm.mandatory_count} onChange={(e) => setSemForm({ ...semForm, mandatory_count: Number(e.target.value) })} placeholder="Mandatory count" className="p-2 border rounded" />
              <input type="number" min="0" value={semForm.elective_count} onChange={(e) => setSemForm({ ...semForm, elective_count: Number(e.target.value) })} placeholder="Elective count" className="p-2 border rounded" />
            </div>
            <textarea value={semForm.description} onChange={(e) => setSemForm({ ...semForm, description: e.target.value })} placeholder="Description (optional)" className="w-full p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowSemModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {showSubjectModal && (
        <Modal onClose={() => setShowSubjectModal(false)}>
          <h2 className="text-xl mb-3">{subjectForm.id ? "Edit Subject" : "Add Subject"}</h2>
          <form onSubmit={submitSubject} className="space-y-3">
            <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="Code" className="w-full p-2 border rounded" />
            <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="1" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="p-2 border rounded" />
              <select value={subjectForm.type} onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })} className="p-2 border rounded">
                <option value="CORE">CORE</option>
                <option value="LAB">LAB</option>
                <option value="ELECTIVE">ELECTIVE</option>
              </select>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={subjectForm.isElective} onChange={(e) => setSubjectForm({ ...subjectForm, isElective: e.target.checked })} />
                <span>Is Elective</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowSubjectModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Modal wrapper
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
      <button onClick={onClose} className="absolute top-3 right-3 px-2 py-1 text-sm">✕</button>
      {children}
    </div>
  </div>
);

export default CurriculumManagement;
