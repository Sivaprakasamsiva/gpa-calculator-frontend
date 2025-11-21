import React, { useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Calculator } from "lucide-react";
import { toast } from "react-toastify";

const CGPACalculator = () => {
  const [semesters, setSemesters] = useState([
    { sem: 1, gpa: "" },
    { sem: 2, gpa: "" },
    { sem: 3, gpa: "" },
    { sem: 4, gpa: "" },
    { sem: 5, gpa: "" },
    { sem: 6, gpa: "" },
    { sem: 7, gpa: "" },
    { sem: 8, gpa: "" },
  ]);

  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const calculateCGPA = () => {
    const valid = semesters.filter((s) => s.gpa !== "");

    if (valid.length === 0) {
      toast.error("Enter at least one GPA");
      return;
    }

    const sum = valid.reduce((acc, cur) => acc + parseFloat(cur.gpa), 0);

    setResult((sum / valid.length).toFixed(2));
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

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {semesters.map((s, i) => (
                <div key={i}>
                  <label className="text-gray-700 dark:text-gray-300">
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
                      updated[i].gpa = e.target.value;
                      setSemesters(updated);
                    }}
                    className="w-full mt-2 p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter GPA"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={calculateCGPA}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Calculator size={20} />
              <span>Calculate CGPA</span>
            </button>

            {result && (
              <div className="mt-6 text-4xl font-bold text-blue-600 dark:text-blue-300">
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
