'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { User, LogOut, ChevronDown, Plus, Trash2, GraduationCap, X } from 'lucide-react';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, currentStudent, setCurrentStudent, students, addStudent } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 新增學生表單狀態
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 3,
    birthMonth: 1,
    gender: 'boy' as 'boy' | 'girl',
    applicationType: 'kindergarten' as 'kindergarten' | 'primary'
  });

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
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-5 py-3 rounded-2xl theme-bg hover:opacity-90 theme-border border transition-all shadow-sm"
                >
                  <div className="w-12 h-12 theme-gradient rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {currentStudent?.name.charAt(0) || '用'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-800">學生檔案</div>
                    <div className="text-xs text-gray-500 font-medium">
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
                          <motion.button
                            key={student.id}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setCurrentStudent(student);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all mb-1 ${
                              currentStudent?.id === student.id
                                ? 'theme-gradient text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
                              currentStudent?.id === student.id
                                ? 'bg-white bg-opacity-30'
                                : 'bg-gradient-to-br from-indigo-100 to-purple-100 theme-text'
                            }`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold">{student.name}</div>
                              <div className="text-xs opacity-80">
                                {student.applicationType === 'kindergarten' ? '幼稚園申請' : '小學申請'}
                              </div>
                            </div>
                          </motion.button>
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
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
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
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoggedIn(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                立即體驗
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* 新增學生 Modal */}
      <AnimatePresence>
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStudentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-50 flex-shrink-0">
                <h3 className="text-xl font-extrabold text-gray-800">新增學生檔案</h3>
                <button
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* 暱稱 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">學生暱稱</label>
                  <input
                    type="text"
                    placeholder="例如：小明"
                    value={newStudentData.name}
                    onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>

                {/* 出生年月 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">出生年份</label>
                    <select
                      value={newStudentData.birthYear}
                      onChange={(e) => setNewStudentData({ ...newStudentData, birthYear: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year} 年</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">出生月份</label>
                    <select
                      value={newStudentData.birthMonth}
                      onChange={(e) => setNewStudentData({ ...newStudentData, birthMonth: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month} 月</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">性別</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setNewStudentData({ ...newStudentData, gender: 'boy' })}
                      className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                        newStudentData.gender === 'boy'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      男孩子
                    </button>
                    <button
                      onClick={() => setNewStudentData({ ...newStudentData, gender: 'girl' })}
                      className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                        newStudentData.gender === 'girl'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      女孩子
                    </button>
                  </div>
                </div>

                {/* 申請類型 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">申請類型</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setNewStudentData({ ...newStudentData, applicationType: 'kindergarten' })}
                      className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                        newStudentData.applicationType === 'kindergarten'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      幼稚園申請
                    </button>
                    <button
                      onClick={() => setNewStudentData({ ...newStudentData, applicationType: 'primary' })}
                      className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                        newStudentData.applicationType === 'primary'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      小學申請
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-50 flex-shrink-0">
                <button
                  onClick={() => {
                    if (newStudentData.name.trim()) {
                      addStudent(newStudentData);
                      setIsAddStudentModalOpen(false);
                      setNewStudentData({
                        name: '',
                        birthYear: new Date().getFullYear() - 3,
                        birthMonth: 1,
                        gender: 'boy',
                        applicationType: 'kindergarten'
                      });
                    }
                  }}
                  disabled={!newStudentData.name.trim()}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
                    newStudentData.name.trim()
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  創建檔案
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
