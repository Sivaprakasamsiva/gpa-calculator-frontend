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
    }))
  );

  const [result, setResult] = useState(null);

  // FETCH GPA RESULTS FROM DATABASE
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const res = await studentAPI.getHistory();
        const db = res.data;

        if (Array.isArray(db) && db.length > 0) {
          setSemesters((prev) =>
            prev.map((row) => {
              const found = db.find((g) => Number(g.semester) === Number(row.sem));
              return found
                ? { ...row, gpa: Number(found.gpa).toFixed(2) }
                : row;
            })
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load saved GPA values");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // IMPORTANT: run only once

  const calculateCGPA = () => {
    const valid = semesters.filter((s) => s.gpa && s.gpa !== "");

    if (valid.length === 0) {
      toast.error("Enter at least one GPA");
      return;
    }

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
              <p className="text-blue-500 text-sm mb-3">
                Loading saved GPA values...
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {semesters.map((s, index) => (
                <div key={index}>
                  <label className="dark:text-gray-200">Semester {s.sem}</label>
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

            <button
              onClick={calculateCGPA}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
