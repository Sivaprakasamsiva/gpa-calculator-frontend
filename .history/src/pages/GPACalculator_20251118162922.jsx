// ================================
// src/pages/GPACalculator.jsx (FIXED)
// ================================

import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon } from "lucide-react";

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const { setLoading } = useAuth();

  // -----------------------------------
  // LOAD STUDENT PROFILE ON PAGE LOAD
  // -----------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        console.error("❌ Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setLoading]);

  // =====================================
  // HANDLE SEMESTER CHANGE & LOAD SUBJECTS
  // =====================================
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setSelectedSubjects([]);
    setGpaResult(null);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile missing regulation or department data");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getSubjects(
        Number(profile.regulation.id),
        Number(profile.department.id),
        Number(value) // Always semester number, not ID
      );

      const data = Array.isArray(res.data) ? res.data : [];

      // Format subjects for GPA table
      const formatted = data.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        type: s.type,               // MUST contain CORE / LAB / ELECTIVE
        isElective: s.isElective,   // Boolean from backend
        grade: "",
      }));

      // Sort: mandatory first, electives last
      formatted.sort((a, b) => {
        if (a.isElective === b.isElective) return a.code.localeCompare(b.code);
        return a.isElective ? 1 : -1;
      });

      setSelectedSubjects(formatted);

      if (formatted.length === 0) toast.info("No subjects found for this semester");

      console.log("📌 Subjects Loaded:", formatted);

    } catch (err) {
      console.error("❌ Subject fetch error:", err);
      toast.error("Failed to load semester subjects");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // HANDLE GRADE VALUE CHANGE
  // =====================================
  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, grade } : s
      )
    );
    setGpaResult(null);
  };

  // ===============================
  // HANDLE GPA CALCULATION
  // ===============================
  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select semester first");

    const gradedSubjects = selectedSubjects.filter((s) => s.grade);

    if (gradedSubjects.length === 0)
      return toast.error("Choose at least one grade");

    const payload = {
      semester: Number(semester),
      subjects: gradedSubjects.map((s) => ({
        subjectId: s.id,
        grade: s.grade,
      })),
    };

    setLoading(true);
    try {
      const res = await studentAPI.calculateGPA(payload);

      setGpaResult({
        gpa: res.data.gpa,
        totalCredits: res.data.totalCredits,
        totalPoints: res.data.totalPoints,
      });

      toast.success("GPA Calculated & Saved!");
    } catch (err) {
      console.error("❌ GPA error:", err);
      toast.error("GPA calculation failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // HANDLE MARKSHEET DOWNLOAD (PDF)
  // =====================================
  const handleDownloadMarksheet = async () => {
    if (!semester) return toast.error("Select semester first");
    if (!gpaResult) return toast.error("Calculate GPA first");

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-semester-${semester}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ PDF error:", err);
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // UI RENDER
  // =====================================
  const maxSemesters =
    profile?.department?.semesterCount > 0
      ? profile.department.semesterCount
      : 8;

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">

            <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

            {/* PROFILE */}
            {profile && (
              <div className="bg-white dark:bg-gray-800 border p-4 rounded mb-6">
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department?.name}</p>
                <p><b>Regulation:</b> {profile.regulation?.name}</p>
              </div>
            )}

            {/* SEMESTER DROPDOWN */}
            <div className="bg-white dark:bg-gray-800 border p-5 rounded mb-8">
              <label className="font-semibold block mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map(
                  (s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  )
                )}
              </select>
            </div>

            {/* SUBJECT TABLE */}
            {selectedSubjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border rounded mb-8 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-left">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubjects.map((sub) => (
                      <tr key={sub.id} className="border-t">
                        <td className="p-3">{sub.code}</td>
                        <td className="p-3">{sub.name}</td>
                        <td className="p-3">{sub.credits}</td>
                        <td className="p-3">{sub.type}</td>
                        <td className="p-3">
                          <select
                            value={sub.grade}
                            onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                            className="border px-2 py-1 rounded"
                          >
                            <option value="">Grade</option>
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
                onClick={handleCalculateGPA}
                disabled={!semester || selectedSubjects.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded"
              >
                <CalcIcon size={20} className="inline mr-2" />
                Calculate & Save GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded"
                >
                  <Download size={20} className="inline mr-2" />
                  Download Marksheet
                </button>
              )}
            </div>

            {/* GPA RESULT BOX */}
            {gpaResult && (
              <div className="mt-6 bg-blue-50 p-5 border rounded">
                <h2 className="text-xl font-bold">
                  GPA: {gpaResult.gpa.toFixed(2)}
                </h2>
                <p>
                  Credits: {gpaResult.totalCredits}<br />
                  Points: {gpaResult.totalPoints}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
