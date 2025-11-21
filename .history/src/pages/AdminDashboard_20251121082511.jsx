import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { Users, BookOpen, FileText, BarChart3 } from "lucide-react";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);

  const [stats, setStats] = useState({
    students: 0,
    departments: 0,
    regulations: 0,
    reports: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [stud, dept, reg, rep] = await Promise.all([
          adminAPI.getTotalStudents(),
          adminAPI.getTotalDepartments(),
          adminAPI.getTotalRegulations(),
          adminAPI.getReportsCount(),
        ]);

        // FIXED HERE → now reading count instead of object
        setStats({
          students: stud.data.count,
          departments: dept.data.count,
          regulations: reg.data.count,
          reports: rep.data.count,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Departments",
      value: stats.departments,
      icon: BookOpen,
      color: "bg-green-600",
    },
    {
      title: "Reports Generated",
      value: stats.reports,
      icon: FileText,
      color: "bg-purple-600",
    },
    {
      title: "Active Regulations",
      value: stats.regulations,
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-1000 mb-8">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 dark:text- gap-6">
            {cards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm"
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
