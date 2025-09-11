import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

interface Document {
  id: number;
  name: string;
  status: string;
  date: string;
  url?: string;
}

const DocumentView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/documents')
      .then(res => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch documents');
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 overflow-y-auto max-h-96">
            <table className="w-full table-auto mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">View</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{doc.name}</td>
                    <td className="py-3">{doc.status}</td>
                    <td className="py-3">{doc.date}</td>
                    <td className="py-3">
                      <button className="text-olive hover:text-olive-600 text-sm" onClick={() => setSelectedDoc(doc)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex-1 bg-gray-50 rounded p-4 min-h-[200px]">
            {selectedDoc ? (
              <div>
                <h3 className="font-bold mb-2">{selectedDoc.name}</h3>
                <p>Status: {selectedDoc.status}</p>
                <p>Date: {selectedDoc.date}</p>
                {selectedDoc.url ? (
                  <iframe src={selectedDoc.url} title={selectedDoc.name} className="w-full h-64 border rounded" />
                ) : (
                  <div className="text-gray-500 mt-2">No preview available.</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Select a document to view details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentView;
