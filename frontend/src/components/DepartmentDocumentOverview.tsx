import React, { useState } from 'react';

const departments = [
  {
    id: 'finance',
    name: 'Finance',
    completed: 12,
    pending: 3,
    lastUpdated: '2025-09-11T09:30:00Z',
    documents: [
      'Budget Report FY25.pdf',
      'Audit Summary.xlsx',
      'Invoice_2025_08.pdf',
    ],
    activity: [
      { action: 'Uploaded Budget Report', status: 'Completed', time: '1 hr ago' },
      { action: 'Submitted Invoice', status: 'Pending', time: '2 hrs ago' },
      { action: 'Rejected Audit Summary', status: 'Rejected', time: 'Yesterday' },
      { action: 'Approved Expense Sheet', status: 'Completed', time: '2 days ago' },
      { action: 'Uploaded Tax Document', status: 'Completed', time: '3 days ago' },
    ],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    completed: 8,
    pending: 2,
    lastUpdated: '2025-09-10T15:00:00Z',
    documents: [
      'Employee Handbook.pdf',
      'Leave Policy.docx',
      'Recruitment Plan.xlsx',
    ],
    activity: [
      { action: 'Uploaded Employee Handbook', status: 'Completed', time: '3 hrs ago' },
      { action: 'Submitted Leave Policy', status: 'Pending', time: '5 hrs ago' },
      { action: 'Approved Recruitment Plan', status: 'Completed', time: 'Yesterday' },
      { action: 'Rejected Training Schedule', status: 'Rejected', time: '2 days ago' },
      { action: 'Uploaded Payslip', status: 'Completed', time: '3 days ago' },
    ],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    completed: 15,
    pending: 4,
    lastUpdated: '2025-09-09T12:00:00Z',
    documents: [
      'Vendor List.pdf',
      'Purchase Order.docx',
      'Tender Notice.pdf',
    ],
    activity: [
      { action: 'Uploaded Vendor List', status: 'Completed', time: '4 hrs ago' },
      { action: 'Submitted Purchase Order', status: 'Pending', time: '6 hrs ago' },
      { action: 'Approved Tender Notice', status: 'Completed', time: 'Yesterday' },
      { action: 'Rejected Quotation', status: 'Rejected', time: '2 days ago' },
      { action: 'Uploaded Contract', status: 'Completed', time: '3 days ago' },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    completed: 10,
    pending: 1,
    lastUpdated: '2025-09-08T10:00:00Z',
    documents: [
      'Blueprint.pdf',
      'Safety Protocols.docx',
      'Project Plan.xlsx',
    ],
    activity: [
      { action: 'Uploaded Blueprint', status: 'Completed', time: '5 hrs ago' },
      { action: 'Submitted Safety Protocols', status: 'Pending', time: '7 hrs ago' },
      { action: 'Approved Project Plan', status: 'Completed', time: 'Yesterday' },
      { action: 'Rejected Site Report', status: 'Rejected', time: '2 days ago' },
      { action: 'Uploaded Maintenance Log', status: 'Completed', time: '3 days ago' },
    ],
  },
];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const DepartmentDocumentOverview: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Centered Section Title */}
      <div className="w-full flex justify-center mb-8">
        <h2 className="text-3xl font-bold text-olive-800 text-center">Recent Activity Feed</h2>
      </div>
      {/* Dropdown */}
      <div className="flex justify-end items-center mb-6">
        <select
          className="bg-white border border-olive-300 rounded-lg px-4 py-2 text-olive-800 font-semibold focus:outline-none focus:ring-2 focus:ring-olive-500 transition"
          value={selectedDept.id}
          onChange={e => setSelectedDept(departments.find(d => d.id === e.target.value) || departments[0])}
        >
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>
      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col sm:flex-row items-center justify-between gap-8 mb-8 border border-olive-100">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold text-olive-700">✅ {selectedDept.completed} Completed</span>
            <span className="text-2xl font-bold text-yellow-700">⏳ {selectedDept.pending} Pending</span>
          </div>
          <div className="text-gray-500 text-sm">Last Updated: {formatDate(selectedDept.lastUpdated)}</div>
        </div>
        <button
          className="bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition-all duration-200"
          onClick={() => setModalOpen(true)}
        >
          View Documents
        </button>
      </div>
      {/* Activity Feed */}
      <div className="bg-white rounded-2xl shadow p-6 border border-olive-100 max-h-64 overflow-y-auto">
        <h3 className="text-lg font-bold text-olive-700 mb-4">Recent Activity</h3>
        <ul className="space-y-4">
          {selectedDept.activity.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-olive-800">{selectedDept.name}</span> {item.action}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[item.status]}`}>{item.status === 'Completed' ? '✅ Completed' : item.status === 'Pending' ? '⏳ Pending' : '❌ Rejected'}</span>
                <span className="text-gray-400 text-xs">{item.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-olive-700 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h4 className="text-xl font-bold mb-4 text-olive-800">Documents</h4>
            <ul className="space-y-3">
              {selectedDept.documents.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 text-olive-700">
                  <i className="bx bx-file text-lg"></i>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDocumentOverview;
