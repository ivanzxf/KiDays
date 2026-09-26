'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import UserDashboard from '@/components/UserDashboard';
import AuthPage from '@/components/auth/AuthPage';
import PublicLanding from '@/components/PublicLanding';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { authReady, isLoggedIn } = useApp();

  if (isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <UserDashboard />
      </div>
    );
  }

  // 未登入（含首屏尚在恢復登入狀態）時，一併輸出公開的介紹內容，
  // 讓搜尋引擎與未啟用 JavaScript 的訪客都能讀到實際文字，而非只有載入提示。
  return (
    <div className="relative min-h-screen bg-background-gray">
      <AuthPage />
      <PublicLanding />

      {!authReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-gray">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600">
            正在恢復登入狀態...
          </div>
        </div>
      )}
    </div>
  );
}
