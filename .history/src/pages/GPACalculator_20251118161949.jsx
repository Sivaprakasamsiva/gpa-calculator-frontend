// src/pages/GPACalculator.jsx
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
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [gpaResult, setGpaResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { setLoading } = useAuth();

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setLoading]);

  const maxSemesters =
    profile?.department?.semesterCount && profile.department.semesterCount > 0
      ? profile.department.semesterCount
      : 8;

  // Load subjects when semester changes
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setSelectedSubjects([]);
    setGpaResult(null);
    setSubjects([]);

    if (!value) return;
    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile missing regulation/department");
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
      setSubjects(list);

      const formattedList = list.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        type: s.type,
        isElective: s.isElective,
        grade: ""
      }));

      setSelectedSubjects(formattedList);

      if (list.length === 0) toast.info("No subjects found for this semester.");
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, grade: grade } : s
      )
    );
    setGpaResult(null);
  };

  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select semester first");

    const graded = selectedSubjects.filter((s) => s.grade);
    if (graded.length === 0) return toast.error("Enter at least one grade");

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
      setGpaResult(res.data);
      toast.success("GPA calculated & saved!");
    } catch (err) {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarksheet = async () => {
    if (!semester) return toast.error("Select semester first");
    if (!gpaResult) return toast.error("Calculate GPA first");

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const file = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-semester-${semester}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download marksheet");
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
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-6">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Department:</strong> {profile.department?.name}</p>
                <p><strong>Regulation:</strong> {profile.regulation?.name}</p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-6">
              <label className="font-medium">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full mt-2 p-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="">Select Semester</option>
                {[...Array(maxSemesters)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {Array.isArray(selectedSubjects) && selectedSubjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border mb-8 overflow-x-auto max-h-[380px]">
                <table className="w-full">
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
                    {selectedSubjects.map((sub) => (
                      <tr key={sub.id} className="border-t">
                        <td className="p-3">{sub.code}</td>
                        <td className="p-3">{sub.name}</td>
                        <td className="p-3">{sub.credits}</td>
                        <td className="p-3">{sub.type}</td>
                        <td className="p-3">
                          <select
                            value={sub.grade}
                            onChange={(e) =>
                              handleGradeChange(sub.id, e.target.value)
                            }
                            className="border p-1 rounded"
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

            <div className="flex gap-4">
              <button
                onClick={handleCalculateGPA}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <CalcIcon size={18} /> Calculate & Save GPA
              </button>

              {gpaResult && (
                <button
                  onClick={handleDownloadMarksheet}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Download size={18} /> Download Marksheet
                </button>
              )}
            </div>

            {gpaResult && (
              <div className="mt-6 bg-blue-50 border p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold">
                  GPA: {gpaResult.gpa.toFixed(2)}
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
