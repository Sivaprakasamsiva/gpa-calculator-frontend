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

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);

  // Load user once
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Private route
  const PrivateRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/login" replace />;
    return children;
  };

  // Clean simple redirect
  const RedirectByRole = () => {
    if (!user) return <Navigate to="/login" replace />;
    return user.role === "ADMIN"
      ? <Navigate to="/admin" replace />
      : <Navigate to="/dashboard" replace />;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={!user ? <Login /> : <RedirectByRole />} />
          <Route path="/register" element={!user ? <Register /> : <RedirectByRole />} />
          <Route path="/logout" element={<Logout />} />

          {/* Student Routes */}
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

          {/* Admin Routes */}
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
          <Route path="/" element={<RedirectByRole />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
