'use client';

import { motion } from 'framer-motion';
import { BellRing, Blocks, FileCheck2, FolderTree, MousePointer2, School2 } from 'lucide-react';

const featureGroups = [
  {
    title: '你真正會用到的功能',
    items: [
      { icon: FolderTree, title: '學校看板', desc: '每個學生有自己的一組學校卡片，重要學校可拖到最前。' },
      { icon: FileCheck2, title: '四個核心節點', desc: '簡介會、遞交申請、第一次面試、第二次面試，一眼看到進度。' },
      { icon: MousePointer2, title: '手動排序', desc: '像手機桌面一樣調整順序，把最關心的學校留在視線前面。' },
    ],
  },
  {
    title: '不是資訊網站，而是管理入口',
    items: [
      { icon: School2, title: '選校整理', desc: '先放入目標學校，再慢慢篩選，不需要一開始就做所有決定。' },
      { icon: BellRing, title: '進度提醒', desc: '後續可接日曆與提醒，把零散時間點收回到同一個地方。' },
      { icon: Blocks, title: '多學生切換', desc: '兄弟姊妹可各自有自己的申請類型、主題色和學校看板。' },
    ],
  },
];

const processSteps = [
  {
    step: '01',
    title: '新增學生檔案',
    desc: '先建立學生暱稱、出生年月、性別與申請類型，後續所有內容都圍繞學生整理。',
  },
  {
    step: '02',
    title: '添加要追蹤的學校',
    desc: '把有興趣的學校先放進看板，再依重要程度排序，整體視圖會清楚很多。',
  },
  {
    step: '03',
    title: '跟住四個申請節點走',
    desc: '每張學校卡只保留最核心的四步，避免首頁變成資訊牆，反而看不懂。',
  },
];

export default function LandingSections() {
  return (
    <div id="landing-sections" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] bg-white/95 px-6 py-8 shadow-2xl backdrop-blur-md sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <div className="text-sm font-bold uppercase tracking-[0.25em] theme-text">為香港家長設計</div>
          <h2 className="mt-3 text-3xl font-black text-slate-900">先把流程理清，再慢慢補齊資料</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            這版首頁樣品先把產品主軸講清楚，不追求滿版資訊，而是讓家長一進來就知道：
            這個工具是拿來管理升學流程，不只是看資料。
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {featureGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: groupIndex * 0.08 }}
              className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5"
            >
              <h3 className="text-xl font-black text-slate-900">{group.title}</h3>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="theme-gradient flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-md">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-base font-black text-slate-900">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-white/25 bg-slate-900 px-6 py-7 text-white shadow-2xl">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-white/50">為什麼這樣做</div>
          <h2 className="mt-3 text-3xl font-black">首頁先講清楚價值，不先堆資料</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            參考站點的優點，是它很快讓人理解「這裡能做什麼」。KiDays 的首頁也應該先回答同一件事：
            我進來之後，能不能把孩子的升學流程整理好。
          </p>
        </div>

        <div className="rounded-[2rem] bg-white/95 px-6 py-7 shadow-2xl">
          <div className="text-sm font-bold uppercase tracking-[0.25em] theme-text">使用流程</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {processSteps.map((item) => (
              <div key={item.step} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <div className="text-sm font-black theme-text">{item.step}</div>
                <h3 className="mt-3 text-lg font-black text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
