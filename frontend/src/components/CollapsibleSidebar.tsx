import React from 'react';

interface SidebarModule {
  id: string;
  name: string;
  icon: string;
}

interface SidebarModule {
  id: string;
  name: string;
  icon: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
}

interface CollapsibleSidebarProps {
  modules: SidebarModule[];
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  currentUser: {
    fullName: string;
    role: string;
    avatar?: string;
  };
  recentDocuments: Document[];
  onDocumentClick: (docId: string) => void;
  onChatToggle: () => void;
  isChatOpen: boolean;
  onProfileClick: () => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  modules,
  activeModule,
  onModuleChange,
  isOpen,
  onToggle,
  className,
  currentUser,
  recentDocuments,
  onDocumentClick,
  onChatToggle,
  isChatOpen,
  onProfileClick,
}) => {
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} bg-olive-100 shadow-xl border-r border-olive-200 flex flex-col ${className || ''}`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          className="p-3 mx-auto focus:outline-none text-gray-600 hover:text-gray-800 flex items-center justify-center"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          <i className="bx bx-menu text-xl"></i>
        </button>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto">
          {/* Module Navigation */}
          <div className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`w-full flex items-center ${isOpen ? 'px-3 py-3 rounded-xl' : 'justify-center py-3'} transition-all duration-200 ${
                  !isChatOpen && activeModule === module.id && isOpen
                    ? 'bg-olive-600 text-white shadow-lg'
                    : 'text-olive-800 hover:bg-olive-200 hover:text-olive-900'
                }`}
                title={module.name}
              >
                <div className={`flex items-center justify-center ${isOpen ? 'w-10 h-10' : 'w-12 h-12'} rounded-full transition-all duration-200 ${
                  !isChatOpen && activeModule === module.id
                    ? isOpen 
                      ? 'bg-white text-olive-600'
                      : 'bg-olive-600 text-white shadow-lg'
                    : 'bg-transparent'
                }`}>
                  <i className={`bx ${module.icon} ${isOpen ? 'text-lg' : 'text-xl'}`}></i>
                </div>
                {isOpen && <span className="ml-4 text-sm font-medium">{module.name}</span>}
              </button>
            ))}
          </div>

          {/* Chat Toggle */}
          <div className="pt-4 border-t border-olive-300">
            <button
              onClick={onChatToggle}
              className={`w-full flex items-center ${isOpen ? 'px-3 py-3 rounded-xl' : 'justify-center py-3'} transition-all duration-200 ${
                isChatOpen && isOpen
                  ? 'bg-olive-600 text-white shadow-lg'
                  : 'text-olive-800 hover:bg-olive-200 hover:text-olive-900'
              }`}
              title="Department Chat"
            >
              <div className={`flex items-center justify-center ${isOpen ? 'w-10 h-10' : 'w-12 h-12'} rounded-full transition-all duration-200 ${
                isChatOpen
                  ? isOpen 
                    ? 'bg-white text-olive-600'
                    : 'bg-olive-600 text-white shadow-lg'
                  : 'bg-transparent'
              }`}>
                <i className={`bx bx-message-dots ${isOpen ? 'text-lg' : 'text-xl'}`}></i>
              </div>
              {isOpen && <span className="ml-4 text-sm font-medium">Department Chat</span>}
            </button>
          </div>

          {/* Documents Section */}
          {isOpen && (
            <div className="pt-4 border-t border-olive-300">
              <h3 className="px-3 text-xs font-semibold text-olive-700 uppercase tracking-wider mb-3">Recent Documents</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentClick(doc.id)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-olive-800 hover:bg-olive-200 hover:text-olive-900 transition-all duration-200"
                    title={doc.name}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-olive-200">
                      <i className="bx bx-file text-sm text-gray-500"></i>
                    </div>
                    <div className="ml-3 text-left overflow-hidden flex-1">
                      <div className="text-sm truncate font-medium">{doc.name}</div>
                      <div className="text-xs text-gray-400">{doc.date}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Profile Section */}
        <div className="border-t border-olive-300 p-2 mt-auto">
          <button
            className={`flex items-center w-full ${isOpen ? 'px-2 py-2' : 'justify-center py-2'} hover:bg-olive-200 focus:outline-none`}
            onClick={onProfileClick}
            aria-label="Open profile"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center text-white text-sm">
                {currentUser.fullName.charAt(0)}
              </div>
            )}
            {isOpen && (
              <div className="ml-3 overflow-hidden text-left">
                <div className="text-sm font-medium text-olive-900 truncate">{currentUser.fullName}</div>
                <div className="text-xs text-olive-600 truncate">{currentUser.role}</div>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
