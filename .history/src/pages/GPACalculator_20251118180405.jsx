// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon, Search } from "lucide-react";

// Grade options with U & Not-Have
const GRADES = [
  { value: "O", label: "O (10)" },
  { value: "A+", label: "A+ (9)" },
  { value: "A", label: "A (8)" },
  { value: "B+", label: "B+ (7)" },
  { value: "B", label: "B (6)" },
  { value: "U", label: "U (0)" },
  { value: "NOT_HAVE", label: "Not Have (Ignore)" },
];

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);

  const [semester, setSemester] = useState("");
  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search state for elective selector
  const [searchTerm, setSearchTerm] = useState("");

  // Load profile once
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        toast.error("Unable to load student profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Semesters available from dept config
  const maxSemesters = useMemo(() => {
    if (profile?.department?.semesterCount > 0) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

  // Build UI rows using subjects and elective count
  const buildRows = (subjects, electiveCount) => {
    const mandatory = subjects.filter((s) => !s.isElective);
    const electives = subjects.filter((s) => s.isElective);

    const mandatoryRows = mandatory.map((s) => ({
      rowId: `MAND-${s.id}`,
      mode: "MANDATORY",
      isElective: false,
      subjectId: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      grade: "",
    }));

    const electiveRows = Array.from({ length: electiveCount }, (_, i) => ({
      rowId: `ELEC-${i + 1}`,
      mode: "ELECTIVE",
      isElective: true,
      subjectId: "",
      code: "",
      name: "",
      credits: null,
      grade: "",
    }));

    return [...mandatoryRows, ...electiveRows];
  };

  // On semester selection
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);
    setSearchTerm("");

    if (!value || !profile?.regulation?.id || !profile?.department?.id) return;

    try {
      setLoading(true);

      const subRes = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      const subjects = Array.isArray(subRes.data) ? subRes.data : [];
      setRawSubjects(subjects);

      const semRes = await studentAPI.getSemesterDetails(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      const electiveCount = semRes?.data?.electiveCount ?? 0;

      const uiRows = buildRows(subjects, electiveCount);
      setRows(uiRows);
    } catch (err) {
      toast.error("Failed loading subject / semester data");
    } finally {
      setLoading(false);
    }
  };

  // Elective options
  const electives = useMemo(
    () =>
      rawSubjects
        .filter((s) => s.isElective)
        .filter((s) =>
          `${s.code} ${s.name}`.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [rawSubjects, searchTerm]
  );

  // Prevent using same elective twice
  const usedByOtherRow = (subjectId, currentRowId) =>
    rows.some(
      (r) =>
        r.rowId !== currentRowId &&
        r.isElective &&
        r.subjectId === subjectId
    );

  // Elective subject selection
  const handleElectiveSelect = (rowId, subjectIdString) => {
    const subjectId = subjectIdString ? Number(subjectIdString) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (!subjectId) {
          return {
            ...row,
            subjectId: "",
            code: "",
            name: "",
            credits: null,
            grade: "",
          };
        }

        const subj = rawSubjects.find((s) => s.id === subjectId);
        if (!subj) return row;

        return {
          ...row,
          subjectId: subj.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
        };
      })
    );
    setGpaResult(null);
  };

  // Grade change
  const handleGradeChange = (rowId, gradeValue) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade: gradeValue } : row
      )
    );
    setGpaResult(null);
  };

  // Calculate GPA
  const handleCalculate = async () => {
    if (!semester || !rows.length) return toast.error("Invalid calculation");

    const graded = rows.filter(
      (r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE"
    );

    if (!graded.length)
      return toast.error("Please provide at least one valid grade");

    const payload = {
      semester: Number(semester),
      subjects: graded.map((row) => ({
        subjectId: row.subjectId,
        grade: row.grade,
      })),
    };

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA(payload);
      setGpaResult(res.data);
      toast.success("GPA calculation successful");
    } catch (err) {
      toast.error("GPA calculation failed");
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    if (!gpaResult) return toast.error("Calculate first");

    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `semester-${semester}-marksheet.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              GPA Calculator
            </h1>

            {profile && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 border">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Name:</strong> {profile.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Department:</strong> {profile.department?.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Regulation:</strong> {profile.regulation?.name}
                </p>
              </div>
            )}

            {/* Semester */}
            <div className="bg-white dark:bg-gray-800 border p-6 rounded mb-8">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Select Semester
              </label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                disabled={!profile || loading}
                className="mt-2 w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select</option>
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map(
                  (s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  )
                )}
              </select>
            </div>

            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border rounded shadow mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Subjects for Semester {semester}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-300">Type</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-300">Subject</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-300">Credits</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-300">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.rowId} className="border-b dark:border-gray-700">
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {row.mode}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {!row.isElective ? (
                              <>
                                <b>{row.code}</b> - {row.name}
                              </>
                            ) : (
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Search size={14} className="text-gray-400" />
                                  <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search elective..."
                                    className="px-2 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                                <select
                                  value={row.subjectId || ""}
                                  onChange={(e) =>
                                    handleElectiveSelect(row.rowId, e.target.value)
                                  }
                                  className="px-3 py-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="">Select elective</option>
                                  {electives.map((e) => (
                                    <option
                                      key={e.id}
                                      value={e.id}
                                      disabled={usedByOtherRow(e.id, row.rowId)}
                                    >
                                      {e.code} - {e.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {row.credits ?? "-"}
                          </td>

                          <td className="px-4 py-2">
                            <select
                              disabled={row.isElective && !row.subjectId}
                              value={row.grade}
                              onChange={(e) =>
                                handleGradeChange(row.rowId, e.target.value)
                              }
                              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Grade</option>
                              {GRADES.map((g) => (
                                <option key={g.value} value={g.value}>
                                  {g.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                disabled={loading || !rows.length}
                onClick={handleCalculate}
                className="px-6 py-3 bg-blue-600 text-white rounded flex items-center space-x-2 hover:bg-blue-700 disabled:bg-gray-400"
              >
                <CalcIcon size={18} />
                <span>Calculate & Save</span>
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-purple-600 text-white rounded flex items-center space-x-2 hover:bg-purple-700"
                >
                  <Download size={18} />
                  <span>Download Marksheet</span>
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="bg-blue-50 dark:bg-blue-900 border mt-6 p-5 rounded text-center">
                <h2 className="text-3xl font-bold text-blue-600 dark:text-white">
                  {Number(gpaResult?.gpa || 0).toFixed(2)}
                </h2>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  GPA for Semester {semester}
                </p>
                <span className="text-xs text-blue-500 dark:text-blue-300">
                  Credits: {gpaResult.totalCredits} • Points: {gpaResult.totalPoints}
                </span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
