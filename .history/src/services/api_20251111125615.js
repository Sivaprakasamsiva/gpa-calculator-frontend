import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
}

export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (profileData) => api.put('/student/profile', profileData),
  getSubjects: (regulationId, departmentId, semester) => 
    api.get(`/student/subjects?regulationId=${regulationId}&departmentId=${departmentId}&semester=${semester}`),
  calculateGPA: (data) => api.post('/student/calculate-gpa', data),
  saveGrades: (data) => api.post('/student/grades', data),
  calculateCGPA: (semesterIds) => api.post('/student/calculate-cgpa', { semesterIds }),
  getHistory: () => api.get('/student/history'),
  generateMarksheet: (semester) => api.get(`/student/marksheet/${semester}`, { responseType: 'blob' }),
  generateCGPASummary: (semesterIds) => 
    api.post('/student/cgpa-summary', { semesterIds }, { responseType: 'blob' }),
}

export const adminAPI = {
  getStudents: (page, size) => api.get(`/admin/students?page=${page}&size=${size}`),
  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  getRegulations: () => api.get('/admin/regulations'),
  getDepartments: () => api.get('/admin/departments'),
  addSubject: (subjectData) => api.post('/admin/subjects', subjectData),
  bulkInsertSubjects: (subjectsData) => api.post('/admin/subjects/bulk', subjectsData),
  getSubjects: (regulationId, departmentId, semester) => 
    api.get(`/admin/subjects?regulationId=${regulationId}&departmentId=${departmentId}&semester=${semester}`),
  generateReport: (type, filters) => api.post('/admin/reports', { type, filters }, { responseType: 'blob' }),
}

export default api