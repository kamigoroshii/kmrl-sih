import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { DocumentViewer } from './DocumentViewer';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

interface ChatUIProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: 'department' | 'document';
  contextId?: string;
  contextName: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  isOpen,
  onClose,
  contextType,
  contextId,
  contextName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking');
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'malayalam'>('english');
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{[chatId: string]: any[]}>({});
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{id: string, name: string, type: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewSource = async () => {
    try {
      // Fetch available documents from backend
      const response = await fetch('http://localhost:5001/api/documents');
      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        // For now, show the first available document
        // In the future, this could be enhanced to show the specific source document
        const firstDoc = data.documents[0];
        setSelectedDocument({
          id: firstDoc.id || 'doc-1',
          name: firstDoc.filename || firstDoc.name,
          type: firstDoc.type || '.pdf'
        });
      } else {
        // Fallback to a known document
        setSelectedDocument({
          id: 'feeder-policy',
          name: 'Feeder-vehicle-policy_KMRL.docx.pdf',
          type: '.pdf'
        });
      }
      
      setViewerOpen(true);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Fallback to a known document
      setSelectedDocument({
        id: 'feeder-policy',
        name: 'Feeder-vehicle-policy_KMRL.docx.pdf',
        type: '.pdf'
      });
      setViewerOpen(true);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  // Load chat history from backend
  const loadChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chat/history');
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    const newChatId = `${contextType}-${contextName}-${Date.now()}`;
    setCurrentChatId(newChatId);
    setMessages([]);
    setShowHistory(false);
  };

  // Load a specific chat from history
  const loadChatFromHistory = (chatId: string) => {
    const chatMessages = chatHistory[chatId] || [];
    const formattedMessages: Message[] = [];
    
    chatMessages.forEach((chat, index) => {
      // Add user message
      formattedMessages.push({
        id: `${chatId}-user-${index}`,
        content: chat.question,
        sender: 'user',
        timestamp: chat.timestamp || new Date().toISOString()
      });
      
      // Add assistant message
      formattedMessages.push({
        id: `${chatId}-assistant-${index}`,
        content: chat.answer,
        sender: 'assistant',
        timestamp: chat.timestamp || new Date().toISOString()
      });
    });
    
    setMessages(formattedMessages);
    setCurrentChatId(chatId);
    setShowHistory(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      // Initialize current chat ID if not set
      if (!currentChatId) {
        const newChatId = `${contextType}-${contextName}-${Date.now()}`;
        setCurrentChatId(newChatId);
      }
    }
  }, [isOpen, contextType, contextName, currentChatId]);

  // Cycle through loading texts when AI is processing
  useEffect(() => {
    if (!isLoading) return;

    const loadingTexts = ['Thinking', 'Analyzing', 'Processing'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[currentIndex]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingText('Thinking'); // Reset loading text

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          contextType,
          contextId,
          contextName,
          chat_id: currentChatId || `${contextType}-${contextName}`,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.');
      return;
    }
    setIsRecording(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev ? prev + ' ' + transcript : transcript);
      setIsRecording(false);
    };
    recognition.onerror = (event: any) => {
      alert('Voice recognition error: ' + event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `✅ File '${file.name}' uploaded and ingested successfully! (${data.chunks_created} chunks)`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `❌ File upload failed: ${data.error || 'Unknown error'}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `❌ File upload error: ${error}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!isOpen) return null;

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Header - Fixed height */}
      <div className="h-16 flex-shrink-0 border-b border-olive-200 flex items-center px-6 bg-olive-100">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <h2 className="font-medium text-olive-800">{contextName}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1 rounded hover:bg-olive-200 text-olive-600"
                title="Chat History"
              >
                <i className="bx bx-history text-lg"></i>
              </button>
              <button
                onClick={startNewChat}
                className="p-1 rounded hover:bg-olive-200 text-olive-600"
                title="New Chat"
              >
                <i className="bx bx-plus text-lg"></i>
              </button>
            </div>
          </div>
          
          {/* Language Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="language-select" className="text-sm text-olive-700">Language:</label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'english' | 'malayalam')}
              className="px-3 py-1 rounded border border-olive-300 bg-white text-olive-800 text-sm focus:outline-none focus:ring-2 focus:ring-olive-500"
            >
              <option value="english">English</option>
              <option value="malayalam">മലയാളം (Malayalam)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat History Popup Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <i className="bx bx-history text-2xl text-olive-600"></i>
                <h2 className="text-xl font-semibold text-gray-800">Chat History</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {Object.keys(chatHistory).length === 0 ? (
                <div className="text-center py-12">
                  <i className="bx bx-chat text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-lg mb-2">No chat history yet</p>
                  <p className="text-gray-400 text-sm">Start a conversation to see your chat history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(chatHistory)
                    .sort(([, a], [, b]) => new Date(b[0]?.timestamp || '').getTime() - new Date(a[0]?.timestamp || '').getTime())
                    .map(([chatId, messages]) => (
                    <div
                      key={chatId}
                      className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                        currentChatId === chatId 
                          ? 'bg-olive-50 border-olive-300 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        loadChatFromHistory(chatId);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="bx bx-chat text-olive-600"></i>
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {messages[0]?.question || 'Untitled Chat'}
                            </div>
                            {currentChatId === chatId && (
                              <span className="px-2 py-1 text-xs bg-olive-200 text-olive-800 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <i className="bx bx-message-dots"></i>
                              {messages.length} message{messages.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="bx bx-time"></i>
                              {new Date(messages[0]?.timestamp || '').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <i className="bx bx-chevron-right text-gray-400 ml-2"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-500">
                {Object.keys(chatHistory).length} total conversation{Object.keys(chatHistory).length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    startNewChat();
                    setShowHistory(false);
                  }}
                  className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors flex items-center gap-2"
                >
                  <i className="bx bx-plus"></i>
                  New Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable with watermark */}
      <div className="flex-1 overflow-hidden relative">
        {/* Watermark logo - only show when no messages */}
        {messages.length === 0 && (
          <img
            src="/KMRL-logo.png"
            alt="Logo Watermark"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none select-none w-64 h-64"
            style={{ zIndex: 0 }}
          />
        )}
        <div className="h-full overflow-y-auto px-2 py-6 relative" style={{ zIndex: 1 }}>
          <div className="w-full space-y-6">
            {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full items-end space-x-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar for assistant (left side) */}
                  {message.sender === 'assistant' && (
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <i className="bx bx-bot text-sm"></i>
                      </div>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-olive-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.sender === 'assistant' ? (
                      <>
                        <div className="text-sm prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            className="p-1 rounded hover:bg-green-100"
                            title="Like"
                            onClick={() => {/* TODO: handle like */}}
                          >
                            <i className="bx bx-like text-green-600 text-lg"></i>
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-100"
                            title="Unlike"
                            onClick={() => {/* TODO: handle unlike */}}
                          >
                            <i className="bx bx-dislike text-red-600 text-lg"></i>
                          </button>
                          <button
                            className="p-1 rounded hover:bg-blue-100"
                            title="Copy response"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(message.content);
                                // Show temporary success feedback
                                const button = event?.currentTarget as HTMLButtonElement;
                                if (button) {
                                  const originalContent = button.innerHTML;
                                  button.innerHTML = '<i class="bx bx-check text-green-600 text-lg"></i>';
                                  setTimeout(() => {
                                    button.innerHTML = originalContent;
                                  }, 1500);
                                }
                              } catch (err) {
                                console.error('Failed to copy:', err);
                                alert('Failed to copy to clipboard');
                              }
                            }}
                          >
                            <i className="bx bx-copy text-blue-600 text-lg"></i>
                          </button>
                          <button
                            className="p-1 rounded hover:bg-purple-100"
                            title="Share response"
                            onClick={async () => {
                              const shareData = {
                                title: 'KMRL Chat Response',
                                text: `Question: ${messages.find(m => m.sender === 'user' && m.timestamp <= message.timestamp)?.content || 'N/A'}\n\nAnswer: ${message.content}`,
                                url: window.location.href
                              };
                              
                              if (navigator.share) {
                                try {
                                  await navigator.share(shareData);
                                } catch (err) {
                                  if ((err as Error).name !== 'AbortError') {
                                    console.error('Error sharing:', err);
                                    // Fallback to clipboard
                                    try {
                                      await navigator.clipboard.writeText(shareData.text);
                                      alert('Response copied to clipboard for sharing!');
                                    } catch (clipErr) {
                                      console.error('Failed to copy to clipboard:', clipErr);
                                    }
                                  }
                                }
                              } else {
                                // Fallback for browsers without Web Share API
                                try {
                                  await navigator.clipboard.writeText(shareData.text);
                                  alert('Response copied to clipboard for sharing!');
                                } catch (err) {
                                  console.error('Failed to copy to clipboard:', err);
                                  // Final fallback - create a temporary textarea
                                  const textarea = document.createElement('textarea');
                                  textarea.value = shareData.text;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  alert('Response copied to clipboard for sharing!');
                                }
                              }
                            }}
                          >
                            <i className="bx bx-share text-purple-600 text-lg"></i>
                          </button>
                          <button
                            className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            title="View Source Document"
                            onClick={handleViewSource}
                          >
                            <i className="bx bx-file-pdf text-blue-600"></i>
                            <span>View Source</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {/* Avatar for user (right side) */}
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 bg-olive-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        U
                      </div>
                    </div>
                  )}
                </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-end space-x-3">
                {/* Assistant avatar for loading */}
                <div className="flex-shrink-0 mb-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <i className="bx bx-bot text-sm"></i>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">{loadingText}...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 pr-36 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-4">
              {/* Voice icon */}
              <button
                type="button"
                className={isRecording ? "text-red-500" : "text-gray-400 hover:text-blue-500"}
                tabIndex={-1}
                aria-label="Voice input"
                onClick={handleVoiceInput}
              >
                <i className="bx bx-microphone text-xl"></i>
              </button>
              {/* Upload icon */}
              <button
                type="button"
                className={uploading ? "text-blue-500 animate-pulse" : "text-gray-400 hover:text-blue-500"}
                tabIndex={-1}
                aria-label="Upload file"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <i className="bx bx-upload text-xl"></i>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={uploading}
              />
              {/* Send icon */}
              <button
                type="submit"
                className="text-gray-400 hover:text-blue-500"
                disabled={isLoading}
                aria-label="Send message"
              >
                <i className="bx bx-send text-xl"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={closeViewer}
        document={selectedDocument}
      />
    </div>
  );
};