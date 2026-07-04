'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockEvents } from '@/lib/mockData';
import { Calendar as CalendarIcon, Star } from 'lucide-react';

// 兼容性函数：将日期字符串或 Date 对象转换为 Date 对象
const getEventDate = (date: string | Date): Date => {
  return typeof date === 'string' ? new Date(date) : date;
};

export default function EventsTimeline() {
  const [activeTab, setActiveTab] = useState<'kindergarten' | 'primary'>('kindergarten');

  const filteredEvents = mockEvents.filter((e) => e.type === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 h-full border border-white/30"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800">重要升學節點</h2>
      </div>

      <div className="flex bg-gradient-to-r from-indigo-50 to-purple-50 p-1.5 rounded-2xl mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('kindergarten')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'kindergarten'
              ? 'bg-white text-indigo-600 shadow-lg'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
        >
          幼稚園
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('primary')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'primary'
              ? 'bg-white text-indigo-600 shadow-lg'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
        >
          小學
        </motion.button>
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event, index) => {
          const eventDate = getEventDate(event.date);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 8, scale: 1.02 }}
              className="group p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <div className="text-white font-bold text-center">
                      <div className="text-lg">{eventDate.getMonth() + 1}</div>
                      <div className="text-xs opacity-80">月</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {eventDate.getMonth() + 1}月{eventDate.getDate()}日 · 
                    {event.type === 'kindergarten' ? '幼稚園' : '小學'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
