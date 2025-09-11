import React, { useState } from 'react';

interface ChatModule {
  id: string;
  name: string;
  icon: string;
}

const modules: ChatModule[] = [
  { id: 'maintenance', name: 'Maintenance & Operations', icon: 'bx-wrench' },
  { id: 'hr', name: 'Human Resources', icon: 'bx-group' },
];

const initialMessages = {
  maintenance: [
    { sender: 'system', text: 'Track train AC failures and missing spares here.' },
  ],
  hr: [
    { sender: 'system', text: 'HR chat: policies, welfare, training.' },
  ],
};

const CollapsibleChatSidebar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('maintenance');
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    let response = '';
    if (activeModule === 'maintenance') {
      if (input.toLowerCase().includes('ac')) {
        response = 'AC failure logged.';
      } else if (input.toLowerCase().includes('spare')) {
        response = 'Missing spare part reported.';
      } else if (input.toLowerCase().includes('it')) {
        response = 'Forwarded IT issue to Engineering.';
      } else {
        response = 'Maintenance message received.';
      }
    } else if (activeModule === 'hr') {
      if (input.toLowerCase().includes('policy')) {
        response = 'HR policy info sent.';
      } else if (input.toLowerCase().includes('welfare')) {
        response = 'Welfare request received.';
      } else if (input.toLowerCase().includes('training')) {
        response = 'Training details provided.';
      } else {
        response = 'HR message received.';
      }
    }
    setMessages({
      ...messages,
      [activeModule]: [
        ...messages[activeModule],
        { sender: 'user', text: input },
        { sender: 'system', text: response },
      ],
    });
    setInput('');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-olive-50 to-beige-50">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg h-full flex flex-col`}>
        <button
          className="p-2 focus:outline-none text-olive"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <i className={`bx ${sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'} text-2xl`}></i>
        </button>
        <nav className="flex-1 mt-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`w-full flex items-center px-4 py-3 mb-2 rounded-lg transition-colors text-left ${
                activeModule === module.id
                  ? 'bg-olive text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <i className={`bx ${module.icon} text-xl mr-3`}></i>
              {sidebarOpen && <span className="font-medium">{module.name}</span>}
            </button>
          ))}
        </nav>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 flex flex-col h-96">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {modules.find(m => m.id === activeModule)?.name} Chat
          </h3>
          <div className="flex-1 overflow-y-auto mb-4 border rounded p-2 bg-gray-50">
            {messages[activeModule].map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`inline-block px-3 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-olive text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              className="flex-1 border rounded-l px-3 py-2 focus:outline-none"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button
              className="bg-olive text-white px-4 py-2 rounded-r hover:bg-olive-600"
              onClick={handleSend}
            >Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleChatSidebar;
