'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { DashboardSchool } from '@/types';

interface AddSchoolModalProps {
  isOpen: boolean;
  searchQuery: string;
  selectedSchool: DashboardSchool | null;
  filteredSchools: DashboardSchool[];
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
  onSearchChange,
  onSelectSchool,
  onClose,
  onConfirm,
  getSchoolNameZh,
  getSchoolNameEn,
}: AddSchoolModalProps) {
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
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-50 p-6">
              <h3 className="text-xl font-extrabold text-gray-800">添加學校</h3>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-all hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="輸入學校名稱..."
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
                        className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
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
