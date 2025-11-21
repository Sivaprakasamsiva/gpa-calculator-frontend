import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { BarChart3, Users, BookOpen, FileText } from "lucide-react";

const AdminDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);

  const stats = [
    {
      title: "Total Students",
      value: 240,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Departments",
      value: 12,
      icon: BookOpen,
      color: "bg-green-600",
    },
    {
      title: "Reports Generated",
      value: 142,
      icon: FileText,
      color: "bg-purple-600",
    },
    {
      title: "Active Regulations",
      value: 2,
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-xl ${item.color}`}>
                      <Icon className="text-white" size={28} />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {item.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
