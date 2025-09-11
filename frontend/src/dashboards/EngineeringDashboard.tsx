import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'

interface EngineeringDashboardProps {
  currentUser: User | null
}

const EngineeringDashboard: React.FC<EngineeringDashboardProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState('overview')

  const modules = [
    { id: 'overview', name: 'Overview', icon: 'bx-bar-chart-alt-2' },
    { id: 'projects', name: 'Projects', icon: 'bx-building' },
    { id: 'technical-docs', name: 'Technical Documents', icon: 'bx-file-blank' },
    { id: 'specifications', name: 'Specifications', icon: 'bx-ruler' },
    { id: 'safety', name: 'Safety Reports', icon: 'bx-shield-alt-2' }
  ]

  const recentDocuments = [
    { id: 1, name: 'Metro Line Extension Plan', status: 'Under Review', date: '2024-01-15' },
    { id: 2, name: 'Safety Compliance Report', status: 'Approved', date: '2024-01-14' },
    { id: 3, name: 'Technical Specifications v2.1', status: 'Draft', date: '2024-01-13' },
    { id: 4, name: 'Infrastructure Assessment', status: 'Pending', date: '2024-01-12' }
  ]

  const projectStats = [
    { title: 'Active Projects', value: '12', color: 'bg-blue-500' },
    { title: 'Pending Approvals', value: '5', color: 'bg-yellow-500' },
    { title: 'Completed This Month', value: '8', color: 'bg-green-500' },
    { title: 'Safety Incidents', value: '0', color: 'bg-red-500' }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projectStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                      <i className="bx bx-bar-chart-alt-2"></i>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
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
      case 'projects':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engineering Projects</h3>
            <p className="text-gray-600">Project management interface will be implemented here.</p>
          </div>
        )
      case 'technical-docs':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Documents</h3>
            <p className="text-gray-600">Technical document management interface will be implemented here.</p>
          </div>
        )
      case 'specifications':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
            <p className="text-gray-600">Specification management interface will be implemented here.</p>
          </div>
        )
      case 'safety':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Reports</h3>
            <p className="text-gray-600">Safety report management interface will be implemented here.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Engineering Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Engineering Modules</h2>
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

export default EngineeringDashboard
