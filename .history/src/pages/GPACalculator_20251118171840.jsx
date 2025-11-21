// ===========================================
// FINAL GPACalculator.jsx (Fully Updated)
// ===========================================

import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { studentAPI } from "../services/api";
import { toast } from "react-toastify";
import { Calculator as CalcIcon, Download } from "lucide-react";

const GPACalculator = () => {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Load profile once
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setProfile(res.data);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Load subjects on semester change
  const handleSemesterChange = async (value) => {
    setSemester(value);
    setSelectedSubjects([]);
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

      const subjects = Array.isArray(res.data) ? res.data : [];
      setAllSubjects(subjects);

      // Extract mandatory only
      const mandatoryList = subjects.filter((s) => !s.isElective);
      setSelectedSubjects(mandatoryList);

    } catch (err) {
      toast.error("Failed loading subjects");
    } finally {
      setLoading(false);
    }
  };

  // Handle grade change
  const handleGradeChange = (id, grade) => {
    if (grade === "remove") {
      setSelectedSubjects((prev) => prev.filter((item) => item.id !== id));
      const updatedGrades = { ...grades };
      delete updatedGrades[id];
      setGrades(updatedGrades);
      return;
    }
    setGrades((prev) => ({ ...prev, [id]: grade }));
    setGpa(null);
  };

  // Add elective
  const addElective = (id) => {
    if (!id) return;

    const electiveLimit = profile?.department?.electiveCount ?? 0;
    const chosenElectives = selectedSubjects.filter((s) => s.isElective).length;

    if (chosenElectives >= electiveLimit) {
      return toast.error(`You can select only ${electiveLimit} electives.`);
    }

    const sub = allSubjects.find((s) => s.id == id);

    if (!selectedSubjects.some((s) => s.id === sub.id)) {
      setSelectedSubjects((prev) => [...prev, sub]);
    }
  };

  // GPA calculation
  const calculateGPA = async () => {
    const validSubjects = Object.entries(grades)
      .filter(([_, grade]) => grade !== "")
      .map(([id, grade]) => ({ subjectId: Number(id), grade }));

    if (validSubjects.length === 0)
      return toast.error("Select at least one grade");

    try {
      setLoading(true);
      const res = await studentAPI.calculateGPA({
        semester: Number(semester),
        subjects: validSubjects,
      });

      setGpa(res.data);
      toast.success("🎉 GPA calculated!");
    } catch (err) {
      toast.error("Failed to calculate GPA");
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF
  const downloadPDF = async () => {
    if (!gpa) return;

    try {
      setLoading(true);
      const res = await studentAPI.generateMarksheet(Number(semester));
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `semester-${semester}-marksheet.pdf`;
      a.click();
    } catch {
      toast.error("Failed to download");
    } finally {
      setLoading(false);
    }
  };

  // Data helpers
  const mandatorySubjects = selectedSubjects.filter((s) => !s.isElective);
  const chosenElectives = selectedSubjects.filter((s) => s.isElective);
  const allElectives = allSubjects.filter((s) => s.isElective);

  const filteredElectives = allElectives.filter(
    (s) =>
      s.code.toLowerCase().includes(searchText.toLowerCase()) ||
      s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">GPA Calculator</h1>

          {/* Profile */}
          {profile && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 border">
              <p><b>Name:</b> {profile.name}</p>
              <p><b>Department:</b> {profile.department?.name}</p>
              <p><b>Regulation:</b> {profile.regulation?.name}</p>
            </div>
          )}

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
                  .map((n) => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </div>

          {/* Mandatory Subjects */}
          {mandatorySubjects.length > 0 && (
            <>
              <h2 className="font-bold text-lg mb-2">Mandatory Subjects</h2>
              <table className="w-full border mb-8">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Credits</th>
                    <th className="p-2">Grade</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-50 dark:bg-gray-700">
                  {mandatorySubjects.map((sub) => (
                    <tr key={sub.id} className="border-b">
                      <td className="p-2">{sub.code}</td>
                      <td className="p-2">{sub.name}</td>
                      <td className="p-2">{sub.credits}</td>
                      <td className="p-2">
                        <select
                          className="border rounded px-2 py-1 dark:text-black"
                          value={grades[sub.id] || ""}
                          onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="10">O</option>
                          <option value="9">A+</option>
                          <option value="8">A</option>
                          <option value="7">B+</option>
                          <option value="6">B</option>
                          <option value="5">C</option>
                          <option value="0">U</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded"
                          onClick={() => handleGradeChange(sub.id, "remove")}
                        >
                          Not Have
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Elective Selector */}
          {allElectives.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-lg mb-2">Add Elective Subjects</h2>
              <input
                className="border w-full p-2 mb-2 dark:text-black"
                placeholder="Search elective by code or name"
                onChange={(e) => setSearchText(e.target.value)}
              />

              <select
                className="border w-full p-2 dark:text-black"
                onChange={(e) => addElective(e.target.value)}
              >
                <option value="">Select elective</option>
                {filteredElectives.map((elec) => (
                  <option key={elec.id} value={elec.id}>
                    {elec.code} - {elec.name}
                  </option>
                ))}
              </select>

              {chosenElectives.length > 0 && (
                <table className="w-full border mt-4">
                  <thead className="bg-purple-700 text-white">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Credits</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50 dark:bg-gray-700">
                    {chosenElectives.map((sub) => (
                      <tr key={sub.id} className="border-b">
                        <td className="p-2">{sub.code}</td>
                        <td className="p-2">{sub.name}</td>
                        <td className="p-2">{sub.credits}</td>
                        <td className="p-2">
                          <select
                            className="border rounded px-2 py-1 dark:text-black"
                            value={grades[sub.id] || ""}
                            onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="10">O</option>
                            <option value="9">A+</option>
                            <option value="8">A</option>
                            <option value="7">B+</option>
                            <option value="6">B</option>
                            <option value="5">C</option>
                            <option value="0">U</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <button
                            className="px-2 py-1 bg-red-600 text-white rounded"
                            onClick={() =>
                              setSelectedSubjects((prev) =>
                                prev.filter((item) => item.id !== sub.id)
                              )
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              disabled={selectedSubjects.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
              onClick={calculateGPA}
            >
              <CalcIcon size={18} className="inline mr-2" /> Calculate GPA
            </button>

            {gpa && (
              <button
                className="px-6 py-3 bg-purple-600 text-white rounded"
                onClick={downloadPDF}
              >
                <Download size={18} className="inline mr-2" /> Download PDF
              </button>
            )}
          </div>

          {/* GPA Output */}
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
