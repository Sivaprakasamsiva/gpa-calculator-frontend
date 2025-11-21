// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { studentAPI } from "../services/api";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import { generateGPAPDF } from "../utils/GPAPDFGenerator";

const History = () => {
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [profRes, histRes] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getHistory(),
      ]);

      setProfile(profRes.data || null);
      setHistory(Array.isArray(histRes.data) ? histRes.data : []);
    } catch (err) {
      console.error("History load failed", err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForSemester = async (h) => {
    try {
      if (!profile) {
        toast.error("Profile not loaded");
        return;
      }

      const semNo = Number(h.semester);
      if (!semNo) {
        toast.error("Invalid semester");
        return;
      }

      setLoading(true);

      // subjects for that sem (no grades here)
      const subRes = await studentAPI.getSubjects(
        profile.regulation?.id,
        profile.department?.id,
        semNo
      );
      const subjects = Array.isArray(subRes.data) ? subRes.data : [];

      const rows = subjects.map((sub) => ({
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        grade: "", // history doesn't have per-subject grade
      }));

      const gpaValue =
        h.gpa ??
        h.GPA ??
        h.gpaValue ??
        h.gradePointAverage ??
        h.result ??
        0;

      const gpaResult = {
        gpa: Number(gpaValue),
        totalCredits: subjects.reduce(
          (sum, s) => sum + Number(s.credits || 0),
          0
        ),
        totalPoints: h.totalPoints ?? "-",
      };

      await generateGPAPDF({
        profile,
        semester: semNo,
        rows,
        gpaResult,
      });
    } catch (err) {
      console.error("History PDF error:", err);
      toast.error("Failed to generate marksheet PDF");
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
          <h1 className="text-3xl font-bold dark:text-white mb-6">History</h1>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            {loading && (
              <p className="text-blue-500 text-sm mb-3">
                Loading / generating PDF...
              </p>
            )}

            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">
                No history found.
              </p>
            ) : (
              <ul className="space-y-4">
                {history.map((h, index) => (
                  <li
                    key={h.id ?? `history-${h.semester}-${index}`}
                    className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Semester {h.semester}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Result:{" "}
                        {typeof h.gpa === "number"
                          ? h.gpa.toFixed(2)
                          : Number(h.gpa || h.result || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleString()
                          : "No date"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadForSemester(h)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* FOOTER */}
<footer className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400 py-6 border-t dark:border-gray-700">
  <p>
    Made by <span className="font-semibold">Sivaprakasam</span> •{" "}
    <a
      href="https://github.com/Sivaprakasamsiva/GradeTrack-Pro-GPA-CGPA-Calculator-with-Admin-Panel.git"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
    >
      GitHub
    </a>
  </p>
</footer>

        </main>
      </div>
    </div>
  );
};

export default History;
