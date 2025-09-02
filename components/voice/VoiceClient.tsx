// ./components/voice/VoiceClient.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { TwilioVoiceClient, Call } from '@/lib/twilioVoice';
import { Phone, PhoneCall, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceClientProps {
  onCallStatusChange?: (call: Call | null) => void;
}

export default function VoiceClient({ onCallStatusChange }: VoiceClientProps) {
  const { token } = useAuthStore();
  const [voiceClient, setVoiceClient] = useState<TwilioVoiceClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCallStatusChange = useCallback((call: Call) => {
    setActiveCall(call);
    if (onCallStatusChange) {
      onCallStatusChange(call);
    }
  }, [onCallStatusChange]);

  const handleIncomingCall = useCallback((call: Call) => {
    setIncomingCall(call);
    setActiveCall(call);
  }, []);

  const initializeVoice = useCallback(async () => {
    if (!token || isInitializing) return;

    try {
      setIsInitializing(true);
      setError(null);

      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get voice token');
      }

      const { token: accessToken } = await response.json();
      
      const client = new TwilioVoiceClient();
      client.setCallStatusHandler(handleCallStatusChange);
      client.setIncomingCallHandler(handleIncomingCall);
      
      await client.initialize(accessToken);
      
      setVoiceClient(client);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize voice:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize voice');
    } finally {
      setIsInitializing(false);
    }
  }, [token, isInitializing, handleCallStatusChange, handleIncomingCall]);

  useEffect(() => {
    initializeVoice();

    return () => {
      if (voiceClient) {
        voiceClient.disconnect();
      }
    };
  }, [initializeVoice]);

  const makeCall = async (phoneNumber: string) => {
    if (!voiceClient || !isInitialized) {
      throw new Error('Voice client not ready');
    }

    try {
      await voiceClient.makeCall(phoneNumber);
      setActiveCall({
        sid: '',
        status: 'connecting',
        direction: 'outbound',
        from: '',
        to: phoneNumber,
      });
    } catch (error) {
      console.error('Failed to make call:', error);
      throw error;
    }
  };

  const acceptCall = () => {
    // This would be handled by the Twilio Device automatically
    // when user clicks accept - implementation depends on your UI
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (voiceClient) {
      voiceClient.disconnect();
    }
    setIncomingCall(null);
    setActiveCall(null);
  };

  const hangUp = () => {
    if (voiceClient) {
      voiceClient.disconnect();
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute functionality with Twilio Device
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Voice Error: {error}</p>
        <button 
          onClick={initializeVoice}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Incoming call UI
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-10 h-10 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Incoming Call
          </h3>
          <p className="text-gray-600 mb-6">
            {incomingCall.from}
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
        </div>
      </div>
    );
  }

  // Active call UI
  if (activeCall && activeCall.status !== 'completed') {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 min-w-72">
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
          
          <div className="flex space-x-3">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-colors ${
                isMuted 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            <button
              onClick={hangUp}
              className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Status indicator
  return (
    <div className="fixed bottom-4 left-4">
      <div className={`px-3 py-2 rounded-lg text-sm ${
        isInitialized 
          ? 'bg-green-100 text-green-800' 
          : isInitializing
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {isInitialized ? '🟢 Voice Ready' : isInitializing ? '🟡 Connecting...' : '🔴 Voice Offline'}
      </div>
    </div>
  );
}

// Export the makeCall function for use in other components
export { VoiceClient };