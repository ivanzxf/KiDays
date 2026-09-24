'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, School as SchoolIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardSchool, formatSchoolForFrontend } from '@/types';
import { useSchoolsWithLatestCycle, useSchools } from '@/hooks/useSupabase';
import SchoolCard from '@/components/SchoolCard';
import AddSchoolModal from '@/components/AddSchoolModal';
import DeleteSchoolDialog from '@/components/DeleteSchoolDialog';
import UpcomingEvents from '@/components/UpcomingEvents';

/**
 * 找出某校「下一個未完成的未來活動」時間（毫秒）。
 * 只計入已確認日期、未完成、仍適用的事件；家長自訂日期優先於學校公佈日期。
 * 找不到時回傳 null（該校在看板排序中排到最後）。
 */
const getNextEventTime = (school: DashboardSchool): number | null => {
  const taskLists =
    school.entryPoints && school.entryPoints.length > 0
      ? school.entryPoints.map((entry) => entry.tasks ?? [])
      : [school.tasks ?? []];

  let earliest: number | null = null;
  for (const tasks of taskLists) {
    for (const task of tasks) {
      if (task.completed || task.is_available === false) continue;
      if (task.date_status === 'na' || task.date_status === 'tbd') continue;

      const startAt = task.private_override?.start_at ?? task.start_at ?? null;
      if (!startAt) continue;

      const time = new Date(startAt).getTime();
      if (Number.isNaN(time)) continue;
      if (earliest === null || time < earliest) earliest = time;
    }
  }

  return earliest;
};

export default function UserDashboard() {
  const { 
    currentStudent, 
    addSchoolToStudent, 
    removeSchoolFromStudent, 
    toggleSchoolFavorite, 
    updateStudentSchoolTasks,
    addCustomEvent,
    removeCustomEvent,
    restoreEventDate,
    updateSchoolResult,
  } = useApp();
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
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

  // 搜尋正規化：忽略大小寫、空白與標點，讓 "St. Stephen's" 與 "St Stephens" 等效。
  const normalizeForSearch = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '');

  // 相關度排序：別名完全命中 > 別名前綴命中 > 其他（名稱子字串）命中。
  const getSearchRelevance = (school: DashboardSchool) => {
    const normalizedQuery = normalizeForSearch(searchQuery.trim());
    if (normalizedQuery.length === 0) return 0;
    const aliases = (school.aliases ?? []).map(normalizeForSearch);
    if (aliases.includes(normalizedQuery)) return 3;
    if (aliases.some((alias) => alias.startsWith(normalizedQuery))) return 2;
    return 1;
  };

  const currentStudentSchools = (currentStudent?.addedSchools ?? []).filter(
    school => school.type === studentApplicationType
  );

  // 看板自動排序：
  //   1. 心儀學校置頂，心儀之間依「下一個未完成的未來活動」由近到遠。
  //   2. 剛取消心儀的學校排在非心儀區最上方（越近期取消越前），
  //      避免取消心儀時卡片跳回原本依事件排序的位置。
  //   3. 其餘依「下一個未完成的未來活動」由近到遠；沒有未來活動的排最後。
  // 同分時維持加入順序。
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sortedStudentSchools = [...currentStudentSchools]
    .map((school, index) => {
      const nextEvent = getNextEventTime(school);
      const unfavoritedAt = school.unfavoritedAt ? new Date(school.unfavoritedAt).getTime() : null;
      return {
        school,
        index,
        favorite: school.isFavorite === true,
        unfavoritedAt:
          unfavoritedAt !== null && !Number.isNaN(unfavoritedAt) ? unfavoritedAt : null,
        upcoming: nextEvent !== null && nextEvent >= todayStart.getTime() ? nextEvent : null,
      };
    })
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;

      // 剛取消心儀的卡片（兩者都有取消時間時，越近期取消越前面）。
      if (a.unfavoritedAt !== null || b.unfavoritedAt !== null) {
        if (a.unfavoritedAt === null) return 1;
        if (b.unfavoritedAt === null) return -1;
        return b.unfavoritedAt - a.unfavoritedAt;
      }

      if (a.upcoming === null && b.upcoming === null) return a.index - b.index;
      if (a.upcoming === null) return 1;
      if (b.upcoming === null) return -1;
      return a.upcoming - b.upcoming;
    })
    .map((item) => item.school);

  const currentStudentSchoolIds = new Set(currentStudentSchools.map((school) => school.id));

  const studentGender = currentStudent?.gender ?? null;

  const filteredSchools = availableSchools
    .map((school) => formatSchoolForFrontend(school))
    .filter((school) => !currentStudentSchoolIds.has(school.id))
    .filter((school) => {
      const nameZh = getSchoolNameZh(school) ?? '';
      const nameEn = getSchoolNameEn(school) ?? '';
      const query = searchQuery.trim();
      const normalizedQuery = normalizeForSearch(query);
      const aliases = school.aliases ?? [];
      const matchesSearch = normalizedQuery.length === 0
        ? true
        : normalizeForSearch(nameZh).includes(normalizedQuery) ||
          normalizeForSearch(nameEn).includes(normalizedQuery) ||
          aliases.some((alias) => normalizeForSearch(alias).includes(normalizedQuery));
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
    })
    .sort((a, b) => getSearchRelevance(b) - getSearchRelevance(a));

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
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-soft">
            <SchoolIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-slate-900">還沒有學生檔案</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
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
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-3">
            <SchoolIcon className="w-8 h-8 text-primary" />
            <span>我的學校看板</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            點卡片右上角的愛心標記特別心儀，心儀學校會置頂；其餘依最近期活動自動排序
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {/* 近期重點事件：固定第一個格子 */}
          <div className="relative h-full w-full">
            <div className="mx-auto h-full w-full max-w-sm">
              <UpcomingEvents
                gender={currentStudent?.gender ?? null}
                applicationType={currentStudent?.applicationType ?? 'primary'}
                schools={currentStudentSchools}
                board
              />
            </div>
          </div>

          {sortedStudentSchools.map(school => (
            <div key={school.id} className="relative w-full">
              <div className="mx-auto w-full max-w-sm">
                <SchoolCard
                  school={school}
                  onTaskUpdate={updateStudentSchoolTasks}
                  onAddCustomEvent={addCustomEvent}
                  onRemoveCustomEvent={removeCustomEvent}
                  onRestoreDate={restoreEventDate}
                  onUpdateResult={updateSchoolResult}
                  onDelete={(schoolId) => setSchoolToDelete(schoolId)}
                  onToggleFavorite={toggleSchoolFavorite}
                />
              </div>
            </div>
          ))}

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
                className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 transition-colors group hover:border-primary-border"
              >
                <div className="w-16 h-16 bg-primary-soft rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:opacity-90">
                  <Plus className="w-8 h-8 theme-text" />
                </div>
                <span className="text-xl font-extrabold text-slate-900">添加學校</span>
                <span className="text-slate-500 text-xs font-medium mt-1">加入追蹤清單</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
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
