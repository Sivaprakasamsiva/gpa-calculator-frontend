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

  // =============================
  // LOAD PROFILE ONCE
  // =============================
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await studentAPI.getProfile();
        setProfile(res.data || null);
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setLoading]);

  const maxSemesters =
    profile?.department?.semesterCount > 0
      ? profile.department.semesterCount
      : 8;

  // =============================
  // FIXED SEMESTER HANDLER
  // =============================
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setGpaResult(null);
    setSelectedSubjects([]);

    if (!value) return;

    if (!profile?.regulation?.id || !profile?.department?.id) {
      toast.error("Profile is missing regulation or department info.");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      console.log("📌 SUBJECTS RESPONSE:", res.data);

      const subjectList = Array.isArray(res.data) ? res.data : [];

      setSubjects(subjectList);

      const formatted = subjectList.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        type: s.type,
        isElective: s.isElective,
        grade: "",
      }));

      setSelectedSubjects(formatted);
      console.log("📌 UI SUBJECT DATA:", formatted);

      if (formatted.length === 0) toast.info("No subjects available.");
    } catch (err) {
      console.error("❌ Subject load failed:", err);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // GRADE HANDLER
  // =============================
  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects((prev) =>
      prev.map((item) =>
        item.id === subjectId ? { ...item, grade } : item
      )
    );
    setGpaResult(null);
  };

  // =============================
  // CALCULATE GPA
  // =============================
  const handleCalculateGPA = async () => {
    if (!semester) return toast.error("Select a semester");
    const graded = selectedSubjects.filter((s) => s.grade);

    if (graded.length === 0)
      return toast.error("Please select at least one grade");

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
      setGpaResult({
        gpa: res.data.gpa,
        totalCredits: res.data.totalCredits,
        totalPoints: res.data.totalPoints,
      });
      toast.success("GPA calculated & saved successfully!");
    } catch (err) {
      console.error("GPA error:", err);
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // DOWNLOAD MARKSHEET
  // =============================
  const handleDownloadMarksheet = async () => {
    if (!semester) return toast.error("Select a semester first");
    if (!gpaResult) return toast.error("Calculate GPA first");

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `marksheet-semester-${semester}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err);
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
            <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

            {profile && (
              <div className="bg-white p-4 rounded border mb-6">
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department?.name}</p>
                <p><b>Regulation:</b> {profile.regulation?.name}</p>
              </div>
            )}

            <div className="bg-white p-5 rounded border mb-6">
              <label className="block font-semibold mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full border px-3 py-2 rounded"
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

            {selectedSubjects.length > 0 && (
              <div className="bg-white rounded border mb-8 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
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
                            value={sub.grade ?? ""}
                            onChange={(e) =>
                              handleGradeChange(sub.id, e.target.value)
                            }
                            className="border px-2 py-1 rounded"
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

            {gpaResult && (
              <div className="mt-6 bg-blue-50 border p-5 rounded">
                <h2 className="text-xl font-bold mb-2">
                  GPA: {gpaResult.gpa.toFixed(2)}
                </h2>
                <p>
                  Total Credits: {gpaResult.totalCredits} <br />
                  Total Points: {gpaResult.totalPoints}
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
