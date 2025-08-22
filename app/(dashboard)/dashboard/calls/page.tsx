// ./app/(dashboard)/dashboard/calls/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Search, 
  Plus, 
  Clock, 
  User,
  Calendar,
  Filter,
  Play,
  Pause,
  Download,
  MoreVertical
} from 'lucide-react';

interface Call {
  id: string;
  sid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'busy' | 'no-answer' | 'failed' | 'in-progress';
  duration: number; // in seconds
  dateCreated: string;
  price?: string;
  recordingUrl?: string;
}

export default function CallsPage() {
  const { token } = useAuthStore();
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [showNewCall, setShowNewCall] = useState(false);
  const [newCallTo, setNewCallTo] = useState('');
  const [isDialing, setIsDialing] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/calls/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls);
      }
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const makeCall = async () => {
    if (!newCallTo.trim()) return;

    try {
      setIsDialing(true);
      const response = await fetch('/api/calls/make', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: newCallTo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewCallTo('');
        setShowNewCall(false);
        await fetchCalls();
        
        // Could show a success message or call status
        alert(`Call initiated to ${newCallTo}. Call SID: ${data.call.sid}`);
      }
    } catch (error) {
      console.error('Failed to make call:', error);
    } finally {
      setIsDialing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'busy':
      case 'no-answer':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.from.includes(searchQuery) ||
      call.to.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    const matchesDirection = filterDirection === 'all' || call.direction === filterDirection;
    
    return matchesSearch && matchesStatus && matchesDirection;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Calls</h1>
          <p className="text-gray-600 mt-1">Manage your voice communications</p>
        </div>
        <button
          onClick={() => setShowNewCall(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center"
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          Make Call
        </button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="busy">Busy</option>
            <option value="no-answer">No Answer</option>
            <option value="failed">Failed</option>
            <option value="in-progress">In Progress</option>
          </select>

          {/* Direction Filter */}
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
          >
            <option value="all">All Calls</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </div>
      </motion.div>

      {/* Calls List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Call History</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCalls.length > 0 ? (
            filteredCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Direction Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      call.direction === 'outbound' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {call.direction === 'outbound' ? (
                        <PhoneOutgoing className="w-5 h-5" />
                      ) : (
                        <PhoneIncoming className="w-5 h-5" />
                      )}
                    </div>

                    {/* Call Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {call.direction === 'outbound' ? call.to : call.from}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(call.dateCreated).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(call.duration)}
                        </span>
                        {call.price && (
                          <span>${call.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {call.recordingUrl && (
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setNewCallTo(call.direction === 'outbound' ? call.to : call.from)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center p-6">
              <Phone className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">No calls found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* New Call Modal */}
      {showNewCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Make a Call</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newCallTo}
                  onChange={(e) => setNewCallTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewCall(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={makeCall}
                disabled={!newCallTo.trim() || isDialing}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDialing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Call Now
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}