'use client';

import { useEffect, useState } from 'react';
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

const SHARE_ERROR_MESSAGES: Record<string, string> = {
  invalid_code: '驗證碼不存在，請確認後再試',
  code_used: '此驗證碼已被使用',
  code_expired: '驗證碼已過期，請重新產生',
  student_already_shared: '此學生檔案已與另一位家長共享',
  already_owner: '這是你自己的學生檔案',
  not_student_owner: '只有檔案擁有者可以產生驗證碼',
  not_authenticated: '請先登入',
  code_generation_failed: '驗證碼產生失敗，請再試一次',
};

const translateShareError = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const key = Object.keys(SHARE_ERROR_MESSAGES).find((item) => message.includes(item));
  return key ? SHARE_ERROR_MESSAGES[key] : '操作失敗，請稍後再試';
};

export default function StudentProfileModal({ mode, student, onClose }: StudentProfileModalProps) {
  const { addStudent, updateStudent, createShareCode, redeemShareCode } = useApp();
  const isEdit = mode === 'edit';

  const [name, setName] = useState(student?.name ?? '');
  const [birthYear, setBirthYear] = useState(
    student?.birthDate?.getFullYear() ?? new Date().getFullYear() - 6,
  );
  const [birthMonth, setBirthMonth] = useState((student?.birthDate?.getMonth() ?? 0) + 1);
  const [gender, setGender] = useState<'boy' | 'girl'>(student?.gender ?? 'boy');

  // 建立檔案時可改用「驗證碼連結現有檔案」
  const [linkMode, setLinkMode] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // 編輯模式：產生共享驗證碼
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSecondsLeft, setShareSecondsLeft] = useState(0);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (!shareCode) return;

    setShareSecondsLeft(60);
    const timer = window.setInterval(() => {
      setShareSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shareCode]);

  const birthYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  if (!birthYears.includes(birthYear)) birthYears.push(birthYear);
  birthYears.sort((a, b) => b - a);

  const canSave = name.trim().length > 0;
  const canLink = linkCode.trim().length === 8;

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

  const handleGenerateShareCode = async () => {
    if (!student) return;
    setIsGeneratingCode(true);
    setShareError(null);
    try {
      const code = await createShareCode(student.id);
      setShareCode(code);
    } catch (error) {
      setShareError(translateShareError(error));
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleRedeem = async () => {
    if (!canLink) return;
    setIsLinking(true);
    setLinkError(null);
    try {
      await redeemShareCode(linkCode.trim());
      onClose();
    } catch (error) {
      setLinkError(translateShareError(error));
    } finally {
      setIsLinking(false);
    }
  };

  const title = isEdit ? '編輯學生檔案' : linkMode ? '連結現有學生檔案' : '新增學生檔案';

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
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
            aria-label="關閉"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-1 rounded-[10px] bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLinkMode(false);
                  setLinkError(null);
                }}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  linkMode ? 'text-slate-500 hover:text-slate-700' : 'bg-white text-primary shadow-sm'
                }`}
              >
                建立新檔案
              </button>
              <button
                type="button"
                onClick={() => setLinkMode(true)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  linkMode ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                用驗證碼連結
              </button>
            </div>
          )}

          {linkMode ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-600">
                若另一位家長已經建立了學生檔案，請向他索取 8 位數字驗證碼，輸入後即可共用同一份申請資料。
              </p>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">共享驗證碼</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="8 位數字"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-2xl font-bold tracking-[0.3em] outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>
              {linkError && <p className="text-sm text-red-600">{linkError}</p>}
            </div>
          ) : (
            <>
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

              {isEdit && student && (
                <div className="border-t border-slate-200 pt-6">
                  <label className="mb-2 block text-sm font-bold text-slate-700">家長共享</label>
                  <p className="mb-3 text-xs leading-relaxed text-slate-500">
                    產生一組 8 位數字驗證碼，讓另一位家長在自己的帳號連結這個學生檔案，共用同一份申請資料（驗證碼 1 分鐘內有效）。
                  </p>

                  {shareCode && (
                    <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="text-3xl font-bold tracking-[0.3em] text-primary">
                        {shareCode}
                      </div>
                      {shareSecondsLeft > 0 ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {shareSecondsLeft} 秒後失效
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-red-600">已過期，請重新產生</p>
                      )}
                    </div>
                  )}

                  {shareError && <p className="mt-2 text-xs text-red-600">{shareError}</p>}

                  <button
                    type="button"
                    onClick={handleGenerateShareCode}
                    disabled={isGeneratingCode}
                    className="mt-3 w-full rounded-[10px] border border-primary py-2.5 font-bold text-primary transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingCode
                      ? '產生中…'
                      : shareCode
                        ? '重新產生驗證碼'
                        : '產生共享驗證碼'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 p-6">
          {linkMode ? (
            <button
              onClick={handleRedeem}
              disabled={!canLink || isLinking}
              className={`w-full rounded-[10px] py-3.5 font-bold transition-colors ${
                canLink && !isLinking
                  ? 'theme-solid text-white hover:opacity-90 active:opacity-80'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              {isLinking ? '連結中…' : '連結現有檔案'}
            </button>
          ) : (
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
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

