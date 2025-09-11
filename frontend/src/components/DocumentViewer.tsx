import React, { useState } from 'react';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const getDocumentUrl = () => {
    return `http://localhost:5001/api/documents/${encodeURIComponent(document.name)}/view`;
  };

  const isPdf = document.type === '.pdf' || document.name.toLowerCase().endsWith('.pdf');
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(document.type) || 
                  /\.(jpg|jpeg|png|gif|bmp)$/i.test(document.name);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load document');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <i className="bx bx-file text-olive-600 text-xl"></i>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-500">Document Viewer</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={getDocumentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-olive-600 text-white rounded hover:bg-olive-700 transition-colors text-sm"
            >
              <i className="bx bx-download mr-1"></i>
              Download
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close viewer"
            >
              <i className="bx bx-x text-xl text-gray-500"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-5 h-5 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading document...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <i className="bx bx-error text-4xl text-red-500 mb-2"></i>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                  }}
                  className="px-4 py-2 bg-olive-600 text-white rounded hover:bg-olive-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {isPdf && (
            <iframe
              src={getDocumentUrl()}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              style={{ minHeight: '500px' }}
            />
          )}

          {isImage && (
            <div className="h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={getDocumentUrl()}
                alt={document.name}
                className="max-w-full max-h-full object-contain"
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}

          {!isPdf && !isImage && (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <i className="bx bx-file text-6xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <a
                  href={getDocumentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-olive-600 text-white rounded hover:bg-olive-700 transition-colors inline-flex items-center"
                >
                  <i className="bx bx-download mr-2"></i>
                  Download to view
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};