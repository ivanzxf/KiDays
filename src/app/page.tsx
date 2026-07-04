'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EventsTimeline from '@/components/EventsTimeline';
import Calendar from '@/components/Calendar';
import UserDashboard from '@/components/UserDashboard';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { isLoggedIn } = useApp();

  // 如果已登录，显示用户看板
  if (isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <UserDashboard />
      </div>
    );
  }

  // 未登录，显示游客首页
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* 顶部双卡片布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventsTimeline />
          </div>
          <div className="lg:col-span-1">
            <Calendar />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
