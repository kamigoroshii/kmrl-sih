import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'
import type { User } from '../hooks/useAuth'

interface NavbarProps {
  toggleSidebar: () => void
  isAuthenticated: boolean
  currentUser: User | null
  onLogin: (username: string, password: string) => Promise<boolean>
  onLogout: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  toggleSidebar,
  isAuthenticated,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const departments = [
    { id: 'engineering', name: 'Engineering', icon: 'bx bx-cog', color: 'bg-olive-500' },
    { id: 'procurement', name: 'Procurement', icon: 'bx bx-package', color: 'bg-olive-600' },
    { id: 'finance', name: 'Finance', icon: 'bx bx-dollar-circle', color: 'bg-olive-400' },
    { id: 'hr', name: 'Human Resources', icon: 'bx bx-group', color: 'bg-olive-700' },
    { id: 'admin', name: 'Administration', icon: 'bx bx-buildings', color: 'bg-olive-800' }
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDepartmentDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDepartmentSelect = async (departmentId: string) => {
    setSelectedDepartment(departmentId)
    setDepartmentDropdownOpen(false)
    
    if (!isAuthenticated) {
      // Open login modal if not authenticated
      setLoginModalOpen(true)
    } else {
      // Navigate to dashboard if authenticated
      navigate(`/dashboard/${departmentId}`)
    }
  }

  const handleLoginSuccess = () => {
    setLoginModalOpen(false)
    // Navigate to selected department dashboard after login
    if (selectedDepartment && currentUser) {
      navigate(`/dashboard/${selectedDepartment}`)
    } else if (currentUser) {
      // Navigate to user's own department if no specific department was selected
      navigate(`/dashboard/${currentUser.department}`)
    }
  }

  return (
    <>
      <nav className="bg-olive text-white shadow-lg sticky top-0 z-50">
        <div className="w-full mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex items-center h-16">
            {/* Logo, Title, and User Info (user info to the right of KMRL) */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-olive font-bold text-xl">K</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">KMRL</h1>
                  <p className="text-xs text-olive-200">Document Workflow</p>
                </div>
              </Link>
              {/* User Info (right of KMRL) */}
              {isAuthenticated && (
                <div className="text-right">
                  <div className="text-sm font-bold">{currentUser?.fullName}</div>
                  <div className="text-xs text-olive-200 capitalize">{currentUser?.department}</div>
                </div>
              )}
            </div>

            {/* Spacer to push content to the right */}
            <div className="flex-1"></div>

            {/* Right-aligned Navigation and Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Home Link */}
              <Link 
                to="/" 
                className="hidden md:block font-medium px-3 py-2 rounded-lg transition-colors
                  hover:bg-olive-100 hover:text-olive-700 focus:bg-olive-200 focus:text-olive-800"
              >
                Home
              </Link>
              
              {/* Department Dropdown */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                  className="flex items-center space-x-1 hover:text-olive-200 transition-colors font-medium"
                >
                  <span>Departments</span>
                  <i className={`bx bx-chevron-down text-lg transition-transform ${departmentDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {/* Dropdown Menu */}
                {departmentDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept.id)}
                        className={`w-full px-4 py-3 text-left flex items-center space-x-3 group transition-colors rounded-lg
                          hover:bg-olive-100 hover:text-olive-700
                          ${selectedDepartment === dept.id ? 'bg-olive-200 text-olive-800 font-semibold' : ''}`}
                      >
                        <span className={`text-lg group-hover:text-olive-700 ${selectedDepartment === dept.id ? 'text-olive-800' : ''}`}><i className={dept.icon}></i></span>
                        <div>
                          <div className={`font-medium group-hover:text-olive-700 ${selectedDepartment === dept.id ? 'text-olive-800' : 'text-gray-900'}`}>
                            {dept.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isAuthenticated && currentUser?.department === dept.id 
                              ? 'Your Department' 
                              : 'View Dashboard'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {isAuthenticated && (
                <Link 
                  to={`/dashboard/${currentUser?.department}`}
                  className="hidden md:block font-medium px-3 py-2 rounded-lg transition-colors
                    hover:bg-olive-100 hover:text-olive-700 focus:bg-olive-200 focus:text-olive-800"
                >
                  My Dashboard
                </Link>
              )}

              {/* User Section (only Logout/Login button now) */}
              {isAuthenticated ? (
                <button
                  onClick={onLogout}
                  className="bg-olive-600 hover:bg-olive-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-white text-olive hover:bg-olive-50 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Login
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-olive-600 rounded-lg transition-colors"
              >
                <i className="bx bx-menu text-2xl"></i>
              </button>

              {/* Mobile Menu Button for authenticated users */}
              {isAuthenticated && (
                <button
                  onClick={toggleSidebar}
                  className="hidden md:block p-2 hover:bg-olive-600 rounded-lg transition-colors"
                  title="Menu"
                >
                  <i className="bx bx-menu text-xl"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={onLogin}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}

export default Navbar