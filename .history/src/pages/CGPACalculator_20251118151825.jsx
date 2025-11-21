// src/pages/CGPACalculator.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { studentAPI } from "../services/api";
import { Calculator, Download } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../App";

const CGPACalculator = () => {
  const [history, setHistory] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { setLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await studentAPI.getHistory();
        const list = Array.isArray(res.data) ? res.data : [];
        setHistory(list);

        const uniqueSems = Array.from(
          new Set(list.map((h) => h.semester))
        ).sort((a, b) => a - b);
        setAvailableSemesters(uniqueSems);
      } catch (err) {
        console.error("Failed to load GPA history for CGPA:", err);
      }
    };

    load();
  }, []);

  const toggleSemester = (sem) => {
    setSelectedSemesters((prev) =>
      prev.includes(sem) ? prev.filter((s) => s !== sem) : [...prev, sem]
    );
    setResult(null);
  };

  const handleCalculateCGPA = async () => {
    if (selectedSemesters.length === 0) {
      toast.error("Select at least one semester");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.calculateCGPA(selectedSemesters);
      const data = res.data;
      setResult({
        cgpa: data.cgpa,
        totalCredits: data.totalCredits,
        totalPoints: data.totalPoints,
      });
    } catch (err) {
      console.error("calculateCGPA error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to calculate CGPA";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSummary = async () => {
    if (!result) {
      toast.error("Calculate CGPA first");
      return;
    }
    if (selectedSemesters.length === 0) {
      toast.error("No semesters selected");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.generateCGPASummary(selectedSemesters);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cgpa-summary-${selectedSemesters.join("-")}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("generateCGPASummary error:", err);
      toast.error("Failed to download CGPA summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            CGPA Calculator
          </h1>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select semesters to include
            </h2>

            {availableSemesters.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No GPA results found. Calculate GPA for at least one semester
                first.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableSemesters.map((sem) => (
                  <label
                    key={sem}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSemesters.includes(sem)}
                      onChange={() => toggleSemester(sem)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      Semester {sem}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleCalculateCGPA}
              disabled={availableSemesters.length === 0}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Calculator size={20} />
              <span>Calculate CGPA</span>
            </button>

            {result && (
              <div className="mt-6">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-300">
                  CGPA:{" "}
                  {result.cgpa?.toFixed
                    ? result.cgpa.toFixed(2)
                    : Number(result.cgpa || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Total Credits: {result.totalCredits} | Total Points:{" "}
                  {result.totalPoints}
                </div>

                <button
                  onClick={handleDownloadSummary}
                  className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center space-x-2 hover:bg-purple-700"
                >
                  <Download size={20} />
                  <span>Download Summary (PDF)</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CGPACalculator;
