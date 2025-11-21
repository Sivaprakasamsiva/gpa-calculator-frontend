import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
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

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function App() {
  // -------------------------
  // GLOBAL AUTH + LOADING FIX
  // -------------------------
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // << FIXED

  // Load saved user on refresh
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // Login: Save user + token
  const login = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  // Logout: Remove user
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Private Route Wrapper
  const PrivateRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/login" />;

    if (role && user.role !== role) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading }}>
      <Router>
        <Routes>

          {/* Auth Pages */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/redirect" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/redirect" />}
          />
          <Route path="/logout" element={<Logout />} />

          {/* Auto Redirect on Login */}
          <Route
            path="/redirect"
            element={
              user ? (
                user.role === "ADMIN" ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* STUDENT ROUTES */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute role="STUDENT">
                <StudentDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/gpa"
            element={
              <PrivateRoute role="STUDENT">
                <GPACalculator />
              </PrivateRoute>
            }
          />

          <Route
            path="/cgpa"
            element={
              <PrivateRoute role="STUDENT">
                <CGPACalculator />
              </PrivateRoute>
            }
          />

          <Route
            path="/history"
            element={
              <PrivateRoute role="STUDENT">
                <History />
              </PrivateRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="ADMIN">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <PrivateRoute role="ADMIN">
                <StudentManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/curriculum"
            element={
              <PrivateRoute role="ADMIN">
                <CurriculumManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <PrivateRoute role="ADMIN">
                <Reports />
              </PrivateRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/redirect" />} />

          {/* 404 FALLBACK */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
