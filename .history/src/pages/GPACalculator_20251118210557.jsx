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

  /** Load profile once */
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

  /** Semester count */
  const maxSemesters = useMemo(() => {
    if (profile?.department?.semesterCount && profile.department.semesterCount > 0) {
      return profile.department.semesterCount;
    }
    return 8;
  }, [profile]);

  /** Build table rows */
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

    const electiveRows = Array.from({ length: Number(electiveCount || 0) }, (_, i) => ({
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

  /** Load subjects & build rows */
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
      setRawSubjects(subjects);

      const semInfo = semRes?.data || {};
      const electiveCount =
        typeof semInfo.electiveCount === "number"
          ? semInfo.electiveCount
          : semInfo?.elective_count ?? 0;

      const builtRows = buildRowsFromSubjects(subjects, electiveCount);
      setRows(builtRows);

      if (subjects.length === 0) toast.info("No subjects found for this semester.");
    } catch (err) {
      console.error("Subject load failed:", err);
      toast.error("Failed loading subject data");
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

  /** Grade Change Handler | RA → U */
  const handleGradeChange = (rowId, grade) => {
    const normalized = grade === "RA(0)" ? "U" : grade;
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade: normalized } : row
      )
    );
    setGpaResult(null);
  };

  /** Elective subject change */
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
          type: subj.type || "ELECTIVE",
        };
      })
    );
    setGpaResult(null);
  };

  /** Remove Row */
  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setGpaResult(null);
  };

  /** Calculate GPA */
  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select a semester");

    const gradedRows = rows.filter((r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE");
    if (gradedRows.length === 0) return toast.error("Enter valid grades");

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
      console.error(err);
      toast.error(err?.response?.data?.message || "GPA calculation failed");
    } finally {
      setLoading(false);
    }
  };

  /** Download Marksheet */
  const handleDownloadMarksheet = () => {
    if (!semester) return toast.error("Select a semester");
    if (!gpaResult) return toast.error("Calculate GPA first");

    generateGPAPDF({
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-6">
                <p className="text-sm"><b>Name:</b> {profile.name}</p>
                <p className="text-sm"><b>Department:</b> {profile.department?.name}</p>
                <p className="text-sm"><b>Regulation:</b> {profile.regulation?.name}</p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mb-8">
              <label className="block mb-2 text-sm font-medium">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden mb-8">
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg">
                    Subjects – Semester {semester}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="p-3 text-left text-xs uppercase">Type</th>
                        <th className="p-3 text-left text-xs uppercase">Subject</th>
                        <th className="p-3 text-left text-xs uppercase">Credits</th>
                        <th className="p-3 text-left text-xs uppercase">Grade</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {rows.map((row) => {
                        const isElect = row.mode === "elective";

                        return (
                          <tr key={row.rowId}>
                            <td className="p-3">{isElect ? "Elective" : "Mandatory"}</td>
                            <td className="p-3">
                              {!isElect ? (
                                <b>{row.code}</b>
                              ) : (
                                <select
                                  value={row.subjectId || ""}
                                  onChange={(e) =>
                                    handleElectiveSubjectChange(row.rowId, e.target.value)
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  <option value="">Select subject</option>
                                  {electiveOptions.map((opt) => {
                                    const disabled =
                                      isSubjectUsedInAnotherRow(opt.id, row.rowId) &&
                                      opt.id !== row.subjectId;
                                    return (
                                      <option key={opt.id} value={opt.id} disabled={disabled}>
                                        {opt.code} - {opt.name}
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </td>
                            <td className="p-3">{row.credits ?? "-"}</td>
                            <td className="p-3">
                              <select
                                value={row.grade || ""}
                                onChange={(e) =>
                                  handleGradeChange(row.rowId, e.target.value)
                                }
                                className="px-2 py-1 border rounded"
                              >
                                <option value="">Select</option>
                                {GRADE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleRemoveRow(row.rowId)}
                                className="text-red-600"
                              >
                                <XCircle size={20} />
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

            <div className="flex flex-wrap justify-between gap-4">
              <button
                onClick={handleCalculateGPA}
                disabled={!semester || rows.length === 0 || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded"
              >
                <CalcIcon size={18} /> Calculate & Save GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded"
                >
                  <Download size={18} /> Download Marksheet (PDF)
                </button>
              )}

              {gpaResult && (
                <div className="bg-blue-50 border rounded p-6 text-center">
                  <h2 className="text-3xl font-bold">
                    {Number(gpaResult.gpa).toFixed(2)}
                  </h2>
                  <p>GPA for Semester {semester}</p>
                  <p className="text-xs mt-1">
                    Credits: {gpaResult.totalCredits} | Points: {gpaResult.totalPoints}
                  </p>
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
