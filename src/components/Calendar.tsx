'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Event } from '@/types';
import { mockEvents } from '@/lib/mockData';

// 兼容性函数：将日期字符串或 Date 对象转换为 Date 对象
const getEventDate = (date: string | Date): Date => {
  return typeof date === 'string' ? new Date(date) : date;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEvent = mockEvents.some(
        (e) => {
          const eventDate = getEventDate(e.date);
          return eventDate.getDate() === day &&
                 eventDate.getMonth() === month &&
                 eventDate.getFullYear() === year;
        }
      );
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push(
        <motion.button
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSelectedDate(date)}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all ${
            isSelected
              ? 'theme-gradient text-white shadow-lg'
              : hasEvent
              ? 'theme-text theme-bg hover:opacity-80'
              : 'text-gray-700 hover:bg-gray-100'
          } relative`}
        >
          {day}
          {hasEvent && !isSelected && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 theme-gradient rounded-full"></div>
          )}
        </motion.button>
      );
    }

    return days;
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return mockEvents.filter(
      (e) => {
        const eventDate = getEventDate(e.date);
        return eventDate.getDate() === selectedDate.getDate() &&
               eventDate.getMonth() === selectedDate.getMonth() &&
               eventDate.getFullYear() === selectedDate.getFullYear();
      }
    );
  };

  const eventsForSelectedDate = getEventsForSelectedDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 h-full border border-white/30"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 theme-gradient rounded-2xl flex items-center justify-center shadow-lg">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800">月曆</h2>
      </div>

      <div className="flex justify-between items-center mb-6 theme-bg p-4 rounded-2xl">
        <h3 className="text-xl font-bold theme-text">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h3>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.1, rotate: -90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))
            }
            className="p-3 bg-white rounded-2xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <ChevronLeft className="w-6 h-6 theme-text" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))
            }
            className="p-3 bg-white rounded-2xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <ChevronRight className="w-6 h-6 theme-text" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-bold ${
              index === 0 || index === 6 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3 mb-8">{renderCalendar()}</div>

      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>
            {selectedDate
              ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 日程`
              : '請選擇日期查看日程'}
          </span>
        </h4>
        {eventsForSelectedDate.length > 0 ? (
          <div className="space-y-3">
            {eventsForSelectedDate.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 8 }}
                className="p-4 theme-bg rounded-2xl border theme-border"
              >
                <div className="font-bold theme-text">{event.title}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">
                  小學申請
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          selectedDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl text-center"
            >
              <div className="text-gray-500 font-medium">當日無公開日程</div>
            </motion.div>
          )
        )}
      </div>
    </motion.div>
  );
}
