import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export interface User {
  username: string
  department: string
  role: 'admin' | 'manager' | 'staff'
  fullName: string
}

interface AuthContextType {
  isAuthenticated: boolean
  currentUser: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo credentials - In production, this would be handled by a secure backend
const demoCredentials = [
  { username: 'admin', password: 'admin123', department: 'admin', role: 'admin' as const, fullName: 'Administrator' },
  { username: 'eng.manager', password: 'eng123', department: 'engineering', role: 'manager' as const, fullName: 'Engineering Manager' },
  { username: 'proc.staff', password: 'proc123', department: 'procurement', role: 'staff' as const, fullName: 'Procurement Staff' },
  { username: 'fin.manager', password: 'fin123', department: 'finance', role: 'manager' as const, fullName: 'Finance Manager' },
  { username: 'hr.staff', password: 'hr123', department: 'hr', role: 'staff' as const, fullName: 'HR Staff' }
]

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('kmrl_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('kmrl_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Allow any username and password for demo/testing
    let user: User;
    if (username === 'admin') {
      user = {
        username: 'admin',
        department: 'admin',
        role: 'admin',
        fullName: 'Administrator'
      };
    } else {
      user = {
        username,
        department: 'demo',
        role: 'staff',
        fullName: username.charAt(0).toUpperCase() + username.slice(1)
      };
    }
    setCurrentUser(user)
    setIsAuthenticated(true)
    localStorage.setItem('kmrl_user', JSON.stringify(user))
    return true;
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('kmrl_user')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
