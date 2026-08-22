'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type EmbeddedSchool = { name_zh: string; school_type: string | null };
type EmbeddedCycle =
  | { school_id: string; application_level: string | null; schools: EmbeddedSchool | EmbeddedSchool[] | null }
  | { school_id: string; application_level: string | null; schools: EmbeddedSchool | EmbeddedSchool[] | null }[]
  | null;

type UpcomingEventRow = {
  id: string;
  event_type: string;
  start_at: string;
  school_cycles: EmbeddedCycle;
};

type DisplayEvent = {
  schoolName: string;
  eventLabel: string;
  startAt: string;
};

const EVENT_LABELS: Record<string, string> = {
  open_day: '開放日',
  info_session: '簡介會',
  application_open: '申請開放',
  application_deadline: '申請截止',
  result_release: '結果公佈',
};

/** 公共主頁只顯示這些非個人化的招生事件；一面/二面等私人資訊不出現在這裡。 */
const PUBLIC_EVENT_TYPES = [
  'open_day',
  'info_session',
  'application_open',
  'application_deadline',
  'result_release',
];

const getSingle = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

/** 事件日期（當地時間）→ 顯示文字：同月「8月21日」，跨月/跨年自動補年份。 */
function formatEventDate(iso: string, now: Date): string {
  const date = new Date(iso);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const base = `${month}月${day}日`;
  return date.getFullYear() === now.getFullYear() ? base : `${date.getFullYear()}年${base}`;
}

/** 距今倒數：今天 / 明天 / 還有 X 天。 */
function countdownLabel(iso: string, now: Date): { label: string; tone: 'today' | 'soon' | 'later' } {
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (days <= 0) return { label: '今天', tone: 'today' };
  if (days === 1) return { label: '明天', tone: 'soon' };
  if (days <= 3) return { label: `${days} 天後`, tone: 'soon' };
  return { label: `${days} 天後`, tone: 'later' };
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<DisplayEvent[] | null>(null);
  const [level, setLevel] = useState<'primary' | 'kindergarten'>('primary');

  useEffect(() => {
    let active = true;

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 14);

    supabase
      .from('school_events')
      .select(
        'id, event_type, start_at, school_cycles(school_id, application_level, academic_year, schools(name_zh, school_type))',
      )
      .eq('date_status', 'confirmed')
      .in('event_type', PUBLIC_EVENT_TYPES)
      .not('start_at', 'is', null)
      .gte('start_at', now.toISOString())
      .lte('start_at', windowEnd.toISOString())
      .eq('school_cycles.status', 'published')
      .order('start_at', { ascending: true })
      .limit(20)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Error loading upcoming events:', error);
          setEvents([]);
          return;
        }

        const seen = new Set<string>();
        const sameDayEventCount = new Map<string, number>();
        const list: DisplayEvent[] = [];
        for (const row of (data ?? []) as UpcomingEventRow[]) {
          const cycle = getSingle(row.school_cycles);
          const school = getSingle(cycle?.schools);
          if (!cycle || !school?.name_zh) continue;

          const dateKey = new Date(row.start_at).toDateString();
          const dedupeKey = `${cycle.school_id}|${row.event_type}|${dateKey}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          // 多樣性：同一種事件在同一天最多顯示 3 間學校，
          // 避免面板被同一波（如 ESF 同時開放申請）塞滿。
          const groupKey = `${row.event_type}|${dateKey}`;
          const groupCount = sameDayEventCount.get(groupKey) ?? 0;
          if (groupCount >= 3) continue;
          sameDayEventCount.set(groupKey, groupCount + 1);

          list.push({
            schoolName: school.name_zh,
            eventLabel: EVENT_LABELS[row.event_type] ?? row.event_type,
            startAt: row.start_at,
          });
          if (list.length >= 5) break;
        }

        setEvents(list);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="flex h-full w-full flex-col rounded-[2rem] bg-white p-5 shadow-2xl lg:p-6"
     >
       <div className="flex flex-shrink-0 items-center justify-between gap-3">
         <div className="flex items-center gap-2.5">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
             <CalendarClock className="h-4 w-4 text-white" />
           </div>
           <h2 className="text-base font-black text-slate-900">近期重點事件</h2>
         </div>
         <div className="flex rounded-xl bg-slate-100 p-1">
           <button
             onClick={() => setLevel('primary')}
             className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
               level === 'primary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
             }`}
           >
             小學
           </button>
           <button
             onClick={() => setLevel('kindergarten')}
             className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
               level === 'kindergarten' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
             }`}
           >
             幼稚園
           </button>
         </div>
       </div>

      <div className="mt-3 flex flex-1 flex-col divide-y divide-slate-100">
        {events === null ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            正在載入近期事件...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-sm leading-7 text-slate-400">
            未來 14 天暫無已公佈的學校活動
            <br />
            晚點再回來看看
          </div>
        ) : (
          events.map((event) => {
            const now = new Date();
            const date = new Date(event.startAt);
            const countdown = countdownLabel(event.startAt, now);
            const toneClass =
              countdown.tone === 'today'
                ? 'bg-emerald-50 text-emerald-600'
                : countdown.tone === 'soon'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-100 text-slate-500';
            return (
              <div key={`${event.schoolName}|${event.eventLabel}|${event.startAt}`} className="flex flex-1 items-center gap-4 py-1.5">
                <div className="flex w-12 flex-shrink-0 flex-col items-center rounded-lg bg-indigo-50 py-1">
                  <span className="text-base font-black leading-tight text-indigo-700">{date.getDate()}</span>
                  <span className="text-[10px] font-bold text-indigo-400">{date.getMonth() + 1}月</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-800">{event.schoolName}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {event.eventLabel} · {formatEventDate(event.startAt, now)}
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${toneClass}`}>
                  {countdown.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </motion.aside>
  );
}
