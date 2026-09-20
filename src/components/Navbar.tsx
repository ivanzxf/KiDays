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
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-primary">
              KiDays 童步
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-5 py-2.5 rounded-[10px] theme-bg theme-border border transition-colors hover:border-primary"
                >
                  <div className="text-left">
                    <div className="text-xs font-medium text-slate-500">學生檔案</div>
                    <div className="text-lg font-extrabold text-slate-800 leading-tight">
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
                      className="absolute right-0 mt-3 w-72 overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-lg"
                    >
                      <div className="p-3">
                        <div className="mb-2 rounded-[10px] bg-primary-soft px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary">
                          切換學生
                        </div>
                        <p className="mb-2 px-1 text-[11px] leading-relaxed text-slate-400">
                          點右側鉛筆圖標可編輯檔案，並可產生家長共享驗證碼
                        </p>
                        {students.map((student) => (
                          <motion.div
                            key={student.id}
                            whileHover={{ x: 4 }}
                            className={`mb-1 flex items-center rounded-[10px] transition-colors ${
                              currentStudent?.id === student.id
                                ? 'theme-solid text-white'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setCurrentStudent(student);
                                setIsDropdownOpen(false);
                              }}
                              className="flex flex-1 items-center px-4 py-3 text-left"
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
                              title="編輯檔案、產生家長共享驗證碼"
                              className={`mr-2 rounded-lg p-2 transition-colors ${
                                currentStudent?.id === student.id
                                  ? 'bg-white/20 hover:bg-white/30'
                                  : 'text-slate-400 hover:bg-slate-100 hover:text-primary'
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="space-y-2 border-t border-slate-200 p-3">
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsAddStudentModalOpen(true);
                          }}
                          className="flex w-full items-center space-x-4 rounded-[10px] px-4 py-3 text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
                            <Plus className="h-5 w-5 text-primary" />
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
                          className={`flex w-full items-center space-x-4 rounded-[10px] px-4 py-3 transition-colors ${
                            currentStudent
                              ? 'text-red-600 hover:bg-red-50'
                              : 'cursor-not-allowed text-slate-300'
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            currentStudent ? 'bg-red-100' : 'bg-slate-100'
                          }`}>
                            <Trash2 className={`w-5 h-5 ${currentStudent ? 'text-red-600' : 'text-slate-300'}`} />
                          </div>
                          <span className="font-semibold">刪除學生</span>
                        </motion.button>
                      </div>
                      
                      <div className="border-t border-slate-200 p-3">
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setIsLoggedIn(false);
                            setIsDropdownOpen(false);
                          }}
                          className="flex w-full items-center space-x-4 rounded-[10px] px-4 py-3 text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                            <LogOut className="h-5 w-5 text-slate-600" />
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
                      className="absolute inset-0 bg-slate-900/50"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: 20 }}
                      className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg"
                    >
                      <div className="mb-6 flex items-center gap-4 text-red-600">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                          <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">確認刪除學生？</h3>
                      </div>

                      <p className="mb-8 text-sm leading-7 text-slate-600">
                        你將刪除「{currentStudent.name}」的學生檔案，已添加學校與申請進度也會一併刪除，此操作無法撤銷。
                      </p>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsDeleteStudentDialogOpen(false)}
                          className="flex-1 rounded-[10px] bg-slate-100 py-3.5 font-bold text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            void removeStudent(currentStudent.id);
                            setIsDeleteStudentDialogOpen(false);
                          }}
                          className="flex-1 rounded-[10px] bg-red-600 py-3.5 font-bold text-white transition-colors hover:bg-red-700"
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
