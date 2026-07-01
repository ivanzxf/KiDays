'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, School as SchoolIcon, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { School } from '@/types';
import { mockSchools } from '@/lib/mockData';
import SchoolCard from '@/components/SchoolCard';
import Calendar from '@/components/Calendar';

export default function UserDashboard() {
  const { currentStudent, addSchoolToStudent, updateStudentSchoolTasks } = useApp();
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // 根据学生申请类型确定显示哪种学校
  const studentApplicationType = currentStudent?.applicationType || 'kindergarten';

  // 过滤搜索的学校
  const filteredSchools = mockSchools.filter(school => {
    const matchesSearch = school.nameZh.includes(searchQuery) || 
                         school.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = school.type === studentApplicationType;
    return matchesSearch && matchesType;
  });

  // 过滤当前学生已添加的学校
  const currentStudentSchools = currentStudent?.addedSchools.filter(
    school => school.type === studentApplicationType
  ) || [];

  // 获取申请类型显示名称
  const getApplicationTypeLabel = () => {
    return studentApplicationType === 'kindergarten' ? '幼稚園' : '小學';
  };

  const handleAddSchool = () => {
    if (selectedSchool) {
      addSchoolToStudent(selectedSchool);
      setIsAddSchoolModalOpen(false);
      setSelectedSchool(null);
      setSearchQuery('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 顶部双卡片布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* 左侧：学生已添加学校的重要节点时间线 */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 h-full border border-white/30"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800">
                  {currentStudent?.name} 的升學節點
                </h2>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  {getApplicationTypeLabel()}申請
                </p>
              </div>
            </div>
            
            {currentStudentSchools.length > 0 ? (
              <div className="space-y-4">
                {currentStudentSchools.map((school, index) => (
                  <motion.div
                    key={school.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ x: 8, scale: 1.02 }}
                    className="group p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                          <SchoolIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{school.nameZh}</h3>
                          <p className="text-sm text-gray-500 font-medium">{school.nameEn}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-indigo-600">
                          {school.tasks.filter(t => t.completed).length}/{school.tasks.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">已完成</div>
                      </div>
                    </div>
                    
                    {/* Mini Progress Bar */}
                    <div className="mt-4">
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${(school.tasks.filter(t => t.completed).length / school.tasks.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SchoolIcon className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">
                  還未添加任何學校
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  快點擊下方的「+」按鈕添加吧！
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 右侧：月曆 */}
        <div className="lg:col-span-1">
          <Calendar />
        </div>
      </div>

      {/* 个人看板 - 学校卡片 */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <SchoolIcon className="w-8 h-8" />
            <span>我的學校看板</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 已添加的学校卡片 */}
          {currentStudentSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <SchoolCard
                school={school}
                onTaskUpdate={updateStudentSchoolTasks}
              />
            </motion.div>
          ))}

          {/* 添加学校按钮卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAddSchoolModalOpen(true)}
              className="w-full bg-white/50 backdrop-blur-md rounded-3xl shadow-xl p-8 border-2 border-dashed border-white/50 hover:border-white/80 transition-all flex flex-col items-center justify-center min-h-[280px] group"
            >
              <div className="w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-all">
                <Plus className="w-12 h-12 text-indigo-500" />
              </div>
              <span className="text-2xl font-extrabold text-white/90">添加學校</span>
              <span className="text-white/70 text-sm font-medium mt-2">
                開始你的申請之旅
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* 添加学校 Modal */}
      <AnimatePresence>
        {isAddSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddSchoolModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal 内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/30"
            >
              {/* Modal 头部 */}
              <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <SchoolIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-800">添加學校</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsAddSchoolModalOpen(false);
                    setSelectedSchool(null);
                    setSearchQuery('');
                  }}
                  className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </motion.button>
              </div>

              {/* Modal 内容 */}
              <div className="p-8">
                {/* 搜索框 */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索學校名稱..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 text-lg transition-all"
                  />
                </div>

                {/* 申请类型提示 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                  <p className="text-gray-600 font-medium">
                    正在為 <span className="font-extrabold text-indigo-700">{currentStudent?.name}</span> 添加 <span className="font-extrabold text-indigo-700">{getApplicationTypeLabel()}</span> 學校
                  </p>
                </div>

                {/* 搜索结果 */}
                <div className="space-y-3 max-h-72 overflow-y-auto mb-8 p-2">
                  {filteredSchools.map((school, index) => (
                    <motion.button
                      key={school.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 8, scale: 1.02 }}
                      onClick={() => setSelectedSchool(school)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                        selectedSchool?.id === school.id
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          selectedSchool?.id === school.id
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            : 'bg-gray-100'
                        }`}>
                          <SchoolIcon className={`w-6 h-6 ${
                            selectedSchool?.id === school.id
                              ? 'text-white'
                              : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <div className={`font-bold text-lg ${
                            selectedSchool?.id === school.id
                              ? 'text-indigo-700'
                              : 'text-gray-800'
                          }`}>
                            {school.nameZh}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{school.nameEn}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 已选学校预览 */}
                {selectedSchool && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl mb-8 border border-indigo-100"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                        <SchoolIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-lg">已選擇</div>
                        <div className="font-extrabold text-indigo-700 text-xl">{selectedSchool.nameZh}</div>
                        <div className="text-sm text-gray-500 font-medium">{selectedSchool.nameEn}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 添加按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddSchool}
                  disabled={!selectedSchool}
                  className={`w-full py-5 rounded-2xl font-extrabold text-lg transition-all shadow-lg ${
                    selectedSchool
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:from-indigo-600 hover:to-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  添加學校到看板
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
