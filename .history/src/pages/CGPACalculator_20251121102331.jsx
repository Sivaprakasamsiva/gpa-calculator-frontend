// src/pages/CGPACalculator.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Calculator, Download } from "lucide-react";
import { toast } from "react-toastify";
import { studentAPI } from "../services/api";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";

const CGPACalculator = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [semesters, setSemesters] = useState(
    Array.from({ length: 8 }).map((_, i) => ({
      sem: i + 1,
      gpa: "",
    }))
  );

  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);

  // LOAD PROFILE + GPA HISTORY
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const [profRes, histRes] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getHistory(),
        ]);

        setProfile(profRes.data || null);

        if (Array.isArray(histRes.data)) {
          setSemesters((prev) =>
            prev.map((row) => {
              const found = histRes.data.find(
                (x) => Number(x.semester) === Number(row.sem)
              );
              if (!found) return row;

              const gpaValue =
                found.gpa ??
                found.GPA ??
                found.gpaValue ??
                found.gradePointAverage ??
                found.cgpa ??
                null;

              return gpaValue !== null
                ? { ...row, gpa: Number(gpaValue).toFixed(2) }
                : row;
            })
          );
        }
      } catch (err) {
        console.error("❌ Failed GPA/Profile Load:", err);
        toast.error("Unable to auto-load data");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // CALCULATE CGPA
  const calculateCGPA = () => {
    const valid = semesters.filter((s) => s.gpa !== "");

    if (valid.length === 0) return toast.error("Enter at least one GPA");

    const total = valid.reduce((sum, s) => sum + Number(s.gpa), 0);

    setResult((total / valid.length).toFixed(2));
  };

  // DOWNLOAD PDFs FOR ALL SEMESTERS THAT HAVE GPA
  const handleDownloadAllPDFs = async () => {
    try {
      if (!profile) {
        toast.error("Profile not loaded yet");
        return;
      }

      const active = semesters.filter((s) => s.gpa !== "");
      if (active.length === 0) {
        toast.error("No semesters available for PDF");
        return;
      }

      setLoading(true);

      for (const s of active) {
        const semNo = Number(s.sem);

        // get subject list (no grades)
        const [subRes] = await Promise.all([
          studentAPI.getSubjects(
            profile.regulation?.id,
            profile.department?.id,
            semNo
          ),
        ]);

        const subjects = Array.isArray(subRes.data) ? subRes.data : [];
        const rows = subjects.map((sub) => ({
          code: sub.code,
          name: sub.name,
          credits: sub.credits,
          grade: "", // grades unknown here
        }));

        const gpaResult = {
          gpa: Number(s.gpa),
          totalCredits: subjects.reduce(
            (sum, sub) => sum + Number(sub.credits || 0),
            0
          ),
          totalPoints: "-", // not known here
        };

        await generateGPAPDF({
          profile,
          semester: semNo,
          rows,
          gpaResult,
        });
      }
    } catch (err) {
      console.error("Error generating CGPA PDFs:", err);
      toast.error("Failed to generate PDFs");
    } finally {
      setLoading(false);
    }
  };

  // RENDER
  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white mb-6">
            CGPA Calculator
          </h1>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl">
            {loading && (
              <p className="text-blue-500 text-sm mb-2">Loading data...</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {semesters.map((s, index) => (
                <div key={index}>
                  <label className="dark:text-gray-200">
                    Semester {s.sem}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={s.gpa}
                    onChange={(e) => {
                      const updated = [...semesters];
                      updated[index].gpa = e.target.value;
                      setSemesters(updated);
                    }}
                    className="mt-2 p-2 w-full border dark:bg-gray-700 rounded text-gray-900 dark:text-white"
                    placeholder="Enter GPA"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-6">
              <button
                onClick={calculateCGPA}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Calculator />
                Calculate CGPA
              </button>

              <button
                onClick={handleDownloadAllPDFs}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Download size={18} />
                Download All Semester PDFs
              </button>
            </div>

            {result && (
              <div className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-300">
                CGPA: {result}
              </div>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default CGPACalculator;
