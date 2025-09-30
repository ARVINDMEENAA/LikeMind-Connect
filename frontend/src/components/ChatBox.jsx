import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Smile, MoreVertical, Paperclip, Image, Video, X, Download, CheckSquare, Square, FileText, File, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const ChatBox = ({ selectedMatch, messages, onSendMessage, onDeleteMessage }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (selectedMatch && (message.trim() || selectedFile)) {
      if (selectedFile) {
        await handleFileUpload();
      } else {
        onSendMessage(selectedMatch.id, message);
        setMessage('');
      }
    }
  };



  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2)
      });
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size should be less than 50MB');
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv',
        'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'application/zip', 'application/x-rar-compressed'
      ];
      
      console.log('📋 File type check:', {
        fileType: file.type,
        isAllowed: allowedTypes.includes(file.type)
      });
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type '${file.type}' not supported. Allowed: Images, Videos, Audio (MP3, WAV), Documents (PDF, DOC, XLS, PPT), Text files, ZIP/RAR`);
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    console.log('📁 Starting file upload:', selectedFile.name, selectedFile.type, selectedFile.size);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('receiverId', selectedMatch.id);
    formData.append('message', selectedFile.name);
    
    console.log('📁 FormData created, sending to server...');
    
    try {
      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('🚀 Server response:', response.data);
      
      // Add uploaded message to chat immediately
      const uploadedMessage = {
        id: response.data.data._id,
        text: response.data.data.message_text,
        message_text: response.data.data.message_text,
        message_type: response.data.data.message_type,
        file_url: response.data.data.file_url,
        file_name: response.data.data.file_name,
        senderId: user?._id,
        from_user_id: { _id: user?._id },
        timestamp: response.data.data.timestamp
      };
      
      // Add to messages via parent callback
      if (onSendMessage) {
        // Manually add the message to the chat
        window.dispatchEvent(new CustomEvent('newFileMessage', { 
          detail: { matchId: selectedMatch.id, message: uploadedMessage } 
        }));
      }
      
      // Clear file selection
      setSelectedFile(null);
      setFilePreview(null);
      setMessage('');
      
      console.log('File uploaded and message added to chat');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleDeleteMessage = async (messageId, deleteFor = 'me') => {
    console.log('Single delete called:', JSON.stringify({ messageId, deleteFor, selectedMatch: selectedMatch?.id }));
    
    const confirmText = deleteFor === 'everyone' ? 
      'Delete this message for everyone?' : 
      'Delete this message for you?';
      
    if (window.confirm(confirmText)) {
      try {
        // For AI chat, just delete locally
        if (selectedMatch?.id === 'ai-assistant') {
          console.log('AI chat - deleting single message locally');
          if (onDeleteMessage) {
            onDeleteMessage(messageId);
          }
          // Update localStorage for AI messages
          const updatedMessages = messages.filter(msg => (msg.id || msg._id) !== messageId);
          localStorage.setItem(`ai-messages-${user?._id}`, JSON.stringify(updatedMessages));
        } else {
          console.log('Regular chat - calling server API for single message');
          // For regular chats, call server API
          const response = await api.delete(`/chat/message/${messageId}`, {
            data: { deleteFor }
          });
          console.log('Server response:', response.data);
          if (onDeleteMessage) {
            onDeleteMessage(messageId);
          }
        }
        console.log('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message: ' + error.message);
      }
    }
    setShowMessageMenu(null);
  };

  const handleBulkDelete = async (deleteFor = 'me') => {
    if (selectedMessages.size === 0) {
      console.log('No messages selected');
      return;
    }
    
    console.log('Bulk delete called:', JSON.stringify({ selectedMessages: Array.from(selectedMessages), deleteFor, selectedMatch: selectedMatch?.id }));
    
    const confirmText = deleteFor === 'everyone' ? 
      `Delete ${selectedMessages.size} messages for everyone?` : 
      `Delete ${selectedMessages.size} messages for you?`;
      
    if (window.confirm(confirmText)) {
      try {
        const messageIds = Array.from(selectedMessages);
        console.log('Deleting messages:', messageIds);
        
        // For AI chat, just delete locally (no server call needed)
        if (selectedMatch?.id === 'ai-assistant') {
          console.log('AI chat - deleting locally');
          if (onDeleteMessage) {
            onDeleteMessage(messageIds); // Pass array instead of individual IDs
          }
          // Update localStorage for AI messages
          const updatedMessages = messages.filter(msg => !messageIds.includes(msg.id || msg._id));
          localStorage.setItem(`ai-messages-${user?._id}`, JSON.stringify(updatedMessages));
        } else {
          console.log('Regular chat - calling server API');
          // For regular chats, call server API
          const response = await api.delete('/chat/messages/bulk', {
            data: { messageIds, deleteFor }
          });
          console.log('Server response:', response.data);
          
          // Remove messages from local state
          if (onDeleteMessage) {
            onDeleteMessage(messageIds); // Pass array instead of individual IDs
          }
        }
        
        console.log('Messages deleted successfully');
        // Exit selection mode
        setSelectionMode(false);
        setSelectedMessages(new Set());
      } catch (error) {
        console.error('Error bulk deleting messages:', error);
        alert('Failed to delete messages: ' + error.message);
      }
    }
  };

  const toggleMessageSelection = (messageId) => {
    console.log('🎯 Toggling selection for:', messageId);
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        console.log('❌ Removing from selection');
        newSet.delete(messageId);
      } else {
        console.log('✅ Adding to selection');
        newSet.add(messageId);
      }
      console.log('📊 Total selected:', newSet.size);
      return newSet;
    });
  };

  const selectAllMessages = () => {
    const allMessageIds = messages.map(msg => msg.id || msg._id);
    setSelectedMessages(new Set(allMessageIds));
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setSelectionMode(false);
  };

  const handleMouseDown = (e) => {
    // Only start drag if clicking on messages container, not on checkboxes or buttons
    if (e.button === 0 && e.target === messagesContainerRef.current) {
      console.log('🖱️ Mouse down - starting drag selection');
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectionMode(true);
      setSelectedMessages(new Set());
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && dragStart) {
      const container = messagesContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const startY = Math.min(dragStart.y - rect.top, e.clientY - rect.top);
      const endY = Math.max(dragStart.y - rect.top, e.clientY - rect.top);

      const messageElements = container.querySelectorAll('[data-message-id]');
      const newSelected = new Set();

      messageElements.forEach(element => {
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top - rect.top;
        const elementBottom = elementRect.bottom - rect.top;

        if (elementBottom >= startY && elementTop <= endY) {
          const messageId = element.getAttribute('data-message-id');
          if (messageId && messageId !== 'undefined' && messageId !== 'null') {
            newSelected.add(messageId);
          }
        }
      });

      if (newSelected.size !== selectedMessages.size) {
        console.log('🎯 Selection changed:', Array.from(newSelected));
      }
      setSelectedMessages(newSelected);
    }
  };

  const handleMouseUp = () => {
    console.log('🖱️ Mouse up - ending drag selection, selected:', selectedMessages.size);
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);



  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessage = (msg) => {
    const messageText = msg.text || msg.message_text;
    const messageType = msg.message_type || 'text';
    const fileUrl = msg.file_url;
    
    return (
      <div>
        {messageType === 'image' && fileUrl ? (
          <div className="mb-2 relative group">
            <img 
              src={fileUrl} 
              alt={messageText}
              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '300px' }}
              onClick={() => window.open(fileUrl, '_blank')}
            />
            <button
              onClick={() => downloadFile(fileUrl, msg.file_name || 'image.jpg')}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download"
            >
              <Download size={16} />
            </button>
            {messageText && messageText !== 'undefined' && (
              <p className="text-sm mt-1 opacity-80">{messageText}</p>
            )}
          </div>
        ) : messageType === 'video' && fileUrl ? (
          <div className="mb-2 relative group">
            <div className="bg-gray-100 p-3 rounded-lg border">
              <div className="flex items-center space-x-3 mb-2">
                <Video size={24} className="text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{msg.file_name || 'Video'}</p>
                  <p className="text-sm text-gray-500">Download to play</p>
                </div>
                <button
                  onClick={() => downloadFile(fileUrl, msg.file_name || 'video.mp4')}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                  title="Download to play"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            {messageText && messageText !== 'undefined' && (
              <p className="text-sm mt-1 opacity-80">{messageText}</p>
            )}
          </div>
        ) : messageType === 'audio' && fileUrl ? (
          <div className="mb-2 relative group">
            <div className="bg-gray-100 p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Music size={24} className="text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{msg.file_name || 'Audio'}</p>
                  <p className="text-sm text-gray-500">Download to play</p>
                </div>
                <button
                  onClick={() => downloadFile(fileUrl, msg.file_name || 'audio.mp3')}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                  title="Download to play"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            {messageText && messageText !== 'undefined' && (
              <p className="text-sm mt-1 opacity-80 truncate">{messageText}</p>
            )}
          </div>
        ) : messageType === 'document' && fileUrl ? (
          <div className="mb-2 relative group">
            <div className="bg-gray-100 p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <FileText size={24} className="text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{msg.file_name || 'Document'}</p>
                  <p className="text-sm text-gray-500">Download to view</p>
                </div>
                <button
                  onClick={() => downloadFile(fileUrl, msg.file_name || 'document')}
                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded flex-shrink-0"
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            {messageText && messageText !== 'undefined' && (
              <p className="text-sm mt-1 opacity-80">{messageText}</p>
            )}
          </div>
        ) : (
          <p style={{fontSize: '16px', lineHeight: '1.4'}}>{messageText}</p>
        )}
        {msg.edited && <p className="text-xs opacity-60 italic mt-1">edited</p>}
      </div>
    );
  };

  if (!selectedMatch) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#E8FFD7] to-[#93DA97]/30">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Select a conversation</h3>
          <p className="text-gray-600">Choose a match from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] border-b p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full mr-3 shadow-lg overflow-hidden">
              {selectedMatch.profilePhoto ? (
                <img 
                  src={selectedMatch.profilePhoto} 
                  alt={selectedMatch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#E8FFD7]/30 flex items-center justify-center text-[#3E5F44] font-semibold">
                  {selectedMatch.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white">{selectedMatch.name}</h2>
              <p className="text-sm text-[#E8FFD7]">
                {selectionMode ? 
                  `${selectedMessages.size} selected ${isDragging ? '(dragging...)' : ''}` : 
                  'Online • Drag to select messages'
                }
              </p>
            </div>
          </div>
          
          {/* Selection Mode Controls */}
          {selectionMode ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllMessages}
                className="text-white hover:bg-white/20 px-2 py-1 rounded text-xs transition-colors"
              >
                All
              </button>
              {selectedMessages.size > 0 && (
                <>
                  <button
                    onClick={() => {
                      console.log('Delete button clicked - selected messages:', Array.from(selectedMessages));
                      handleBulkDelete('me');
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={clearSelection}
                className="text-white hover:bg-white/20 px-2 py-1 rounded text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-white text-xs opacity-75">
              Click checkboxes or drag to select
            </div>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-[#E8FFD7]/50 to-[#93DA97]/20 space-y-4 select-none"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'crosshair' : 'default' }}
      >
        {/* Drag Selection Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#5E936C]/10 border-2 border-dashed border-[#5E936C] pointer-events-none z-10 rounded-lg" />
        )}
        {messages.map((msg, index) => {
          const isOwn = (msg.senderId || msg.from_user_id?._id) === user?._id;
          const messageId = msg.id || msg._id || `temp_${index}`;

          
          if (index < 3) console.log('Message details:', JSON.stringify({ messageId, msgId: msg.id, msg_Id: msg._id, text: (msg.text || msg.message_text)?.substring(0, 50) }));
          
          return (
            <div 
              key={messageId} 
              data-message-id={messageId}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-start space-x-2`}
            >
              {/* Selection Checkbox - Always visible */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('✅ Checkbox clicked for message:', messageId);
                  if (!selectionMode) {
                    console.log('🔄 Activating selection mode');
                    setSelectionMode(true);
                  }
                  toggleMessageSelection(messageId);
                }}
                className={`mt-2 p-2 rounded-full transition-colors border-2 ${
                  selectedMessages.has(messageId) 
                    ? 'text-white bg-[#5E936C] border-[#5E936C]' 
                    : 'text-[#5E936C] bg-white border-[#5E936C] hover:bg-[#E8FFD7]'
                }`}
                title="Select message"
              >
                {selectedMessages.has(messageId) ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-lg relative group transition-all duration-200 ${
                selectedMessages.has(messageId) 
                  ? 'ring-2 ring-[#5E936C] ring-opacity-70 scale-105 shadow-xl bg-[#5E936C]/20' 
                  : ''
              } ${
                isOwn && msg.message_type !== 'ai'
                  ? selectedMessages.has(messageId) 
                    ? 'bg-gradient-to-r from-[#5E936C] to-[#93DA97] text-white'
                    : 'bg-gradient-to-r from-[#3E5F44] to-[#5E936C] text-white'
                  : msg.message_type === 'ai'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-2 border-purple-300'
                  : selectedMessages.has(messageId)
                    ? 'bg-[#5E936C]/30 backdrop-blur-sm text-gray-800 shadow-sm'
                    : 'bg-[#E8FFD7]/95 backdrop-blur-sm text-gray-800 shadow-sm'
              }`}>
                {/* Selection Indicator */}
                {selectedMessages.has(messageId) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#5E936C] rounded-full flex items-center justify-center">
                    <CheckSquare size={10} className="text-white" />
                  </div>
                )}
              {msg.message_type === 'ai' && (
                <div className="flex items-center mb-1">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🤖 AI Assistant</span>
                </div>
              )}
                {renderMessage(msg)}
                
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${
                    isOwn ? 'text-[#E8FFD7]' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                  
                  {!selectionMode && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMessageMenu(showMessageMenu === messageId ? null : messageId)}
                        className="ml-2 p-1 hover:bg-white/20 rounded transition-all bg-white/10"
                      >
                        <MoreVertical size={12} />
                      </button>
                      
                      {showMessageMenu === messageId && (
                        <div className="absolute right-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => handleDeleteMessage(messageId, 'me')}
                            className="flex items-center space-x-2 px-3 py-1 text-gray-700 hover:bg-gray-100 w-full text-left text-sm"
                          >
                            <Trash2 size={12} />
                            <span>Delete for me</span>
                          </button>
                          {isOwn && selectedMatch?.id !== 'ai-assistant' && (
                            <button
                              onClick={() => handleDeleteMessage(messageId, 'everyone')}
                              className="flex items-center space-x-2 px-3 py-1 text-red-600 hover:bg-red-50 w-full text-left text-sm"
                            >
                              <Trash2 size={12} />
                              <span>Delete for everyone</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {/* Floating Action Buttons */}
        {selectionMode && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border flex items-center space-x-2 px-4 py-2 z-20">
            <button
              onClick={selectAllMessages}
              className="text-[#5E936C] hover:text-[#3E5F44] px-2 py-1 rounded transition-colors text-sm font-medium"
            >
              Select All
            </button>
            {selectedMessages.size > 0 && (
              <>
                <div className="w-px h-6 bg-gray-300"></div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedMessages.size} selected
                </span>
                <button
                  onClick={() => {
                    console.log('Floating Delete button clicked - selected messages:', Array.from(selectedMessages));
                    handleBulkDelete('me');
                  }}
                  className="flex items-center space-x-1 text-red-500 hover:text-red-600 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Delete</span>
                </button>
              </>
            )}
            <button
              onClick={clearSelection}
              className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      

      
      {/* Message Input */}
      <div className="p-4 bg-[#E8FFD7]/95 backdrop-blur-sm border-t shadow-lg">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-white/50 rounded-lg border border-[#5E936C]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image size={20} className="text-[#5E936C]" />
                ) : selectedFile.type.startsWith('video/') ? (
                  <Video size={20} className="text-[#5E936C]" />
                ) : selectedFile.type.startsWith('audio/') ? (
                  <Music size={20} className="text-[#5E936C]" />
                ) : selectedFile.type === 'application/pdf' || selectedFile.type.includes('document') ? (
                  <FileText size={20} className="text-[#5E936C]" />
                ) : (
                  <File size={20} className="text-[#5E936C]" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={removeSelectedFile}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X size={16} />
              </button>
            </div>
            {filePreview && (
              <div className="mt-2">
                <img src={filePreview} alt="Preview" className="max-h-20 rounded" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-lg p-4 grid grid-cols-8 gap-3 z-10 max-h-80 overflow-y-auto w-80">
                {['😀','😂','🤣','😊','😍','🥰','😘','😎','🤔','😢','😭','😡','🤬','😱','🤯','🥺','😴','🤗','🙄','😏','🤪','😋','🥳','😌','🤤','😇','🤠','🥸','🤡','👻','💀','👽','🤖','💩','👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','🤝','💪','🦾','🧠','❤️','💔','💕','💖','💗','💘','💝','💞','💟','🔥','💯','💢','💥','💫','⭐','🌟','✨','⚡','🌈','🎉','🎊','🎈','🎁','🏆','🥇','🎯','🎮','🎵','🎶','🎤','🍕','🍔','🍟','🌮','🍩','🍰','🎂','🍺','🍻','☕','🥤','🌍','🌎','🌏','🔮','💎','👑','🎭','🎨','📱','💻','🎯','⚽','🏀','🎾','🏈','⚾','🏐','🏓','🚀','✈️','🚗','🏠','🌺','🌸','🌼','🌻','🌹','🌷','🌱','🌿','🍀','🌳','🌲','🦋','🐝','🐞','🦄','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🙈','🙉','🙊'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:bg-gray-100 hover:scale-110 p-2 rounded-lg transition-all duration-200 flex items-center justify-center h-12 w-12"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Paperclip size={20} />
            </button>
          </div>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            onClick={() => setShowMessageMenu(null)}
            placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
            className="flex-1 px-4 py-3 bg-[#E8FFD7]/30 border-2 border-transparent rounded-xl focus:border-[#5E936C] focus:bg-[#E8FFD7] transition-all duration-200 outline-none shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || uploading}
            className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] hover:from-[#3E5F44] hover:to-[#93DA97] text-white p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;