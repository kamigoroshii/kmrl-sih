
import React, { useState, useRef, useEffect } from 'react';

// Dummy data for departments and activities
const departments = [
  {
    id: 'maintenance',
    name: 'Maintenance',
    color: 'bg-teal-600',
    documents: [
      { name: 'M&O1.pdf', url: '/M&O1.pdf' },
      { name: 'M&O2.pdf', url: '/M&O2.pdf' },
      { name: 'M&O3.pdf', url: '/M&O3.pdf' },
      { name: 'M&O4.pdf', url: '/M&O4.pdf' },
    ],
    activity: [
      { file: 'M&O1.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '1 hr ago' },
      { file: 'M&O2.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: 'Yesterday' },
      { file: 'M&O3.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '2 days ago' },
      { file: 'M&O4.pdf', type: 'pdf', action: 'rejected', status: 'Rejected', time: '3 days ago' },
      { file: 'M&O1.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '4 days ago' },
      { file: 'M&O2.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: '5 days ago' },
      { file: 'M&O3.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '6 days ago' },
      { file: 'M&O4.pdf', type: 'pdf', action: 'rejected', status: 'Rejected', time: '1 week ago' },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    color: 'bg-blue-800',
    documents: [
      { name: 'engineering1.jpg', url: '/engineering1.jpg' },
      { name: 'engineering2.jpg', url: '/engineering2.jpg' },
      { name: 'engineering3.jpg', url: '/engineering3.jpg' },
      { name: 'engineering4.jpg', url: '/engineering4.jpg' },
      { name: 'engineering5.jpg', url: '/engineering5.jpg' },
      { name: 'engineering6.jpg', url: '/engineering6.jpg' },
    ],
    activity: [
      { file: 'engineering1.jpg', type: 'jpg', action: 'uploaded', status: 'Completed', time: '1 hr ago' },
      { file: 'engineering2.jpg', type: 'jpg', action: 'pending', status: 'Pending', time: 'Yesterday' },
      { file: 'engineering3.jpg', type: 'jpg', action: 'uploaded', status: 'Completed', time: '2 days ago' },
      { file: 'engineering4.jpg', type: 'jpg', action: 'rejected', status: 'Rejected', time: '3 days ago' },
      { file: 'engineering5.jpg', type: 'jpg', action: 'uploaded', status: 'Completed', time: '4 days ago' },
      { file: 'engineering6.jpg', type: 'jpg', action: 'pending', status: 'Pending', time: '5 days ago' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    color: 'bg-green-700',
    documents: [
      { name: 'finance1.pdf', url: '/finance1.pdf' },
      { name: 'finance2.pdf', url: '/finance2.pdf' },
      { name: 'finance3.pdf', url: '/finance3.pdf' },
      { name: 'finance4.pdf', url: '/finance4.pdf' },
      { name: 'finance5.pdf', url: '/finance5.pdf' },
      { name: 'finance6.pdf', url: '/finance6.pdf' },
    ],
    activity: [
      { file: 'finance1.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '1 hr ago' },
      { file: 'finance2.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: 'Yesterday' },
      { file: 'finance3.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '2 days ago' },
      { file: 'finance4.pdf', type: 'pdf', action: 'rejected', status: 'Rejected', time: '3 days ago' },
      { file: 'finance5.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '4 days ago' },
      { file: 'finance6.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: '5 days ago' },
    ],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    color: 'bg-pink-600',
    documents: [
      { name: 'HR1.pdf', url: '/HR1.pdf' },
      { name: 'HR2.pdf', url: '/HR2.pdf' },
      { name: 'HR3.pdf', url: '/HR3.pdf' },
      { name: 'HR4.pdf', url: '/HR4.pdf' },
    ],
    activity: [
      { file: 'HR1.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '1 hr ago' },
      { file: 'HR2.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: 'Yesterday' },
      { file: 'HR3.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '2 days ago' },
      { file: 'HR4.pdf', type: 'pdf', action: 'rejected', status: 'Rejected', time: '3 days ago' },
    ],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    color: 'bg-yellow-700',
    documents: [
      { name: 'procurment1.pdf', url: '/procurment1.pdf' },
      { name: 'procurment2.pdf', url: '/procurment2.pdf' },
      { name: 'procurment3.pdf', url: '/procurment3.pdf' },
      { name: 'procurment4.pdf', url: '/procurment4.pdf' },
      { name: 'procurment5.pdf', url: '/procurment5.pdf' },
    ],
    activity: [
      { file: 'procurment1.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '1 hr ago' },
      { file: 'procurment2.pdf', type: 'pdf', action: 'pending', status: 'Pending', time: 'Yesterday' },
      { file: 'procurment3.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '2 days ago' },
      { file: 'procurment4.pdf', type: 'pdf', action: 'rejected', status: 'Rejected', time: '3 days ago' },
      { file: 'procurment5.pdf', type: 'pdf', action: 'uploaded', status: 'Completed', time: '4 days ago' },
    ],
  },
];

const statusChips = {
  Completed: {
    color: 'bg-green-100 text-green-700',
    icon: 'bx-check-circle',
    label: 'Completed',
  },
  Pending: {
    color: 'bg-blue-100 text-blue-700',
    icon: 'bx-time-five',
    label: 'Pending',
  },
  Rejected: {
    color: 'bg-red-100 text-red-700',
    icon: 'bx-x-circle',
    label: 'Rejected',
  },
};

const fileTypeIcons = {
  pdf: 'bx-file-pdf text-red-600',
  docx: 'bx-file-doc text-blue-600',
  xlsx: 'bx-file text-green-600',
};

const actionText = {
  uploaded: 'uploaded',
  submitted: 'submitted',
  pending: 'pending',
  rejected: 'rejected',
};

const RecentActivityFeed: React.FC = () => {
  // By default, show a mix of activities from all departments for showcase
  const [selectedDept, setSelectedDept] = useState<{id: string, name: string, color: string, documents: any[], activity: any[]} | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [rejectedModalOpen, setRejectedModalOpen] = useState(false);

  // If no department selected, show a mix of activities from all departments
  let activities: any[] = [];
  if (selectedDept) {
    activities = selectedDept.activity;
  } else {
    // Mix: take first 2 from each department for demo
    activities = departments.flatMap(dept => dept.activity.slice(0, 2).map(a => ({ ...a, _dept: dept.name, _color: dept.color })));
  }

  // Status summary (count by status for selected department)
  const summary = {
    Completed: activities.filter(a => a.status === 'Completed').length,
    Pending: activities.filter(a => a.status === 'Pending').length,
    Rejected: activities.filter(a => a.status === 'Rejected').length,
  };

  // Last updated: use the most recent activity time (for demo, just now)
  const lastUpdated = 'Just now';

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div>
  <div className="w-full max-w-5xl flex flex-col gap-8 relative">
        {/* Header */}
        <div className="flex flex-row items-center justify-end gap-2 mb-2">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#008080] text-white font-semibold rounded-lg shadow hover:bg-[#005f99] focus:outline-none focus:ring-2 focus:ring-[#008080] transition"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span className="font-medium">View Documents</span>
              <i className={`bx bx-chevron-down text-lg transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fadeIn overflow-hidden">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    className={`w-full px-4 py-2 text-left text-gray-800 hover:bg-[#f5f6f8] focus:bg-[#e0f7fa] transition font-medium ${selectedDept && selectedDept.id === dept.id ? 'bg-[#e0f7fa] text-[#008080]' : ''}`}
                    onClick={() => {
                      setSelectedDept(dept);
                      setDropdownOpen(false);
                      setModalOpen(true);
                    }}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Status Row */}
  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f5f6f8] via-[#e0f7fa] to-[#f5f6f8] rounded-xl px-8 py-5 text-lg">
          <div className="flex gap-3 flex-wrap">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-bold text-base focus:outline-none focus:ring-2 focus:ring-green-400 hover:bg-green-200 transition"
                onClick={() => setCompletedModalOpen(true)}
                tabIndex={0}
                title="View all completed documents"
              >
                <i className="bx bx-check-circle text-base mr-1"></i> {summary.Completed} Completed
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-200 transition"
                onClick={() => setPendingModalOpen(true)}
                tabIndex={0}
                title="View all pending documents"
              >
                <i className="bx bx-time-five text-base mr-1"></i> {summary.Pending} Pending
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-bold text-base focus:outline-none focus:ring-2 focus:ring-red-400 hover:bg-red-200 transition"
                onClick={() => setRejectedModalOpen(true)}
                tabIndex={0}
                title="View all rejected documents"
              >
                <i className="bx bx-x-circle text-base mr-1"></i> {summary.Rejected} Rejected
              </button>
        {/* Pending Documents Modal */}
        {pendingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setPendingModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl relative animate-fadeIn" onClick={e => e.stopPropagation()}>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-blue-700 text-2xl font-bold"
                onClick={() => setPendingModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h4 className="text-xl font-bold mb-4 text-blue-700">Pending Documents by Department</h4>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {departments.map((dept) => {
                  const pendingDocs = dept.activity.filter((a) => a.status === 'Pending');
                  if (pendingDocs.length === 0) return null;
                  return (
                    <div key={dept.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${dept.color}`}>{dept.name}</span>
                      </div>
                      <ul className="space-y-2">
                        {pendingDocs.map((doc, idx) => {
                          const docMeta = dept.documents.find((d) => d.name === doc.file);
                          return (
                            <li key={idx} className="flex items-center gap-2 text-gray-800">
                              <i className={`bx ${fileTypeIcons[doc.type as keyof typeof fileTypeIcons] || 'bx-file'} text-lg`}></i>
                              {docMeta ? (
                                <a
                                  href={docMeta.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-blue-700"
                                >
                                  {doc.file}
                                </a>
                              ) : (
                                <span>{doc.file}</span>
                              )}
                              <span className="ml-2 text-xs text-gray-400">{doc.time}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rejected Documents Modal */}
        {rejectedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setRejectedModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl relative animate-fadeIn" onClick={e => e.stopPropagation()}>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-700 text-2xl font-bold"
                onClick={() => setRejectedModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h4 className="text-xl font-bold mb-4 text-red-700">Rejected Documents by Department</h4>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {departments.map((dept) => {
                  const rejectedDocs = dept.activity.filter((a) => a.status === 'Rejected');
                  if (rejectedDocs.length === 0) return null;
                  return (
                    <div key={dept.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${dept.color}`}>{dept.name}</span>
                      </div>
                      <ul className="space-y-2">
                        {rejectedDocs.map((doc, idx) => {
                          const docMeta = dept.documents.find((d) => d.name === doc.file);
                          return (
                            <li key={idx} className="flex items-center gap-2 text-gray-800">
                              <i className={`bx ${fileTypeIcons[doc.type as keyof typeof fileTypeIcons] || 'bx-file'} text-lg`}></i>
                              {docMeta ? (
                                <a
                                  href={docMeta.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-red-700"
                                >
                                  {doc.file}
                                </a>
                              ) : (
                                <span>{doc.file}</span>
                              )}
                              <span className="ml-2 text-xs text-gray-400">{doc.time}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
            </div>
        {/* Completed Documents Modal */}
        {completedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setCompletedModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl relative animate-fadeIn" onClick={e => e.stopPropagation()}>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-green-700 text-2xl font-bold"
                onClick={() => setCompletedModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h4 className="text-xl font-bold mb-4 text-green-700">Completed Documents by Department</h4>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {departments.map((dept) => {
                  const completedDocs = dept.activity.filter((a) => a.status === 'Completed');
                  if (completedDocs.length === 0) return null;
                  return (
                    <div key={dept.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${dept.color}`}>{dept.name}</span>
                      </div>
                      <ul className="space-y-2">
                        {completedDocs.map((doc, idx) => {
                          // Find the document URL from dept.documents
                          const docMeta = dept.documents.find((d) => d.name === doc.file);
                          return (
                            <li key={idx} className="flex items-center gap-2 text-gray-800">
                              <i className={`bx ${fileTypeIcons[doc.type as keyof typeof fileTypeIcons] || 'bx-file'} text-lg`}></i>
                              {docMeta ? (
                                <a
                                  href={docMeta.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-green-700"
                                >
                                  {doc.file}
                                </a>
                              ) : (
                                <span>{doc.file}</span>
                              )}
                              <span className="ml-2 text-xs text-gray-400">{doc.time}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
          <div className="text-gray-400 text-xs font-medium ml-auto">Last Updated: {lastUpdated}</div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl bg-gradient-to-br from-[#f5f6f8] via-[#e0f7fa] to-[#f5f6f8] p-8 max-h-[32rem] overflow-y-auto scrollbar-hide shadow-inner text-lg">
          <ul className="flex flex-col gap-6">
            {activities.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-4 bg-white rounded-xl px-8 py-5 shadow-sm hover:shadow-lg transition-shadow group cursor-pointer text-lg"
              >
                <div className="flex items-center gap-5 min-w-0">
                  {/* Department Badge */}
                  <span className={`text-base font-bold text-white px-4 py-2 rounded-full ${(selectedDept ? selectedDept.color : (item._color || 'bg-gray-400'))} whitespace-nowrap`}>{selectedDept ? selectedDept.name : (item._dept || '')}</span>
                  {/* File Type Icon */}
                  <i className={`bx ${fileTypeIcons[item.type as keyof typeof fileTypeIcons] || 'bx-file'} text-2xl`}></i>
                  {/* Filename + Action */}
                  <span className="truncate font-semibold text-gray-800">
                    {(selectedDept ? selectedDept.name : (item._dept || ''))} {actionText[item.action as keyof typeof actionText] || item.action} <span className="font-bold">{item.file}</span>
                  </span>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0">
                  {/* Status Chip */}
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-base ${statusChips[item.status as keyof typeof statusChips].color}`}> <i className={`bx ${statusChips[item.status as keyof typeof statusChips].icon} text-xl mr-1`}></i> {statusChips[item.status as keyof typeof statusChips].label}</span>
                  {/* Relative Timestamp */}
                  <span className="text-gray-400 text-base font-medium whitespace-nowrap">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal for Documents */}
        {modalOpen && selectedDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative animate-fadeIn" onClick={e => e.stopPropagation()}>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-[#008080] text-2xl font-bold"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h4 className="text-xl font-bold mb-4 text-[#008080]">{selectedDept.name} Documents</h4>
              <ul className="space-y-3">
                {selectedDept.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-800">
                    <i className={`bx ${doc.name.endsWith('.pdf') ? 'bx-file-pdf text-red-600' : doc.name.endsWith('.docx') ? 'bx-file-doc text-blue-600' : doc.name.endsWith('.xlsx') ? 'bx-file text-green-600' : 'bx-file'} text-lg`}></i>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-[#008080]"
                    >
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityFeed;
