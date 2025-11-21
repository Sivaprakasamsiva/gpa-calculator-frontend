import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import GPACalculator from './pages/GPACalculator'
import CGPACalculator from './pages/CGPACalculator'
import History from './pages/History'
import StudentManagement from './pages/StudentManagement'
import CurriculumManagement from './pages/CurriculumManagement'
import Reports from './pages/Reports'

// Context
const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading }}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />} />
            
            {/* Student Routes */}
            <Route path="/dashboard" element={user?.role === 'STUDENT' ? <StudentDashboard /> : <Navigate to="/login" />} />
            <Route path="/gpa" element={user?.role === 'STUDENT' ? <GPACalculator /> : <Navigate to="/login" />} />
            <Route path="/cgpa" element={user?.role === 'STUDENT' ? <CGPACalculator /> : <Navigate to="/login" />} />
            <Route path="/history" element={user?.role === 'STUDENT' ? <History /> : <Navigate to="/login" />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/admin/students" element={user?.role === 'ADMIN' ? <StudentManagement /> : <Navigate to="/login" />} />
            <Route path="/admin/curriculum" element={user?.role === 'ADMIN' ? <CurriculumManagement /> : <Navigate to="/login" />} />
            <Route path="/admin/reports" element={user?.role === 'ADMIN' ? <Reports /> : <Navigate to="/login" />} />
            
            <Route path="/" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/login'} />} />
          </Routes>
          
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthContext.Provider>
  )
}

export default App