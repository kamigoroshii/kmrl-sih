import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'

interface FinanceDashboardProps {
  currentUser: User | null
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState('overview')

  const modules = [
    { id: 'overview', name: 'Overview', icon: 'bx-bar-chart-alt-2' },
    { id: 'budgets', name: 'Budget Management', icon: 'bx-dollar-circle' },
    { id: 'invoices', name: 'Invoices', icon: 'bx-receipt' },
    { id: 'expenses', name: 'Expenses', icon: 'bx-credit-card' },
    { id: 'reports', name: 'Financial Reports', icon: 'bx-trending-up' }
  ]

  const recentDocuments = [
    { id: 1, name: 'Monthly Budget Report', status: 'Under Review', date: '2024-01-15' },
    { id: 2, name: 'Vendor Invoice #INV-001', status: 'Approved', date: '2024-01-14' },
    { id: 3, name: 'Expense Claim Form', status: 'Draft', date: '2024-01-13' },
    { id: 4, name: 'Financial Audit Report', status: 'Pending', date: '2024-01-12' }
  ]

  const financeStats = [
    { title: 'Monthly Budget', value: '₹50L', color: 'bg-blue-500' },
    { title: 'Pending Invoices', value: '8', color: 'bg-yellow-500' },
    { title: 'Approved Expenses', value: '₹12L', color: 'bg-green-500' },
    { title: 'Cost Savings', value: '₹3L', color: 'bg-purple-500' }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financeStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                      <i className="bx bx-dollar-circle"></i>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Financial Documents</h3>
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
      case 'budgets':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Management</h3>
            <p className="text-gray-600">Budget management interface will be implemented here.</p>
          </div>
        )
      case 'invoices':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Management</h3>
            <p className="text-gray-600">Invoice management interface will be implemented here.</p>
          </div>
        )
      case 'expenses':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Management</h3>
            <p className="text-gray-600">Expense management interface will be implemented here.</p>
          </div>
        )
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Reports</h3>
            <p className="text-gray-600">Financial reports interface will be implemented here.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Finance Modules</h2>
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

export default FinanceDashboard
