// src/pages/CurriculumManagement.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "react-toastify";
import Footer from "../components/Layout/Footer";

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

  // -------------------------
  // NEW: Bulk Import Modal
  // -------------------------
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [bulkTab, setBulkTab] = useState("sql"); // 'sql' | 'csv' | 'json'
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState([]); // parsed objects
  const [bulkType, setBulkType] = useState("subjects"); // 'subjects' | 'semesters'
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

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
      const semObj = semesters.find(s => s.id == semesterId);
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
  // REGULATION CRUD (unchanged)
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
  // DEPARTMENT CRUD (unchanged)
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
  // SEMESTER CRUD (unchanged)
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
  // SUBJECT CRUD (unchanged)
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

  // -------------------------------
  // BULK IMPORT UTILITIES
  // -------------------------------
  const resetBulkModal = () => {
    setBulkText("");
    setBulkPreview([]);
    setBulkTab("sql");
    setBulkType("subjects");
    setParsing(false);
    setImporting(false);
  };

  const parseCSV = (text) => {
    // Very small CSV parser: header line required
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      // split with comma, allowing quoted values
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      return headers.reduce((acc, h, i) => {
        let v = values[i] || "";
        v = v.trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        acc[h] = v;
        return acc;
      }, {});
    });
    return rows;
  };

  const parseJSONText = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object") return [parsed];
      return [];
    } catch (e) {
      throw new Error("Invalid JSON");
    }
  };

  // Basic SQL INSERT parser: supports multiple INSERT lines.
  // Example supported:
  // INSERT INTO subjects (code, name, credits, is_elective, type, regulation_id, department_id, semester) VALUES ('CS101','Intro',3,0,'CORE',1,2,1);
  const parseSQLInsert = (text) => {
    const out = [];
    // normalize whitespace
    const normalized = text.replace(/\s+/g, " ").trim();
    // split by ';' to get statements
    const statements = normalized.split(";").map(s => s.trim()).filter(Boolean);
    const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)/i;

    statements.forEach(stmt => {
      const match = stmt.match(insertRegex);
      if (!match) return;
      const table = match[1].replace(/`/g, "").toLowerCase();
      const cols = match[2].split(",").map(c => c.trim().replace(/`/g, ""));
      // VALUES portion may contain commas inside strings; we parse by scanning chars
      const rawValues = match[3].trim();
      const values = [];
      let cur = "";
      let inQuote = false;
      let quoteChar = null;
      for (let i = 0; i < rawValues.length; i++) {
        const ch = rawValues[i];
        if (!inQuote && (ch === "'" || ch === '"')) {
          inQuote = true; quoteChar = ch; cur += ch;
        } else if (inQuote && ch === quoteChar) {
          cur += ch;
          // check for escaped quote
          const next = rawValues[i+1];
          if (next === quoteChar) {
            // escaped quote, keep and skip
            cur += next;
            i++;
            continue;
          } else {
            inQuote = false;
            quoteChar = null;
          }
        } else if (!inQuote && ch === ",") {
          values.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      if (cur.length) values.push(cur.trim());

      // clean values and map to object
      const obj = {};
      cols.forEach((c, idx) => {
        let v = values[idx] ?? null;
        if (v === null) { obj[c] = null; return; }

        // remove surrounding quotes if any
        v = v.trim();
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
          // replace doubled quotes for SQL escaped single quotes
          let inner = v.slice(1, -1).replace(/''/g, "'");
          inner = inner.replace(/\\"/g, '"');
          obj[c] = inner;
        } else if (v.toLowerCase() === "null") {
          obj[c] = null;
        } else if (/^\d+(\.\d+)?$/.test(v)) {
          obj[c] = v.indexOf(".") >= 0 ? parseFloat(v) : parseInt(v, 10);
        } else if (v === "0" || v === "1") {
          obj[c] = v === "1" ? 1 : 0;
        } else {
          obj[c] = v;
        }
      });

      out.push({ table, row: obj });
    });

    return out;
  };

  // Convert SQL parser output to the expected subject/semester JSON shape
  const convertParsedToTarget = (parsedRows, type) => {
    // type: 'subjects' or 'semesters'
    const results = [];
    parsedRows.forEach(item => {
      // item: {table, row}
      const table = item.table.toLowerCase();
      const row = item.row;
      if (type === "subjects") {
        // try both 'subjects' table and if AI produced different table name
        if (table.includes("subject")) {
          // map common column names to API fields
          const s = {
            code: firstValue(row, ["code", "course_code", "courseCode", "coursecode"]),
            name: firstValue(row, ["name", "title", "course_title", "courseTitle"]),
            credits: toNumber(firstValue(row, ["credits", "credit"], 0)),
            isElective: toBool(firstValue(row, ["is_elective", "isElective", "elective"], false)),
            type: firstValue(row, ["type", "subject_type"], "CORE"),
            regulationId: toNumber(firstValue(row, ["regulation_id", "regulationId", "reg_id"]), regId || null),
            departmentId: toNumber(firstValue(row, ["department_id", "departmentId", "dept_id"]), deptId || null),
            semester: toNumber(firstValue(row, ["semester", "sem", "semester_no", "semesterNumber"]), semesterId ? semesters.find(s => s.id == semesterId)?.number : null)
          };
          results.push(s);
        } else if (table.includes("sem")) {
          // someone pasted semesters into subjects tab - ignore or let user choose
        }
      } else if (type === "semesters") {
        if (table.includes("semester")) {
          const sem = {
            regulationId: toNumber(firstValue(row, ["regulation_id", "regulationId", "reg_id"]), regId || null),
            departmentId: toNumber(firstValue(row, ["department_id", "departmentId", "dept_id"]), deptId || null),
            number: toNumber(firstValue(row, ["number", "sem", "semester"]), 1),
            mandatoryCount: toNumber(firstValue(row, ["mandatory_count", "mandatoryCount", "mandatory"], 0)),
            electiveCount: toNumber(firstValue(row, ["elective_count", "electiveCount", "elective"], 0)),
            description: firstValue(row, ["description", "desc"], "")
          };
          results.push(sem);
        }
      }
    });
    return results;
  };

  // helper to pick first existing key
  const firstValue = (obj, keys, fallback = null) => {
    for (const k of keys) {
      if (obj.hasOwnProperty(k)) return obj[k];
      // try lower/upper variations
      const lk = Object.keys(obj).find(x => x.toLowerCase() === k.toLowerCase());
      if (lk) return obj[lk];
    }
    return fallback;
  };

  const toNumber = (v, fallback = null) => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const toBool = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  };

  // -------------------------
  // PARSE button action
  // -------------------------
  const handleParse = () => {
    setParsing(true);
    setBulkPreview([]);
    try {
      if (!bulkText.trim()) {
        toast.error("Paste SQL / CSV / JSON into the box first");
        setParsing(false);
        return;
      }

      if (bulkTab === "json") {
        const arr = parseJSONText(bulkText);
        // Basic normalization: if subject objects don't include regulationId/departmentId, fill from selected
        const normalized = arr.map(obj => {
          if (bulkType === "subjects") {
            return {
              code: obj.code || obj.code?.toString() || obj.courseCode || obj.course_code,
              name: obj.name || obj.title || obj.courseTitle || obj.course_title,
              credits: toNumber(obj.credits ?? obj.credit, 3),
              isElective: toBool(obj.isElective ?? obj.is_elective ?? obj.elective),
              type: obj.type || obj.subject_type || "CORE",
              regulationId: toNumber(obj.regulationId ?? obj.regulation_id, regId || null),
              departmentId: toNumber(obj.departmentId ?? obj.department_id, deptId || null),
              semester: toNumber(obj.semester ?? obj.sem, semesters.find(s => s.id == semesterId)?.number ?? 1)
            };
          } else {
            return {
              regulationId: toNumber(obj.regulationId ?? obj.regulation_id, regId || null),
              departmentId: toNumber(obj.departmentId ?? obj.department_id, deptId || null),
              number: toNumber(obj.number ?? obj.semester ?? obj.sem, 1),
              mandatoryCount: toNumber(obj.mandatoryCount ?? obj.mandatory_count, 0),
              electiveCount: toNumber(obj.electiveCount ?? obj.elective_count, 0),
              description: obj.description ?? ""
            };
          }
        });
        setBulkPreview(normalized);
        setParsing(false);
        return;
      }

      if (bulkTab === "csv") {
        const rows = parseCSV(bulkText);
        // map CSV headers to target shape like JSON path above
        const normalized = rows.map(row => {
          if (bulkType === "subjects") {
            return {
              code: firstValue(row, ["code", "course_code", "courseCode"], ""),
              name: firstValue(row, ["name", "title", "course_title"], ""),
              credits: toNumber(firstValue(row, ["credits", "credit"], 3)),
              isElective: toBool(firstValue(row, ["is_elective", "isElective", "elective"], false)),
              type: firstValue(row, ["type", "subject_type"], "CORE"),
              regulationId: toNumber(firstValue(row, ["regulation_id", "regulationId"]), regId || null),
              departmentId: toNumber(firstValue(row, ["department_id", "departmentId"]), deptId || null),
              semester: toNumber(firstValue(row, ["semester", "sem", "semester_no"]), semesters.find(s => s.id == semesterId)?.number ?? 1)
            };
          } else {
            return {
              regulationId: toNumber(firstValue(row, ["regulation_id", "regulationId"]), regId || null),
              departmentId: toNumber(firstValue(row, ["department_id", "departmentId"]), deptId || null),
              number: toNumber(firstValue(row, ["number", "sem", "semester"]), 1),
              mandatoryCount: toNumber(firstValue(row, ["mandatory_count", "mandatoryCount"]), 0),
              electiveCount: toNumber(firstValue(row, ["elective_count", "electiveCount"]), 0),
              description: firstValue(row, ["description", "desc"], "")
            };
          }
        });
        setBulkPreview(normalized);
        setParsing(false);
        return;
      }

      // SQL tab
      const parsed = parseSQLInsert(bulkText);
      if (parsed.length === 0) {
        toast.error("No valid INSERT statements found");
        setParsing(false);
        return;
      }
      const converted = convertParsedToTarget(parsed, bulkType);
      if (!converted || converted.length === 0) {
        toast.warn("Parsed statements but couldn't map to the selected import type. Switch tab or check SQL column names.");
      }
      setBulkPreview(converted);
    } catch (err) {
      toast.error("Failed to parse: " + (err.message || err));
    } finally {
      setParsing(false);
    }
  };

  // -------------------------
  // IMPORT button action
  // -------------------------
  const handleImport = async () => {
    if (!bulkPreview || bulkPreview.length === 0) {
      toast.error("Nothing to import. Parse first and check preview.");
      return;
    }

    if (!regId || !deptId) {
      // For subjects/semesters we generally need regulation & department set
      if (bulkType === "subjects" || bulkType === "semesters") {
        return toast.error("Select regulation and department in the filters before importing (they can be overridden per-row).");
      }
    }

    if (!window.confirm(`Import ${bulkPreview.length} ${bulkType}? This operation will create records.`)) return;

    setImporting(true);
    try {
      // call backend endpoints (add the functions in adminAPI as shown below)
      if (bulkType === "subjects") {
        const payload = bulkPreview.map(p => ({
          code: p.code,
          name: p.name,
          credits: Number(p.credits || 0),
          type: p.type || "CORE",
          isElective: !!p.isElective,
          regulationId: Number(p.regulationId),
          departmentId: Number(p.departmentId),
          semester: Number(p.semester)
        }));
        await adminAPI.bulkImportSubjects(payload);
        toast.success(`Imported ${payload.length} subjects`);
      } else {
        const payload = bulkPreview.map(p => ({
          regulationId: Number(p.regulationId),
          departmentId: Number(p.departmentId),
          number: Number(p.number),
          mandatoryCount: Number(p.mandatoryCount || 0),
          electiveCount: Number(p.electiveCount || 0),
          description: p.description || null
        }));
        await adminAPI.bulkImportSemesters(payload);
        toast.success(`Imported ${payload.length} semesters`);
      }

      setShowSqlModal(false);
      resetBulkModal();
      // refresh UI
      if (regId && deptId) {
        await loadSemesters(regId, deptId);
        await loadSubjects();
      }
    } catch (err) {
      const message = err?.response?.data || err?.message || "Import failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  // ===============================
  // UI RENDER
  // ===============================

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">

          <h1 className="text-3xl font-bold mb-6 dark:text-gray-1000">
            Curriculum Management
          </h1>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Regulation */}
            <div>
              <label className="text-sm dark:text-gray-1000">Regulation</label>
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
              <label className="text-sm dark:text-gray-1000">Department</label>
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
              <label className="text-sm dark:text-gray-800">Semester</label>
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

          {/* SEARCH + ACTION BUTTONS */}
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
          </div>

          {/* SUBJECT TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Mandatory */}
            <div className="border rounded-lg dark:bg-gray-800">
              <div className="p-4 border-b">
                <h3 className="text-lg dark:text-white">Mandatory Subjects</h3>
                <p className="text-sm text-gray-500">{filteredMandatory.length} items</p>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
  <tr>
    <th className="p-3 text-left dark:text-white dark:text-white">Code</th>
    <th className="p-3 text-left dark:text-white dark:text-white">Name</th>
    <th className="p-3 text-left dark:text-white dark:text-white">Credits</th>
    <th className="p-3 text-left dark:text-white dark:text-white">Type</th>
    <th className="p-3 text-left dark:text-white dark:text-white">Actions</th>
  </tr>
</thead>


                <tbody>
                  {loadingSubjects ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center dark:text-white">Loading...</td>
                    </tr>
                  ) : filteredMandatory.length > 0 ? (
                    filteredMandatory.map(sb => (
                      <tr key={sb.id} className="border-b">
                        <td className="p-3 dark:text-white dark:text-white">{sb.code}</td>

                        <td className="p-3 dark:text-white">{sb.name}</td>
                        <td className="p-3 dark:text-white">{sb.credits}</td>
                        <td className="p-3 dark:text-white">{sb.type}</td>
                        <td className="p-3 dark:text-white">
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
                    <tr><td colSpan="5" className="p-6 text-center dark:text-white">No mandatory subjects</td></tr>
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
                <thead className="bg-blue-50 dark:bg-blue-900 dark:text-white">
                  <tr>
                    <th className="p-3 text-left dark:text-white">Code</th>
                    <th className="p-3 text-left dark:text-white">Name</th>
                    <th className="p-3 text-left dark:text-white">Credits</th>
                    <th className="p-3 text-left dark:text-white">Type</th>
                    <th className="p-3 text-left dark:text-white">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingSubjects ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center dark:text-white">Loading...</td>
                    </tr>
                  ) : filteredElective.length > 0 ? (
                    filteredElective.map(sb => (
                      <tr key={sb.id} className="border-b">
                        <td className="p-3 dark:text-white dark:text-white">{sb.code}</td>
<td className="p-3 dark:text-white dark:text-white">{sb.name}</td>
<td className="p-3 dark:text-white dark:text-white">{sb.credits}</td>
<td className="p-3 dark:text-white dark:text-white">{sb.type}</td>

                        <td className="p-3 dark:text-white">
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
                    <tr><td colSpan="5" className="p-6 text-center dark:text-white">No elective subjects</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
          <Footer />  
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

      {/* =============================== */}
      {/* BULK INSERT MODAL */}
      {/* =============================== */}
      {showSqlModal && (
        <Modal onClose={() => { setShowSqlModal(false); resetBulkModal(); }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Bulk Insert Data</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Type</label>
                <select value={bulkType} onChange={(e) => setBulkType(e.target.value)} className="p-2 border rounded">
                  <option value="subjects">Subjects</option>
                  <option value="semesters">Semesters</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded ${bulkTab === "sql" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setBulkTab("sql")}>SQL → JSON</button>
              <button className={`px-3 py-1 rounded ${bulkTab === "csv" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setBulkTab("csv")}>CSV</button>
              <button className={`px-3 py-1 rounded ${bulkTab === "json" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setBulkTab("json")}>JSON</button>
              <div className="ml-auto text-sm text-gray-500">Pro tip: set Regulation & Department filters first</div>
            </div>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={10}
              placeholder={
                bulkTab === "sql"
                  ? "Paste INSERT statements here (multiple OK). Example:\nINSERT INTO subjects (code, name, credits, is_elective, type, regulation_id, department_id, semester) VALUES ('CS101','Intro to CS',3,0,'CORE',1,2,1);"
                  : bulkTab === "csv"
                  ? "Paste CSV with header row. Example: code,name,credits,is_elective,type,regulation_id,department_id,semester\nCS101,Intro,3,0,CORE,1,2,1"
                  : "Paste JSON array or object. Example: [{ code: 'CS101', name: 'Intro', credits: 3, isElective: false, type: 'CORE', regulationId:1, departmentId:2, semester:1 }]"
              }
              className="w-full p-3 border rounded text-sm font-mono bg-gray-50 dark:bg-gray-900 dark:text-white"
            />

            <div className="flex items-center gap-2">
              <button onClick={handleParse} disabled={parsing} className="px-4 py-2 bg-blue-600 text-white rounded">{parsing ? "Parsing..." : "Preview"}</button>
              <button onClick={() => { setBulkText(""); setBulkPreview([]); }} className="px-4 py-2 bg-gray-300 rounded">Clear</button>
              <div className="ml-auto text-sm text-gray-500">{bulkPreview.length} rows parsed</div>
            </div>

            {/* PREVIEW */}
            <div className="max-h-64 overflow-auto border rounded p-2 bg-white dark:bg-gray-800">
              {bulkPreview.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">Preview will appear here after parsing.</div>
              ) : (
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr>
                      {Object.keys(bulkPreview[0]).map((k) => (
                        <th key={k} className="p-2 text-left text-xs text-gray-600 dark:text-white">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.keys(bulkPreview[0]).map((k) => (
                          <td key={k} className="p-2 align-top dark:text-white">{String(row[k] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => { setShowSqlModal(false); resetBulkModal(); }} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleImport} disabled={importing || bulkPreview.length === 0} className="px-3 py-2 bg-green-600 text-white rounded">{importing ? "Importing..." : "Import"}</button>
            </div>
          </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl relative">
      <button onClick={onClose} className="absolute top-3 right-3 px-2 py-1 text-sm">✕</button>
      {children}
    </div>
  </div>
);

export default CurriculumManagement;
