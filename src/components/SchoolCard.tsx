'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardSchool, StudentTask } from '@/types';
import { School as SchoolIcon, CheckCircle2, X, Move } from 'lucide-react';

interface SchoolCardProps {
  school: DashboardSchool;
  onTaskUpdate?: (schoolId: string, tasks: StudentTask[]) => void;
  onDelete?: (schoolId: string) => void;
  dragHandleAttributes?: any;
  dragHandleListeners?: any;
  dragHandleRef?: (element: HTMLElement | null) => void;
  isOverlay?: boolean;
}

export default function SchoolCard({
  school,
  onTaskUpdate,
  onDelete,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  isOverlay = false,
}: SchoolCardProps) {
  // 兼容性处理 - 获取正确的字段
  const nameZh = school.nameZh || school.name_zh;
  const tasks = school.tasks || [];

  // 添加本地状态来管理任务完成情况
  const [localTasks, setLocalTasks] = useState<StudentTask[]>(tasks);

  const handleTaskToggle = (taskId: string) => {
    const newTasks = localTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setLocalTasks(newTasks);
    if (onTaskUpdate) {
      onTaskUpdate(school.id, newTasks);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isOverlay ? { y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' } : {}}
      className="relative h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white/30 overflow-hidden flex flex-col"
    >
      {!isOverlay && (
        <div className="absolute right-0 top-0 flex items-center gap-0">
          <div 
            ref={dragHandleRef}
            {...dragHandleAttributes}
            {...dragHandleListeners}
            className="flex h-8 w-8 items-center justify-center text-gray-400 transition-all hover:theme-text cursor-grab active:cursor-grabbing"
            title="按住拖拽排序"
          >
            <Move className="h-4 w-4" />
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(school.id)}
                className="-ml-2 flex h-8 w-8 items-center justify-center text-gray-400 transition-all hover:text-red-500"
              title="刪除學校"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="mb-1 min-h-[48px] pr-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="mt-0.5 h-11 w-11 theme-gradient rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <SchoolIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-extrabold text-gray-800 leading-snug break-words">
              {nameZh}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Tasks */}
      <div className="mt-3 grid flex-1 grid-rows-4 gap-1.5 pr-10">
        {localTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex min-h-0 items-center space-x-2 rounded-xl px-2 py-1 hover:bg-gray-50 transition-all"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTaskToggle(task.id)}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                task.completed
                  ? 'border-transparent theme-gradient'
                  : 'border-gray-200 group-hover:theme-border'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </motion.button>
            <label
              className={`flex-1 truncate text-[12px] font-semibold cursor-pointer leading-5 transition-all ${
                task.completed
                  ? 'text-gray-300 line-through'
                  : 'text-gray-600 group-hover:theme-text'
              }`}
            >
              {task.title}
            </label>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
