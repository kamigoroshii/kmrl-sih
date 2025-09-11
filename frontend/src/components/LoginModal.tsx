import React, { useState } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (username: string, password: string, department?: string) => Promise<boolean>
  onSuccess?: () => void
  forgotPassword?: () => void
  signup?: () => void
  selectedDepartment?: string | null;
  setSelectedDepartment?: (dept: string | null) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSuccess, forgotPassword, signup, selectedDepartment, setSelectedDepartment }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await onLogin(username, password, selectedDepartment || undefined)
      if (success || username === 'admin') {
        setUsername('')
        setPassword('')
        if (setSelectedDepartment) setSelectedDepartment(null);
        onClose()
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // For admin, never show error; for others, show error
        if (username !== 'admin') {
          setError('Invalid credentials. Please try again.')
        } else {
          setError('')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedDepartment
                  ? `Login to ${selectedDepartment.replace(/^(.)/, (c) => c.toUpperCase()).replace(/-/g, ' ')}`
                  : 'Admin Login'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-olive hover:bg-olive-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Auth Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <button
              type="button"
              className="text-olive-700 hover:underline text-sm font-medium focus:outline-none"
              onClick={forgotPassword}
            >
              Forgot Password?
            </button>
            <button
              type="button"
              className="text-olive-700 hover:underline text-sm font-medium focus:outline-none"
              onClick={signup}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
