// src/pages/GPACalculator.jsx
import React, { useState, useEffect } from "react";
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

  // local loading flag (DO NOT use global setLoading here)
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // LOAD PROFILE ONCE
  // ------------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
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

  // max semesters from department, fallback 8
  const maxSemesters =
    profile?.department?.semesterCount && profile.department.semesterCount > 0
      ? profile.department.semesterCount
      : 8;

  // ------------------------------------------------------------
  // CHANGE SEMESTER → LOAD SUBJECTS
  // ------------------------------------------------------------
  const handleSemesterChange = async (value) => {
    console.log("▶ handleSemesterChange value =", value);

    setSemester(value);
    setGpaResult(null);
    setSubjects([]);
    setSelectedSubjects([]);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile is missing regulation/department");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      const list = Array.isArray(res.data) ? res.data : [];
      console.log("📌 SUBJECT RESPONSE:", list);

      setSubjects(list);

      const initialSelected = list.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        type: s.type,
        isElective: s.isElective,
        grade: "",
      }));

      console.log("📌 SUBJECTS LOADED INTO UI:", initialSelected);
      setSelectedSubjects(initialSelected);

      if (list.length === 0) {
        toast.info("No subjects configured for this semester.");
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      toast.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // GRADE CHANGE
  // ------------------------------------------------------------
  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects((prev) =>
      Array.isArray(prev)
        ? prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  grade,
                }
              : s
          )
        : []
    );
    setGpaResult(null);
  };

  // ------------------------------------------------------------
  // CALCULATE GPA
  // ------------------------------------------------------------
  const handleCalculateGPA = async () => {
    if (!semester) {
      toast.error("Please select a semester");
      return;
    }

    const graded = Array.isArray(selectedSubjects)
      ? selectedSubjects.filter((s) => s.grade)
      : [];

    if (graded.length === 0) {
      toast.error("Please enter at least one grade");
      return;
    }

    const payload = {
      semester: Number(semester),
      subjects: graded.map((s) => ({
        subjectId: s.id,
        grade: s.grade,
      })),
    };

    setLoading(true);
    try {
      const res = await studentAPI.calculateGPA(payload);
      const data = res.data || {};
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

  // ------------------------------------------------------------
  // DOWNLOAD MARKSHEET
  // ------------------------------------------------------------
  const handleDownloadMarksheet = async () => {
    if (!semester) {
      toast.error("Select a semester first");
      return;
    }
    if (!gpaResult) {
      toast.error("Calculate & save GPA before downloading marksheet");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `marksheet-semester-${semester}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("generateMarksheet error:", err);
      toast.error("Failed to download marksheet");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
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

            {/* Profile summary */}
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

            {/* Semester selection */}
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
                  {loading && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Loading…
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects table */}
            {Array.isArray(selectedSubjects) &&
              selectedSubjects.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Subjects – Semester {semester}
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {selectedSubjects.map((subject) => (
                          <tr
                            key={subject.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {subject.code}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {subject.name}
                              {subject.isElective && (
                                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                  Elective
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {subject.credits}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {subject.type}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={subject.grade || ""}
                                onChange={(e) =>
                                  handleGradeChange(subject.id, e.target.value)
                                }
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Select Grade</option>
                                {Array.isArray(GRADE_OPTIONS) &&
                                  GRADE_OPTIONS.map((opt) => (
                                    <option
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Actions + result */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <button
                  onClick={handleCalculateGPA}
                  disabled={
                    loading || !semester || selectedSubjects.length === 0
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CalcIcon size={20} />
                  <span>Calculate & Save GPA</span>
                </button>

                {gpaResult && (
                  <button
                    onClick={handleDownloadMarksheet}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
