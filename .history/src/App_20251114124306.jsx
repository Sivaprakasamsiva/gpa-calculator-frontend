import React, { useState, createContext, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GPACalculator from "./pages/GPACalculator";
import CGPACalculator from "./pages/CGPACalculator";
import History from "./pages/History";
import StudentManagement from "./pages/StudentManagement";
import CurriculumManagement from "./pages/CurriculumManagement";
import Reports from "./pages/Reports";
import Logout from "./pages/Logout";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (data) => {
    if (!data.role) data.role = "STUDENT"; // fallback to avoid infinite loop
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (loading) return <div className="text-center mt-10 text-lg">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/logout" element={<Logout />} />

          {/* STUDENT ROUTES */}
          <Route path="/dashboard" element={user?.role === "STUDENT" ? <StudentDashboard /> : <Navigate to="/login" />} />
          <Route path="/gpa" element={user?.role === "STUDENT" ? <GPACalculator /> : <Navigate to="/login" />} />
          <Route path="/cgpa" element={user?.role === "STUDENT" ? <CGPACalculator /> : <Navigate to="/login" />} />
          <Route path="/history" element={user?.role === "STUDENT" ? <History /> : <Navigate to="/login" />} />

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={user?.role === "ADMIN" ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/admin/students" element={user?.role === "ADMIN" ? <StudentManagement /> : <Navigate to="/login" />} />
          <Route path="/admin/curriculum" element={user?.role === "ADMIN" ? <CurriculumManagement /> : <Navigate to="/login" />} />
          <Route path="/admin/reports" element={user?.role === "ADMIN" ? <Reports /> : <Navigate to="/login" />} />

          {/* DEFAULT ROUTE */}
          <Route path="/" element={<Navigate to={user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"} />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={2500} />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
