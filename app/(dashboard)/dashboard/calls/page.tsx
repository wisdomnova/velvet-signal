// ./app/(dashboard)/dashboard/calls/page.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
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
  MoreVertical,
  PhoneOff,
  Volume2,
  VolumeX,
  AlertTriangle 
} from 'lucide-react'; 

// Import the Twilio Voice SDK
import { Device } from '@twilio/voice-sdk';

interface Call {
  id: string;
  sid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'busy' | 'no-answer' | 'failed' | 'in-progress';
  duration: number;
  dateCreated: string;
  price?: string;
  recordingUrl?: string;
}

interface LiveCall {
  sid: string;
  status: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
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
  
  // Voice SDK states
  const [device, setDevice] = useState<Device | null>(null);
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [activeCall, setActiveCall] = useState<LiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const currentCallRef = useRef<any>(null);

  useEffect(() => {
    fetchCalls();
    initializeVoice();
    
    return () => {
      if (device) {
        device.disconnectAll();
        device.unregister();
      }
    };
  }, []);

  // Phone number validation
  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  // Play recording function
  const playRecording = (recordingUrl: string) => {
    const audio = new Audio(recordingUrl);
    audio.play().catch(error => {
      console.error('Error playing recording:', error);
      alert('Failed to play recording');
    });
  };

