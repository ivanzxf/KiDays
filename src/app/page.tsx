'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import UserDashboard from '@/components/UserDashboard';
import LandingPage from '@/components/landing/LandingPage';
import AuthPage from '@/components/auth/AuthPage';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { authReady, isLoggedIn } = useApp();
  const [view, setView] = useState<'landing' | 'auth'>('landing');

  useEffect(() => {
    if (isLoggedIn) {
      setView('landing');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncViewWithAuthHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setView('auth');
      }
    };

    syncViewWithAuthHash();
    window.addEventListener('hashchange', syncViewWithAuthHash);

    return () => window.removeEventListener('hashchange', syncViewWithAuthHash);
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-gray">
        <div className="rounded-3xl bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
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

  if (view === 'auth') {
    return (
      <div className="min-h-screen">
        <AuthPage onBack={() => setView('landing')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onOpenAuth={() => setView('auth')} />
      <LandingPage onOpenAuth={() => setView('auth')} />
    </div>
  );
}
