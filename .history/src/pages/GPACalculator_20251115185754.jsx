import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { useAuth } from "../App";
import { studentAPI } from "../services/api";
import { toast } from "react-toastify";
import { Calculator, Download, Save, Search } from "lucide-react";

const GPACalculator = () => {
  const { user, setLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const [electiveSearch, setElectiveSearch] = useState("");
  const [filteredElectives, setFilteredElectives] = useState([]);

  const [gpaResult, setGpaResult] = useState(null);

  const [formData, setFormData] = useState({
    regulationId: "",
    departmentId: "",
    semester: "",
  });

  const [darkMode, setDarkMode] = useState(false);

  // ----------------------------------------------------------------
  // 1. Load student profile (regulation + department)
  // ----------------------------------------------------------------
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getProfile();
      setProfile(res.data);

      setFormData((prev) => ({
        ...prev,
        regulationId: res.data.regulation?.id || "",
        departmentId: res.data.department?.id || "",
      }));
    } catch (err) {
      toast.error("Failed loading profile");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 2. Fetch subjects from backend (REAL API)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (
      formData.regulationId &&
      formData.departmentId &&
      formData.semester
    ) {
      fetchSubjects();
    }
  }, [formData.regulationId, formData.departmentId, formData.semester]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getSubjects(
        formData.regulationId,
        formData.departmentId,
        formData.semester
      );

      setSubjects(res.data);

      setSelectedSubjects(
        res.data.map((s) => ({
          ...s,
          grade: "",
          points: 0,
        }))
      );
    } catch (err) {
      toast.error("Failed fetching subjects");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 3. Elective search (LOCAL filtering)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!electiveSearch) {
      setFilteredElectives([]);
      return;
    }

    setFilteredElectives(
      subjects.filter(
        (s) =>
          s.isElective &&
          (s.name.toLowerCase().includes(electiveSearch.toLowerCase()) ||
            s.code.toLowerCase().includes(electiveSearch.toLowerCase()))
      )
    );
  }, [electiveSearch, subjects]);

  const addElective = (elective) => {
    if (!selectedSubjects.find((s) => s.id === elective.id)) {
      setSelectedSubjects((prev) => [
        ...prev,
        { ...elective, grade: "", points: 0 },
      ]);
    }
    setElectiveSearch("");
    setFilteredElectives([]);
  };

  // ----------------------------------------------------------------
  // 4. Grade selection & GPA calculation
  // ----------------------------------------------------------------
  const gradePoints = {
    O: 10,
    "A+": 9,
    A: 8,
    "B+": 7,
    B: 6,
    C: 5,
    RA: 0,
  };

  const handleGradeChange = (id, grade) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, grade, points: gradePoints[grade] } : s
      )
    );
    setGpaResult(null);
  };

  const calculateGPA = () => {
    const graded = selectedSubjects.filter((s) => s.grade);

    if (graded.length === 0) return toast.error("Enter at least one grade");

    let totalCredits = 0;
    let totalPoints = 0;

    graded.forEach((s) => {
      totalCredits += s.credits;
      totalPoints += s.credits * s.points;
    });

    const gpa = totalPoints / totalCredits;

    setGpaResult({
      gpa: gpa.toFixed(2),
      totalCredits,
      totalPoints,
    });
  };

  // ----------------------------------------------------------------
  // 5. Save grades → backend
  // ----------------------------------------------------------------
  const saveGrades = async () => {
    if (!gpaResult) return toast.error("Calculate GPA first");

    setLoading(true);
    try {
      await studentAPI.saveGrades({
        semester: parseInt(formData.semester),
        subjects: selectedSubjects.filter((s) => s.grade),
      });
      toast.success("Grades saved successfully");
    } catch (err) {
      toast.error("Failed saving grades");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 6. Download marksheet → PDF
  // ----------------------------------------------------------------
  const generatePDF = async () => {
    if (!gpaResult) return toast.error("Calculate GPA first");

    setLoading(true);
    try {
      const res = await studentAPI.generateMarksheet(formData.semester);
      const blob = new Blob([res.data], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `marksheet-sem-${formData.semester}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed generating PDF");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------
  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            GPA Calculator
          </h1>

          {/* Semester Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <select
              value={formData.semester}
              onChange={(e) =>
                setFormData((p) => ({ ...p, semester: e.target.value }))
              }
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Subjects List */}
          {selectedSubjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Code</th>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-left">Credits</th>
                    <th className="px-6 py-3 text-left">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjects.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-200 dark:border-gray-600"
                    >
                      <td className="px-6 py-3">{s.code}</td>
                      <td className="px-6 py-3">
                        {s.name}
                        {s.isElective && (
                          <span className="ml-2 text-xs px-2 py-1 bg-purple-200 dark:bg-purple-900 rounded">
                            Elective
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">{s.credits}</td>
                      <td className="px-6 py-3">
                        <select
                          value={s.grade}
                          onChange={(e) =>
                            handleGradeChange(s.id, e.target.value)
                          }
                          className="p-1 border rounded"
                        >
                          <option value="">Select</option>
                          <option value="O">O (10)</option>
                          <option value="A+">A+ (9)</option>
                          <option value="A">A (8)</option>
                          <option value="B+">B+ (7)</option>
                          <option value="B">B (6)</option>
                          <option value="C">C (5)</option>
                          <option value="RA">RA (0)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={calculateGPA}
              className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              <Calculator className="mr-2" /> Calculate GPA
            </button>

            {gpaResult && (
              <>
                <button
                  onClick={saveGrades}
                  className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg"
                >
                  <Save className="mr-2" /> Save Grades
                </button>

                <button
                  onClick={generatePDF}
                  className="flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg"
                >
                  <Download className="mr-2" /> Download PDF
                </button>
              </>
            )}
          </div>

          {gpaResult && (
            <div className="mt-8 bg-blue-100 dark:bg-blue-900 p-6 rounded-lg">
              <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                GPA: {gpaResult.gpa}
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Total Credits: {gpaResult.totalCredits}  
                <br />
                Total Points: {gpaResult.totalPoints}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GPACalculator;
