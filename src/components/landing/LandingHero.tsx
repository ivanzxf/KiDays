'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import LandingPreview from '@/components/landing/LandingPreview';

interface LandingHeroProps {
  onOpenAuth: () => void;
}

const heroStats = [
  { label: '學生檔案', value: '多學生切換' },
  { label: '學校看板', value: '拖拽排序' },
  { label: '進度節點', value: '4 個核心步驟' },
  { label: '提醒方式', value: '看板 + 月曆' },
];

export default function LandingHero({ onOpenAuth }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 bg-white/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:items-center lg:gap-14 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-5 inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md">
            小學升學管理樣品首頁
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            把香港升學流程
            <span className="block text-white/85">整理成你看得懂、跟得上的看板</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
            KiDays 童步把學生檔案、學校名單、四個申請節點、面試進度與月曆提醒放在同一個入口。
            不再用零散記事本、截圖和 WhatsApp 自己拼。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              登入 / 註冊
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <a
              href="#landing-sections"
              className="inline-flex items-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15"
            >
              看看功能樣品
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-md"
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{item.label}</div>
                <div className="mt-2 text-base font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <LandingPreview />
      </div>
    </section>
  );
}
