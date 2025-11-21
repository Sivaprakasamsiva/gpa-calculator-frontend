// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(false);   // local loading state
  const { user } = useAuth(); // removed setLoading

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (loading) return; // prevent double calls

      setLoading(true);
      try {
        const [profileRes, historyRes] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getHistory(),
        ]);

        setProfile(profileRes.data || null);

        const history = Array.isArray(historyRes.data) ? historyRes.data : [];
        const sorted = [...history].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setRecentCalculations(sorted.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // FIXED, fires once


  const quickActions = [
    {
      title: "GPA Calculator",
      description: "Calculate and save your semester GPA",
      icon: Calculator,
      link: "/gpa",
      color: "bg-blue-500",
    },
    {
      title: "CGPA Calculator",
      description: "Calculate your overall CGPA from stored GPAs",
      icon: BarChart3,
      link: "/cgpa",
      color: "bg-green-500",
    },
    {
      title: "History",
      description: "View all your stored GPA results",
      icon: HistoryIcon,
      link: "/history",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name || profile?.name || "Student"}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and calculate your academic performance.
              </p>
            </div>

            {profile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {profile.department?.name || "No department"}{" "}
                      {profile.regulation?.name
                        ? `• ${profile.regulation.name}`
                        : ""}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.link}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Recent Calculations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent GPA Calculations
                </h2>
              </div>
              <div className="p-6">
                {recentCalculations.length > 0 ? (
                  <div className="space-y-4">
                    {recentCalculations.map((calculation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Semester {calculation.semester}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {calculation.createdAt
                              ? new Date(calculation.createdAt).toLocaleDateString()
                              : ""}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Credits: {calculation.totalCredits} • Points: {calculation.totalPoints}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {calculation.gpa?.toFixed
                              ? calculation.gpa.toFixed(2)
                              : Number(calculation.gpa || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">GPA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No GPA results stored yet. Start with the GPA calculator!
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
