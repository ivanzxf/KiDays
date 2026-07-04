'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, CollisionDetection, rectIntersection, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Plus, School as SchoolIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardSchool } from '@/types';
import { mockSchools } from '@/lib/mockData';
import SchoolCard from '@/components/SchoolCard';
import AddSchoolModal from '@/components/AddSchoolModal';
import DeleteSchoolDialog from '@/components/DeleteSchoolDialog';
import SortableSchoolCard from '@/components/SortableSchoolCard';

const BOARD_CARD_SIZE = 240;
const BOARD_GRID_TEMPLATE = `repeat(auto-fit, ${BOARD_CARD_SIZE}px)`;

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
    updateStudentSchoolTasks 
  } = useApp();
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<DashboardSchool | null>(null);

  const studentApplicationType = currentStudent?.applicationType || 
                                 currentStudent?.application_type || 
                                 'kindergarten';

  const getSchoolNameZh = (school: DashboardSchool) => school.nameZh || school.name_zh;
  const getSchoolNameEn = (school: DashboardSchool) => school.nameEn || school.name_en;

  const filteredSchools = mockSchools.filter(school => {
    const nameZh = getSchoolNameZh(school);
    const nameEn = getSchoolNameEn(school);
    const matchesSearch = (nameZh?.includes(searchQuery) || '') || 
                         (nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || '');
    const matchesType = school.type === studentApplicationType;
    return matchesSearch && matchesType;
  });

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

  const handleDeleteConfirm = () => {
    if (schoolToDelete) {
      removeSchoolFromStudent(schoolToDelete);
      setSchoolToDelete(null);
    }
  };

  const closeAddSchoolModal = () => {
    setIsAddSchoolModalOpen(false);
    setSelectedSchool(null);
    setSearchQuery('');
  };

  const handleAddSchool = () => {
    if (selectedSchool) {
      addSchoolToStudent(selectedSchool);
      closeAddSchoolModal();
    }
  };

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
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveSchoolId(null);
          }}
        >
          <div
            className="grid justify-center gap-6"
            style={{ gridTemplateColumns: BOARD_GRID_TEMPLATE }}
          >
            <SortableContext items={currentStudentSchools.map(s => s.id)} strategy={rectSortingStrategy}>
              {currentStudentSchools.map(school => (
                <SortableSchoolCard
                  key={school.id}
                  id={school.id}
                  school={school}
                  cardSize={BOARD_CARD_SIZE}
                  updateStudentSchoolTasks={updateStudentSchoolTasks}
                  setSchoolToDelete={setSchoolToDelete}
                />
              ))}
            </SortableContext>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              style={{ height: BOARD_CARD_SIZE, width: BOARD_CARD_SIZE }}
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
              <div
                className="opacity-70 pointer-events-none"
                style={{ height: BOARD_CARD_SIZE, width: BOARD_CARD_SIZE }}
              >
                <SchoolCard school={activeSchool} isOverlay={true} />
              </div>
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
