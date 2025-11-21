// src/pages/GPACalculator.jsx
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Calculator, Save, Download, Search } from "lucide-react";
import { useAuth } from "../App";
import { toast } from "react-toastify";

const GPACalculator = () => {
  const { user, setLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);

  const [semester, setSemester] = useState("");
  const [gpaResult, setGpaResult] = useState(null);

  const [electiveSearch, setElectiveSearch] = useState("");
  const [filteredElectives, setFiltered] = useState([]);

  const [darkMode, setDarkMode] = useState(false);

  // Load user profile so we know regulation + department
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await studentAPI.getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load subjects when semester changes
  useEffect(() => {
    if (profile && semester) fetchSubjects();
  }, [semester, profile]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getSubjects(
        profile.regulation.id,
        profile.department.id,
        semester
      );

      setSubjects(res.data);

      setSelected(
        res.data.map((s) => ({ ...s, grade: "", points: 0 }))
      );
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const getPoints = (g) =>
    ({ O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, RA: 0 }[g] || 0);

  const handleGrade = (id, grade) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, grade, points: getPoints(grade) } : s
      )
    );
    setGpaResult(null);
  };

  const calcGPA = () => {
    const valid = selected.filter((s) => s.grade);

    if (valid.length === 0) return toast.error("Enter at least one grade");

    let totalCredits = 0;
    let totalPoints = 0;

    valid.forEach((s) => {
      totalCredits += s.credits;
      totalPoints += s.points * s.credits;
    });

    const gpa = totalPoints / totalCredits;

    setGpaResult({ gpa: gpa.toFixed(2), totalCredits, totalPoints });
  };

  const saveGrades = async () => {
    if (!gpaResult) return toast.error("Calculate GPA first!");

    try {
      await studentAPI.saveGrades({
        semester: Number(semester),
        subjects: selected.filter((s) => s.grade),
      });

      toast.success("Grades saved!");
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const generatePDF = async () => {
    if (!gpaResult) return toast.error("Calculate GPA first!");

    try {
      const res = await studentAPI.generateMarksheet(Number(semester));

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-sem-${semester}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  // Elective search
  useEffect(() => {
    if (!electiveSearch) return setFiltered([]);

    setFiltered(
      subjects.filter(
        (s) =>
          s.isElective &&
          (s.code.toLowerCase().includes(electiveSearch.toLowerCase()) ||
            s.name.toLowerCase().includes(electiveSearch.toLowerCase()))
      )
    );
  }, [electiveSearch, subjects]);

  const addElective = (e) => {
    setSelected((prev) =>
      prev.some((s) => s.id === e.id) ? prev : [...prev, { ...e, grade: "", points: 0 }]
    );
    setElectiveSearch("");
    setFiltered([]);
  };

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white mb-8">
            GPA Calculator
          </h1>

          {/* SELECT SEMESTER */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl mb-8">
            <label className="font-semibold dark:text-white">
              Select Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 mt-2 border dark:bg-gray-700 rounded"
            >
              <option value="">Select</option>
              {Array.from({ length: profile?.department.semesterCount || 8 }).map(
                (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ELECTIVE SEARCH */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl mb-8">
            <h3 className="font-bold mb-4 dark:text-white">Add Elective</h3>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />

              <input
                type="text"
                value={electiveSearch}
                onChange={(e) => setElectiveSearch(e.target.value)}
                placeholder="Search electives by code or name"
                className="w-full pl-10 pr-3 py-2 border dark:bg-gray-700 rounded"
              />
            </div>

            {filteredElectives.length > 0 && (
              <div className="mt-3 border rounded max-h-40 overflow-y-auto dark:bg-gray-700">
                {filteredElectives.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => addElective(e)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b"
                  >
                    <p className="font-semibold dark:text-white">{e.code}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {e.name} • {e.credits} Credits
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBJECT TABLE */}
          {selected.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl mb-8">
              <h3 className="p-6 text-xl font-bold dark:text-white">
                Subjects — Semester {semester}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Credits</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Grade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selected.map((s) => (
                      <tr key={s.id} className="border-b dark:border-gray-700">
                        <td className="p-3">{s.code}</td>
                        <td className="p-3 dark:text-white">
                          {s.name}
                          {s.isElective && (
                            <span className="ml-2 text-xs bg-purple-200 dark:bg-purple-700 px-2 py-1 rounded">
                              Elective
                            </span>
                          )}
                        </td>
                        <td className="p-3">{s.credits}</td>
                        <td className="p-3">{s.type}</td>

                        <td className="p-3">
                          <select
                            value={s.grade}
                            onChange={(e) => handleGrade(s.id, e.target.value)}
                            className="border px-2 py-1 dark:bg-gray-700 rounded"
                          >
                            <option value="">Select</option>
                            {["O", "A+", "A", "B+", "B", "C", "RA"].map((g) => (
                              <option key={g} value={g}>
                                {g}
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

          {/* RESULT + ACTION BUTTONS */}
          <div className="flex gap-4 items-center">
            <button
              onClick={calcGPA}
              disabled={!semester}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:bg-gray-500"
            >
              <Calculator />
              Calculate GPA
            </button>

            {gpaResult && (
              <>
                <button
                  onClick={saveGrades}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Save />
                  Save Grades
                </button>

                <button
                  onClick={generatePDF}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Download />
                  Marksheet PDF
                </button>
              </>
            )}

            {gpaResult && (
              <div className="ml-auto p-5 bg-blue-100 dark:bg-blue-900 border dark:border-blue-700 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {gpaResult.gpa}
                </p>
                <p className="text-sm dark:text-gray-300">
                  Total Credits: {gpaResult.totalCredits}
                </p>
                <p className="text-xs dark:text-gray-400">
                  Points: {gpaResult.totalPoints}
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
