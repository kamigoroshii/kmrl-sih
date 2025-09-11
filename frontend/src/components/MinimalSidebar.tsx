import React from 'react';

interface SidebarModule {
  id: string;
  name: string;
  icon: string;
}

interface MinimalSidebarProps {
  modules: SidebarModule[];
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
}

const MinimalSidebar: React.FC<MinimalSidebarProps> = ({ modules, activeModule, onModuleChange }) => {
  return (
    <div className="w-16 bg-gray-50 shadow-sm h-screen flex flex-col">
      <nav className="flex-1 py-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`w-full flex items-center justify-center p-3 transition-colors ${
              activeModule === module.id
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={module.name}
          >
            <i className={`bx ${module.icon} text-xl`}></i>
          </button>
        ))}
      </nav>
      <button 
        className="w-full p-3 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
        title="Profile"
      >
        <i className="bx bx-user text-xl"></i>
      </button>
    </div>
  );
};

export default MinimalSidebar;
