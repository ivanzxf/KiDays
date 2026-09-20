'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import UserDashboard from '@/components/UserDashboard';
import AuthPage from '@/components/auth/AuthPage';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { authReady, isLoggedIn } = useApp();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-gray">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600">
          正在恢復登入狀態...
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <UserDashboard />
      </div>
    );
  }

  return <AuthPage />;
}
