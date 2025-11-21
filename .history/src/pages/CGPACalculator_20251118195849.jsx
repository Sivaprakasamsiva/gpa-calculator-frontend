// src/pages/CGPACalculator.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Calculator } from "lucide-react";
import { toast } from "react-toastify";
import { studentAPI } from "../services/api";

const CGPACalculator = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [semesters, setSemesters] = useState(
    Array.from({ length: 8 }).map((_, i) => ({
      sem: i + 1,
      gpa: "",
      locked: false,
    }))
  );

  const [result, setResult] = useState(null);

  // 🚀 Auto fetch previously saved GPA values
  useEffect(() => {
    const loadGPAHistory = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getHistory();
        const dbGPAs = res.data;

        if (Array.isArray(dbGPAs) && dbGPAs.length > 0) {
          setSemesters((prev) =>
            prev.map((s) => {
              const found = dbGPAs.find((h) => h.semester === s.sem);
              return found
                ? { ...s, gpa: found.gpa.toFixed(2), locked: false }
                : s;
            })
          );
        }
      } catch (err) {
        console.error("Failed to load GPA history:", err);
        toast.error("Failed to auto-load GPA values");
      } finally {
        setLoading(false);
      }
    };

    loadGPAHistory();
  }, []);

  const calculateCGPA = () => {
    const valid = semesters.filter((s) => s.gpa !== "");

    if (valid.length === 0) return toast.error("Enter at least one GPA");

    const total = valid.reduce((sum, s) => sum + Number(s.gpa), 0);

    setResult((total / valid.length).toFixed(2));
  };

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
              <p className="text-blue-600 dark:text-blue-300 mb-4 text-sm">
                Loading GPA values...
              </p>
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
                    value={s.gpa}
                    onChange={(e) => {
                      const updated = [...semesters];
                      updated[index].gpa = e.target.value;
                      updated[index].locked = false; // make editable
                      setSemesters(updated);
                    }}
                    className="mt-2 p-2 w-full border dark:bg-gray-700 rounded"
                    placeholder="Enter GPA"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={calculateCGPA}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              <Calculator />
              Calculate CGPA
            </button>

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
