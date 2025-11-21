// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { studentAPI } from "../services/api";
import {
  Calculator,
  BarChart3,
  History as HistoryIcon,
  User,
} from "lucide-react";

import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [recentCalculations, setRecentCalculations] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const { user, setLoading } = useAuth();

  // Load profile + history
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [profileRes, historyRes] = await Promise.all([
        studentAPI.getProfile(),   // GET /api/student/profile
        studentAPI.getHistory(),   // GET /api/student/history
      ]);

      setProfile(profileRes?.data || null);

      // take only latest 5 items
      const hist = Array.isArray(historyRes?.data)
        ? historyRes.data.slice(0, 5)
        : [];
      setRecentCalculations(hist);

    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "GPA Calculator",
      description: "Calculate your semester GPA",
      icon: Calculator,
      link: "/gpa",
      color: "bg-blue-600",
    },
    {
      title: "CGPA Calculator",
      description: "Calculate your overall CGPA",
      icon: BarChart3,
      link: "/cgpa",
      color: "bg-green-600",
    },
    {
      title: "History",
      description: "View all your GPA/CGPA calculations",
      icon: HistoryIcon,
      link: "/history",
      color: "bg-purple-600",
    },
  ];

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome, {user?.name || "Student"} 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Track your academic progress
            </p>

            {/* PROFILE SUMMARY */}
            {profile && (
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl mb-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-200 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User size={32} className="text-blue-700 dark:text-blue-300" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold dark:text-white">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {profile.department?.name} • {profile.regulation?.name}
                    </p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.title}
                    to={a.link}
                    className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 ${a.color} rounded-xl flex items-center justify-center`}
                      >
                        <Icon size={28} className="text-white" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold dark:text-white">
                          {a.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* RECENT CALCULATIONS */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-4 dark:text-white">
                Recent Calculations
              </h2>

              {recentCalculations.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-6">
                  No recent calculations found. Start by calculating your GPA!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentCalculations.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 border dark:border-gray-700 rounded-lg flex justify-between dark:bg-gray-700"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Semester {c.semester} • {c.type}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-xl font-bold text-blue-600 dark:text-blue-300">
                        {typeof c.result === "number"
                          ? c.result.toFixed(2)
                          : c.result}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
