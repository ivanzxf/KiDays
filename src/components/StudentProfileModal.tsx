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
        className="absolute inset-0 bg-slate-900/40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex max-h-[calc(100dvh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800">
            {isEdit ? '編輯學生檔案' : '新增學生檔案'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
            aria-label="關閉"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">學生暱稱</label>
            <input
              type="text"
              placeholder="例如：小明"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">出生年份</label>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                className="w-full appearance-none rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium outline-none transition-colors focus:border-primary focus:bg-white"
              >
                {birthYears.map((year) => (
                  <option key={year} value={year}>
                    {year} 年
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">出生月份</label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(parseInt(e.target.value))}
                className="w-full appearance-none rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium outline-none transition-colors focus:border-primary focus:bg-white"
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
            <label className="mb-2 block text-sm font-bold text-slate-700">性別</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('boy')}
                className={`rounded-[10px] border py-3 font-bold transition-colors ${
                  gender === 'boy'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                男孩子
              </button>
              <button
                type="button"
                onClick={() => setGender('girl')}
                className={`rounded-[10px] border py-3 font-bold transition-colors ${
                  gender === 'girl'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                女孩子
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 p-6">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-[10px] py-3.5 font-bold transition-colors ${
              canSave
                ? 'theme-solid text-white hover:opacity-90 active:opacity-80'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
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
