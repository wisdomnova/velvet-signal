// ./app/(dashboard)/dashboard/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';  
import { 
  Phone, 
  MessageSquare, 
  DollarSign,
  PhoneCall,
  TrendingUp,
  Clock,
  MessageCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardStats {
  callsThisMonth: number;
  smsThisMonth: number;
  totalCost: number;
  activeNumbers: number;
  callsChange: string;
  smsChange: string;
  costChange: string;
  numbersChange: string;
}

interface RecentActivity {
  id: string;
  type: 'call' | 'sms';
  title: string;
  time: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllActivity = () => {
    router.push('/dashboard/activity');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statsData = stats ? [
    {
      title: 'Voice Calls',
      value: stats.callsThisMonth.toString(),
      subtitle: 'calls this month',
      icon: Phone,
      bgGradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      isPositive: stats.callsChange.startsWith('+')
    },
    {
      title: 'SMS Messages',
      value: stats.smsThisMonth.toLocaleString(),
      subtitle: 'messages sent',
      icon: MessageSquare,
      bgGradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      isPositive: stats.smsChange.startsWith('+')
    },
    {
      title: 'Total Cost',
      value: `$${stats.totalCost.toFixed(2)}`,
      subtitle: 'this month',
      icon: DollarSign,
      bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      isPositive: !stats.costChange.startsWith('-') // Lower cost is better
    },
    {
      title: 'Active Numbers',
      value: stats.activeNumbers.toString(),
      subtitle: 'phone numbers',
      icon: PhoneCall,
      bgGradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      isPositive: stats.numbersChange.startsWith('+')
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Welcome Section with Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your communication today.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Make Call
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 border border-gray-200 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send SMS
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 border border-gray-200 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Number
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <motion.div 
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + (index * 0.1) }}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 ${stat.bgGradient} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {stat.isPositive ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </h4>
                  <div className="text-3xl font-bold text-gray-900 leading-none">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-500">
                    {stat.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
              <button 
                onClick={handleViewAllActivity}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-xl"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      activity.type === 'call' ? 'bg-blue-100' : 'bg-emerald-100'
                    }`}>
                      {activity.type === 'call' ? (
                        <Phone className="w-6 h-6 text-blue-600" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{activity.title}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{activity.time}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'answered' || activity.status === 'delivered' || activity.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : activity.status === 'missed' || activity.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
                <p className="text-gray-500">Your call and message activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}