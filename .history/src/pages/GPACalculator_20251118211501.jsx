// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useMemo } from "react";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, FileBadge, Award, Calculator as CalcIcon, XCircle } from "lucide-react";

// PDF Generators
import { generateGPAPDF } from "../utils/GPAPDFGenerator";
import { generateGPAPDFPro } from "../utils/GPAPDFGeneratorPro";

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

    if (!value || !profile?.regulation?.id || !profile?.department?.id) return;

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
      const electiveCount = semInfo?.electiveCount ?? semInfo.elective_count ?? 0;

      setRawSubjects(subjects);
      setRows(buildRowsFromSubjects(subjects, electiveCount));

      if (subjects.length === 0) toast.info("No subjects configured for this semester.");
    } catch {
      toast.error("Failed loading subject / semester data");
    } finally {
      setLoading(false);
    }
  };

  const electiveOptions = useMemo(
    () => rawSubjects.filter((s) => !!s.isElective),
    [rawSubjects]
  );

  const handleGradeChange = (rowId, grade) => {
    const normalized = grade === "RA(0)" ? "U" : grade;
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, grade: normalized } : row
      )
    );
    setGpaResult(null);
  };

  const handleElectiveSubjectChange = (rowId, subjectIdStr) => {
    const subjectId = subjectIdStr ? Number(subjectIdStr) : null;
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        if (!subjectId)
          return { ...row, subjectId: "", code: "", name: "", credits: null, grade: "" };

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

  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setGpaResult(null);
  };

  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Please select a semester");

    const gradedRows = rows.filter((r) => r.subjectId && r.grade && r.grade !== "NOT_HAVE");
    if (gradedRows.length === 0) return toast.error("Please enter at least one grade");

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: gradedRows.map((r) => ({
          subjectId: r.subjectId,
          grade: r.grade,
        })),
      });

      const d = res.data;
      setGpaResult({ gpa: d.gpa, totalCredits: d.totalCredits, totalPoints: d.totalPoints });
      toast.success("GPA calculated & saved!");
    } catch (err) {
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  // 📄 BASIC PDF
  const downloadBasicPDF = () => {
    generateGPAPDF({ profile, semester, rows, gpaResult });
  };

  // 📜 PRO OFFICIAL PDF
  const downloadProPDF = () => {
    generateGPAPDFPro({ profile, semester, rows, gpaResult });
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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border mb-6">
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department?.name}</p>
                <p><b>Regulation:</b> {profile.regulation?.name}</p>
              </div>
            )}

            {/* Semester Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border mb-8">
              <label className="block mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                ))}
              </select>
            </div>

            {/* Subject Table */}
            {rows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Credits</th>
                      <th className="px-4 py-2">Grade</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowId}>
                        <td className="px-4 py-2">{row.isElective ? "Elective" : "Mandatory"}</td>
                        <td className="px-4 py-2">{row.code} - {row.name}</td>
                        <td className="px-4 py-2">{row.credits ?? "-"}</td>
                        <td className="px-4 py-2">
                          <select
                            value={row.grade || ""}
                            onChange={(e) => handleGradeChange(row.rowId, e.target.value)}
                            className="border px-2 py-1"
                          >
                            <option value="">Select</option>
                            {GRADE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => handleRemoveRow(row.rowId)}>
                            <XCircle className="text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleCalculateGPA}
                className="bg-blue-600 text-white px-5 py-2 rounded flex items-center gap-2"
              >
                <CalcIcon size={20} /> Calculate & Save
              </button>

              {gpaResult && (
                <>
                  <button
                    onClick={downloadBasicPDF}
                    className="bg-purple-600 text-white px-5 py-2 rounded flex items-center gap-2"
                  >
                    <Download size={20} /> Download Basic PDF
                  </button>

                  <button
                    onClick={downloadProPDF}
                    className="bg-yellow-600 text-white px-5 py-2 rounded flex items-center gap-2"
                  >
                    <Award size={20} /> Download Pro Marksheet
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
