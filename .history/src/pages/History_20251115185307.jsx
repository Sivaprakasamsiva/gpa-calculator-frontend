// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { studentAPI } from "../services/api";

const History = () => {
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await studentAPI.getHistory();
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("History load failed", err);
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
            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">
                No history found.
              </p>
            ) : (
              <ul className="space-y-4">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                  >
                    <p className="font-bold text-gray-900 dark:text-white">
                      Semester {h.semester} — {h.type}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      Result: {typeof h.result === "number" ? h.result.toFixed(2) : h.result}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default History;
