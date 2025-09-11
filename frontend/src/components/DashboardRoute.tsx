import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import EngineeringDashboard from '../dashboards/EngineeringDashboard'
import ProcurementDashboard from '../dashboards/ProcurementDashboard'
import FinanceDashboard from '../dashboards/FinanceDashboard'
import HRDashboard from '../dashboards/HRDashboard'
import type { User } from '../hooks/useAuth'

interface DashboardRouteProps {
  isAuthenticated: boolean
  currentUser: User | null
}

const DashboardRoute: React.FC<DashboardRouteProps> = ({ isAuthenticated, currentUser }) => {
  const { department } = useParams<{ department: string }>()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Check if user has access to this department
  if (currentUser?.role !== 'admin' && currentUser?.department !== department) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-beige-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the {department} department dashboard.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-olive hover:bg-olive-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (department) {
      case 'engineering':
        return <EngineeringDashboard currentUser={currentUser} />
      case 'procurement':
        return <ProcurementDashboard currentUser={currentUser} />
      case 'finance':
        return <FinanceDashboard currentUser={currentUser} />
      case 'hr':
        return <HRDashboard currentUser={currentUser} />
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-olive-50 to-beige-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
              <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Department Not Found</h2>
              <p className="text-gray-600 mb-6">
                The requested department '{department}' does not exist.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-olive hover:bg-olive-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )
    }
  }

  return renderDashboard()
}

export default DashboardRoute
