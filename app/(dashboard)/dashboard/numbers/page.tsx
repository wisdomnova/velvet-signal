// ./app/(dashboard)/dashboard/numbers/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { 
  Phone, 
  Search, 
  Plus, 
  Trash2, 
  MessageSquare, 
  PhoneCall, 
  MapPin,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface AvailableNumber { 
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  postalCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  price: string;
}

interface OwnedNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  status: string;
  dateCreated: string;
  voiceUrl?: string;
  smsUrl?: string;
}

export default function NumbersPage() {
  const { token } = useAuthStore();
  const [ownedNumbers, setOwnedNumbers] = useState<OwnedNumber[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    areaCode: '',
    locality: ''
  });
  const [activeTab, setActiveTab] = useState<'owned' | 'search'>('owned');

  // Success/Error state
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOwnedNumbers();
  }, []);

  const fetchOwnedNumbers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/numbers/owned', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOwnedNumbers(data.numbers);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch owned numbers');
      }
    } catch (error) {
      console.error('Failed to fetch owned numbers:', error);
      setError('Failed to fetch owned numbers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchNumbers = async () => {
    try {
      setIsSearching(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchFilters.areaCode) params.append('areaCode', searchFilters.areaCode);
      if (searchFilters.locality) params.append('locality', searchFilters.locality);
      params.append('countryCode', 'US'); // Always US

      const response = await fetch(`/api/numbers/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableNumbers(data.numbers);
        
        if (data.numbers.length === 0) {
          setError('No numbers found matching your criteria. Try different filters.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search numbers');
        setAvailableNumbers([]);
      }
    } catch (error) {
      console.error('Failed to search numbers:', error);
      setError('Failed to search numbers. Please try again.');
      setAvailableNumbers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const purchaseNumber = async (phoneNumber: string) => {
    try {
      setIsPurchasing(phoneNumber);
      setError(null);
      
      const response = await fetch('/api/numbers/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        await fetchOwnedNumbers();
        setAvailableNumbers(prev => prev.filter(num => num.phoneNumber !== phoneNumber));
        setPurchaseSuccess(`Successfully purchased ${phoneNumber} with automatic webhook configuration`);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setPurchaseSuccess(null), 5000);
        
        // Switch to owned tab to show the new number
        setActiveTab('owned');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to purchase number');
      }
    } catch (error) {
      console.error('Failed to purchase number:', error);
      setError('Failed to purchase number. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  const releaseNumber = async (sid: string) => {
    if (!confirm('Are you sure you want to release this number? This action cannot be undone and you will lose all associated data.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`/api/numbers/${sid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setOwnedNumbers(prev => prev.filter(num => num.sid !== sid));
        setPurchaseSuccess('Number released successfully');
        setTimeout(() => setPurchaseSuccess(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to release number');
      }
    } catch (error) {
      console.error('Failed to release number:', error);
      setError('Failed to release number. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Numbers</h1>
          <p className="text-gray-600">
            Manage your US phone numbers and purchase new ones
          </p>
        </div>
      </motion.div>

      {/* Success/Error Notifications */}
      {purchaseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">
              {purchaseSuccess}
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100"
      >
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('owned')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'owned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Owned Numbers ({ownedNumbers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Search & Buy
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'owned' ? (
            /* Owned Numbers Tab */
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ownedNumbers.length > 0 ? (
                <div className="space-y-4">
                  {ownedNumbers.map((number, index) => (
                    <motion.div
                      key={number.sid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {number.phoneNumber}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              number.status === 'in-use'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {number.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Purchased {new Date(number.dateCreated).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            {number.capabilities.voice && (
                              <div className="flex items-center text-blue-600">
                                <PhoneCall className="w-4 h-4 mr-1" />
                                <span className="text-sm">Voice</span>
                              </div>
                            )}
                            {number.capabilities.sms && (
                              <div className="flex items-center text-green-600">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span className="text-sm">SMS</span>
                              </div>
                            )}
                            {number.capabilities.mms && (
                              <div className="flex items-center text-purple-600">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span className="text-sm">MMS</span>
                              </div>
                            )}
                          </div>

                          {/* Webhook Status */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {number.voiceUrl && (
                              <div className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                <span>Voice webhook configured</span>
                              </div>
                            )}
                            {number.smsUrl && (
                              <div className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                <span>SMS webhook configured</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button 
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Settings"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => releaseNumber(number.sid)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Release number"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers</h3>
                  <p className="text-gray-500 mb-6">You don't have any phone numbers yet. Purchase one to start making calls and sending SMS.</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Search for Numbers
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Search Numbers Tab */
            <div>
              {/* Search Filters */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search US Phone Numbers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 415"
                      maxLength={3}
                      value={searchFilters.areaCode}
                      onChange={(e) => setSearchFilters(prev => ({ 
                        ...prev, 
                        areaCode: e.target.value.replace(/\D/g, '') 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., San Francisco"
                      value={searchFilters.locality}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, locality: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    />
                  </div>
                </div>
                <button
                  onClick={searchNumbers}
                  disabled={isSearching}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {isSearching ? 'Searching...' : 'Search US Numbers'}
                </button>
              </div>

              {/* Available Numbers */}
              {availableNumbers.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available US Numbers ({availableNumbers.length} found)
                  </h3>
                  {availableNumbers.map((number, index) => (
                    <motion.div
                      key={number.phoneNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {number.phoneNumber}
                            </h3>
                            <span className="text-lg font-bold text-green-600">
                              {number.price}/month
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {number.locality}, {number.region}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {number.capabilities.voice && (
                              <div className="flex items-center text-blue-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">Voice</span>
                              </div>
                            )}
                            {number.capabilities.sms && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">SMS</span>
                              </div>
                            )}
                            {number.capabilities.mms && (
                              <div className="flex items-center text-purple-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">MMS</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => purchaseNumber(number.phoneNumber)}
                          disabled={isPurchasing === number.phoneNumber}
                          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
                        >
                          {isPurchasing === number.phoneNumber ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Purchasing...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Purchase
                            </>
                          )} 
                        </button> 
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search for US numbers</h3>
                  <p className="text-gray-500">
                    Use the filters above to find available US phone numbers. Numbers come with automatic webhook configuration for instant call and SMS reception.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}