import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import AlertsPopup from './components/AlertsPopup'
import Sidebar from './components/Sidebar'
import HeroSection from './components/HeroSection'
import Footer from './components/Footer'
import DashboardRoute from './components/DashboardRoute'
import { AuthProvider, useAuth } from './hooks/useAuth'

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, currentUser, isLoading, login, logout } = useAuth()
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <Router>
      <AppRoutes 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        isLoading={isLoading}
        login={login}
        logout={logout}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        loginModalOpen={loginModalOpen}
        setLoginModalOpen={setLoginModalOpen}
      />
    </Router>
  )
}

const AppRoutes: React.FC<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  currentUser: any;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectedDepartment: string | null;
  setSelectedDepartment: (dept: string | null) => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}> = ({
  sidebarOpen,
  setSidebarOpen,
  isAuthenticated,
  currentUser,
  isLoading,
  login,
  logout,
  selectedDepartment,
  setSelectedDepartment,
  loginModalOpen,
  setLoginModalOpen
}) => {
  const navigate = useNavigate()

  // Enhanced login function with automatic redirection
  const handleLogin = async (username: string, password: string) => {
    const success = await login(username, password)
    return success
  }

  // Auto-redirect after successful login
  useEffect(() => {
    if (isAuthenticated && currentUser && selectedDepartment) {
      // Close login modal
      setLoginModalOpen(false)
      
      // Map department names to dashboard routes
      const departmentRouteMap: { [key: string]: string } = {
        'engineering': 'engineering',
        'procurement': 'procurement', 
        'finance': 'finance',
        'hr': 'hr',
        'maintenance-operations': 'maintenance-operations'
      }
      
      const route = departmentRouteMap[selectedDepartment] || departmentRouteMap[currentUser.department]
      if (route) {
        navigate(`/dashboard/${route}`)
        // Clear selected department after redirect
        setSelectedDepartment(null)
      }
    }
  }, [isAuthenticated, currentUser, selectedDepartment, navigate, setLoginModalOpen, setSelectedDepartment])

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-beige-50">
      <Navbar 
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={logout}
        loginModalOpen={loginModalOpen}
        setLoginModalOpen={setLoginModalOpen}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
      />
      {isAuthenticated && <AlertsPopup />}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isAuthenticated={isAuthenticated}
      />
      <main className="transition-all duration-300">
        <Routes>
          <Route path="/" element={
            <>
              <HeroSection 
                onDepartmentLogin={(departmentId) => {
                  setSelectedDepartment(departmentId);
                  setLoginModalOpen(true);
                }} 
                isAuthenticated={isAuthenticated}
              />
              <Footer />
            </>
          } />
          <Route 
            path="/dashboard/:department" 
            element={
              <DashboardRoute 
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
                isLoading={isLoading}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App