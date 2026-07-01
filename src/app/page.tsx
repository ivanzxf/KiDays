'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Search, Star, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EventsTimeline from '@/components/EventsTimeline';
import Calendar from '@/components/Calendar';
import UserDashboard from '@/components/UserDashboard';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { isLoggedIn, setIsLoggedIn } = useApp();

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
      
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-8"
        >
          <Zap className="w-10 h-10 text-white" />
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
          輕鬆管理你的
          <span className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
            升學申請
          </span>
        </h1>
        
        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          KiDays 幫你一站式管理幼稚園和小學的申請流程，
          不再錯過任何重要時間節點！
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsLoggedIn(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          立即開始使用 🎉
        </motion.button>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: <CalendarIcon className="w-8 h-8" />,
              title: "重要節點提醒",
              description: "自動跟蹤所有申請截止日期和面試時間",
            },
            {
              icon: <Search className="w-8 h-8" />,
              title: "學校信息庫",
              description: "全面的香港幼稚園和小學數據庫",
            },
            {
              icon: <Star className="w-8 h-8" />,
              title: "多學生管理",
              description: "輕鬆管理多個孩子的申請流程",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/30"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-extrabold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

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
