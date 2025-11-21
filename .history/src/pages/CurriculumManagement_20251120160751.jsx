// ===============================
// CurriculumManagement.jsx (FIXED)
// ===============================

import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "react-toastify";

const CurriculumManagement = () => {
  const [darkMode, setDarkMode] = useState(false);

  // filters
  const [regulations, setRegulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [regId, setRegId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // MODALS ------------------------
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    id: null,
    name: "",
    year: new Date().getFullYear(),
    description: ""
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    id: null,
    name: "",
    code: "",
    description: "",
    semesterCount: 8,
    regulationId: ""
  });

  const [showSemModal, setShowSemModal] = useState(false);
  const [semForm, setSemForm] = useState({
    id: null,
    regulationId: "",
    departmentId: "",
    number: 1,
    mandatoryCount: 0,
    electiveCount: 0,
    description: ""
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
    semester: 1
  });

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    setSemesterId("");
    if (regId && deptId) {
      loadSemesters(regId, deptId);
    } else {
      setSemesters([]);
      setSubjects([]);
    }
  }, [regId, deptId]);

  useEffect(() => {
    if (regId && deptId && semesterId) {
      loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [semesterId]);

  // ===============================
  // LOAD FILTERS
  // ===============================
  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const regs = await adminAPI.getRegulations();
      const deps = await adminAPI.getDepartments();
      setRegulations(regs.data || []);
      setDepartments(deps.data || []);
    } catch (err) {
      toast.error("Failed to load regulations/departments");
    } finally {
      setLoadingFilters(false);
    }
  };

  // ===============================
  // LOAD SEMESTERS
  // ===============================
  const loadSemesters = async (rId, dId) => {
    try {
      const res = await adminAPI.getSemesters(rId, dId);
      setSemesters(res.data || []);
    } catch (err) {
      toast.error("Failed to load semesters");
    }
  };

  // ===============================
  // LOAD SUBJECTS
  // ===============================
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const semObj = semesters.find(s => s.id == semesterId); // FIXED
      const semNumber = semObj ? semObj.number : null;

      const res = await adminAPI.getSubjects(regId, deptId, semNumber);
      setSubjects(res.data || []);
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ===============================
  // REGULATION CRUD
  // ===============================
  const openAddReg = () => {
    setRegForm({ id: null, name: "", year: new Date().getFullYear(), description: "" });
    setShowRegModal(true);
  };

  const openEditReg = (r) => {
    setRegForm({ id: r.id, name: r.name, year: r.year, description: r.description });
    setShowRegModal(true);
  };

  const submitReg = async (e) => {
    e.preventDefault();
    try {
      if (regForm.id) {
        await adminAPI.updateRegulation(regForm.id, regForm);
        toast.success("Regulation updated");
      } else {
        await adminAPI.createRegulation(regForm);
        toast.success("Regulation created");
      }
      setShowRegModal(false);
      await loadFilters();
    } catch (err) {
      toast.error("Failed to save regulation");
    }
  };

  const deleteReg = async (id) => {
    if (!window.confirm("Delete this regulation?")) return;
    try {
      await adminAPI.deleteRegulation(id);
      toast.success("Regulation deleted");
      await loadFilters();
    } catch (err) {
      toast.error("Failed");
    }
  };

  // ===============================
  // DEPARTMENT CRUD
  // ===============================
  const openAddDept = () => {
    setDeptForm({
      id: null,
      name: "",
      code: "",
      description: "",
      semesterCount: 8,
      regulationId: ""
    });
    setShowDeptModal(true);
  };

  const openEditDept = (d) => {
    setDeptForm({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      semesterCount: d.semesterCount || 8,
      regulationId: d.regulationId
    });
    setShowDeptModal(true);
  };

  const submitDept = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...deptForm, semesterCount: Number(deptForm.semesterCount) };

      if (deptForm.id) {
        await adminAPI.updateDepartment(deptForm.id, payload);
        toast.success("Department updated");
      } else {
        await adminAPI.createDepartment(payload);
        toast.success("Department created");
      }
      setShowDeptModal(false);
      await loadFilters();
    } catch (err) {
      toast.error("Failed to save department");
    }
  };

  const deleteDept = async (id) => {
    if (!window.confirm("Delete department permanently?")) return;
    try {
      await adminAPI.deleteDepartment(id);
      toast.success("Department deleted");
      await loadFilters();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // ===============================
  // SEMESTER CRUD
  // ===============================
  const openAddSem = () => {
    setSemForm({
      id: null,
      regulationId: regId,
      departmentId: deptId,
      number: 1,
      mandatoryCount: 0,
      electiveCount: 0,
      description: ""
    });
    setShowSemModal(true);
  };

  const openEditSem = (s) => {
    setSemForm({
      id: s.id,
      regulationId: s.regulationId,
      departmentId: s.departmentId,
      number: s.number,
      mandatoryCount: s.mandatoryCount,
      electiveCount: s.electiveCount,
      description: s.description
    });
    setShowSemModal(true);
  };

  const submitSem = async (e) => {
    e.preventDefault();

    const payload = {
      regulationId: Number(semForm.regulationId),
      departmentId: Number(semForm.departmentId),
      number: Number(semForm.number),
      mandatoryCount: Number(semForm.mandatoryCount),
      electiveCount: Number(semForm.electiveCount),
      description: semForm.description
    };

    try {
      if (semForm.id) {
        await adminAPI.updateSemester(semForm.id, payload);
        toast.success("Semester updated");
      } else {
        await adminAPI.createSemester(payload);
        toast.success("Semester created");
      }

      setShowSemModal(false);
      await loadSemesters(payload.regulationId, payload.departmentId);
    } catch (err) {
      toast.error("Failed to save semester");
    }
  };

  const deleteSem = async (id) => {
    if (!window.confirm("Delete semester?")) return;
    try {
      await adminAPI.deleteSemester(id);
      toast.success("Semester deleted");
      if (regId && deptId) await loadSemesters(regId, deptId);
    } catch (err) {
      toast.error("Failed");
    }
  };

  // ===============================
  // SUBJECT CRUD
  // ===============================
  const openAddSubject = () => {
    if (!regId || !deptId || !semesterId) {
      toast.error("Select regulation, department & semester");
      return;
    }

    const sem = semesters.find(s => s.id == semesterId);

    setSubjectForm({
      id: null,
      code: "",
      name: "",
      credits: 3,
      type: "CORE",
      isElective: false,
      regulationId: regId,
      departmentId: deptId,
      semester: sem.number // FIXED
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
      isElective: s.isElective,
      regulationId: regId,
      departmentId: deptId,
      semester: s.semester
    });
    setShowSubjectModal(true);
  };

  const submitSubject = async (e) => {
    e.preventDefault();

    const payload = {
      code: subjectForm.code,
      name: subjectForm.name,
      credits: Number(subjectForm.credits),
      type: subjectForm.type,
      isElective: subjectForm.isElective,
      regulationId: Number(subjectForm.regulationId),
      departmentId: Number(subjectForm.departmentId),
      semester: Number(subjectForm.semester)
    };

    try {
      if (subjectForm.id) {
        await adminAPI.updateSubject(subjectForm.id, payload);
        toast.success("Subject updated");
      } else {
        await adminAPI.addSubject(payload);
        toast.success("Subject added");
      }

      setShowSubjectModal(false);

      await loadSemesters(regId, deptId); // FIX: update semester counters
      await loadSubjects();               // FIX: refresh subject list

    } catch (err) {
      toast.error("Failed to save subject");
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete subject?")) return;

    try {
      await adminAPI.deleteSubject(id);
      toast.success("Subject deleted");

      await loadSemesters(regId, deptId);
      await loadSubjects();

    } catch (err) {
      toast.error("Failed");
    }
  };

  // ===============================
  // FILTER SUBJECTS BY SEARCH
  // ===============================
  const filteredMandatory = subjects.filter(s =>
    !s.isElective &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.code.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredElective = subjects.filter(s =>
    s.isElective &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.code.toLowerCase().includes(search.toLowerCase()))
  );

  // ===============================
  // UI RENDER
  // ===============================

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">

          <h1 className="text-3xl font-bold mb-6 dark:text-white">
            Curriculum Management
          </h1>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Regulation */}
            <div>
              <label className="text-sm dark:text-gray-300">Regulation</label>
              <div className="flex">
                <select
                  className="w-full p-3 border rounded-lg dark:bg-gray-800"
                  value={regId}
                  onChange={e => setRegId(e.target.value)}
                >
                  <option value="">All Regulations</option>
                  {regulations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.year}
                    </option>
                  ))}
                </select>

                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddReg} className="px-3 py-2 bg-green-600 text-white rounded">+</button>
                  {regId && (
                    <>
                      <button
                        onClick={() => openEditReg(regulations.find(x => x.id == regId))}
                        className="px-3 py-2 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteReg(regId)}
                        className="px-3 py-2 bg-red-600 text-white rounded"
                      >
                        Del
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-sm dark:text-gray-300">Department</label>
              <div className="flex">
                <select
                  className="w-full p-3 border rounded-lg dark:bg-gray-800"
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>

                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddDept} className="px-3 py-2 bg-green-600 text-white rounded">+</button>

                  {deptId && (
                    <>
                      <button
                        onClick={() => openEditDept(departments.find(x => x.id == deptId))}
                        className="px-3 py-2 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteDept(deptId)}
                        className="px-3 py-2 bg-red-600 text-white rounded"
                      >
                        Del
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="text-sm dark:text-gray-300">Semester</label>
              <div className="flex">
                <select
                  className="w-full p-3 border rounded-lg dark:bg-gray-800"
                  value={semesterId}
                  onChange={e => setSemesterId(e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>
                      Semester {s.number} ({s.mandatoryCount} M, {s.electiveCount} E)
                    </option>
                  ))}
                </select>

                <div className="ml-2 flex items-center space-x-2">
                  <button onClick={openAddSem} className="px-3 py-2 bg-green-600 text-white rounded">+</button>

                  {semesterId && (
                    <>
                      <button
                        onClick={() => openEditSem(semesters.find(x => x.id == semesterId))}
                        className="px-3 py-2 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteSem(semesterId)}
                        className="px-3 py-2 bg-red-600 text-white rounded"
                      >
                        Del
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* =============================== */}
          {/* SEARCH + ACTION BUTTONS */}
          {/* =============================== */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="flex items-center p-3 border rounded-lg dark:bg-gray-800 w-1/2">
              <Search className="mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search subjects..."
                className="w-full bg-transparent outline-none dark:text-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div>
  <button
    onClick={() => {
      if (!regId || !deptId || !semesterId)
        return toast.error("Select regulation, department & semester");

      loadSubjects();
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
  >
    View Subjects
  </button>

  <button
    onClick={openAddSubject}
    disabled={!regId || !deptId || !semesterId}
    className="ml-3 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
  >
    Add Subject
  </button>

  {/* NEW INSERT BUTTON */}
  <button
    onClick={() => setShowSqlModal(true)}
    className="ml-3 px-4 py-2 bg-green-600 text-white rounded-lg"
  >
    Insert Data
  </button>
</div>


          {/* =============================== */}
          {/* SUBJECT TABLES */}
          {/* =============================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Mandatory */}
            <div className="border rounded-lg dark:bg-gray-800">
              <div className="p-4 border-b">
                <h3 className="text-lg dark:text-white">Mandatory Subjects</h3>
                <p className="text-sm text-gray-500">{filteredMandatory.length} items</p>
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
                    <tr>
                      <td colSpan="5" className="p-6 text-center">Loading...</td>
                    </tr>
                  ) : filteredMandatory.length > 0 ? (
                    filteredMandatory.map(sb => (
                      <tr key={sb.id} className="border-b">
                        <td className="p-3">{sb.code}</td>
                        <td className="p-3">{sb.name}</td>
                        <td className="p-3">{sb.credits}</td>
                        <td className="p-3">{sb.type}</td>
                        <td className="p-3">
                          <button
                            onClick={() => openEditSubject(sb)}
                            className="px-2 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => deleteSubject(sb.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-6 text-center">No mandatory subjects</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Elective */}
            <div className="border rounded-lg dark:bg-gray-800">
              <div className="p-4 border-b">
                <h3 className="text-lg dark:text-white">Elective Subjects</h3>
                <p className="text-sm text-gray-500">{filteredElective.length} items</p>
              </div>

              <table className="w-full">
                <thead className="bg-blue-50 dark:bg-blue-900">
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
                      <td colSpan="5" className="p-6 text-center">Loading...</td>
                    </tr>
                  ) : filteredElective.length > 0 ? (
                    filteredElective.map(sb => (
                      <tr key={sb.id} className="border-b">
                        <td className="p-3">{sb.code}</td>
                        <td className="p-3">{sb.name}</td>
                        <td className="p-3">{sb.credits}</td>
                        <td className="p-3">{sb.type}</td>
                        <td className="p-3">
                          <button
                            onClick={() => openEditSubject(sb)}
                            className="px-2 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => deleteSubject(sb.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-6 text-center">No elective subjects</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>

      {/* =============================== */}
      {/* MODALS */}
      {/* =============================== */}

      {/* Regulation Modal */}
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

      {/* Department Modal */}
      {showDeptModal && (
        <Modal onClose={() => setShowDeptModal(false)}>
          <h2 className="text-xl mb-3">{deptForm.id ? "Edit Department" : "Add Department"}</h2>
          <form onSubmit={submitDept} className="space-y-3">
            <select value={deptForm.regulationId} onChange={(e) => setDeptForm({ ...deptForm, regulationId: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Regulation</option>
              {regulations.map(r => <option key={r.id} value={r.id}>{r.name} - {r.year}</option>)}
            </select>
            <input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="Code" className="w-full p-2 border rounded" />
            <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />
            <input type="number" value={deptForm.semesterCount} onChange={(e) => setDeptForm({ ...deptForm, semesterCount: e.target.value })} placeholder="Semesters (default 8)" className="w-full p-2 border rounded" />
            <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowDeptModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Semester Modal */}
      {showSemModal && (
        <Modal onClose={() => setShowSemModal(false)}>
          <h2 className="text-xl mb-3">{semForm.id ? "Edit Semester" : "Add Semester"}</h2>
          <form onSubmit={submitSem} className="space-y-3">
            <select value={semForm.regulationId} onChange={(e) => setSemForm({ ...semForm, regulationId: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Regulation</option>
              {regulations.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <select value={semForm.departmentId} onChange={(e) => setSemForm({ ...semForm, departmentId: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
            </select>

            <input type="number" min="1" value={semForm.number} onChange={(e) => setSemForm({ ...semForm, number: e.target.value })} className="w-full p-2 border rounded" placeholder="Semester number" />

            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" value={semForm.mandatoryCount} onChange={(e) => setSemForm({ ...semForm, mandatoryCount: e.target.value })} className="p-2 border rounded" placeholder="Mandatory" />
              <input type="number" min="0" value={semForm.electiveCount} onChange={(e) => setSemForm({ ...semForm, electiveCount: e.target.value })} className="p-2 border rounded" placeholder="Elective" />
            </div>

            <textarea value={semForm.description} onChange={(e) => setSemForm({ ...semForm, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" />

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowSemModal(false)} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <Modal onClose={() => setShowSubjectModal(false)}>
          <h2 className="text-xl mb-3">{subjectForm.id ? "Edit Subject" : "Add Subject"}</h2>
          <form onSubmit={submitSubject} className="space-y-3">
            <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="Code" className="w-full p-2 border rounded" />
            <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />

            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} className="p-2 border rounded" />
              <select value={subjectForm.type} onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })} className="p-2 border rounded">
                <option value="CORE">CORE</option>
                <option value="LAB">LAB</option>
                <option value="ELECTIVE">ELECTIVE</option>
              </select>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={subjectForm.isElective} onChange={(e) => setSubjectForm({ ...subjectForm, isElective: e.target.checked })} />
                <span>Elective?</span>
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

// ===============================
// MODAL WRAPPER
// ===============================

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
      <button onClick={onClose} className="absolute top-3 right-3 px-2 py-1 text-sm">✕</button>
      {children}
    </div>
  </div>
);

export default CurriculumManagement;
