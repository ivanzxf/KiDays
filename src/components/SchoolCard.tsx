'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { School, Task } from '@/types';
import { School as SchoolIcon, CheckCircle2 } from 'lucide-react';

interface SchoolCardProps {
  school: School;
  onDetailsClick?: (school: School) => void;
  onTaskUpdate?: (schoolId: string, tasks: Task[]) => void;
}

export default function SchoolCard({ school, onDetailsClick, onTaskUpdate }: SchoolCardProps) {
  // 添加本地状态来管理任务完成情况
  const [tasks, setTasks] = useState(school.tasks);

  const handleTaskToggle = (taskId: string) => {
    const newTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    if (onTaskUpdate) {
      onTaskUpdate(school.id, newTasks);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-7 border border-white/30 overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <SchoolIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-800">{school.nameZh}</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">{school.nameEn}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-600">完成進度</span>
          <span className="text-sm font-bold text-indigo-600">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
          />
        </div>
      </div>
      
      {/* Tasks */}
      <div className="space-y-3 mb-6">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 transition-all"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => !task.disabled && handleTaskToggle(task.id)}
              disabled={task.disabled}
              className={`flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                task.disabled
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                  : task.completed
                  ? 'border-transparent bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </motion.button>
            <label
              className={`flex-1 text-sm font-medium cursor-pointer transition-all ${
                task.completed
                  ? 'text-gray-400 line-through'
                  : 'text-gray-700 group-hover:text-indigo-700'
              } ${task.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {task.title}
            </label>
          </motion.div>
        ))}
      </div>
      
      {onDetailsClick && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDetailsClick(school)}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          查看詳情
        </motion.button>
      )}
    </motion.div>
  );
}
