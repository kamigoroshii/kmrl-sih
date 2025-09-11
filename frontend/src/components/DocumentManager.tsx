import React, { useState, useEffect } from 'react';

interface Document {
  filename: string;
  file_type: string;
  upload_date: string;
  chunks: number;
}

interface DocumentManagerProps {
  onRefresh?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ onRefresh }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5001/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDocuments = async () => {
    if (!confirm('Are you sure you want to clear all documents? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5001/api/documents/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear documents');
      }

      setDocuments([]);
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear documents';
      setError(errorMessage);
    } finally {
      setIsClearing(false);
    }
  };

  const formatFileSize = (chunks: number) => {
    return `${chunks} chunks`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case '.pdf':
        return 'bx-file-pdf';
      case '.docx':
        return 'bx-file-doc';
      case '.xlsx':
        return 'bx-spreadsheet';
      case '.csv':
        return 'bx-table';
      case '.txt':
        return 'bx-file-txt';
      default:
        return 'bx-file';
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-olive-700">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <i className="bx bx-error text-red-600"></i>
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={fetchDocuments}
          className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-olive-800">
          Uploaded Documents ({documents.length})
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={fetchDocuments}
            className="px-3 py-1 text-sm text-olive-600 hover:text-olive-800 border border-olive-300 rounded hover:bg-olive-50"
          >
            <i className="bx bx-refresh mr-1"></i>
            Refresh
          </button>
          {documents.length > 0 && (
            <button
              onClick={handleClearDocuments}
              disabled={isClearing}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
            >
              {isClearing ? (
                <>
                  <div className="inline-block w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <i className="bx bx-trash mr-1"></i>
                  Clear All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-olive-600">
          <i className="bx bx-folder-open text-4xl mb-2"></i>
          <p>No documents uploaded yet</p>
          <p className="text-sm">Upload documents to start chatting with your data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-olive-200 rounded-lg hover:shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <i className={`bx ${getFileIcon(doc.file_type)} text-2xl text-olive-600`}></i>
                <div>
                  <p className="font-medium text-olive-800">{doc.filename}</p>
                  <p className="text-sm text-olive-600">
                    {formatFileSize(doc.chunks)} • Uploaded {formatDate(doc.upload_date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs bg-olive-100 text-olive-700 rounded">
                  {doc.file_type.replace('.', '').toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};