  const initializeVoice = async () => {
    try {
      setVoiceError(null);
      
      // Get access token
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get voice token');
      }

      const { token: accessToken } = await response.json();
      
      // Initialize Twilio Device
      const twilioDevice = new Device(accessToken, { 
        logLevel: 1,
      });
      
      twilioDevice.on('ready', () => {
        console.log('Twilio Device ready');
        setIsVoiceReady(true);
        setRetryCount(0); // Reset retry count on success
      });

      twilioDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
        setVoiceError(error.message || 'Voice connection error');
        setIsVoiceReady(false);
      });

      twilioDevice.on('incoming', (call) => {
        console.log('Incoming call from:', call.parameters.From);
        
        setIncomingCall(call);
        setActiveCall({
          sid: call.parameters.CallSid || '',
          status: 'ringing',
          direction: 'inbound',
          from: call.parameters.From || '',
          to: call.parameters.To || '',
        });

        call.on('accept', () => {
          console.log('Incoming call accepted');
          setIncomingCall(null);
          currentCallRef.current = call;
          setActiveCall(prev => prev ? { ...prev, status: 'in-progress' } : null);
        });

        call.on('disconnect', () => {
          console.log('Incoming call ended');
          setActiveCall(null);
          setIncomingCall(null);
          currentCallRef.current = null;
          setIsMuted(false); // Reset mute state
          fetchCalls(); // Refresh call history
        });

        call.on('reject', () => {
          console.log('Incoming call rejected');
          setActiveCall(null);
          setIncomingCall(null);
          currentCallRef.current = null;
        });
      });

      await twilioDevice.register();
      setDevice(twilioDevice);
      
    } catch (error) {
      console.error('Failed to initialize voice:', error);
      setVoiceError(error instanceof Error ? error.message : 'Failed to initialize voice');
      setRetryCount(prev => prev + 1);
    }
  };

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

  const makeWebCall = async () => {
    if (!newCallTo.trim() || !device || !isVoiceReady || !isValidPhoneNumber(newCallTo)) return;

    try {
      setIsDialing(true);
      
      const call = await device.connect({
        params: { To: newCallTo }
      });
      
      currentCallRef.current = call;
      setActiveCall({
        sid: '',
        status: 'connecting',
        direction: 'outbound',
        from: '',
        to: newCallTo,
      });

      call.on('accept', () => {
        console.log('Outbound call connected');
        setActiveCall(prev => prev ? { ...prev, status: 'in-progress' } : null);
      });

      call.on('disconnect', () => {
        console.log('Outbound call ended');
        setActiveCall(null);
        currentCallRef.current = null;
        setIsMuted(false); // Reset mute state
        fetchCalls(); // Refresh call history
      });

      setNewCallTo('');
      setShowNewCall(false);
      
    } catch (error) {
      console.error('Failed to make call:', error);
      alert('Failed to make call: ' + error);
    } finally {
      setIsDialing(false);
    }
  };

  // Keep the existing API call function for non-web calls
  const makeApiCall = async () => {
    if (!newCallTo.trim() || !isValidPhoneNumber(newCallTo)) return;

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
        
        alert(`Call initiated to ${newCallTo}. Call SID: ${data.call.sid}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make call');
      }
    } catch (error) {
      console.error('Failed to make call:', error);
      alert('Failed to make call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDialing(false);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      incomingCall.accept();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.reject();
    }
    setIncomingCall(null);
    setActiveCall(null);
  };

  const hangUp = () => {
    if (currentCallRef.current) {
      currentCallRef.current.disconnect();
    }
    if (device) {
      device.disconnectAll();
    }
    setActiveCall(null);
    setIncomingCall(null);
    currentCallRef.current = null;
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (currentCallRef.current) {
      if (isMuted) {
        currentCallRef.current.mute(false);
      } else {
        currentCallRef.current.mute(true);
      }
      setIsMuted(!isMuted);
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
      {/* Voice Status Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isVoiceReady 
            ? 'bg-green-100 text-green-800' 
            : voiceError
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isVoiceReady ? '🟢 Voice Ready' : voiceError ? '🔴 Voice Error' : '🟡 Connecting...'}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-green-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Incoming Call
            </h3>
            <p className="text-gray-600 mb-6">
              {incomingCall.parameters.From}
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Call Widget */}
      {activeCall && activeCall.status !== 'completed' && !incomingCall && (
        <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 min-w-72 z-40">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneCall className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {activeCall.direction === 'outbound' ? 'Calling' : 'Connected'}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeCall.direction === 'outbound' ? activeCall.to : activeCall.from}
            </p>
            
            <div className="flex space-x-3 justify-center">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-colors ${
                  isMuted 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <button
                onClick={hangUp}
                className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                title="Hang up"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Calls</h1>
          <p className="text-gray-600 mt-1">Make and manage voice communications</p>
        </div>
        <button
          onClick={() => setShowNewCall(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center"
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          Make Call
        </button>
      </motion.div>

      {/* Enhanced Voice Error */}
      {voiceError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-600 text-sm font-medium">Voice Connection Error</p>
                <p className="text-red-500 text-xs mt-1">{voiceError}</p>
                {retryCount > 0 && (
                  <p className="text-red-400 text-xs mt-1">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={initializeVoice}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
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

                  <div className="flex items-center space-x-2">
                    {call.recordingUrl && (
                      <button 
                        onClick={() => playRecording(call.recordingUrl!)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Play recording"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setNewCallTo(call.direction === 'outbound' ? call.to : call.from);
                        setShowNewCall(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Call this number"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                    
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="More options"
                    >
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

      {/* Enhanced New Call Modal */}
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
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 ${
                    newCallTo && !isValidPhoneNumber(newCallTo) 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
                {newCallTo && !isValidPhoneNumber(newCallTo) && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter a valid phone number (e.g., +1234567890)
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewCall(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {/* Two call options: Web Call (in-browser) and API Call (traditional) */}
              <div className="flex-1 flex space-x-2">
                <button
                  onClick={makeWebCall}
                  disabled={!newCallTo.trim() || !isValidPhoneNumber(newCallTo) || isDialing || !isVoiceReady}
                  className="flex-1 px-3 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  title="In-browser calling"
                >
                  {isDialing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-1" />
                      Web
                    </>
                  )}
                </button>
                
                <button
                  onClick={makeApiCall}
                  disabled={!newCallTo.trim() || !isValidPhoneNumber(newCallTo) || isDialing}
                  className="flex-1 px-3 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  title="Server-side calling"
                >
                  {isDialing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4 mr-1" />
                      API
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Web: In-browser calling • API: Server-side calling
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}