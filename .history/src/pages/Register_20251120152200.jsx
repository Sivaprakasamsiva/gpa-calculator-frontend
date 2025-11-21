import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    regulation: '',
    department: ''
  })

  const [regulations, setRegulations] = useState([])
  const [departments, setDepartments] = useState([])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { setLoading } = useAuth()
  const navigate = useNavigate()

  // =============================
  // 🔥 FETCH DROPDOWN DATA
  // =============================
  useEffect(() => {
    loadRegulations()
    loadDepartments()
  }, [])

  // -----------------------------
  // CLEAN REGULATIONS RESPONSE
  // -----------------------------
  const loadRegulations = async () => {
    try {
      const res = await authAPI.getPublicRegulations()
      console.log("RAW Regulations:", res.data)

      const cleaned = res.data.map(r => ({
        id: r.id,
        name: r.name,
        year: r.year
      }))

      console.log("Cleaned Regulations:", cleaned)
      setRegulations(cleaned)
    } catch (err) {
      console.error("Failed to fetch regulations", err)
      setRegulations([])
    }
  }

  // -----------------------------
  // CLEAN DEPARTMENTS RESPONSE
  // -----------------------------
  const loadDepartments = async () => {
    try {
      const res = await authAPI.getPublicDepartments()
      console.log("RAW Departments:", res.data)

      const cleaned = res.data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code
      }))

      console.log("Cleaned Departments:", cleaned)
      setDepartments(cleaned)
    } catch (err) {
      console.error("Failed to fetch departments", err)
      setDepartments([])
    }
  }

  // ============================
  // FORM CHANGE
  // ============================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // ============================
  // SUBMIT REGISTER
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await authAPI.register(formData)

      toast.success('Registration successful! Please login.')
      navigate('/login')

    } catch (error) {
      toast.error(error.response?.data || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">

            {/* Name */}
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="relative block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Full Name"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Email address"
              />
            </div>

            {/* Regulation */}
            <select
              name="regulation"
              required
              value={formData.regulation}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select Regulation</option>
              {regulations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.year})
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="relative block w-full pl-10 pr-10 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="relative block w-full pl-10 pr-10 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
