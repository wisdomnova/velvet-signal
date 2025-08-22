// ./app/(dashboard)/dashboard/activity/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth'; 
import { 
  Phone, 
  MessageCircle,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'call' | 'sms';
  title: string;
  description: string;
  time: string;
  status: string;
  created_at: string;
  phone_number?: string;
  duration?: number;
  cost?: number;
}

export default function ActivityPage() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, calls, sms
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/dashboard/activity/all?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
      
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.phone_number && activity.phone_number.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4 mb-6">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
            <p className="text-gray-600">All your calls and messages in one place</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black cursor-pointer"
            >
              <option value="all">All Activity</option>
              <option value="calls">Calls Only</option>
              <option value="sms">SMS Only</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Activity List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors cursor-default">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activity.type === 'call' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'call' ? (
                        <Phone className="w-6 h-6 text-blue-600" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
                          <p className="text-gray-600">{activity.description}</p>
                          {activity.phone_number && (
                            <p className="text-sm text-gray-500 mt-1">{activity.phone_number}</p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{activity.time}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'answered' || activity.status === 'delivered' || activity.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : activity.status === 'missed' || activity.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.status}
                          </span>
                          
                          {activity.duration && (
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.floor(activity.duration / 60)}:{(activity.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                          
                          {activity.cost && (
                            <p className="text-xs text-gray-500 mt-1">
                              ${activity.cost.toFixed(3)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Your activity history will appear here'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}