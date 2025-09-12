import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'
import UserProfileModal from './UserProfileModal'

// Departments data
const departments = [
  { id: 'engineering', name: 'Engineering' },
  { id: 'maintenance-operations', name: 'Operations & Maintenance' },
  { id: 'procurement', name: 'Procurement' },
  { id: 'finance', name: 'Finance' },
  { id: 'hr', name: 'Human Resources' }
]

// Sample languages
const languages = ['English', 'Malayalam', 'Hindi']

interface NavbarProps {
  isAuthenticated: boolean
  currentUser: { name: string } | null
  onLogin: (username: string, password: string) => Promise<boolean>
  onLogout: () => void
  loginModalOpen?: boolean
  setLoginModalOpen?: (open: boolean) => void
  selectedDepartment: string | null
  setSelectedDepartment: (dept: string) => void
}

function Navbar({
  isAuthenticated,
  currentUser,
  onLogin,
  onLogout,
  loginModalOpen: loginModalOpenProp,
  setLoginModalOpen: setLoginModalOpenProp,
  selectedDepartment,
  setSelectedDepartment,
}: NavbarProps): JSX.Element {
  // Modal state
  const [internalLoginModalOpen, setInternalLoginModalOpen] = useState(false)
  const modalOpen = typeof loginModalOpenProp === 'boolean' ? loginModalOpenProp : internalLoginModalOpen
  const setModalOpen = setLoginModalOpenProp || setInternalLoginModalOpen

  // Dropdown states
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  
  // Refs for click outside handling
  const departmentDropdownRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setDepartmentDropdownOpen(false)
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigation
  const navigate = useNavigate()

  // Handlers
  const handleDepartmentSelect = (departmentId: string) => {
    setDepartmentDropdownOpen(false)
    setSelectedDepartment(departmentId);
    navigate(`/dashboard/${departmentId}`)
  }

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language)
    setLanguageDropdownOpen(false)
  }

  const handleProfileUpdate = (updatedUser: any) => {
    // Handle profile update logic here
    console.log('Profile updated:', updatedUser)
  }

  return (
    <>
      <nav className="bg-olive-600 text-white shadow-lg sticky top-0 z-50">
        <div className="w-full mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex items-center space-x-6 h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/KMRL-logo.png"
                alt="KMRL Logo"
                className="h-8 w-auto"
              />
            </Link>


            {/* 1. Home Link */}
            <Link
              to="/"
              className="font-medium px-3 py-2 rounded-lg transition-colors
                hover:bg-olive-700 hover:text-white focus:bg-olive-800 focus:text-white"
            >
              Home
            </Link>


            {/* 2. Departments Dropdown */}
            <div ref={departmentDropdownRef} className="relative">
              <button
                onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                className="font-medium px-3 py-2 rounded-lg transition-colors text-white
                  hover:bg-olive-700 hover:text-white focus:bg-olive-800 focus:text-white"
              >
                {selectedDepartment
                  ? departments.find(d => d.id === selectedDepartment)?.name || 'Departments'
                  : 'Departments'}
                <span className="ml-2">
                  <i className={`bx bx-chevron-down text-lg transition-transform ${departmentDropdownOpen ? 'rotate-180' : ''}`}></i>
                </span>
              </button>
              {departmentDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleDepartmentSelect(dept.id)}
                      className="w-full px-4 py-2 text-left text-olive-700 hover:bg-olive-50"
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Language Dropdown */}
            <div ref={languageDropdownRef} className="relative">
              <button
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="font-medium px-3 py-2 rounded-lg transition-colors text-white
                  hover:bg-olive-700 hover:text-white focus:bg-olive-800 focus:text-white"
              >
                {selectedLanguage}
                <span className="ml-2">
                  <i className={`bx bx-chevron-down text-lg transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`}></i>
                </span>
              </button>
              {languageDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className="w-full px-4 py-2 text-left text-olive-700 hover:bg-olive-50"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* 4. User Info */}
            {isAuthenticated ? (
              <>
                <div 
                  className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 group hover:bg-olive-700"
                  onClick={() => setProfileModalOpen(true)}
                  tabIndex={0}
                  role="button"
                  aria-label="Open profile settings"
                >
                  <div className="w-8 h-8 rounded-full bg-olive-200 flex items-center justify-center font-bold text-olive-800 text-lg uppercase group-hover:bg-olive-800 group-hover:text-white transition-colors duration-200">
                    {currentUser?.name?.[0] || 'A'}
                  </div>
                  <div className="text-sm font-medium text-white group-hover:text-white transition-colors duration-200">
                    {currentUser?.name || 'Administrator'}
                  </div>
                  <i className="bx bx-user-circle text-xl ml-1 text-olive-100 group-hover:text-white transition-colors duration-200"></i>
                </div>
                <button
                  onClick={onLogout}
                  className="font-medium px-3 py-2 rounded-lg transition-colors
                    hover:bg-olive-700 hover:text-white focus:bg-olive-800 focus:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="font-medium px-3 py-2 rounded-lg transition-colors
                  hover:bg-olive-700 hover:text-white focus:bg-olive-800 focus:text-white"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onLogin={onLogin}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleProfileUpdate}
      />
    </>
  )
}

export default Navbar
