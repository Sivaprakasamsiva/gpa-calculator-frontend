// ======================================
// Full Working GPACalculator.jsx
// ======================================

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import { studentAPI } from "../services/api";
import { GRADE_OPTIONS } from "../utils/constants";
import { toast } from "react-toastify";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Calculator as CalcIcon, Download } from "lucide-react";

const GPACalculator = () => {
  const { setLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [gpa, setGpa] = useState(null);

  const loadProfileOnce = useRef(false);

  // --------------------------------------------------
  // LOAD PROFILE (one time only)
  // --------------------------------------------------
  useEffect(() => {
    if (loadProfileOnce.current) return;
    loadProfileOnce.current = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data);
        console.log("PROFILE LOADED:", res.data);
      } catch (err) {
        toast.error("Failed to load profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // --------------------------------------------------
  // HANDLE SEMESTER CHANGE + FETCH SUBJECTS
  // --------------------------------------------------
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

      const list = Array.isArray(res.data) ? res.data : [];

      setSubjects(list);

      if (list.length === 0) toast.info("No subjects found");
    } catch (err) {
      console.error(err);
      toast.error("Failed loading subjects");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // HANDLE GRADE SELECTION
  // --------------------------------------------------
  const handleGradeChange = (sid, grade) => {
    setGrades((prev) => ({ ...prev, [sid]: grade }));
    setGpa(null);
  };

  // --------------------------------------------------
  // CALCULATE GPA
  // --------------------------------------------------
  const handleCalculate = async () => {
    const chosen = Object.entries(grades)
      .filter(([_, g]) => g)
      .map(([subjectId, grade]) => ({
        subjectId: Number(subjectId),
        grade
      }));

    if (chosen.length === 0) return toast.error("Select grades first");

    try {
      setLoading(true);

      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: chosen
      });

      setGpa(res.data);

      console.log("GPA RESULT:", res.data);

      toast.success("GPA calculated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DOWNLOAD MARKSHEET
  // --------------------------------------------------
  const downloadPdf = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-sem-${semester}.pdf`;
      a.click();
    } catch (err) {
      toast.error("Failed to download");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UI ALWAYS RENDERS (even before profile loads)
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 text-gray-900 dark:text-white">

          <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

          {/* Profile Box */}
          <div className="bg-white dark:bg-gray-800 p-4 mb-6 rounded shadow border">
            {profile ? (
              <>
                <p><b>Name:</b> {profile.name}</p>
                <p><b>Department:</b> {profile.department?.name}</p>
                <p><b>Regulation:</b> {profile.regulation?.name}</p>
              </>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>

          {/* SEMESTER DROPDOWN */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded shadow border mb-8">
            <label className="font-semibold">Select Semester</label>
            <select
              value={semester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="border px-3 py-2 rounded w-full mt-1"
            >
              <option value="">Choose...</option>

              {profile &&
                Array.from(
                  { length: profile.department?.semesterCount || 8 },
                  (_, i) => i + 1
                ).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
            </select>
          </div>

          {/* SUBJECT TABLE */}
          {subjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded shadow border mb-8 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Credits</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="border-t">
                      <td className="p-2">{sub.code}</td>
                      <td className="p-2">{sub.name}</td>
                      <td className="p-2">{sub.credits}</td>
                      <td className="p-2">{sub.isElective ? "ELECTIVE" : sub.type}</td>
                      <td className="p-2">
                        <select
                          value={grades[sub.id] || ""}
                          onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                          className="border rounded px-2 py-1"
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

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleCalculate}
              disabled={!semester || subjects.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              <CalcIcon size={18} className="inline mr-2" />
              Calculate
            </button>

            {gpa && (
              <button
                onClick={downloadPdf}
                className="px-6 py-3 bg-purple-600 text-white rounded"
              >
                <Download size={18} className="inline mr-2" />
                Download PDF
              </button>
            )}
          </div>

          {/* GPA RESULT */}
          {gpa && (
            <div className="p-4 bg-blue-100 dark:bg-blue-800 rounded shadow">
              <h2 className="text-lg font-bold">
                GPA: {gpa.gpa.toFixed(2)}
              </h2>
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
