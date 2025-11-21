// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon } from "lucide-react";

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");

  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------
  // Load profile only once
  // -------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const maxSemesters = useMemo(() => {
    return profile?.department?.semesterCount || 8;
  }, [profile]);

  // -------------------------------------------------------
  // Build rows using elective_count (NOT subject count)
  // -------------------------------------------------------
  const buildRows = (subjects, electiveCount) => {
    if (!Array.isArray(subjects)) return [];

    const mandatory = subjects.filter((s) => !s.isElective);

    const mandatoryRows = mandatory.map((s) => ({
      rowId: `MAND-${s.id}`,
      mode: "mandatory",
      isElective: false,
      subjectId: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type || "CORE",
      grade: "",
    }));

    const electiveRows = Array.from({ length: electiveCount }, (_, idx) => ({
      rowId: `ELEC-${idx + 1}`,
      mode: "elective",
      isElective: true,
      slotNumber: idx + 1,
      subjectId: "",
      code: "",
      name: "",
      credits: null,
      type: "ELECTIVE",
      grade: "",
    }));

    return [...mandatoryRows, ...electiveRows];
  };

  // -------------------------------------------------------
  // On Semester Selection
  // -------------------------------------------------------
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);

    if (!value) return;

    try {
      setLoading(true);

      // Fetch subject list
      const subRes = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );
      const subjects = Array.isArray(subRes.data) ? subRes.data : [];
      setRawSubjects(subjects);

      // Fetch semester details for elective_count
      const semRes = await studentAPI.getSemesterDetails(
        profile.department.id,
        profile.regulation.id,
        Number(value)
      );
      const electiveCount = semRes?.data?.elective_count ?? 0;

      const builtRows = buildRows(subjects, electiveCount);

      setRows(builtRows);

      if (!subjects.length) toast.info("No subjects found for this semester.");
    } catch (error) {
      toast.error("Failed loading semester data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Elective Subject Dropdown List
  // -------------------------------------------------------
  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => s.isElective),
    [rawSubjects]
  );

  const isSubjectUsed = (subjectId, rowId) => {
    return rows.some(
      (r) => r.rowId !== rowId && r.mode === "elective" && r.subjectId === subjectId
    );
  };

  // -------------------------------------------------------
  // Update Grade
  // -------------------------------------------------------
  const handleGradeChange = (rowId, grade) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade } : row
      )
    );
    setGpaResult(null);
  };

  // -------------------------------------------------------
  // Update elective selection
  // -------------------------------------------------------
  const handleElectiveSelection = (rowId, value) => {
    const subjectId = value ? Number(value) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (!subjectId) {
          return { ...row, subjectId: "", code: "", name: "", credits: null, grade: "" };
        }

        const selected = electiveOptions.find((s) => s.id === subjectId);
        if (!selected) return row;

        return {
          ...row,
          subjectId: selected.id,
          code: selected.code,
          name: selected.name,
          credits: selected.credits,
        };
      })
    );
    setGpaResult(null);
  };

  // -------------------------------------------------------
  // GPA Calculation
  // -------------------------------------------------------
  const handleCalculate = async () => {
    if (!semester) return toast.error("Select a semester");

    const validRows = rows.filter(
      (r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE"
    );

    if (!validRows.length) return toast.error("Enter at least one grade");

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: validRows.map((r) => ({
          subjectId: r.subjectId,
          grade: r.grade,
        })),
      });

      setGpaResult({
        gpa: res.data.gpa,
        totalCredits: res.data.totalCredits,
        totalPoints: res.data.totalPoints,
      });

      toast.success("GPA saved successfully");
    } catch (err) {
      toast.error("Failed to calculate GPA");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Marksheet Download
  // -------------------------------------------------------
  const handleDownload = async () => {
    if (!semester || !gpaResult)
      return toast.error("Calculate GPA before downloading");

    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-sem-${semester}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 dark:text-white">
              GPA Calculator
            </h1>

            {profile && (
              <div className="mb-6 p-4 border rounded bg-white dark:bg-gray-800">
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department.name}</p>
                <p><b>Regulation:</b> {profile.regulation.name}</p>
              </div>
            )}

            {/* SEMESTER DROPDOWN */}
            <div className="p-4 border rounded mb-6 bg-white dark:bg-gray-800">
              <label className="font-semibold mb-1 block">Select Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                disabled={!profile || loading}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select --</option>
                {Array.from({ length: maxSemesters }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBJECT TABLE */}
            {rows.length > 0 && (
              <div className="mb-6 border rounded overflow-hidden bg-white dark:bg-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Subject</th>
                      <th className="p-3 text-left">Credits</th>
                      <th className="p-3 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowId} className="border-b">
                        <td className="p-3 font-medium">
                          {row.isElective ? "Elective" : "Mandatory"}
                        </td>
                        <td className="p-3">
                          {!row.isElective ? (
                            `${row.code} - ${row.name}`
                          ) : (
                            <select
                              value={row.subjectId || ""}
                              onChange={(e) =>
                                handleElectiveSelection(row.rowId, e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Elective</option>
                              {electiveOptions.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  disabled={isSubjectUsed(opt.id, row.rowId) && opt.id !== row.subjectId}
                                >
                                  {opt.code} - {opt.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          {row.credits !== null ? row.credits : "-"}
                        </td>
                        <td className="p-3">
                          <select
                            value={row.grade}
                            disabled={row.isElective && !row.subjectId}
                            onChange={(e) => handleGradeChange(row.rowId, e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Grade</option>
                            {GRADE_OPTIONS.map((g) => (
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
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-4">
              <button
                onClick={handleCalculate}
                disabled={!rows.length || loading}
                className="px-5 py-3 bg-blue-600 text-white rounded"
              >
                <CalcIcon size={18} /> Calculate GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownload}
                  className="px-5 py-3 bg-purple-600 text-white rounded"
                >
                  <Download size={18} /> Download PDF
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="mt-5 p-4 bg-blue-100 border rounded">
                <h2 className="text-xl font-bold">
                  GPA: {Number(gpaResult.gpa).toFixed(2)}
                </h2>
                <p>Total Credits: {gpaResult.totalCredits}</p>
                <p>Total Points: {gpaResult.totalPoints}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
