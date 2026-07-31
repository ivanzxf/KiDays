'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Search, X } from 'lucide-react';
import { DashboardSchool, SchoolCycleWithEvents } from '@/types';
import { formatSchoolEventLabel } from '@/hooks/useSupabase';

interface AddSchoolModalProps {
  isOpen: boolean;
  searchQuery: string;
  selectedSchool: DashboardSchool | null;
  filteredSchools: DashboardSchool[];
  cyclesMap: Record<string, SchoolCycleWithEvents[]>;
  cyclesLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectSchool: (school: DashboardSchool) => void;
  onClose: () => void;
  onConfirm: () => void;
  getSchoolNameZh: (school: DashboardSchool) => string;
  getSchoolNameEn: (school: DashboardSchool) => string | null | undefined;
}

export default function AddSchoolModal({
  isOpen,
  searchQuery,
  selectedSchool,
  filteredSchools,
  cyclesMap,
  cyclesLoading,
  onSearchChange,
  onSelectSchool,
  onClose,
  onConfirm,
  getSchoolNameZh,
  getSchoolNameEn,
}: AddSchoolModalProps) {
  const selectedCycles = selectedSchool ? cyclesMap[selectedSchool.id] ?? [] : []
  const latestCycle = selectedCycles[0] ?? null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-50 p-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-gray-800">添加學校</h3>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-600">
                  即時連接 Supabase 學校主檔
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-all hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-5">
              <div className="custom-scrollbar flex min-h-0 flex-col overflow-y-auto border-b border-gray-100 p-6 md:col-span-3 md:border-b-0 md:border-r">
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="輸入學校名稱...（可輸入中/英文）"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full rounded-2xl border-2 border-transparent bg-gray-50 py-3.5 pl-5 pr-12 font-medium text-gray-700 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    搜索結果 ({filteredSchools.length})
                  </div>

                  <div className="min-h-[100px] space-y-2">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => onSelectSchool(school)}
                          className={`group flex w-full items-start justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                            selectedSchool?.id === school.id
                              ? 'border-indigo-500 bg-indigo-50/50'
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div
                              className={`truncate text-sm font-bold ${
                                selectedSchool?.id === school.id ? 'text-indigo-700' : 'text-gray-800'
                              }`}
                            >
                              {getSchoolNameZh(school)}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] font-medium text-gray-400">
                              {getSchoolNameEn(school)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {school.district ? (
                                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-100">
                                  {school.district}
                                </span>
                              ) : null}
                              {school.school_type ? (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-100">
                                  {school.school_type}
                                </span>
                              ) : null}
                              {school.gender_policy ?? school.gender ? (
                                <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-600 border border-pink-100">
                                  {school.gender_policy ?? school.gender}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {selectedSchool?.id === school.id && (
                            <div className="theme-gradient ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-sm font-medium text-gray-400">未找到相關學校</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="custom-scrollbar flex min-h-0 flex-col overflow-y-auto bg-gray-50/70 p-6 md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    學校申請時程
                  </div>
                </div>

                {!selectedSchool ? (
                  <div className="mt-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Search className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-500">
                      請先選擇一間學校
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      這裡會顯示該學校從 Supabase 取出的招生週期與關鍵日期
                    </p>
                  </div>
                ) : cyclesLoading ? (
                  <div className="mt-10 text-center text-sm text-gray-400">
                    正在載入學校申請時程...
                  </div>
                ) : !latestCycle ? (
                  <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-gray-200 bg-white p-5">
                    <div className="text-sm font-bold text-gray-700">
                      {getSchoolNameZh(selectedSchool)}
                    </div>
                    <p className="text-xs text-gray-400">
                      學校主檔已連結成功，但目前尚未建立該校的招生週期 / 關鍵日期。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-gray-800">
                            {getSchoolNameZh(selectedSchool)}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] font-medium text-gray-400">
                            {getSchoolNameEn(selectedSchool)}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                          {latestCycle.academic_year}
                        </span>
                      </div>
                      {selectedSchool.address_zh ? (
                        <div className="mt-3 text-[11px] leading-5 text-gray-500">
                          {selectedSchool.address_zh}
                        </div>
                      ) : null}
                      {selectedSchool.website ? (
                        <div className="mt-1 truncate text-[11px] text-indigo-600">
                          {selectedSchool.website}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        關鍵日期
                      </div>
                      <div className="space-y-2">
                        {latestCycle.events.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-400">
                            本學年尚未設定關鍵日期
                          </div>
                        ) : (
                          latestCycle.events.map((event) => {
                            const dateText = event.start_at
                              ? new Date(event.start_at).toLocaleDateString('zh-HK', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                              : '待定'

                            return (
                              <div
                                key={event.id}
                                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-bold text-gray-700">
                                      {event.title_zh ??
                                        formatSchoolEventLabel(event.event_type, event.sequence_no)}
                                    </div>
                                    <div className="mt-1 truncate text-[10px] text-gray-400">
                                      {event.event_type}
                                      {event.sequence_no ? ` · 第 ${event.sequence_no} 次` : ''}
                                    </div>
                                  </div>
                                  <div className="shrink-0 rounded-xl bg-indigo-50 px-2.5 py-1.5 text-right text-[11px] font-semibold text-indigo-700">
                                    {dateText}
                                  </div>
                                </div>
                                {event.location ? (
                                  <div className="mt-2 text-[10px] text-gray-400">
                                    地點：{event.location}
                                  </div>
                                ) : null}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-50 p-6">
              <button
                onClick={onConfirm}
                disabled={!selectedSchool}
                className={`w-full rounded-2xl py-4 text-sm font-bold transition-all ${
                  selectedSchool
                    ? 'theme-gradient text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400 shadow-none'
                }`}
              >
                確認添加
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
