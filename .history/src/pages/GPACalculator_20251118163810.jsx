// ==============================================
// src/pages/GPACalculator.jsx  (REWRITTEN, FINAL)
// ==============================================

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Download, Calculator as CalcIcon } from "lucide-react";

const GPACalculator = () => {
  const { setLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // prevent repeat API profile calls (React 18 strict mode)
  const profileFetched = useRef(false);

  // ====================================================
  // LOAD PROFILE ONLY ONCE
  // ====================================================
  useEffect(() => {
    if (profileFetched.current) return;
    profileFetched.current = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data);
      } catch {
        toast.error("Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ====================================================
  // LOAD SUBJECTS WHEN SEMESTER CHANGES
  // ====================================================
  const loadSubjects = async (sem) => {
    if (!sem || !profile) return;

    try {
      setLoading(true);
      const res = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(sem)
      );

      const list = Array.isArray(res.data) ? res.data : [];

      setSubjects(list);
      setGrades({});
      setGpaResult(null);

      if (list.length === 0) toast.info("No subjects found");
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (value) => {
    setSemester(value);
    loadSubjects(value);
  };

  // ====================================================
  // UPDATE GRADE
  // ====================================================
  const handleGradeSelect = (subjectId, value) => {
    setGrades((prev) => ({
      ...prev,
      [subjectId]: value,
    }));
  };

  // ====================================================
  // CALCULATE GPA
  // ====================================================
  const calculateGPA = async () => {
    if (!semester) return toast.error("Select semester first");

    const gradedSubjects = Object.entries(grades)
      .filter(([_, g]) => g)
      .map(([id, grade]) => ({ subjectId: Number(id), grade }));

    if (gradedSubjects.length === 0)
      return toast.error("Select grades first");

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: gradedSubjects,
      });

      setGpaResult(res.data);

      toast.success("GPA calculated");
    } catch {
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // DOWNLOAD MARKSHEET
  // ====================================================
  const downloadMarksheet = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-sem-${semester}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download marksheet");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null; // wait until profile loads fully

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 border rounded p-4 mb-6">
            <p><b>Name:</b> {profile.name}</p>
            <p><b>Department:</b> {profile.department.name}</p>
            <p><b>Regulation:</b> {profile.regulation.name}</p>
          </div>

          {/* Semester Selection */}
          <div className="bg-white dark:bg-gray-800 border p-4 rounded mb-6">
            <label className="font-semibold">Semester</label>
            <select
              value={semester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="border px-3 py-2 rounded w-full mt-1"
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

          {/* Subjects Table */}
          {subjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border rounded mb-8 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="border-t">
                      <td className="p-3">{sub.code}</td>
                      <td className="p-3">{sub.name}</td>
                      <td className="p-3">{sub.credits}</td>
                      <td className="p-3">{sub.isElective ? "ELECTIVE" : sub.type}</td>
                      <td className="p-3">
                        <select
                          value={grades[sub.id] || ""}
                          onChange={(e) => handleGradeSelect(sub.id, e.target.value)}
                          className="border px-2 py-1 rounded"
                        >
                          <option value="">Select</option>
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

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={calculateGPA}
              className="px-6 py-3 bg-blue-600 text-white rounded"
              disabled={!semester || subjects.length === 0}
            >
              <CalcIcon size={18} className="inline mr-2" /> Calculate GPA
            </button>

            {gpaResult && (
              <button
                onClick={downloadMarksheet}
                className="px-6 py-3 bg-purple-600 text-white rounded"
              >
                <Download size={18} className="inline mr-2" /> Download PDF
              </button>
            )}
          </div>

          {/* GPA Result */}
          {gpaResult && (
            <div className="mt-6 bg-blue-50 p-5 border rounded">
              <h2 className="text-xl font-bold">GPA: {gpaResult.gpa.toFixed(2)}</h2>
              <p>Credits: {gpaResult.totalCredits}</p>
              <p>Points: {gpaResult.totalPoints}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
