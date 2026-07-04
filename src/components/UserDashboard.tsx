'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, CollisionDetection, rectIntersection, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Plus, Search, X, School as SchoolIcon, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { School } from '@/types';
import { mockSchools } from '@/lib/mockData';
import SchoolCard from '@/components/SchoolCard';

// 兼容性接口
interface CompatibleSchool extends School {
  nameZh?: string;
  nameEn?: string | null;
  schoolNet?: string | null;
  tasks?: any[];
}

export default function UserDashboard() {
  const { 
    currentStudent, 
    addSchoolToStudent, 
    removeSchoolFromStudent, 
    reorderStudentSchools, 
    updateStudentSchoolTasks 
  } = useApp();
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<CompatibleSchool | null>(null);

  // 兼容性处理 - 获取正确的申请类型
  const studentApplicationType = currentStudent?.applicationType || 
                                 currentStudent?.application_type || 
                                 'kindergarten';

  // 兼容性处理 - 获取正确的字段
  const getSchoolNameZh = (school: CompatibleSchool) => school.nameZh || school.name_zh;
  const getSchoolNameEn = (school: CompatibleSchool) => school.nameEn || school.name_en;

  // 过滤搜索的学校
  const filteredSchools = mockSchools.filter(school => {
    const nameZh = getSchoolNameZh(school);
    const nameEn = getSchoolNameEn(school);
    const matchesSearch = (nameZh?.includes(searchQuery) || '') || 
                         (nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || '');
    const matchesType = school.type === studentApplicationType;
    return matchesSearch && matchesType;
  });

  // 过滤当前学生已添加的学校
  const currentStudentSchools = (currentStudent?.addedSchools || []).filter(
    school => school.type === studentApplicationType
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeSchool = activeSchoolId
    ? currentStudentSchools.find(s => s.id === activeSchoolId) || null
    : null;

  const handleDragStart = (event: any) => {
    setActiveSchoolId(event.active?.id ?? null);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentStudentSchools.findIndex(s => s.id === active.id);
    const newIndex = currentStudentSchools.findIndex(s => s.id === over.id);

    if (oldIndex !== newIndex) {
      const nextSchools = arrayMove(currentStudentSchools, oldIndex, newIndex);
      reorderStudentSchools(nextSchools);
    }
  };

  const handleDragEnd = () => {
    setActiveSchoolId(null);
  };

  // 處理刪除確認
  const handleDeleteConfirm = () => {
    if (schoolToDelete) {
      removeSchoolFromStudent(schoolToDelete);
      setSchoolToDelete(null);
    }
  };

  const handleAddSchool = () => {
    if (selectedSchool) {
      addSchoolToStudent(selectedSchool);
      setIsAddSchoolModalOpen(false);
      setSelectedSchool(null);
      setSearchQuery('');
    }
  };

  // 自定義碰撞檢測：只有當鼠標指針進入目標卡片區域時才觸發重排
  const customCollisionDetection: CollisionDetection = (args) => {
    const { pointerCoordinates, droppableContainers } = args;
    
    if (!pointerCoordinates) return rectIntersection(args);

    // 找出鼠標指針當前懸停在在哪個容器上
    const target = droppableContainers.find((container) => {
      const rect = container.rect.current;
      if (!rect) return false;
      return (
        pointerCoordinates.x >= rect.left &&
        pointerCoordinates.x <= rect.right &&
        pointerCoordinates.y >= rect.top &&
        pointerCoordinates.y <= rect.bottom
      );
    });

    if (target) {
      return [{ id: target.id }];
    }

    return rectIntersection(args);
  };

  const dropAnimation = {
    duration: 160,
    easing: 'cubic-bezier(0.18, 0.67, 0.35, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0',
        },
      },
    }),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 个人看板 - 学校卡片 */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <SchoolIcon className="w-8 h-8" />
            <span>我的學校看板</span>
          </h2>
          <p className="text-white/60 text-sm font-medium">
            按住單卡右上角的十字箭頭可調整順序
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveSchoolId(null);
          }}
        >
          <div
            className="grid justify-center gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fit, 240px)' }}
          >
            <SortableContext items={currentStudentSchools.map(s => s.id)} strategy={rectSortingStrategy}>
              {currentStudentSchools.map(school => (
                <SortableSchoolCard
                  key={school.id}
                  id={school.id}
                  school={school}
                  updateStudentSchoolTasks={updateStudentSchoolTasks}
                  setSchoolToDelete={setSchoolToDelete}
                />
              ))}
            </SortableContext>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="h-[240px] w-[240px]"
            >
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsAddSchoolModalOpen(true)}
                  className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-white/50 p-6 shadow-xl transition-all group hover:border-white/80"
                >
                  <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-all">
                    <Plus className="w-8 h-8 theme-text" />
                  </div>
                  <span className="text-xl font-extrabold text-white/90">添加學校</span>
                  <span className="text-white/70 text-xs font-medium mt-1">開始你的申請之旅</span>
                </motion.button>
              </motion.div>
          </div>

          <DragOverlay
            modifiers={[snapCenterToCursor]}
            dropAnimation={dropAnimation}
          >
            {activeSchool ? (
              <div className="h-[240px] w-[240px] opacity-70 pointer-events-none">
                <SchoolCard school={activeSchool} isOverlay={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* 刪除確認 Modal */}
      <AnimatePresence>
        {schoolToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSchoolToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100"
            >
              <div className="flex items-center space-x-4 mb-6 text-red-600">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">確認刪除？</h3>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                確認刪除該學校？<span className="font-bold text-red-600">申請進度會一並刪除</span>，此操作無法撤銷。
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSchoolToDelete(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  確認刪除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 添加学校 Modal */}
      <AnimatePresence>
        {isAddSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddSchoolModalOpen(false);
                setSelectedSchool(null);
                setSearchQuery('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal 内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              {/* Modal 头部 */}
              <div className="flex justify-between items-center p-6 border-b border-gray-50 flex-shrink-0">
                <h3 className="text-xl font-extrabold text-gray-800">添加學校</h3>
                <button
                  onClick={() => {
                    setIsAddSchoolModalOpen(false);
                    setSelectedSchool(null);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal 內容區 - 可滾動 */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* 搜索框 */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="輸入學校名稱..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-gray-700 font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                </div>

                {/* 搜索结果列表 */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
                    搜索結果 ({filteredSchools.length})
                  </div>
                  
                  <div className="space-y-2 min-h-[100px]">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => setSelectedSchool(school)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                            selectedSchool?.id === school.id
                              ? 'border-indigo-500 bg-indigo-50/50'
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={`font-bold text-sm truncate ${
                              selectedSchool?.id === school.id ? 'text-indigo-700' : 'text-gray-800'
                            }`}>
                              {getSchoolNameZh(school)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                              {getSchoolNameEn(school)}
                            </div>
                          </div>
                          {selectedSchool?.id === school.id && (
                            <div className={`w-5 h-5 theme-gradient rounded-full flex items-center justify-center ml-3 flex-shrink-0`}>
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-sm text-gray-400 font-medium">未找到相關學校</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal 底部按鈕 - 固定 */}
              <div className="p-6 border-t border-gray-50 flex-shrink-0">
                <button
                  onClick={handleAddSchool}
                  disabled={!selectedSchool}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                    selectedSchool
                      ? 'theme-gradient text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  確認添加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableSchoolCard({ id, school, updateStudentSchoolTasks, setSchoolToDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative h-[240px] w-[240px]">
      <SchoolCard
        school={school}
        onTaskUpdate={updateStudentSchoolTasks}
        onDelete={(schoolId) => setSchoolToDelete(schoolId)}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        dragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}
