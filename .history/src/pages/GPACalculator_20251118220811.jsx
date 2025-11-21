// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon, XCircle } from "lucide-react";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");

  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const maxSemesters = useMemo(() => {
    if (
      profile?.department?.semesterCount &&
      profile.department.semesterCount > 0
    ) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

  const buildRowsFromSubjects = (subjectList, electiveCount) => {
    if (!Array.isArray(subjectList)) return [];

    const mandatory = subjectList.filter((s) => !s.isElective);
    const electives = subjectList.filter((s) => !!s.isElective);

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

    const count = Number(electiveCount || 0);
    const electiveRows = Array.from({ length: count }, (_, i) => ({
      rowId: `ELEC-${i + 1}`,
      mode: "elective",
      isElective: true,
      slotNumber: i + 1,
      subjectId: "",
      code: "",
      name: "",
      credits: null,
      type: "ELECTIVE",
      grade: "",
    }));

    return [...mandatoryRows, ...electiveRows];
  };

  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile is missing regulation/department");
      return;
    }

    try {
      setLoading(true);

      const regId = profile.regulation.id;
      const deptId = profile.department.id;
      const semNum = Number(value);

      const [subRes, semRes] = await Promise.all([
        studentAPI.getSubjects(regId, deptId, semNum),
        studentAPI.getSemesterDetails(deptId, regId, semNum),
      ]);

      const subjects = Array.isArray(subRes.data) ? subRes.data : [];
      const semInfo = semRes?.data || {};

      const electiveCount =
        typeof semInfo.electiveCount === "number"
          ? semInfo.electiveCount
          : semInfo?.elective_count ?? 0;

      setRawSubjects(subjects);

      const builtRows = buildRowsFromSubjects(subjects, electiveCount);
      setRows(builtRows);

      if (subjects.length === 0) {
        toast.info("No subjects configured for this semester.");
      }
    } catch (err) {
      console.error("Failed loading subject / semester data:", err);
      toast.error("Failed loading subject / semester data");
    } finally {
      setLoading(false);
    }
  };

  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => !!s.isElective),
    [rawSubjects]
  );

  const isSubjectUsedInAnotherRow = (subjectId, currentRowId) => {
    if (!subjectId) return false;
    return rows.some(
      (r) => r.rowId !== currentRowId && r.isElective && r.subjectId === subjectId
    );
  };

  /*** MODIFIED (RA → U) ***/
  const handleGradeChange = (rowId, grade) => {
    const normalizedGrade = grade === "RA(0)" ? "U" : grade;
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade: normalizedGrade } : row
      )
    );
    setGpaResult(null);
  };

  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;

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

        const subj = electiveOptions.find((s) => s.id === subjectId);
        if (!subj) return row;

        return {
          ...row,
          subjectId: subj.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          type: subj.type || "ELECTIVE",
        };
      })
    );
    setGpaResult(null);
  };

  /*** NEW – REMOVE ROW BUTTON  ***/
  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setGpaResult(null);
  };

  const handleCalculateGPA = async () => {
    if (!semester) {
      toast.error("Please select a semester");
      return;
    }

    const gradedRows = rows.filter(
      (r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE"
    );

    if (gradedRows.length === 0) {
      toast.error("Please enter at least one valid grade");
      return;
    }

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
      const data = res.data;

      setGpaResult({
        gpa: data.gpa,
        totalCredits: data.totalCredits,
        totalPoints: data.totalPoints,
      });

      toast.success("GPA calculated and saved successfully!");
    } catch (err) {
      console.error("calculateGPA error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to calculate GPA";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 🔽 FRONTEND PDF GENERATION (no backend call)
  const handleDownloadMarksheet = async () => {
    if (!semester) {
      toast.error("Select a semester first");
      return;
    }
    if (!gpaResult) {
      toast.error("Calculate & save GPA before downloading marksheet");
      return;
    }
    if (!profile) {
      toast.error("Profile not loaded");
      return;
    }

    await generateGPAPDF({
      profile,
      semester,
      rows,
      gpaResult,
    });
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <span className="font-semibold">Name:</span> {profile.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <span className="font-semibold">Department:</span>{" "}
                  {profile.department?.name}{" "}
                  {profile.department?.code
                    ? `(${profile.department.code})`
                    : ""}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <span className="font-semibold">Regulation:</span>{" "}
                  {profile.regulation?.name}{" "}
                  {profile.regulation?.year
                    ? `(${profile.regulation.year})`
                    : ""}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={!profile || loading}
                  >
                    <option value="">Select Semester</option>
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map(
                      (s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subjects – Semester {semester}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mandatory subjects are fixed. For each Elective row, select
                    the elective paper and grade.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Code / Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {rows.map((row) => {
                        const isElect = row.mode === "elective";
                        const subjectLabel =
                          row.code && row.name
                            ? `${row.code} - ${row.name}`
                            : "";

                        return (
                          <tr
                            key={row.rowId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {isElect ? "Elective" : "Mandatory"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {!isElect ? (
                                <>
                                  <span className="font-semibold">
                                    {row.code}
                                  </span>{" "}
                                  – {row.name}
                                </>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Elective Paper {row.slotNumber}
                                  </span>
                                  <select
                                    value={row.subjectId || ""}
                                    onChange={(e) =>
                                      handleElectiveSubjectChange(
                                        row.rowId,
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                  >
                                    <option value="">
                                      Select Elective Subject
                                    </option>
                                    {electiveOptions.map((opt) => {
                                      const disabled =
                                        isSubjectUsedInAnotherRow(
                                          opt.id,
                                          row.rowId
                                        ) && opt.id !== row.subjectId;
                                      return (
                                        <option
                                          key={opt.id}
                                          value={opt.id}
                                          disabled={disabled}
                                        >
                                          {opt.code} - {opt.name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  {subjectLabel && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Selected: {subjectLabel}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {row.credits != null ? row.credits : "-"}
                            </td>

                            <td className="px-6 py-4">
                              <select
                                value={row.grade || ""}
                                onChange={(e) =>
                                  handleGradeChange(row.rowId, e.target.value)
                                }
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                disabled={isElect && !row.subjectId}
                              >
                                <option value="">Select Grade</option>
                                {GRADE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              {isElect && !row.subjectId && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                  Select an elective subject first.
                                </p>
                              )}
                            </td>

                            {/* REMOVE BUTTON */}
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleRemoveRow(row.rowId)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove this subject"
                              >
                                <XCircle size={22} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleCalculateGPA}
                  disabled={!semester || rows.length === 0 || loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CalcIcon size={20} />
                  <span>Calculate & Save GPA</span>
                </button>

                {gpaResult && (
                  <button
                    onClick={handleDownloadMarksheet}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Download size={20} />
                    <span>Download Marksheet (PDF)</span>
                  </button>
                )}
              </div>

              {gpaResult && (
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {gpaResult.gpa?.toFixed
                      ? gpaResult.gpa.toFixed(2)
                      : Number(gpaResult.gpa || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    GPA for Semester {semester}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Total Credits: {gpaResult.totalCredits} | Total Points:{" "}
                    {gpaResult.totalPoints}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
