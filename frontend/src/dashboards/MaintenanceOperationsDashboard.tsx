import React, { useState } from 'react'
import type { User } from '../hooks/useAuth'
import CollapsibleSidebar from '../components/CollapsibleSidebar'
import { ChatUI } from '../components/ChatUI'
import { DocumentHistory } from '../components/DocumentHistory'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentManager } from '../components/DocumentManager'
import { DocumentViewer } from '../components/DocumentViewer'

interface MaintenanceOperationsDashboardProps {
  currentUser: User | null
}

const MaintenanceOperationsDashboard: React.FC<MaintenanceOperationsDashboardProps> = ({ currentUser }) => {
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

  // Maintenance & Operations statistics
  const maintenanceStats = [
    { title: 'System Health', value: '96%', icon: 'bx-shield-check', color: 'bg-olive-600' },
    { title: 'Active Work Orders', value: '23', icon: 'bx-task', color: 'bg-olive-600' },
    { title: 'Staff On Duty', value: '42/45', icon: 'bx-group', color: 'bg-olive-600' },
    { title: 'Pending Tasks', value: '8', icon: 'bx-time', color: 'bg-olive-600' }
  ]

  // Integrated modules for unified department
  const modules = [
    { id: 'overview', name: 'Department Overview', icon: 'bx-grid-alt' },
    { id: 'daily-ops', name: 'Daily Operations', icon: 'bx-analyse' },
    { id: 'asset-management', name: 'Asset Management', icon: 'bx-cog' },
    { id: 'work-orders', name: 'Work Orders', icon: 'bx-task' },
    { id: 'scheduling', name: 'Staff & Resource Planning', icon: 'bx-calendar' },
    { id: 'monitoring', name: 'System Monitoring', icon: 'bx-line-chart' },
    { id: 'reports', name: 'Reports & Analytics', icon: 'bx-file' },
    { id: 'documents', name: 'Document Management', icon: 'bx-folder' }
  ]

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId)
  }

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="p-6 bg-olive-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-olive-800">Maintenance & Operations Overview</h1>
              <button className="bg-olive-600 hover:bg-olive-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                <i className="bx bx-plus mr-2"></i>
                CREATE WORK ORDER
              </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {maintenanceStats.map((stat, index) => (
                <div key={index} className={`${stat.color} p-6 text-white relative overflow-hidden`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <div className="relative z-10">
                    <div className="text-3xl font-semibold mb-2">{stat.value}</div>
                    <div className="text-olive-100 font-normal mb-1">{stat.title}</div>
                    <div className="text-olive-200 text-sm">All systems operational</div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-30">
                    <i className={`bx ${stat.icon} text-4xl`}></i>
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow-sm border border-olive-200">
                <div className="p-6 border-b border-olive-100">
                  <h3 className="text-xl font-semibold text-olive-800">Active Work Orders</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { id: 'WO-2389', type: 'Preventive', system: 'HVAC', status: 'In Progress', time: '2h remaining' },
                      { id: 'WO-2388', type: 'Corrective', system: 'Signaling', status: 'Pending Parts', time: 'Parts due today' },
                      { id: 'WO-2387', type: 'Inspection', system: 'Track', status: 'Scheduled', time: 'Starts in 1h' }
                    ].map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-olive-50 rounded-lg border border-olive-100">
                        <div>
                          <p className="font-medium text-olive-900">{order.id}: {order.system}</p>
                          <p className="text-sm text-olive-600">{order.type} Maintenance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-olive-700">{order.status}</p>
                          <p className="text-xs text-olive-500">{order.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-olive-200">
                <div className="p-6 border-b border-olive-100">
                  <h3 className="text-xl font-semibold text-olive-800">System Monitoring</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { system: 'Train Control', status: 'Operational', uptime: '99.8%', color: 'text-olive-600' },
                      { system: 'Power Systems', status: 'Operational', uptime: '98.2%', color: 'text-olive-600' },
                      { system: 'Communication', status: 'Maintenance', uptime: '95.1%', color: 'text-amber-600' },
                      { system: 'HVAC Systems', status: 'Operational', uptime: '97.5%', color: 'text-olive-600' }
                    ].map((system, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-olive-50 rounded-lg border border-olive-100">
                        <div>
                          <p className="font-medium text-olive-900">{system.system}</p>
                          <p className="text-sm text-olive-600">Uptime: {system.uptime}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            system.status === 'Operational' ? 'bg-olive-100 text-olive-800' :
                            system.status === 'Maintenance' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {system.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'daily-ops':
      case 'asset-management':
      case 'work-orders':
      case 'scheduling':
      case 'monitoring':
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modules.find(m => m.id === activeModule)?.name || 'Module'}
            </h3>
            <p className="text-gray-600">This module is under development.</p>
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
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a module</h3>
            <p className="text-gray-600">Please select a module from the sidebar to view its content.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Maintenance & Operations</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.fullName}</p>
        </div>
      </header>

      {/* Sidebar with adjusted position */}
      <CollapsibleSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        modules={modules}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-20"
        currentUser={{
          fullName: currentUser?.fullName || 'Guest User',
          role: currentUser?.role || 'Guest'
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
              {currentUser?.fullName?.charAt(0) || 'M'}
            </div>
            <div className="text-xl font-bold text-olive-900 mb-6">{currentUser?.fullName || 'Maintenance User'}</div>
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
      <main className={`min-h-screen pt-16 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Module Content */}
          {renderModuleContent()}
        </div>
      </main>

      {/* Chat Interface */}
      <div className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg transform transition-transform duration-300 z-30 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
            <h3 className="font-semibold">Department Assistant</h3>
            <button onClick={() => setChatOpen(false)} className="text-white hover:text-blue-100">
              <i className="bx bx-x text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Chat messages will go here */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-3 ml-auto max-w-[80%]">
                <p className="text-sm">How can I assist you with maintenance and operations today?</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <button className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                <i className="bx bx-send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed right-6 bottom-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-opacity duration-300 z-30 ${chatOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <i className="bx bx-message-dots text-2xl"></i>
      </button>

      {/* Chat UI */}
      <ChatUI
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        contextType="department"
        contextName="Maintenance & Operations Department"
      />

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

export default MaintenanceOperationsDashboard
