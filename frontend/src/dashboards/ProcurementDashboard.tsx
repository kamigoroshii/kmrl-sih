import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'
import CollapsibleSidebar from '../components/CollapsibleSidebar'
import { ChatUI } from '../components/ChatUI'
import { DocumentHistory } from '../components/DocumentHistory'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentManager } from '../components/DocumentManager'
import { DocumentViewer } from '../components/DocumentViewer'

interface ProcurementDashboardProps {
  currentUser: User | null
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ currentUser }) => {
  const [activeModule, setActiveModule] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; date: string }[]>([])
  const [viewerDocument, setViewerDocument] = useState<{ id: string; name: string; type: string } | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<{
    id: string;
    name: string;
    history: Array<{
      id: string;
      action: string;
      user: string;
      timestamp: string;
      comment?: string;
    }>;
  } | null>(null)
  const [docHistoryOpen, setDocHistoryOpen] = useState(false)

  // Load documents from backend
  React.useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch('http://localhost:5001/api/documents');
        const data = await res.json();
        if (res.ok && Array.isArray(data.documents)) {
          setDocuments(data.documents.map((doc: any) => ({
            id: doc.filename,
            name: doc.filename,
            type: doc.file_type,
            date: doc.upload_date ? doc.upload_date.split('T')[0] : '',
          })));
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchDocuments();
  }, []);

  const modules = [
    { id: 'overview', name: 'Overview', icon: 'bx-bar-chart-alt-2' },
    { id: 'vendors', name: 'Vendor Management', icon: 'bx-buildings' },
    { id: 'purchase-orders', name: 'Purchase Orders', icon: 'bx-edit' },
    { id: 'contracts', name: 'Contracts', icon: 'bx-clipboard' },
    { id: 'inventory', name: 'Inventory', icon: 'bx-package' },
    { id: 'documents', name: 'Document ', icon: 'bx-file' }
  ]

  const procurementStats = [
    { title: 'Active Vendors', value: '45', color: 'bg-olive-600', icon: 'bx-buildings' },
    { title: 'Pending Orders', value: '12', color: 'bg-olive-600', icon: 'bx-time' },
    { title: 'Monthly Savings', value: '₹2.5L', color: 'bg-olive-600', icon: 'bx-trending-up' },
    { title: 'Open Tenders', value: '3', color: 'bg-olive-600', icon: 'bx-notepad' }
  ]

  type RecentDocument = {
    id: number;
    name: string;
    status: string;
    date: string;
  }

  const recentDocuments: RecentDocument[] = [
    { id: 1, name: 'Vendor Agreement - ABC Corp', status: 'Under Review', date: '2024-01-15' },
    { id: 2, name: 'Purchase Order #PO-2024-001', status: 'Approved', date: '2024-01-14' },
    { id: 3, name: 'Equipment Procurement Plan', status: 'Draft', date: '2024-01-13' },
    { id: 4, name: 'Supplier Evaluation Report', status: 'Pending', date: '2024-01-12' }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="p-6 bg-olive-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-olive-800">Procurement Overview</h1>
              <button className="bg-olive-600 hover:bg-olive-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                <i className="bx bx-plus mr-2"></i>
                CREATE ORDER
              </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {procurementStats.map((stat, index) => (
                <div key={index} className={`${stat.color} p-6 text-white relative overflow-hidden`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <div className="relative z-10">
                    <div className="text-3xl font-semibold mb-2">{stat.value}</div>
                    <div className="text-olive-100 font-normal mb-1">{stat.title}</div>
                    <div className="text-olive-200 text-sm">3 upcoming</div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-30">
                    <i className={`bx ${stat.icon} text-4xl`}></i>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Documents */}
            <div className="bg-white shadow-sm border border-olive-200">
              <div className="p-6 border-b border-olive-100">
                <h3 className="text-xl font-semibold text-olive-800">Recent Procurement Documents</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-olive-100">
                        <th className="text-left py-2 text-olive-700">Document Name</th>
                        <th className="text-left py-2 text-olive-700">Status</th>
                        <th className="text-left py-2 text-olive-700">Date</th>
                        <th className="text-left py-2 text-olive-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b border-olive-50 hover:bg-olive-50">
                          <td className="py-3 text-olive-800">{doc.name}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'Approved' ? 'bg-olive-100 text-olive-800' :
                              doc.status === 'Under Review' ? 'bg-olive-200 text-olive-900' :
                              doc.status === 'Draft' ? 'bg-olive-50 text-olive-700' :
                              'bg-olive-100 text-olive-800'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 text-olive-600">{doc.date}</td>
                          <td className="py-3">
                            <button className="text-olive-600 hover:text-olive-800 text-sm font-medium">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-olive-800 mb-4">Document Upload</h3>
              <DocumentUpload
                onUploadSuccess={(filename, chunks) => {
                  setNotification({
                    type: 'success',
                    message: `Successfully uploaded ${filename} (${chunks} chunks created)`
                  });
                  setTimeout(() => setNotification(null), 5000);
                }}
                onUploadError={(error) => {
                  setNotification({
                    type: 'error',
                    message: error
                  });
                  setTimeout(() => setNotification(null), 5000);
                }}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <DocumentManager
                onRefresh={() => {
                  setNotification({
                    type: 'success',
                    message: 'Documents refreshed successfully'
                  });
                  setTimeout(() => setNotification(null), 3000);
                }}
              />
            </div>
          </div>
        )
      default:
        return <div>Select a module to view content</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Procurement</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>
      </header>

      {/* Sidebar with adjusted position */}
      <CollapsibleSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        modules={modules}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-20"
        currentUser={{
          fullName: currentUser?.fullName || 'Guest User',
          role: currentUser?.role || 'Procurement'
        }}
        recentDocuments={documents}
        onDocumentClick={(docId) => {
          const doc = documents.find(d => d.id === docId);
          if (doc) {
            setViewerDocument({
              id: doc.id,
              name: doc.name,
              type: doc.type
            });
            setViewerOpen(true);
          }
        }}
        onChatToggle={() => setChatOpen(!chatOpen)}
        isChatOpen={chatOpen}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative flex flex-col items-center">
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
              onClick={() => setProfileOpen(false)}
              aria-label="Close profile"
            >
              <i className="bx bx-x text-xl text-gray-500"></i>
            </button>
            <div className="w-16 h-16 rounded-full bg-olive-600 flex items-center justify-center text-white text-2xl mb-4">
              {currentUser?.fullName?.charAt(0) || 'P'}
            </div>
            <div className="text-xl font-bold text-olive-900 mb-6">{currentUser?.fullName || 'Procurement User'}</div>
            <button
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-base"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              <i className="bx bx-log-out mr-2"></i>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800'
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <i className={`bx ${notification.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-current hover:text-opacity-70"
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        </div>
      )}

      {/* Main content with margins */}
      <div className={`min-h-screen pt-16 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {chatOpen ? (
          <ChatUI
            isOpen={true}
            onClose={() => setChatOpen(false)}
            contextType="department"
            contextName="Procurement Department Chat"
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderModuleContent()}
          </div>
        )}
      </div>

      {/* Document History */}
      {selectedDoc && (
        <DocumentHistory
          isOpen={docHistoryOpen}
          onClose={() => {
            setDocHistoryOpen(false);
            setSelectedDoc(null);
          }}
          document={selectedDoc}
        />
      )}

      {/* Document Viewer */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerDocument(null);
        }}
        document={viewerDocument}
      />
    </div>
  )
}

export default ProcurementDashboard
