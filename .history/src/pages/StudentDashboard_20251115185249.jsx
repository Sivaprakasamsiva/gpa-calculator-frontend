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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getHistory(),
      ]);

      setProfile(p?.data || null);
      setRecentCalculations(Array.isArray(h.data) ? h.data.slice(0, 5) : []);
    } catch (e) {
      console.error("Dashboard failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "GPA Calculator",
      description: "Calculate semester GPA",
      icon: Calculator,
      link: "/gpa",
      color: "bg-blue-600",
    },
    {
      title: "CGPA Calculator",
      description: "Calculate overall CGPA",
      icon: BarChart3,
      link: "/cgpa",
      color: "bg-green-600",
    },
    {
      title: "History",
      description: "View your calculation history",
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

        <main className="flex-1 p-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white">
            Welcome, {user?.name} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your academic dashboard
          </p>

          {/* PROFILE CARD */}
          {profile && (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center">
                  <User size={32} className="text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold dark:text-white">
                    {profile.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-300">
                    {profile.department?.name} • {profile.regulation?.name}
                  </p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.title}
                  to={a.link}
                  className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow hover:shadow-lg transition"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-xl ${a.color} flex items-center justify-center`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold dark:text-white">
                        {a.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {a.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* RECENT */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold dark:text-white mb-3">
              Recent Calculations
            </h2>

            {recentCalculations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No history found.
              </p>
            ) : (
              <div className="space-y-4">
                {recentCalculations.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-lg border dark:border-gray-700 flex justify-between dark:bg-gray-700"
                  >
                    <div>
                      <p className="font-semibold dark:text-white">
                        Semester {h.semester} • {h.type}
                      </p>
                      <p className="text-gray-400">
                        {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      {typeof h.result === "number" ? h.result.toFixed(2) : h.result}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
