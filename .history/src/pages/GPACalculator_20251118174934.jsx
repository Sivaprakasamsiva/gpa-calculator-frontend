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

  // ----------------------------------------------------
  // Load profile once
  // ----------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // ----------------------------------------------------
  // Allowed semester count
  // ----------------------------------------------------
  const maxSemesters = useMemo(() => {
    const count = profile?.department?.semesterCount;
    return count && count > 0 ? count : 8;
  }, [profile]);

  // ----------------------------------------------------
  // Build rows based on DB elective_count
  // ----------------------------------------------------
  const buildRowsFromSubjects = (subjects, electiveCount) => {
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
      type: s.type ?? "CORE",
      grade: "",
    }));

    const electiveRows = Array.from({ length: electiveCount }, (_, index) => ({
      rowId: `ELEC-${index + 1}`,
      mode: "elective",
      isElective: true,
      slotNumber: index + 1,
      subjectId: "",
      code: "",
      name: "",
      credits: null,
      type: "ELECTIVE",
      grade: "",
    }));

    return [...mandatoryRows, ...electiveRows];
  };

  // ----------------------------------------------------
  // Handle semester selection
  // ----------------------------------------------------
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile missing required details");
      return;
    }

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
        profile.department.id,
        profile.regulation.id,
        Number(value)
      );
      const electiveCount = semRes?.data?.elective_count ?? 0;

      const builtRows = buildRowsFromSubjects(subjects, electiveCount);
      setRows(builtRows);

    } catch (err) {
      console.error("Semester load failed:", err);
      toast.error("Failed to load semester info");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Elective helpers
  // ----------------------------------------------------
  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => s.isElective),
    [rawSubjects]
  );

  const isSubjectUsed = (subjectId, currentRowId) =>
    rows.some(
      (r) => r.rowId !== currentRowId && r.isElective && r.subjectId === subjectId
    );

  // ----------------------------------------------------
  // On grade change
  // ----------------------------------------------------
  const handleGradeChange = (rowId, grade) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, grade } : r))
    );
    setGpaResult(null);
  };

  // ----------------------------------------------------
  // On elective subject choose
  // ----------------------------------------------------
  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (!subjectId) {
          return { ...row, subjectId: "", code: "", name: "", credits: null, grade: "" };
        }

        const subj = electiveOptions.find((s) => s.id === subjectId);
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
  };

  // ----------------------------------------------------
  // GPA calculation
  // ----------------------------------------------------
  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select Semester first");

    const gradedRows = rows.filter(
      (r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE"
    );

    if (gradedRows.length === 0) return toast.error("Enter at least one grade");

    const payload = {
      semester: Number(semester),
      subjects: gradedRows.map((r) => ({
        subjectId: r.subjectId,
        grade: r.grade,
      })),
    };

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA(payload);
      setGpaResult({
        gpa: res.data.gpa,
        totalCredits: res.data.totalCredits,
        totalPoints: res.data.totalPoints,
      });
      toast.success("GPA saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("GPA calculation failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Download PDF
  // ----------------------------------------------------
  const handleDownloadMarksheet = async () => {
    if (!semester) return toast.error("Select a semester");
    if (!gpaResult) return toast.error("Calculate GPA first");

    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-semester-${semester}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // UI Rendering
  // ----------------------------------------------------
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
              <div className="bg-white dark:bg-gray-800 border p-4 mb-6 rounded">
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department?.name}</p>
                <p><b>Regulation:</b> {profile.regulation?.name}</p>
              </div>
            )}

            {/* Semester selection */}
            <div className="bg-white dark:bg-gray-800 border p-6 mb-8 rounded">
              <label className="block mb-2 font-medium">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                disabled={!profile}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => (
                  <option value={i + 1} key={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Subjects table */}
            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border rounded mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Subject</th>
                      <th className="p-3 text-left">Credits</th>
                      <th className="p-3 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowId} className="border-b">
                        <td className="p-3 font-semibold">
                          {row.isElective ? "Elective" : "Mandatory"}
                        </td>

                        <td className="p-3">
                          {!row.isElective ? (
                            `${row.code} - ${row.name}`
                          ) : (
                            <select
                              value={row.subjectId || ""}
                              onChange={(e) =>
                                handleElectiveSubjectChange(
                                  row.rowId,
                                  e.target.value
                                )
                              }
                              className="p-2 border rounded w-full"
                            >
                              <option value="">Select Elective</option>
                              {electiveOptions.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  disabled={
                                    isSubjectUsed(opt.id, row.rowId) &&
                                    opt.id !== row.subjectId
                                  }
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
                            value={row.grade || ""}
                            disabled={row.isElective && !row.subjectId}
                            onChange={(e) => handleGradeChange(row.rowId, e.target.value)}
                            className="p-2 border rounded w-full"
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

            {/* GPA Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleCalculateGPA}
                disabled={!rows.length || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded"
              >
                <CalcIcon size={18} /> Calculate & Save
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded"
                >
                  <Download size={18} /> Download PDF
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="mt-4 bg-blue-100 p-4 rounded">
                <h2 className="font-bold text-lg">
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
