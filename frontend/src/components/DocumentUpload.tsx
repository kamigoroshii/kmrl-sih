import React, { useState, useRef } from 'react';

interface DocumentUploadProps {
  onUploadSuccess?: (filename: string, chunks: number) => void;
  onUploadError?: (error: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.csv', '.xlsx'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      onUploadError?.('Unsupported file type. Please upload PDF, DOCX, TXT, CSV, or XLSX files.');
      return;
    }

    // Validate file size (16MB limit)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      onUploadError?.('File too large. Maximum size is 16MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);

      // Show success for a moment before hiding
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);

      onUploadSuccess?.(data.filename, data.chunks_created);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.csv,.xlsx"
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      <button
        onClick={handleFileSelect}
        disabled={isUploading}
        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
          isUploading
            ? 'border-olive-300 bg-olive-50 cursor-not-allowed'
            : 'border-olive-300 bg-white hover:border-olive-500 hover:bg-olive-50 cursor-pointer'
        }`}
      >
        {isUploading ? (
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-olive-700">Uploading... {uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <i className="bx bx-cloud-upload text-2xl text-olive-600"></i>
            <div className="text-left">
              <p className="text-olive-800 font-medium">Upload Document</p>
              <p className="text-olive-600 text-sm">PDF, DOCX, TXT, CSV, XLSX (max 16MB)</p>
            </div>
          </div>
        )}
      </button>

      {isUploading && (
        <div className="mt-2 w-full bg-olive-200 rounded-full h-2">
          <div 
            className="bg-olive-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};