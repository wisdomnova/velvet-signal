// ./app/(dashboard)/dashboard/admin/settings/page.tsx

"use client";

import { useAuthStore } from '@/store/auth';
import { Shield, Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-600">System settings panel coming soon...</p>
        </div>
      </div>
    </div>
  );
}