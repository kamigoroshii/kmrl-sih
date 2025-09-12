import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'
import UserProfileModal from './UserProfileModal'
import '../styles/navbar.css'

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
  currentUser: { fullName: string } | null
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
    
    if (isAuthenticated) {
      // If user is authenticated, navigate to the dashboard
      navigate(`/dashboard/${departmentId}`)
    } else {
      // If user is not authenticated, open the login modal
      setModalOpen(true)
    }
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
      <nav className="bg-gradient-to-r from-olive-600 via-olive-700 to-olive-800 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm border-b border-olive-500/20">
        <div className="w-full mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex items-center h-18">
            {/* Logo Section - Enhanced */}
            <Link to="/" className="flex items-center space-x-3 group mr-8">
              <div className="relative">
                <img
                  src="/KMRL-logo.png"
                  alt="KMRL Logo"
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
       

          
            </Link>

            {/* Navigation Links - Enhanced - Left side */}
            <div className="hidden md:flex items-center space-x-2 flex-1">
              {/* 1. Departments Dropdown - Enhanced */}
              <div ref={departmentDropdownRef} className="relative">
                <button
                  onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                  className="relative font-medium px-4 py-2 rounded-xl transition-all duration-300 group flex items-center
                    hover:bg-white/10 hover:text-white focus:bg-white/20 focus:text-white
                    before:absolute before:inset-0 before:rounded-xl before:bg-white/5 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                >
                  <i className="bx bx-buildings mr-2"></i>
                  {selectedDepartment
                    ? departments.find(d => d.id === selectedDepartment)?.name || 'Departments'
                    : 'Departments'}
                  <i className={`bx bx-chevron-down ml-2 text-lg transition-transform duration-300 ${departmentDropdownOpen ? 'rotate-180' : ''}`}></i>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-3/4 group-hover:-translate-x-1/2"></div>
                </button>
                {departmentDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-olive-200/50 overflow-hidden">
                    <div className="p-2">
                      {departments.map((dept, index) => (
                        <button
                          key={dept.id}
                          onClick={() => handleDepartmentSelect(dept.id)}
                          className={`w-full px-4 py-3 text-left text-olive-700 hover:bg-olive-50 hover:text-olive-800 
                            rounded-xl transition-all duration-200 flex items-center group
                            ${index < departments.length - 1 ? 'border-b border-olive-100 mb-1' : ''}
                            ${selectedDepartment === dept.id ? 'bg-olive-100 text-olive-800 border-olive-200' : ''}`}
                        >
                          <div className="w-8 h-8 bg-olive-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-olive-200 transition-colors duration-200">
                            <i className="bx bx-building text-olive-600"></i>
                          </div>
                          <span className="font-medium">{dept.name}</span>
                          {selectedDepartment === dept.id && (
                            <i className="bx bx-check ml-auto text-olive-600"></i>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Language Dropdown - Enhanced */}
              <div ref={languageDropdownRef} className="relative">
                <button
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  className="relative font-medium px-4 py-2 rounded-xl transition-all duration-300 group flex items-center
                    hover:bg-white/10 hover:text-white focus:bg-white/20 focus:text-white
                    before:absolute before:inset-0 before:rounded-xl before:bg-white/5 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                >
                  <i className="bx bx-globe mr-2"></i>
                  {selectedLanguage}
                  <i className={`bx bx-chevron-down ml-2 text-lg transition-transform duration-300 ${languageDropdownOpen ? 'rotate-180' : ''}`}></i>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-3/4 group-hover:-translate-x-1/2"></div>
                </button>
                {languageDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-olive-200/50 overflow-hidden">
                    <div className="p-2">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageSelect(lang)}
                          className="w-full px-4 py-3 text-left text-olive-700 hover:bg-olive-50 hover:text-olive-800 
                            rounded-xl transition-all duration-200 flex items-center group"
                        >
                          <div className="w-8 h-8 bg-olive-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-olive-200 transition-colors duration-200">
                            <i className="bx bx-world text-olive-600"></i>
                          </div>
                          <span className="font-medium">{lang}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Section - Enhanced - Right side */}
            <div className="flex items-center space-x-4 ml-auto">
              {isAuthenticated ? (
                <>
                  {/* User Profile */}
                  <div 
                    className="flex items-center space-x-3 cursor-pointer px-4 py-2 rounded-xl transition-all duration-300 group hover:bg-white/10 relative
                      before:absolute before:inset-0 before:rounded-xl before:bg-white/5 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                    onClick={() => setProfileModalOpen(true)}
                    tabIndex={0}
                    role="button"
                    aria-label="Open profile settings"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-200 to-olive-300 flex items-center justify-center font-bold text-olive-800 text-lg uppercase group-hover:from-white group-hover:to-olive-100 transition-all duration-300 shadow-lg">
                        {currentUser?.fullName?.[0] || 'A'}
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-semibold text-white group-hover:text-olive-100 transition-colors duration-300">
                        {currentUser?.fullName || 'Administrator'}
                      </div>
                      <div className="text-xs text-olive-200 group-hover:text-olive-100 transition-colors duration-300">
                        Online
                      </div>
                    </div>
                    <i className="bx bx-chevron-down text-lg text-olive-100 group-hover:text-white transition-all duration-300"></i>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="relative font-medium px-4 py-2 rounded-xl transition-all duration-300 group flex items-center
                      hover:bg-red-500/20 hover:text-red-100 focus:bg-red-500/30 focus:text-red-100
                      before:absolute before:inset-0 before:rounded-xl before:bg-red-500/10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <i className="bx bx-log-out mr-2"></i>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="relative font-medium px-4 py-2 rounded-xl transition-all duration-300 group flex items-center
                    hover:bg-white/10 hover:text-white focus:bg-white/20 focus:text-white
                    before:absolute before:inset-0 before:rounded-xl before:bg-white/5 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                >
                  <i className="bx bx-user mr-2"></i>
                  Login
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-3/4 group-hover:-translate-x-1/2"></div>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
              >
                <i className="bx bx-menu text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {departmentDropdownOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-olive-500/30">
              <div className="space-y-2 pt-4">
                <Link
                  to="/"
                  className="block px-4 py-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                  onClick={() => setDepartmentDropdownOpen(false)}
                >
                  <i className="bx bx-home-alt mr-2"></i>
                  Home
                </Link>
                <div className="px-4 py-2 text-olive-200 text-sm font-medium">Departments</div>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      handleDepartmentSelect(dept.id);
                      setDepartmentDropdownOpen(false);
                    }}
                    className="block w-full text-left px-6 py-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    {dept.name}
                  </button>
                ))}
                <div className="px-4 py-2 text-olive-200 text-sm font-medium">Language</div>
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      handleLanguageSelect(lang);
                      setDepartmentDropdownOpen(false);
                    }}
                    className="block w-full text-left px-6 py-2 rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
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
