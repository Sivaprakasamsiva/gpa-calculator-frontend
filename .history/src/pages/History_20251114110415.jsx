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
      setHistory(res.data);
    } catch (err) {
      console.error("Failed loading history");
    }
  };

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            History
          </h1>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            {history.length === 0 ? (
              <p className="text-gray-500">No history found</p>
            ) : (
              <ul className="space-y-4">
                {history.map((item, index) => (
                  <li
                    key={index}
                    className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <p className="font-bold text-gray-900 dark:text-white">
                      Semester {item.semester} – {item.type}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Result: {item.result}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(item.createdAt).toLocaleString()}
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
