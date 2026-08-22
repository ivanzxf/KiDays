'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  CollisionDetection,
  rectIntersection,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus, School as SchoolIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardSchool, formatSchoolForFrontend } from '@/types';
import { useSchoolsWithLatestCycle, useSchools } from '@/hooks/useSupabase';
import SchoolCard from '@/components/SchoolCard';
import AddSchoolModal from '@/components/AddSchoolModal';
import DeleteSchoolDialog from '@/components/DeleteSchoolDialog';
import SortableSchoolCard from '@/components/SortableSchoolCard';
import UpcomingEvents from '@/components/UpcomingEvents';

const customCollisionDetection: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableContainers } = args;

  if (!pointerCoordinates) {
    return rectIntersection(args);
  }

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

  return target ? [{ id: target.id }] : rectIntersection(args);
};

export default function UserDashboard() {
  const { 
    currentStudent, 
    addSchoolToStudent, 
    removeSchoolFromStudent, 
    reorderStudentSchools, 
    updateStudentSchoolTasks,
    addCustomEvent,
    removeCustomEvent,
    restoreEventDate,
    updateSchoolResult,
  } = useApp();
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [activeCardSize, setActiveCardSize] = useState<{ width: number; height: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<DashboardSchool | null>(null);

  const studentApplicationType = currentStudent?.applicationType ?? 'primary';
  const { schools: availableSchools } = useSchools(studentApplicationType);
  const { cyclesMap, loading: cyclesLoading } = useSchoolsWithLatestCycle(
    studentApplicationType,
    '2027-2028'
  );

  const getSchoolNameZh = (school: DashboardSchool) => school.nameZh || school.name_zh;
  const getSchoolNameEn = (school: DashboardSchool) => school.nameEn || school.name_en;

  const currentStudentSchools = (currentStudent?.addedSchools ?? []).filter(
    school => school.type === studentApplicationType
  );

  const currentStudentSchoolIds = new Set(currentStudentSchools.map((school) => school.id));

  const studentGender = currentStudent?.gender ?? null;

  const filteredSchools = availableSchools
    .map((school) => formatSchoolForFrontend(school))
    .filter((school) => !currentStudentSchoolIds.has(school.id))
    .filter((school) => {
      const nameZh = getSchoolNameZh(school) ?? '';
      const nameEn = getSchoolNameEn(school) ?? '';
      const query = searchQuery.trim();
      const matchesSearch = query.length === 0
        ? true
        : nameZh.includes(query) || nameEn.toLowerCase().includes(query.toLowerCase());
      const matchesType =
        (school.application_level ?? school.type) === studentApplicationType ||
        school.type === studentApplicationType;
      const schoolGenderPolicy = school.gender_policy ?? school.gender ?? null;
      let matchesGender = true;
      if (studentGender === 'girl') {
        matchesGender = schoolGenderPolicy === 'girls' || schoolGenderPolicy === 'coed';
      } else if (studentGender === 'boy') {
        matchesGender = schoolGenderPolicy === 'boys' || schoolGenderPolicy === 'coed';
      }
      return matchesSearch && matchesType && matchesGender;
    });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeSchool = activeSchoolId
    ? currentStudentSchools.find(s => s.id === activeSchoolId) || null
    : null;

  const measureInnerCardSize = useCallback(
    (activeId: string | number): { width: number; height: number } => {
      const fallback = { width: 320, height: 220 };
      try {
        if (typeof activeId !== 'string' || typeof document === 'undefined') return fallback;
        const node = document.querySelector(
          `[aria-label="school-card-${activeId}"] [data-school-card-inner="true"]`
        ) as HTMLElement | null;
        const rect = node?.getBoundingClientRect();
        if (!rect) return fallback;
        return { width: rect.width, height: rect.height };
      } catch {
        return fallback;
      }
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveId = typeof event.active.id === 'string' ? event.active.id : null;
    setActiveSchoolId(nextActiveId);
    if (!nextActiveId) {
      setActiveCardSize(null);
      return;
    }
    setActiveCardSize(measureInnerCardSize(nextActiveId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentStudentSchools.findIndex((school) => school.id === active.id);
      const newIndex = currentStudentSchools.findIndex((school) => school.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        void reorderStudentSchools(arrayMove(currentStudentSchools, oldIndex, newIndex));
      }
    }

    setActiveSchoolId(null);
    setActiveCardSize(null);
  };

  const handleDeleteConfirm = () => {
    if (schoolToDelete) {
      void removeSchoolFromStudent(schoolToDelete);
      setSchoolToDelete(null);
    }
  };

  const closeAddSchoolModal = () => {
    setIsAddSchoolModalOpen(false);
    setSelectedSchool(null);
    setSearchQuery('');
  };

  const handleAddSchool = () => {
    if (selectedSchool && currentStudent) {
      void addSchoolToStudent(selectedSchool);
      closeAddSchoolModal();
    }
  };

  if (!currentStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-[2rem] border border-white/20 bg-white/10 px-8 py-12 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
            <SchoolIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-white">還沒有學生檔案</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-white/70">
            請先從右上角新增學生，建立檔案後就可以開始添加學校與追蹤申請進度。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveSchoolId(null);
            setActiveCardSize(null);
          }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {/* 近期重點事件：固定第一個格子，在拖拽區之外，無法被移動或刪除 */}
            <div className="relative h-full w-full">
              <div className="mx-auto h-full w-full max-w-sm">
                <UpcomingEvents gender={currentStudent?.gender ?? null} />
              </div>
            </div>

            <SortableContext items={currentStudentSchools.map(s => s.id)} strategy={rectSortingStrategy}>
              {currentStudentSchools.map(school => (
                <SortableSchoolCard
                  key={school.id}
                  id={school.id}
                  school={school}
                  updateStudentSchoolTasks={updateStudentSchoolTasks}
                  addCustomEvent={addCustomEvent}
                  removeCustomEvent={removeCustomEvent}
                  restoreEventDate={restoreEventDate}
                  updateSchoolResult={updateSchoolResult}
                  setSchoolToDelete={setSchoolToDelete}
                />
              ))}
            </SortableContext>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <div className="mx-auto w-full max-w-sm">
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsAddSchoolModalOpen(true)}
                  className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-white/50 p-6 shadow-xl transition-all group hover:border-white/80"
                >
                  <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-all">
                    <Plus className="w-8 h-8 theme-text" />
                  </div>
                  <span className="text-xl font-extrabold text-white/90">添加學校</span>
                  <span className="text-white/70 text-xs font-medium mt-1">加入追蹤清單</span>
                </motion.button>
              </div>
            </motion.div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeSchool && activeCardSize ? (
              <motion.div
                initial={{ opacity: 0.85, scale: 1 }}
                animate={{ opacity: 0.85, scale: 1 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="pointer-events-none"
                style={{
                  width: activeCardSize.width,
                  height: activeCardSize.height,
                  transformOrigin: 'center',
                }}
              >
                <SchoolCard school={activeSchool} isOverlay={true} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <DeleteSchoolDialog
        schoolId={schoolToDelete}
        onCancel={() => setSchoolToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      <AddSchoolModal
        isOpen={isAddSchoolModalOpen}
        searchQuery={searchQuery}
        selectedSchool={selectedSchool}
        filteredSchools={filteredSchools}
        cyclesMap={cyclesMap}
        cyclesLoading={cyclesLoading}
        onSearchChange={setSearchQuery}
        onSelectSchool={setSelectedSchool}
        onClose={closeAddSchoolModal}
        onConfirm={handleAddSchool}
        getSchoolNameZh={getSchoolNameZh}
        getSchoolNameEn={getSchoolNameEn}
      />
    </div>
  );
}
