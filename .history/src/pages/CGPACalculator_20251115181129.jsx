import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { studentAPI } from '../services/api'
import { GRADE_OPTIONS, SEMESTERS } from '../utils/constants'
import { toast } from 'react-toastify'
import Header from '../components/Layout/Header'
import Sidebar from '../components/Layout/Sidebar'
import { Save, Download, Calculator, Search } from 'lucide-react'

const GPACalculator = () => {
  const [regulations, setRegulations] = useState([])
  const [departments, setDepartments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [electiveSearch, setElectiveSearch] = useState('')
  const [filteredElectives, setFilteredElectives] = useState([])
  const [gpaResult, setGpaResult] = useState(null)
  
  const [formData, setFormData] = useState({
    regulationId: '',
    departmentId: '',
    semester: ''
  })

  const { user, setLoading } = useAuth()
  const [darkMode, setDarkMode] = useState(false)

  // Mock data - in real app, fetch from API
  useEffect(() => {
    setRegulations([
      { id: 1, name: 'R2017', year: 2017 },
      { id: 2, name: 'R2021', year: 2021 }
    ])
    setDepartments([
      { id: 1, name: 'Computer Science Engineering', code: 'CSE' },
      { id: 2, name: 'Information Technology', code: 'IT' }
    ])
  }, [])

  const fetchSubjects = async () => {
    if (!formData.regulationId || !formData.departmentId || !formData.semester) {
      return
    }

    setLoading(true)
    try {
      const response = await studentAPI.getSubjects(
        formData.regulationId,
        formData.departmentId,
        formData.semester
      )
      const subjectsData = response.data
      setSubjects(subjectsData)
      
      // Initialize selected subjects with empty grades
      const initialSelected = subjectsData.map(subject => ({
        ...subject,
        grade: '',
        points: 0
      }))
      setSelectedSubjects(initialSelected)
    } catch (error) {
      toast.error('Failed to fetch subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [formData.regulationId, formData.departmentId, formData.semester])

  useEffect(() => {
    if (electiveSearch) {
      const filtered = subjects.filter(subject =>
        subject.isElective &&
        (subject.code.toLowerCase().includes(electiveSearch.toLowerCase()) ||
         subject.name.toLowerCase().includes(electiveSearch.toLowerCase()))
      )
      setFilteredElectives(filtered)
    } else {
      setFilteredElectives([])
    }
  }, [electiveSearch, subjects])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setGpaResult(null)
  }

  const handleGradeChange = (subjectId, grade) => {
    setSelectedSubjects(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? { ...subject, grade, points: getGradePoints(grade) }
          : subject
      )
    )
    setGpaResult(null)
  }

  const getGradePoints = (grade) => {
    const pointsMap = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'RA': 0
    }
    return pointsMap[grade] || 0
  }

  const calculateGPA = () => {
    const validSubjects = selectedSubjects.filter(subject => subject.grade)
    
    if (validSubjects.length === 0) {
      toast.error('Please enter grades for at least one subject')
      return
    }

    let totalCredits = 0
    let totalPoints = 0

    validSubjects.forEach(subject => {
      totalCredits += subject.credits
      totalPoints += subject.points * subject.credits
    })

    const gpa = totalPoints / totalCredits
    setGpaResult({
      gpa: gpa.toFixed(2),
      totalCredits,
      totalPoints
    })
  }

  const saveGrades = async () => {
    if (!gpaResult) {
      toast.error('Please calculate GPA first')
      return
    }

    setLoading(true)
    try {
      await studentAPI.saveGrades({
        semester: parseInt(formData.semester),
        subjects: selectedSubjects.filter(subject => subject.grade)
      })
      toast.success('Grades saved successfully!')
    } catch (error) {
      toast.error('Failed to save grades')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!gpaResult) {
      toast.error('Please calculate GPA first')
      return
    }

    setLoading(true)
    try {
      const response = await studentAPI.generateMarksheet(formData.semester)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `marksheet-semester-${formData.semester}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  const addElective = (elective) => {
    if (!selectedSubjects.find(subject => subject.id === elective.id)) {
      setSelectedSubjects(prev => [...prev, { ...elective, grade: '', points: 0 }])
    }
    setElectiveSearch('')
    setFilteredElectives([])
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              GPA Calculator
            </h1>

            {/* Selection Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Regulation
                  </label>
                  <select
                    value={formData.regulationId}
                    onChange={(e) => handleInputChange('regulationId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Regulation</option>
                    {regulations.map(reg => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(sem => (
                      <option key={sem.value} value={sem.value}>
                        {sem.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Elective Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Elective Subjects
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={electiveSearch}
                  onChange={(e) => setElectiveSearch(e.target.value)}
                  placeholder="Search electives by code or name..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {filteredElectives.length > 0 && (
                <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 max-h-60 overflow-y-auto">
                  {filteredElectives.map(elective => (
                    <div
                      key={elective.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-600 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => addElective(elective)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {elective.code}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {elective.name} • {elective.credits} Credits
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subjects Table */}
            {selectedSubjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subjects - Semester {formData.semester}
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Subject Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Subject Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {selectedSubjects.map((subject) => (
                        <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {subject.code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {subject.name}
                            {subject.isElective && (
                              <span className="ml-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                Elective
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {subject.credits}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {subject.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={subject.grade}
                              onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Select Grade</option>
                              {GRADE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons and Result */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <button
                  onClick={calculateGPA}
                  disabled={!formData.semester}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Calculator size={20} />
                  <span>Calculate GPA</span>
                </button>
                
                {gpaResult && (
                  <>
                    <button
                      onClick={saveGrades}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save size={20} />
                      <span>Save Grades</span>
                    </button>
                    
                    <button
                      onClick={generatePDF}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Download size={20} />
                      <span>Generate PDF</span>
                    </button>
                  </>
                )}
              </div>

              {gpaResult && (
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {gpaResult.gpa}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    GPA for Semester {formData.semester}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Total Credits: {gpaResult.totalCredits} | Total Points: {gpaResult.totalPoints}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default GPACalculator