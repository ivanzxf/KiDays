'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import UserDashboard from '@/components/UserDashboard';
import LandingPage from '@/components/landing/LandingPage';
import AuthPage from '@/components/auth/AuthPage';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { isLoggedIn } = useApp();
  const [view, setView] = useState<'landing' | 'auth'>('landing');

  useEffect(() => {
    if (isLoggedIn) {
      setView('landing');
    }
  }, [isLoggedIn]);

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
