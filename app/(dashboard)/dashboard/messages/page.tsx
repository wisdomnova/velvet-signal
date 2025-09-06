// app/(dashboard)/dashboard/messages/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@supabase/supabase-js';
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
  MoreVertical,
  Bell,
  ChevronDown,
  X // Add this for close button
} from 'lucide-react';

// Add Supabase client for realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface UserNumber {
  id: string;
  phoneNumber: string;
  capabilities: {
    sms: boolean;
  };
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
  
  // Number selection states
  const [userNumbers, setUserNumbers] = useState<UserNumber[]>([]);
  const [selectedFromNumber, setSelectedFromNumber] = useState<string>('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  
  // Real-time notification states
  const [newMessageNotification, setNewMessageNotification] = useState<Message | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchUserNumbers();
    setupRealtimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels();
    };
  }, []);

  // Setup real-time subscriptions for incoming messages
  const setupRealtimeSubscriptions = async () => {
    try {
      // Get user ID from token
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return;
      
      const { user } = await response.json();
      const userId = user.id;

      // Real-time subscription for messages
      const messagesChannel = supabase
        .channel('user_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('🔥 Real-time message received!', payload);
          
          const newMessage = payload.new as any;
          
          // Refresh conversations to include new message
          fetchConversations();
          
          // Show notification for incoming messages
          if (newMessage.direction === 'inbound') {
            setNewMessageNotification(newMessage);
            showBrowserNotification('New Message', `From ${newMessage.from_number}: ${newMessage.body}`);
            
            // Auto-hide notification after 10 seconds
            setTimeout(() => setNewMessageNotification(null), 10000);
          }
        })
        .subscribe((status) => {
          console.log('Messages subscription status:', status);
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      console.log('✅ Real-time SMS subscriptions setup complete');
      
    } catch (error) {
      console.error('❌ Failed to setup real-time subscriptions:', error);
    }
  };

  // Browser notification function
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      });
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchUserNumbers = async () => {
    try {
      const response = await fetch('/api/numbers/owned', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const smsCapableNumbers = data.numbers.filter((num: any) => num.capabilities?.sms);
        setUserNumbers(smsCapableNumbers.map((num: any) => ({
          id: num.sid,
          phoneNumber: num.phoneNumber,
          capabilities: num.capabilities
        })));
        
        // Set first SMS-capable number as default
        if (smsCapableNumbers.length > 0 && !selectedFromNumber) {
          setSelectedFromNumber(smsCapableNumbers[0].phoneNumber);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user numbers:', error);
    }
  };

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

  if (!selectedFromNumber) {
    alert('Please select a phone number to send from');
    return;
  }

  try {
    setIsSending(true);
    console.log('📤 Sending SMS:', {
      to,
      body: newMessage,
      from: selectedFromNumber
    });

    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        body: newMessage,
        from: selectedFromNumber,
      }),
    });

    console.log('📡 SMS API response status:', response.status);

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ SMS sent successfully:', responseData);
      
      // Clear message input immediately
      setNewMessage('');
      
      // Handle new message vs existing conversation
      if (showNewMessage) {
        // New conversation - switch to it after sending
        setNewMessageTo('');
        setShowNewMessage(false);
        setSelectedConversation(to);
        
        // Show success feedback
        console.log('🎯 Switched to new conversation:', to);
      }
      
      // Refresh conversations to show the new message
      await fetchConversations();
      
      // Optional: Show a brief success toast
      console.log('🎉 Message sent successfully!');
      
    } else {
      const errorData = await response.json();
      console.error('❌ SMS API error:', errorData);
      alert('Failed to send message: ' + (errorData.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    alert('Failed to send message: ' + (error instanceof Error ? error.message : 'Network error'));
  } finally {
    setIsSending(false);
  }
};

  // 🔧 FIXED: Handle new message creation
  const handleNewMessage = () => {
    console.log('📝 Starting new message...');
    setSelectedConversation(null); // Clear any selected conversation
    setShowNewMessage(true); // Show new message form
    setNewMessage(''); // Clear message input
    setNewMessageTo(''); // Clear recipient input
  };

  // 🔧 FIXED: Handle conversation selection
  const handleConversationSelect = (phoneNumber: string) => {
    console.log('💬 Selecting conversation:', phoneNumber);
    setSelectedConversation(phoneNumber);
    setShowNewMessage(false); // Hide new message form
    setNewMessageTo(''); // Clear new message recipient
  };

  // 🔧 FIXED: Handle closing new message form
  const handleCloseNewMessage = () => {
    console.log('❌ Closing new message form');
    setShowNewMessage(false);
    setNewMessage('');
    setNewMessageTo('');
    // Don't automatically select a conversation - let user choose
  };

  const filteredConversations = conversations.filter(conv =>
    conv.phoneNumber.includes(searchQuery) ||
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.phoneNumber === selectedConversation);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Real-time Status Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isRealtimeConnected 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isRealtimeConnected ? '🔄 Real-time Connected' : '⏸️ Real-time Offline'}
        </div>
      </div>

      {/* Real-time Message Notification */}
      {newMessageNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-80"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">New Message</h4>
              <p className="text-sm text-gray-600">From: {newMessageNotification.from}</p>
              <p className="text-sm text-gray-800 mt-1">{newMessageNotification.body}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(newMessageNotification.dateCreated).toLocaleTimeString()}
              </p>
            </div>
            <button 
              onClick={() => setNewMessageNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

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
            {/* 🔧 FIXED: New message button */}
            <button
              onClick={handleNewMessage}
              className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              title="Start new message"
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
                  onClick={() => handleConversationSelect(conversation.phoneNumber)}
                  className={`w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors mb-2 ${
                    selectedConversation === conversation.phoneNumber && !showNewMessage
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
              <button
                onClick={handleNewMessage}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Start your first conversation
              </button>
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
        {selectedConv && !showNewMessage ? (
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
                  <button 
                    onClick={handleNewMessage}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="New message"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
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
              {/* From Number Selector */}
              <div className="mb-4">
                <div className="relative">
                  <button
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">
                      From: {selectedFromNumber || 'Select number'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {showFromDropdown && (
                    <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {userNumbers.length > 0 ? (
                        userNumbers.map((number) => (
                          <button
                            key={number.id}
                            onClick={() => {
                              setSelectedFromNumber(number.phoneNumber);
                              setShowFromDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                          >
                            {number.phoneNumber}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No SMS-capable numbers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={!newMessage.trim() || !selectedFromNumber || isSending}
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
          /* 🔧 IMPROVED: New Message Form */
          <div className="flex-1 flex flex-col">
            {/* New Message Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">New Message</h3>
                <button
                  onClick={handleCloseNewMessage}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* New Message Form */}
            <div className="flex-1 p-6">
              <div className="max-w-md mx-auto space-y-6">
                {/* From Number Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <select
                    value={selectedFromNumber}
                    onChange={(e) => setSelectedFromNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                  >
                    <option value="">Select a number to send from</option>
                    {userNumbers.map((number) => (
                      <option key={number.id} value={number.phoneNumber}>
                        {number.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Number Input */}
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

                {/* Message Input */}
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

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseNewMessage}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Send button clicked:', {
                        newMessage: newMessage.trim(),
                        newMessageTo: newMessageTo.trim(),
                        selectedFromNumber,
                        isSending
                      });
                      sendMessage();
                    }}
                    disabled={!newMessage.trim() || !newMessageTo.trim() || !selectedFromNumber || isSending}
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
              onClick={handleNewMessage}
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