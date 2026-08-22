'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { LogOut, ChevronDown, Plus, Trash2, GraduationCap, Pencil, AlertTriangle } from 'lucide-react';
import StudentProfileModal from '@/components/StudentProfileModal';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, currentStudent, setCurrentStudent, students, removeStudent } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<typeof currentStudent>(null);
  const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-xl sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              KiDays 童步
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-5 py-3 rounded-2xl theme-bg hover:opacity-90 theme-border border transition-all shadow-sm"
                >
                  <div className="text-left">
                    <div className="text-xs font-medium text-gray-500">學生檔案</div>
                    <div className="text-lg font-extrabold text-gray-800 leading-tight">
                      {currentStudent?.name || '請選擇學生'}
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 theme-text transition-transform" />
                </motion.button>

                {/* 下拉菜单 */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider px-4 py-3 bg-indigo-50/50 rounded-2xl mb-2">
                          切換學生
                        </div>
                        {students.map((student) => (
                          <motion.div
                            key={student.id}
                            whileHover={{ x: 4 }}
                            className={`flex items-center rounded-2xl transition-all mb-1 ${
                              currentStudent?.id === student.id
                                ? 'theme-gradient text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setCurrentStudent(student);
                                setIsDropdownOpen(false);
                              }}
                              className="flex flex-1 items-center px-4 py-4 text-left"
                            >
                              <div>
                                <div className="font-bold">{student.name}</div>
                                <div className="text-xs opacity-80">
                                  小學申請
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setIsDropdownOpen(false);
                              }}
                              aria-label={`編輯 ${student.name} 的檔案`}
                              className={`mr-2 rounded-xl p-2 transition-colors ${
                                currentStudent?.id === student.id
                                  ? 'bg-white/20 hover:bg-white/30'
                                  : 'text-slate-400 hover:bg-gray-100 hover:text-indigo-600'
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-100 p-3 space-y-2">
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsAddStudentModalOpen(true);
                          }}
                          className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-semibold">新增學生</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            if (!currentStudent) return;
                            setIsDropdownOpen(false);
                            setIsDeleteStudentDialogOpen(true);
                          }}
                          disabled={!currentStudent}
                          className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all ${
                            currentStudent
                              ? 'text-red-600 hover:bg-red-50'
                              : 'cursor-not-allowed text-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            currentStudent ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            <Trash2 className={`w-5 h-5 ${currentStudent ? 'text-red-600' : 'text-gray-300'}`} />
                          </div>
                          <span className="font-semibold">刪除學生</span>
                        </motion.button>
                      </div>
                      
                      <div className="border-t border-gray-100 p-3">
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setIsLoggedIn(false);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-gray-600" />
                          </div>
                          <span className="font-semibold">登出</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>
      </div>

      {isMounted
        ? createPortal(
            <>
              <AnimatePresence>
                {isAddStudentModalOpen && (
                  <StudentProfileModal
                    mode="create"
                    onClose={() => setIsAddStudentModalOpen(false)}
                  />
                )}
                {editingStudent && (
                  <StudentProfileModal
                    mode="edit"
                    student={editingStudent}
                    onClose={() => setEditingStudent(null)}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isDeleteStudentDialogOpen && currentStudent && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsDeleteStudentDialogOpen(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: 20 }}
                      className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl"
                    >
                      <div className="mb-6 flex items-center gap-4 text-red-600">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                          <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">確認刪除學生？</h3>
                      </div>

                      <p className="mb-8 text-sm leading-7 text-gray-600">
                        你將刪除「{currentStudent.name}」的學生檔案，已添加學校與申請進度也會一併刪除，此操作無法撤銷。
                      </p>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsDeleteStudentDialogOpen(false)}
                          className="flex-1 rounded-2xl bg-gray-100 py-4 font-bold text-gray-600 transition-all hover:bg-gray-200"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            void removeStudent(currentStudent.id);
                            setIsDeleteStudentDialogOpen(false);
                          }}
                          className="flex-1 rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700"
                        >
                          確認刪除
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>,
            document.body
          )
        : null}
    </nav>
  );
}
