// ===========================================
// FIXED & STABLE GPACalculator.jsx
// ===========================================

import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import { Calculator as CalcIcon, Download } from "lucide-react";

const GPACalculator = () => {
  // ------------------ STATE ------------------
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(false);

  // =================================================
  // LOAD PROFILE (only once — no infinite re-render)
  // =================================================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        console.log("PROFILE LOADED:", res.data);
        setProfile(res.data);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []); // <-- EMPTY dependencies = run ONCE

  // =================================================
  // LOAD SUBJECTS WHEN SEMESTER CHANGES
  // =================================================
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setSubjects([]);
    setGrades({});
    setGpa(null);

    if (!value || !profile) return;

    try {
      setLoading(true);
      const res = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        Number(value)
      );

      console.log("SUBJECT RESPONSE:", res.data);

      setSubjects(Array.isArray(res.data) ? res.data : []);
      if (res.data.length === 0) toast.info("No subjects found");
      
    } catch (err) {
      toast.error("Failed loading subjects");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // STORE SELECTED GRADES
  // =================================================
  const handleGradeChange = (id, grade) => {
    setGrades(prev => ({ ...prev, [id]: grade }));
    setGpa(null);
  };

  // =================================================
  // CALCULATE GPA
  // =================================================
  const calculateGPA = async () => {
    const mapped = Object.entries(grades)
      .filter(([_, grade]) => grade !== "")
      .map(([id, grade]) => ({ subjectId: Number(id), grade }));

    if (mapped.length === 0) return toast.error("Select at least one grade");

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: mapped,
      });
      console.log("GPA RESULT:", res.data);
      setGpa(res.data);
      toast.success("GPA calculated");
    } catch (err) {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // DOWNLOAD PDF
  // =================================================
  const downloadPDF = async () => {
    if (!gpa) return;

    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `semester-${semester}-marksheet.pdf`;
      a.click();
    } catch (err) {
      toast.error("Failed to download");
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // UI
  // =================================================
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">

          <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

          {/* Profile */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 border">
            {loading && !profile ? (
              <p>Loading profile...</p>
            ) : (
              <>
                <p><b>Name:</b> {profile?.name}</p>
                <p><b>Department:</b> {profile?.department?.name}</p>
                <p><b>Regulation:</b> {profile?.regulation?.name}</p>
              </>
            )}
          </div>

          {/* Semester */}
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded border mb-6">
            <label className="font-semibold">Select Semester</label>
            <select
              className="border rounded px-3 py-2 w-full mt-1 dark:text-black"
              value={semester}
              onChange={(e) => handleSemesterChange(e.target.value)}
            >
              <option value="">Choose...</option>
              {profile &&
                Array.from({ length: profile.department?.semesterCount || 8 }, (_, i) => i + 1)
                  .map(n => <option key={n} value={n}>Semester {n}</option>)
              }
            </select>
          </div>

          {/* Subjects */}
          {subjects.length > 0 && (
            <table className="w-full border mb-6">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Credits</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 dark:bg-gray-700">
                {subjects.map(sub => (
                  <tr key={sub.id} className="border-b">
                    <td className="p-2">{sub.code}</td>
                    <td className="p-2">{sub.name}</td>
                    <td className="p-2">{sub.credits}</td>
                    <td className="p-2">{sub.isElective ? "ELECTIVE" : sub.type}</td>
                    <td className="p-2">
                      <select
                        value={grades[sub.id] || ""}
                        onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                        className="border rounded px-2 py-1 dark:text-black"
                      >
                        <option value="">Grade</option>
                        {GRADE_OPTIONS.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              disabled={!semester || subjects.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
              onClick={calculateGPA}
            >
              <CalcIcon size={18} className="inline mr-2" />
              Calculate GPA
            </button>

            {gpa && (
              <button
                className="px-6 py-3 bg-purple-600 text-white rounded"
                onClick={downloadPDF}
              >
                <Download size={18} className="inline mr-2" />
                Download PDF
              </button>
            )}
          </div>

          {/* Result */}
          {gpa && (
            <div className="p-4 bg-green-200 dark:bg-green-700 rounded border">
              <h2 className="text-xl font-bold">GPA: {gpa.gpa.toFixed(2)}</h2>
              <p>Total Credits: {gpa.totalCredits}</p>
              <p>Total Points: {gpa.totalPoints}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
