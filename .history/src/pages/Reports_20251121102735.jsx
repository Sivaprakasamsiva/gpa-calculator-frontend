import React, { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import { adminAPI } from "../services/api";
import { FileText, Download } from "lucide-react";
import { toast } from "react-toastify";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await adminAPI.getReports();
      setReports(res.data || []);
    } catch (e) {
      console.error("Reports load error:", e);
      toast.error("Failed to load reports");
    }
  };

  const downloadReport = async (id) => {
    try {
      const res = await adminAPI.downloadReport(id);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${id}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed");
    }
  };

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Reports
          </h1>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            {reports.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No reports available.
              </p>
            ) : (
              <ul className="space-y-4">
                {reports.map((rp) => (
                  <li
                    key={rp.id}
                    className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700"
                  >
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {rp.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Generated on:{" "}
                        {new Date(rp.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => downloadReport(rp.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700"
                    >
                      <Download size={18} className="mr-2" />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
           <Footer
        </main>
      </div>
    </div>
  );
};

export default Reports;
