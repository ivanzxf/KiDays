'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface DeleteSchoolDialogProps {
  schoolId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteSchoolDialog({
  schoolId,
  onCancel,
  onConfirm,
}: DeleteSchoolDialogProps) {
  return (
    <AnimatePresence>
      {schoolId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center space-x-4 text-red-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold">確認刪除？</h3>
            </div>
            <p className="mb-8 leading-relaxed text-gray-600">
              確認刪除該學校？<span className="font-bold text-red-600">申請進度會一並刪除</span>，此操作無法撤銷。
            </p>
            <div className="flex space-x-4">
              <button
                onClick={onCancel}
                className="flex-1 rounded-2xl bg-gray-100 py-4 font-bold text-gray-600 transition-all hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700"
              >
                確認刪除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
