import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAuthenticated }) => {
  const navigate = useNavigate()

  const departments = [
    { id: 'engineering', name: 'Engineering', icon: 'bx bx-cog', color: 'text-olive-500' },
    { id: 'procurement', name: 'Procurement', icon: 'bx bx-package', color: 'text-olive-600' },
    { id: 'finance', name: 'Finance', icon: 'bx bx-dollar-circle', color: 'text-olive-400' },
    { id: 'hr', name: 'Human Resources', icon: 'bx bx-group', color: 'text-olive-700' }
  ]

  const handleDepartmentClick = (departmentId: string) => {
    navigate(`/dashboard/${departmentId}`)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white to-olive-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-80 border-r border-olive-200`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-olive-600 to-olive-700 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-olive font-bold text-lg">K</span>
              </div>
              <h2 className="text-xl font-bold">KMRL Menu</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-olive-200 transition-colors p-1 rounded-lg hover:bg-olive-800"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6">
          {/* Main Navigation */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Main Menu
            </h3>
            <nav className="space-y-2">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group"
              >
                <i className="bx bx-home text-xl mr-3 group-hover:text-olive-600"></i>
                <span className="font-medium">Home</span>
              </Link>
              
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group"
                >
                  <i className="bx bx-bar-chart-alt-2 text-xl mr-3 group-hover:text-olive-600"></i>
                  <span className="font-medium">Dashboard</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Departments */}
          {isAuthenticated && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Departments
              </h3>
              <nav className="space-y-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleDepartmentClick(dept.id)}
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group"
                  >
                    <i className={`${dept.icon} text-xl mr-3 ${dept.color} group-hover:text-olive-600`}></i>
                    <span className="font-medium">{dept.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <nav className="space-y-2">
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group">
                <i className="bx bx-file-plus text-xl mr-3 text-blue-500 group-hover:text-olive-600"></i>
                <span className="font-medium">New Document</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group">
                <i className="bx bx-search text-xl mr-3 text-green-500 group-hover:text-olive-600"></i>
                <span className="font-medium">Search Documents</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group">
                <i className="bx bx-trending-up text-xl mr-3 text-purple-500 group-hover:text-olive-600"></i>
                <span className="font-medium">Reports</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-olive-100 hover:text-olive-700 rounded-lg transition-all duration-200 group">
                <i className="bx bx-cog text-xl mr-3 text-gray-500 group-hover:text-olive-600"></i>
                <span className="font-medium">Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-olive-200 bg-olive-50">
          <div className="flex items-center justify-center space-x-2 text-olive-700">
            <i className="bx bx-shield-alt-2 text-lg"></i>
            <p className="text-xs font-medium">
              KMRL Document Workflow System v2.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
