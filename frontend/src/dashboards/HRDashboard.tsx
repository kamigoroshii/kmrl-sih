import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'

interface HRDashboardProps {
  currentUser: User | null
}

const HRDashboard: React.FC<HRDashboardProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState('overview')

  const modules = [
    { id: 'overview', name: 'Overview', icon: 'bx-bar-chart-alt-2' },
    { id: 'employees', name: 'Employee Management', icon: 'bx-group' },
    { id: 'recruitment', name: 'Recruitment', icon: 'bx-target-lock' },
    { id: 'performance', name: 'Performance', icon: 'bx-trending-up' },
    { id: 'policies', name: 'Policies & Compliance', icon: 'bx-clipboard' }
  ]

  const recentDocuments = [
    { id: 1, name: 'Employee Handbook v3.0', status: 'Under Review', date: '2024-01-15' },
    { id: 2, name: 'Job Posting - Senior Engineer', status: 'Approved', date: '2024-01-14' },
    { id: 3, name: 'Performance Review Template', status: 'Draft', date: '2024-01-13' },
    { id: 4, name: 'Training Program Proposal', status: 'Pending', date: '2024-01-12' }
  ]

  const hrStats = [
    { title: 'Total Employees', value: '450', color: 'bg-blue-500' },
    { title: 'Active Recruitments', value: '7', color: 'bg-yellow-500' },
    { title: 'Pending Reviews', value: '23', color: 'bg-green-500' },
    { title: 'Training Sessions', value: '5', color: 'bg-purple-500' }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hrStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                      <i className="bx bx-group"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent HR Documents</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Document Name</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{doc.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            doc.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            doc.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            doc.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3">{doc.date}</td>
                        <td className="py-3">
                          <button className="text-olive hover:text-olive-600 text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      case 'employees':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Management</h3>
            <p className="text-gray-600">Employee management interface will be implemented here.</p>
          </div>
        )
      case 'recruitment':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Management</h3>
            <p className="text-gray-600">Recruitment management interface will be implemented here.</p>
          </div>
        )
      case 'performance':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Management</h3>
            <p className="text-gray-600">Performance management interface will be implemented here.</p>
          </div>
        )
      case 'policies':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Policies & Compliance</h3>
            <p className="text-gray-600">Policies and compliance interface will be implemented here.</p>
          </div>
        )
      default:
        return <div>Select a module to view content</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Human Resources Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">HR Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`p-4 rounded-lg text-center transition-colors ${
                  activeModule === module.id
                    ? 'bg-olive text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="text-2xl mb-2">
                  <i className={`bx ${module.icon}`}></i>
                </div>
                <div className="text-sm font-medium">{module.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module Content */}
        {renderModuleContent()}
      </div>
    </div>
  )
}

export default HRDashboard
