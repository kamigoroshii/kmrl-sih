import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'

interface ProcurementDashboardProps {
  currentUser: User | null
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState('overview')

  const modules = [
    { id: 'overview', name: 'Overview', icon: 'bx-bar-chart-alt-2' },
    { id: 'vendors', name: 'Vendor Management', icon: 'bx-buildings' },
    { id: 'purchase-orders', name: 'Purchase Orders', icon: 'bx-edit' },
    { id: 'contracts', name: 'Contracts', icon: 'bx-clipboard' },
    { id: 'inventory', name: 'Inventory', icon: 'bx-package' }
  ]

  const recentDocuments = [
    { id: 1, name: 'Vendor Agreement - ABC Corp', status: 'Under Review', date: '2024-01-15' },
    { id: 2, name: 'Purchase Order #PO-2024-001', status: 'Approved', date: '2024-01-14' },
    { id: 3, name: 'Equipment Procurement Plan', status: 'Draft', date: '2024-01-13' },
    { id: 4, name: 'Supplier Evaluation Report', status: 'Pending', date: '2024-01-12' }
  ]

  const procurementStats = [
    { title: 'Active Vendors', value: '45', color: 'bg-blue-500' },
    { title: 'Pending Orders', value: '12', color: 'bg-yellow-500' },
    { title: 'Monthly Savings', value: '₹2.5L', color: 'bg-green-500' },
    { title: 'Open Tenders', value: '3', color: 'bg-purple-500' }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {procurementStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                      <i className="bx bx-package"></i>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Procurement Documents</h3>
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
      case 'vendors':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Management</h3>
            <p className="text-gray-600">Vendor management interface will be implemented here.</p>
          </div>
        )
      case 'purchase-orders':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Orders</h3>
            <p className="text-gray-600">Purchase order management interface will be implemented here.</p>
          </div>
        )
      case 'contracts':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts</h3>
            <p className="text-gray-600">Contract management interface will be implemented here.</p>
          </div>
        )
      case 'inventory':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
            <p className="text-gray-600">Inventory management interface will be implemented here.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Procurement Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Procurement Modules</h2>
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

export default ProcurementDashboard
