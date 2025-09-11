import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HeroSection from './components/HeroSection'
import DashboardRoute from './components/DashboardRoute'
import { AuthProvider, useAuth } from './hooks/useAuth'

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, currentUser, login, logout } = useAuth()

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-beige-50">
        <Navbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={login}
          onLogout={logout}
        />
        
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isAuthenticated={isAuthenticated}
        />
        
        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<HeroSection />} />
            <Route 
              path="/dashboard/:department" 
              element={
                <DashboardRoute 
                  isAuthenticated={isAuthenticated}
                  currentUser={currentUser}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
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