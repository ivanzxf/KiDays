'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardSchool, StudentTask } from '@/types';
import { School as SchoolIcon, CheckCircle2, X, Move } from 'lucide-react';

type DragHandleListeners = Record<string, Function>;

interface SchoolCardProps {
  school: DashboardSchool;
  onTaskUpdate?: (schoolId: string, tasks: StudentTask[]) => void;
  onDelete?: (schoolId: string) => void;
  dragHandleAttributes?: React.HTMLAttributes<HTMLDivElement>;
  dragHandleListeners?: DragHandleListeners;
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
  const { id, nameZh, tasks } = school;

  const [localTasks, setLocalTasks] = useState<StudentTask[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleTaskToggle = (taskId: string) => {
    const newTasks = localTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setLocalTasks(newTasks);
    if (onTaskUpdate) {
      onTaskUpdate(id, newTasks);
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
              onClick={() => onDelete(id)}
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
      <div className="mt-3 flex-1 space-y-1.5 pr-10">
        {localTasks.length > 0 ? localTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-start space-x-2 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-all"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTaskToggle(task.id)}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                task.completed
                  ? 'border-transparent theme-gradient'
                  : 'border-gray-200 group-hover:theme-border'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </motion.button>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <label
                className={`min-w-0 flex-1 text-[12px] font-semibold cursor-pointer leading-5 transition-all ${
                  task.completed
                    ? 'text-gray-300 line-through'
                    : 'text-gray-600 group-hover:theme-text'
                }`}
              >
                {task.title}
              </label>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-5 ${
                  task.description === '日期待定'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {task.description ?? '日期待定'}
              </span>
            </div>
          </motion.div>
        )) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-4 text-xs font-semibold text-gray-400">
            這間學校暫時還沒有可勾選的申請項目
          </div>
        )}
      </div>
    </motion.div>
  );
}
