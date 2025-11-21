// src/pages/GPACalculator.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { setLoading } = useAuth();

  // Fetch profile once
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res?.data || null);
      } catch (err) {
        toast.error("Unable to fetch profile!");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setLoading]);

  const maxSemesters = profile?.department?.semesterCount || 8;

  // Fetch subjects from backend
  const fetchSubjects = useCallback(async (sem) => {
    setLoading(true);
    setSubjects([]);
    setSelectedSubjects([]);
    setGpaResult(null);

    try {
      const res = await studentAPI.getSubjects(
        profile?.regulation?.id,
        profile?.department?.id,
        Number(sem)
      );

      const list = Array.isArray(res?.data) ? res.data : [];

      if (list.length === 0) toast.info("No subjects found for selected semester.");

      setSubjects(list);
      setSelectedSubjects(list.map((s) => ({ ...s, grade: "" })));
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [profile, setLoading]);

  const handleSemesterChange = (value) => {
    setSemester(value);
    if (value && profile?.regulation?.id && profile?.department?.id) {
      fetchSubjects(value);
    }
  };

  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, grade } : s))
    );
    setGpaResult(null);
  };

  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select semester first.");
    const graded = selectedSubjects.filter((s) => s.grade);

    if (graded.length === 0) return toast.error("Enter at least one grade.");

    setLoading(true);
    try {
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: graded.map((s) => ({ subjectId: s.id, grade: s.grade })),
      });

      setGpaResult(res?.data || null);
      toast.success("GPA calculated successfully!");
    } catch {
      toast.error("GPA calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarksheet = async () => {
    if (!gpaResult) return toast.error("Calculate GPA before downloading");

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-semester-${semester}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Name:</strong> {profile.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Department:</strong> {profile.department?.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>Regulation:</strong> {profile.regulation?.name}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-8 border dark:border-gray-700">
              <label className="block text-sm mb-2 font-medium">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 w-full"
                disabled={!profile}
              >
                <option value="">Select Semester</option>
                {Array.from({ length: maxSemesters }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {selectedSubjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 mb-8">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Credits</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubjects.map((sub) => (
                      <tr key={sub.id} className="border-t dark:border-gray-600">
                        <td className="p-3">{sub.code}</td>
                        <td className="p-3">{sub.name}</td>
                        <td className="p-3">{sub.credits}</td>
                        <td className="p-3">{sub.type}</td>
                        <td className="p-3">
                          <select
                            value={sub.grade}
                            onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                            className="border rounded-md px-2 py-1"
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

            {/* Buttons & Result */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleCalculateGPA}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg"
                disabled={!semester}
              >
                <CalcIcon size={18} /> Calculate & Save GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg"
                >
                  <Download size={18} /> Download PDF
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="mt-6 p-6 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-bold">
                  GPA: {gpaResult?.gpa?.toFixed(2)}
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
