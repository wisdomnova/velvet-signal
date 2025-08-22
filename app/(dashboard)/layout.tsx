// ./app/(dashboard)/layout.tsx

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth, token } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isMounted) return;
      
      setIsChecking(true);
      
      // If no token, redirect immediately
      if (!token) {
        router.push('/auth/sign-in');
        return;
      }

      // If not authenticated but have token, check auth
      if (!isAuthenticated) {
        await checkAuth();
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [isMounted, isAuthenticated, token, checkAuth, router]);

  // Show loading until mounted and auth check complete
  if (!isMounted || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f3f9' }}>
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If still not authenticated after checking, show loading (redirect should happen)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f3f9' }}>
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f2f3f9' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6" style={{ backgroundColor: '#f2f3f9' }}>
          {children}
        </main>
      </div>
    </div>
  );
}