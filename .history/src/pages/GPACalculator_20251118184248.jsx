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
  const [semesterMeta, setSemesterMeta] = useState(null);

  // original subjects from API
  const [rawSubjects, setRawSubjects] = useState([]);

  // rows shown in UI (mandatory rows + elective slots)
  const [rows, setRows] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Load profile once
  // --------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // --------------------------------------------------
  // Build rows
  // --------------------------------------------------
  const buildRowsFromSubjects = (list, electiveCount) => {
    const mandatory = list.filter((s) => !s.isElective);
    const electiveSubjects = list.filter((s) => s.isElective);

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

    // create elective slots equal to electiveCount
    const electiveRows = Array.from({ length: electiveCount }, (_, i) => ({
      rowId: `ELEC-${i + 1}`,
      mode: "elective",
      isElective: true,
      subjectId: "",
      code: "",
      name: "",
      credits: null,
      type: "ELECTIVE",
      grade: "",
      slotNumber: i + 1,
    }));

    return [...mandatoryRows, ...electiveRows];
  };

  // --------------------------------------------------
  // Semester changed
  // --------------------------------------------------
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setRows([]);
    setRawSubjects([]);
    setSemesterMeta(null);

    if (!value || !profile) return;

    try {
      setLoading(true);

      // fetch semester meta from backend (admin semesters API)
      const semMetaResp = await (await import("../services/api")).adminAPI.getSemesters(
        profile.regulation.id,
        profile.department.id
      );

      const found = semMetaResp.data?.find(
        (s) => Number(s.number) === Number(value)
      );

      if (!found) {
        toast.error("Semester config not found");
        return;
      }

      setSemesterMeta(found);

      // fetch subjects
      const subResp = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      const list = Array.isArray(subResp.data) ? subResp.data : [];
      setRawSubjects(list);

      const built = buildRowsFromSubjects(list, found.electiveCount);
      setRows(built);

      if (list.length === 0) toast.info("No subjects configured for this semester");
    } catch (err) {
      console.error(err);
      toast.error("Failed loading subject / semester data");
    } finally {
      setLoading(false);
    }
  };

  // elective list
  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => s.isElective),
    [rawSubjects]
  );

  // prevent duplicate elective selection
  const isSubjectUsedInAnotherRow = (subjectId, currentRowId) => {
    return rows.some(
      (r) => r.rowId !== currentRowId && r.subjectId === subjectId
    );
  };

  // --------------------------------------------------
  // Grade Change
  // --------------------------------------------------
  const handleGradeChange = (rowId, grade) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade } : row
      )
    );
    setGpaResult(null);
  };

  // --------------------------------------------------
  // Elective Select Change
  // --------------------------------------------------
  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        if (!subjectId) {
          return { ...row, subjectId: "", code: "", name: "", credits: null, grade: "" };
        }

        const subj = electiveOptions.find((s) => s.id === subjectId);
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

  // --------------------------------------------------
  // Remove Subject (NOT HAVE)
  // --------------------------------------------------
  const handleRemoveSubject = (rowId) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setGpaResult(null);
  };

  // --------------------------------------------------
  // CALCULATE GPA
  // --------------------------------------------------
  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Please select a semester");

    const validRows = rows.filter((r) => r.subjectId && r.grade);

    if (validRows.length === 0) return toast.error("Enter at least one grade");

    const payload = {
      semester: Number(semester),
      subjects: validRows.map((r) => ({
        subjectId: r.subjectId,
        grade: r.grade,
      })),
    };

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA(payload);
      setGpaResult(res.data);
      toast.success("GPA saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed!");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DOWNLOAD PDF
  // --------------------------------------------------
  const handleDownloadMarksheet = async () => {
    if (!gpaResult) return toast.error("Calculate first!");

    try {
      const res = await studentAPI.getMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-sem-${semester}.pdf`;
      a.click();
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  // --------------------------------------------------
  // UI render
  // --------------------------------------------------
  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">
            GPA Calculator
          </h1>

          {/* SEMESTER SELECT */}
          {profile && (
            <div className="mb-6">
              <label className="font-medium dark:text-white">Semester</label>
              <select
                className="w-full p-2 mt-1 border rounded"
                value={semester}
                disabled={loading}
                onChange={(e) => handleSemesterChange(e.target.value)}
              >
                <option value="">Select Semester</option>
                {Array.from(
                  { length: profile.department.semesterCount || 8 },
                  (_, i) => i + 1
                ).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SUBJECT TABLE */}
          {rows.length > 0 && (
            <div className="overflow-x-auto w-full border rounded bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Credits</th>
                    <th className="p-3 text-left">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isElect = row.isElective;
                    return (
                      <tr key={row.rowId} className="border-b dark:border-gray-700">
                        <td className="p-3 font-medium dark:text-white">
                          {isElect ? `Elective` : "Mandatory"}
                        </td>
                        <td className="p-3 dark:text-white">
                          {!isElect ? (
                            <>
                              <b>{row.code}</b> - {row.name}
                            </>
                          ) : (
                            <select
                              className="border p-2 rounded bg-white dark:bg-gray-700 dark:text-white"
                              value={row.subjectId || ""}
                              onChange={(e) =>
                                handleElectiveSubjectChange(
                                  row.rowId,
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select Elective</option>
                              {electiveOptions.map((s) => (
                                <option
                                  key={s.id}
                                  value={s.id}
                                  disabled={isSubjectUsedInAnotherRow(
                                    s.id,
                                    row.rowId
                                  )}
                                >
                                  {s.code} - {s.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-3 dark:text-white">
                          {row.credits || "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <select
                              className="border p-2 rounded bg-white dark:bg-gray-700 dark:text-white"
                              value={row.grade || ""}
                              disabled={isElect && !row.subjectId}
                              onChange={(e) =>
                                handleGradeChange(row.rowId, e.target.value)
                              }
                            >
                              <option value="">Select</option>
                              {GRADE_OPTIONS.map((g) => (
                                <option key={g.value} value={g.value}>
                                  {g.label}
                                </option>
                              ))}
                            </select>

                            <button
                              className="bg-red-500 text-white px-2 rounded hover:bg-red-600"
                              onClick={() => handleRemoveSubject(row.rowId)}
                            >
                              Not Have
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ACTIONS */}
          {rows.length > 0 && (
            <div className="mt-4 flex gap-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                onClick={handleCalculateGPA}
                disabled={loading}
              >
                <CalcIcon size={18} className="inline mr-1" /> Calculate & Save
              </button>

              {gpaResult && (
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded"
                  onClick={handleDownloadMarksheet}
                >
                  <Download size={18} className="inline mr-1" />
                  Download Marksheet
                </button>
              )}
            </div>
          )}

          {/* RESULT */}
          {gpaResult && (
            <div className="mt-4 p-4 bg-blue-100 rounded text-center text-lg font-bold">
              GPA: {Number(gpaResult.gpa).toFixed(2)}
              <div className="text-sm font-normal">
                Credits: {gpaResult.totalCredits} | Points:{" "}
                {gpaResult.totalPoints}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
