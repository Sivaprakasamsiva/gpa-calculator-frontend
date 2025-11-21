// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon, XCircle } from "lucide-react";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";
import SearchableDropdown from "../components/SearchableDropdown";

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");

  const [rawSubjects, setRawSubjects] = useState([]);
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [electiveDefaultCredits, setElectiveDefaultCredits] = useState(3);

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
    if (profile?.department?.semesterCount > 0) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

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

    const electiveRows = Array.from({ length: Number(electiveCount) || 0 }, (_, i) => ({
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
      toast.error("Profile missing regulation or department");
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

      if (subjects.length === 0) toast.info("No subjects found.");
    } catch (err) {
      console.error("Failed loading subjects:", err);
      toast.error("Failed to load subject data");
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

  const handleGradeChange = (rowId, grade) => {
    const normalized = grade === "RA(0)" ? "U" : grade;

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;

        if (r.isElective && !r.boundToSubject) {
          return { ...r, grade: normalized, points: 3 };
        }

        const pts = normalized ? GRADE_POINT_MAP[normalized] ?? null : null;

        return { ...r, grade: normalized, points: pts };
      })
    );

    setGpaResult(null);
  };

  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;

        if (!subjectId) {
          return {
            ...r,
            subjectId: "",
            code: "",
            name: `Elective ${r.slotNumber}`,
            credits: electiveDefaultCredits,
            points: 3,
            boundToSubject: false,
          };
        }

        const subj = electiveOptions.find((s) => s.id === subjectId);
        if (!subj) return r;

        const normalized = r.grade === "RA(0)" ? "U" : r.grade;
        const pts = normalized ? GRADE_POINT_MAP[normalized] ?? null : null;

        return {
          ...r,
          subjectId: subj.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          type: subj.type || "ELECTIVE",
          grade: normalized,
          points: pts,
          boundToSubject: true,
        };
      })
    );

    setGpaResult(null);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
    setGpaResult(null);
  };

  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Please select semester");

    const gradedRows = rows.filter(
      (r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE"
    );

    if (gradedRows.length === 0) {
      return toast.error("Enter at least one valid grade");
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
      setGpaResult(res.data);
      toast.success("GPA Saved!");
    } catch (err) {
      console.error("GPA calc error:", err);
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarksheet = async () => {
    if (!semester) return toast.error("Select semester");
    if (!gpaResult) return toast.error("Calculate GPA first");
    if (!profile) return toast.error("Profile not loaded");

    await generateGPAPDF({ profile, semester, rows, gpaResult });
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold dark:text-white mb-8">
              GPA Calculator
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
              <label className="block text-sm mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Subjects – Semester {semester}</h3>
                  <p className="text-xs text-gray-500">
                    Mandatory subjects are fixed. Elective subjects can be selected or left unselected.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs">Type</th>
                        <th className="px-6 py-3 text-left text-xs">Code / Subject</th>
                        <th className="px-6 py-3 text-left text-xs">Credits</th>
                        <th className="px-6 py-3 text-left text-xs">Grade</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row) => {
                        const isElect = row.mode === "elective";
                        const subjectLabel =
                          row.code && row.name ? `${row.code} - ${row.name}` : "";

                        return (
                          <tr key={row.rowId}>
                            <td className="px-6 py-4">{isElect ? "Elective" : "Mandatory"}</td>

                            <td className="px-6 py-4">
                              {!isElect ? (
                                <>
                                  <b>{row.code}</b> – {row.name}
                                </>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-xs">Elective {row.slotNumber}</span>

                                  {/* 🔍 SEARCHABLE DROPDOWN */}
                                  <SearchableDropdown
                                    value={row.subjectId}
                                    options={electiveOptions.filter(
                                      (opt) =>
                                        !isSubjectUsedInAnotherRow(opt.id, row.rowId) ||
                                        opt.id === row.subjectId
                                    )}
                                    onChange={(val) =>
                                      handleElectiveSubjectChange(row.rowId, val)
                                    }
                                  />

                                  {subjectLabel ? (
                                    <span className="text-xs">Selected: {subjectLabel}</span>
                                  ) : (
                                    <span className="text-xs">
                                      Unselected — shown as: {row.name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">{row.credits}</td>

                            <td className="px-6 py-4">
                              <select
                                value={row.grade}
                                onChange={(e) =>
                                  handleGradeChange(row.rowId, e.target.value)
                                }
                                className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700"
                              >
                                <option value="">Select Grade</option>
                                {GRADE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>

                              {isElect && !row.boundToSubject && (
                                <p className="text-[11px] text-gray-500">
                                  Unselected → fixed points = 3
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleRemoveRow(row.rowId)}
                                className="text-red-500"
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

            <div className="flex justify-between mt-6">
              <button
                onClick={handleCalculateGPA}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg"
              >
                <CalcIcon size={20} /> Calculate & Save GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg"
                >
                  <Download size={20} /> Download Marksheet (PDF)
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="bg-blue-50 border mt-6 p-6 text-center rounded-lg">
                <div className="text-3xl font-bold">
                  {Number(gpaResult.gpa).toFixed(2)}
                </div>
                <div className="text-sm">GPA for Semester {semester}</div>
                <div className="text-xs">
                  Total Credits: {gpaResult.totalCredits} | Total Points:{" "}
                  {gpaResult.totalPoints}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
