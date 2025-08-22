// ./components/dashboard/Sidebar.tsx

"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import { 
  LayoutDashboard, 
  Phone, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard,
  PhoneCall,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Voice Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'SMS Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Phone Numbers', href: '/dashboard/numbers', icon: PhoneCall },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// Admin navigation
const adminNavigation = [
  { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
  { name: 'System Settings', href: '/dashboard/admin/settings', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push('/auth/sign-in');
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center px-6 py-5.5 border-b border-gray-200">
        <Image
          src="/velvet-signal.png"
          alt="Velvet Signal"
          width={40}
          height={40}
          className="mr-3"
        />
        <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Alata, sans-serif' }}>
          Velvet Signal
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2"> 
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Section - only show for admins */}
        {user?.role === 'admin' && (
          <>
            <div className="pt-6 pb-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Administration
              </h3>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-900 text-white'
                      : 'text-gray-700 hover:bg-red-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info and sign out */}
      <div className="px-4 py-4 border-t border-gray-200">
        {/* User info */}
        {user && (
          <div className="mb-4 px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
              {user.role === 'admin' && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */} 
          <div className="relative flex flex-col w-64 bg-white">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0" />
    </>
  );
}