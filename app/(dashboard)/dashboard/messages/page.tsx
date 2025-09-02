// ./app/(dashboard)/dashboard/messages/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { 
  MessageSquare, 
  Send,  
  Search, 
  Plus, 
  Trash2, 
  Phone,
  Calendar,
  User,
  Filter, 
  MoreVertical
} from 'lucide-react';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'delivered' | 'sent' | 'failed' | 'received';
  dateCreated: string;
  sid: string;
}

interface Conversation {
  phoneNumber: string;
  contactName?: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

export default function MessagesPage() {
  const { token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageTo, setNewMessageTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sms/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const to = selectedConversation || newMessageTo;
    if (!to) return;

    try {
      setIsSending(true);
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          body: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setNewMessageTo('');
        setShowNewMessage(false);
        await fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.phoneNumber.includes(searchQuery) ||
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.phoneNumber === selectedConversation);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Conversations List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-80 bg-white rounded-2xl border border-gray-100 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewMessage(true)}
              className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="p-2">
              {filteredConversations.map((conversation, index) => (
                <motion.button
                  key={conversation.phoneNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conversation.phoneNumber)}
                  className={`w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors mb-2 ${
                    selectedConversation === conversation.phoneNumber
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {conversation.contactName || conversation.phoneNumber}
                        </h3>
                        {conversation.contactName && (
                          <p className="text-sm text-gray-500">{conversation.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(conversation.lastMessageDate).toLocaleDateString()}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center p-6">
              <MessageSquare className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col"
      >
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConv.contactName || selectedConv.phoneNumber}
                    </h3>
                    {selectedConv.contactName && (
                      <p className="text-sm text-gray-500">{selectedConv.phoneNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConv.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.direction === 'outbound'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.body}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        message.direction === 'outbound' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {new Date(message.dateCreated).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {message.direction === 'outbound' && (
                        <span className={`text-xs ${
                          message.status === 'delivered' ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {message.status}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : showNewMessage ? (
          /* New Message Form */
          <div className="flex-1 flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">New Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={newMessageTo}
                    onChange={(e) => setNewMessageTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 resize-none"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowNewMessage(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !newMessageTo.trim() || isSending}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
            <p className="text-gray-500 mb-6">Choose a conversation from the sidebar or start a new one</p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}