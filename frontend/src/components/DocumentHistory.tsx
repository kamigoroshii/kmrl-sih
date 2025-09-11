import React from 'react';

interface DocumentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    history: Array<{
      id: string;
      action: string;
      user: string;
      timestamp: string;
      comment?: string;
    }>;
  };
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-olive-600 text-white rounded-t-lg">
          <h2 className="font-semibold">{document.name} - History</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative">
            {document.history.map((event) => (
              <div key={event.id} className="mb-8 flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-olive-100 rounded-full">
                  <i className="bx bx-history text-olive-600"></i>
                </div>
                <div className="ml-4 flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{event.action}</p>
                    <p className="text-sm text-gray-600 mt-1">By {event.user}</p>
                    {event.comment && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{event.comment}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
