'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AppStudent } from '@/types';
import { useApp } from '@/context/AppContext';

interface StudentProfileModalProps {
  mode: 'create' | 'edit';
  student?: AppStudent;
  onClose: () => void;
}

export default function StudentProfileModal({ mode, student, onClose }: StudentProfileModalProps) {
  const { addStudent, updateStudent } = useApp();
  const isEdit = mode === 'edit';

  const [name, setName] = useState(student?.name ?? '');
  const [birthYear, setBirthYear] = useState(
    student?.birthDate?.getFullYear() ?? new Date().getFullYear() - 6,
  );
  const [birthMonth, setBirthMonth] = useState((student?.birthDate?.getMonth() ?? 0) + 1);
  const [gender, setGender] = useState<'boy' | 'girl'>(student?.gender ?? 'boy');

  const birthYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  if (!birthYears.includes(birthYear)) birthYears.push(birthYear);
  birthYears.sort((a, b) => b - a);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (isEdit && student) {
      void updateStudent(student.id, {
        name: name.trim(),
        birthYear,
        birthMonth,
        gender,
        applicationType: student.applicationType,
      });
    } else {
      void addStudent({
        name: name.trim(),
        birthYear,
        birthMonth,
        gender,
        applicationType: 'primary',
      });
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
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
        className="relative flex max-h-[calc(100dvh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-50 p-6">
          <h3 className="text-xl font-extrabold text-gray-800">
            {isEdit ? '編輯學生檔案' : '新增學生檔案'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-all hover:bg-gray-100"
            aria-label="關閉"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">學生暱稱</label>
            <input
              type="text"
              placeholder="例如：小明"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">出生年份</label>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                className="w-full appearance-none rounded-2xl border-2 border-transparent bg-gray-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white"
              >
                {birthYears.map((year) => (
                  <option key={year} value={year}>
                    {year} 年
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">出生月份</label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(parseInt(e.target.value))}
                className="w-full appearance-none rounded-2xl border-2 border-transparent bg-gray-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {month} 月
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">性別</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('boy')}
                className={`rounded-2xl py-3 font-bold transition-all border-2 ${
                  gender === 'boy'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                男孩子
              </button>
              <button
                type="button"
                onClick={() => setGender('girl')}
                className={`rounded-2xl py-3 font-bold transition-all border-2 ${
                  gender === 'girl'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                女孩子
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-50 p-6">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-2xl py-4 font-bold shadow-lg transition-all ${
              canSave
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
          >
            {isEdit ? '儲存變更' : '創建檔案'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
