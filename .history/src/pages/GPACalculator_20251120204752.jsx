// ===============================
// GPA CALCULATOR (PATCHED - PART 1)
// WITH SEARCHABLE ELECTIVE DROPDOWN
// ===============================

import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";

import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";

import { Download, Calculator as CalcIcon, XCircle } from "lucide-react";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";

// ⭐ NEW SEARCHABLE SELECT COMPONENT
import SearchableDropdown from "../components/SearchableDropdown";

const GPACalculator = () => {
  // ----------------------------------------
  // STATE
  // ----------------------------------------
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");

  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // default credits for unselected elective
  const [electiveDefaultCredits, setElectiveDefaultCredits] = useState(3);

  // ----------------------------------------
  // LOAD PROFILE
  // ----------------------------------------
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

  // ----------------------------------------
  // SEMESTER COUNT
  // ----------------------------------------
  const maxSemesters = useMemo(() => {
    if (
      profile?.department?.semesterCount &&
      profile.department.semesterCount > 0
    ) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

  // ----------------------------------------
  // GRADE → POINT MAP
  // ----------------------------------------
  const GRADE_POINT_MAP = {
    O: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    U: 0,
    RA: 0,
    "RA(0)": 0,
  };

  // ----------------------------------------
  // BUILD ROWS
  // ----------------------------------------
  const buildRowsFromSubjects = (subjectList, electiveCount) => {
    if (!Array.isArray(subjectList)) return [];

    const mandatory = subjectList.filter((s) => !s.isElective);
    const electives = subjectList.filter((s) => !!s.isElective);

    const defaultElectiveCredits =
      electives.length > 0 ? electives[0].credits ?? 3 : 3;

    setElectiveDefaultCredits(defaultElectiveCredits);

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
      points: null,
    }));

    const electiveRows = Array.from(
      { length: Number(electiveCount || 0) },
      (_, i) => ({
        rowId: `ELEC-${i + 1}`,
        mode: "elective",
        isElective: true,
        slotNumber: i + 1,
        subjectId: "",
        code: "",
        name: `Elective ${i + 1}`,
        credits: defaultElectiveCredits,
        type: "ELECTIVE",
        grade: "",
        points: 3,
        boundToSubject: false,
      })
    );

    return [...mandatoryRows, ...electiveRows];
  };

  // ----------------------------------------
  // WHEN SEMESTER CHANGES → LOAD SUBJECTS
  // ----------------------------------------
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
      toast.error("Failed loading data");
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------
  // FILTER ELECTIVE OPTIONS
  // ----------------------------------------
  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => !!s.isElective),
    [rawSubjects]
  );

  // Check if elective already used in other row
  const isSubjectUsedInAnotherRow = (subjectId, currentRowId) => {
    if (!subjectId) return false;
    return rows.some(
      (r) => r.rowId !== currentRowId && r.isElective && r.subjectId === subjectId
    );
  };

  // ----------------------------------------
  // GRADE CHANGE HANDLER
  // ----------------------------------------
  const handleGradeChange = (rowId, grade) => {
    const normalizedGrade = grade === "RA(0)" ? "U" : grade;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        // If elective and unselected → fixed points = 3
        if (row.isElective && !row.boundToSubject) {
          return {
            ...row,
            grade: normalizedGrade,
            points: 3,
          };
        }

        const pts = normalizedGrade
          ? GRADE_POINT_MAP[normalizedGrade] ?? null
          : null;

        return {
          ...row,
          grade: normalizedGrade,
          points: pts,
        };
      })
    );

    setGpaResult(null);
  };

  // ----------------------------------------
  // ELECTIVE SUBJECT SELECTION HANDLER
  // ----------------------------------------
  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        // User cleared selection -> reset to "Elective X"
        if (!subjectId) {
          return {
            ...row,
            subjectId: "",
            code: "",
            name: `Elective ${row.slotNumber}`,
            credits: electiveDefaultCredits,
            grade: row.grade || "",
            points: 3,
            boundToSubject: false,
          };
        }

        const subj = electiveOptions.find((s) => s.id === subjectId);
        if (!subj) return row;

        const gradeVal = row.grade || "";
        const normalizedGrade = gradeVal === "RA(0)" ? "U" : gradeVal;

        const pts =
          normalizedGrade !== "" ? GRADE_POINT_MAP[normalizedGrade] ?? null : null;

        return {
          ...row,
          subjectId: subj.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          type: subj.type || "ELECTIVE",
          grade: normalizedGrade,
          points: pts,
          boundToSubject: true,
        };
      })
    );

    setGpaResult(null);
  };

  // ----------------------------------------
  // REMOVE A ROW (ELECTIVE ONLY)
  // ----------------------------------------
  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setGpaResult(null);
  };

  // ----------------------------------------
  // CALCULATE GPA BUTTON CLICK
  // ----------------------------------------
  const handleCalculateGPA = async () => {
    if (!semester) {
      toast.error("Please select a semester");
      return;
    }

    // Only include real subjects
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

      toast.success("GPA calculated & saved!");
    } catch (err) {
      console.error("GPA error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Failed to calculate GPA"
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // GENERATE PDF
  // ----------------------------------------
  const handleDownloadMarksheet = async () => {
    if (!semester) {
      toast.error("Select a semester");
      return;
    }
    if (!gpaResult) {
      toast.error("Calculate & save GPA first");
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

            {/* ---------- PROFILE CARD ---------- */}
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

            {/* ---------- SEMESTER DROPDOWN ---------- */}
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

            {/* ---------- SUBJECT TABLE ---------- */}
            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subjects – Semester {semester}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mandatory subjects are fixed. Electives allow searchable
                    selection or can remain unselected.
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

                        return (
                          <tr
                            key={row.rowId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {/* TYPE */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {isElect ? "Elective" : "Mandatory"}
                            </td>

                            {/* SUBJECT CELL */}
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
                                    Elective {row.slotNumber}
                                  </span>

                                  {/* 🔍 SEARCHABLE DROPDOWN */}
                                  <SearchableDropdown
                                    value={row.subjectId}
                                    options={electiveOptions.filter(
                                      (opt) =>
                                        !isSubjectUsedInAnotherRow(
                                          opt.id,
                                          row.rowId
                                        ) || opt.id === row.subjectId
                                    )}
                                    onChange={(val) =>
                                      handleElectiveSubjectChange(
                                        row.rowId,
                                        val
                                      )
                                    }
                                  />

                                  {row.subjectId ? (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Selected: {row.code} – {row.name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Unselected — shows as: {row.name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* CREDITS */}
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {row.credits}
                            </td>

                            {/* GRADE DROPDOWN */}
                            <td className="px-6 py-4">
                              <select
                                value={row.grade || ""}
                                onChange={(e) =>
                                  handleGradeChange(row.rowId, e.target.value)
                                }
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Select Grade</option>
                                {GRADE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {isElect && !row.boundToSubject && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                  Unselected elective → fixed points = 3
                                </p>
                              )}
                            </td>

                            {/* REMOVE BUTTON */}
                            <td className="px-6 py-4">
                              {isElect && (
                                <button
                                  onClick={() => handleRemoveRow(row.rowId)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <XCircle size={22} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
