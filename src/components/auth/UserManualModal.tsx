'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import manualMarkdown from '@/content/user-manual.md';
import { parseManual } from '@/lib/manualMarkdown';

const blocks = parseManual(manualMarkdown);

export default function UserManualModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-black text-slate-900">用戶手冊及使用條款</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="關閉"
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
              {blocks.map((block, index) => {
                switch (block.type) {
                  case 'title':
                    return (
                      <h4 key={index} className="text-lg font-black text-slate-900">
                        {block.text}
                      </h4>
                    );
                  case 'heading':
                    return (
                      <h5 key={index} className="mt-5 text-base font-bold text-slate-900">
                        {block.text}
                      </h5>
                    );
                  case 'listItem':
                    return (
                      <p key={index} className="mt-2 flex gap-2 text-sm leading-relaxed text-slate-600">
                        <span className="mt-[0.625rem] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        <span>{block.text}</span>
                      </p>
                    );
                  case 'paragraph':
                    return (
                      <p key={index} className="mt-2 text-sm leading-relaxed text-slate-600">
                        {block.text}
                      </p>
                    );
                }
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
