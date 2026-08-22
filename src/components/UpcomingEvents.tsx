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

/** featured_events 表的自訂重點事件。 */
type FeaturedEventRow = {
  school_name: string;
  title: string;
  event_date: string;
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

/** 距今倒數：今天 / 明天 / 還有 X 天。 */
function countdownLabel(iso: string, now: Date): { label: string; tone: 'today' | 'soon' | 'later' } {
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (days <= 0) return { label: '今天', tone: 'today' };
  if (days === 1) return { label: '明天', tone: 'soon' };
  if (days <= 3) return { label: `${days} 天後`, tone: 'soon' };
  return { label: `${days} 天後`, tone: 'later' };
}

/** 事件若有明確時間（非午夜）才顯示，例如「 · 上午9時」。 */
function formatEventTime(iso: string): string {
  const date = new Date(iso);
  const hour = date.getHours();
  const minute = date.getMinutes();
  if (hour === 0 && minute === 0) return '';
  const period = hour < 12 ? '上午' : '下午';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? ` · ${period}${hour12}時`
    : ` · ${period}${hour12}時${minute}分`;
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<DisplayEvent[] | null>(null);

  useEffect(() => {
    let active = true;

    const now = new Date();
    // 範圍起點：今天 0 點（今天的事件即使已過時間也顯示，昨天及之前的不顯示）
    const rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 14);

    Promise.all([
      // 1. 學校官方事件（僅小學入口）
      supabase
        .from('school_events')
        .select(
          'id, event_type, start_at, school_cycles(school_id, application_level, academic_year, schools(name_zh, school_type))',
        )
        .eq('date_status', 'confirmed')
        .in('event_type', PUBLIC_EVENT_TYPES)
        .not('start_at', 'is', null)
        .gte('start_at', rangeStart.toISOString())
        .lte('start_at', windowEnd.toISOString())
        .eq('school_cycles.status', 'published')
        .eq('school_cycles.application_level', 'primary')
        .order('start_at', { ascending: true })
        .limit(20),
      // 2. 營運方自訂的重點事件（與學校節點無關）
      supabase
        .from('featured_events')
        .select('school_name, title, event_date')
        .gte('event_date', rangeStart.toISOString())
        .order('event_date', { ascending: true })
        .limit(20),
    ])
      .then(([schoolRes, featuredRes]) => {
        if (!active) return;
        if (schoolRes.error) {
          console.error('Error loading upcoming events:', schoolRes.error);
          setEvents([]);
          return;
        }

        const seen = new Set<string>();
        const sameDayEventCount = new Map<string, number>();
        const schoolList: DisplayEvent[] = [];
        for (const row of (schoolRes.data ?? []) as UpcomingEventRow[]) {
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

          schoolList.push({
            schoolName: school.name_zh,
            eventLabel: EVENT_LABELS[row.event_type] ?? row.event_type,
            startAt: row.start_at,
          });
        }

        // 自訂重點事件直接加入（不套學校事件的多樣性限制）
        const featuredList: DisplayEvent[] = (featuredRes.data ?? []).map((row: FeaturedEventRow) => ({
          schoolName: row.school_name,
          eventLabel: row.title,
          startAt: row.event_date,
        }));

        // 合併後按時間排序，取最近 5 個
        const combined = [...schoolList, ...featuredList]
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, 5);

        setEvents(combined);
      })
      .catch((error) => {
        console.error('Error loading upcoming events:', error);
        if (active) setEvents([]);
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
                    {event.eventLabel}
                    {formatEventTime(event.startAt)}
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
