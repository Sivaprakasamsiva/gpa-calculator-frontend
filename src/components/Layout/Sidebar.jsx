import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../App'
import { 
  LayoutDashboard, 
  Calculator, 
  Users, 
  BookOpen, 
  History as HistoryIcon,
  FileText,
  BarChart3
} from 'lucide-react'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const studentMenu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/gpa', icon: Calculator, label: 'GPA Calculator' },
    { path: '/cgpa', icon: BarChart3, label: 'CGPA Calculator' },
    { path: '/history', icon: HistoryIcon, label: 'History' },
  ]

  const adminMenu = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/students', icon: Users, label: 'Student Management' },
    { path: '/admin/curriculum', icon: BookOpen, label: 'Curriculum Management' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
  ]

  const menuItems = user?.role === 'ADMIN' ? adminMenu : studentMenu

  const isActive = (path) => {
    if (path === '/dashboard' || path === '/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <nav className="mt-8">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-r-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar