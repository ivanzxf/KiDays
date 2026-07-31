'use client';

import { motion } from 'framer-motion';
import { CalendarClock, FolderKanban, School, Users } from 'lucide-react';

const previewSchools = [
  { name: '港島直資第一小學', tag: '港島區', status: '簡介會已安排' },
  { name: '九龍男拔資助小學', tag: '九龍區', status: '等待第一次面試' },
  { name: '新界國際小學', tag: '新界區', status: '遞交申請中' },
];

const previewMilestones = ['7 月 15 日 簡介會', '7 月 26 日 遞交申請', '8 月 10 日 第一次面試'];

export default function LandingPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 }}
      className="relative"
    >
      <div className="rounded-[2rem] border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between rounded-3xl bg-slate-900 px-5 py-4 text-white">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Dashboard Preview</div>
            <div className="mt-1 text-xl font-black">我的學校看板</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold">小紅 · 小學申請</div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="theme-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg">
                <School className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">目標學校</div>
                <div className="text-xs font-medium text-slate-500">依重要程度自由排序</div>
              </div>
            </div>
            <div className="space-y-3">
              {previewSchools.map((school) => (
                <div key={school.name} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-800">{school.name}</div>
                      <div className="mt-1 text-xs font-medium text-slate-400">{school.tag}</div>
                    </div>
                    <FolderKanban className="h-4 w-4 flex-shrink-0 text-slate-300" />
                  </div>
                  <div className="mt-3 text-xs font-semibold theme-text">{school.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">多學生檔案</div>
                  <div className="text-xs text-slate-500">男女主題色跟學生檔案同步</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-3 py-3 font-semibold text-slate-700">小明</div>
                <div className="rounded-2xl bg-rose-50 px-3 py-3 font-semibold text-rose-600">小紅</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">節點提醒</div>
                  <div className="text-xs text-slate-500">簡介會、申請、兩次面試</div>
                </div>
              </div>
              <div className="space-y-2">
                {previewMilestones.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
