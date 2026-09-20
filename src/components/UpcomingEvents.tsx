'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardSchool, StudentGender, StudentTask } from '@/types';
import { formatCardDateFull, formatSchoolEventRangeLabel } from '@/lib/formatEventDateLabel';

type EmbeddedSchool = { name_zh: string; school_type: string | null; gender_policy: string | null };
type EmbeddedCycle =
  | { school_id: string; application_level: string | null; schools: EmbeddedSchool | EmbeddedSchool[] | null }
  | { school_id: string; application_level: string | null; schools: EmbeddedSchool | EmbeddedSchool[] | null }[]
  | null;

type UpcomingEventRow = {
  id: string;
  event_type: string;
  start_at: string;
  /** 多場活動的自訂時間文字（如「上午10時/下午2時」）；無值時由 start_at 推算。 */
  time_label?: string | null;
  school_cycles: EmbeddedCycle;
};

/** featured_events 表的自訂重點事件。 */
type FeaturedEventRow = {
  school_name: string;
  title: string;
  event_date: string;
  gender: string | null;
};

type DisplayEvent = {
  schoolName: string;
  eventLabel: string;
  /** 排序與倒數用的事件起日（ISO）。 */
  startAt: string;
  /** 副標顯示的日期文字（個人看板為單日或區間，不含時間）。 */
  dateLabel: string;
  /** 多場活動的自訂時間文字（僅公開模式使用）。 */
  timeLabel?: string | null;
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

/** 看板最多顯示的事件數（不限天數，取最接近今天的幾筆）。 */
const MAX_EVENTS = 5;

const getSingle = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

/** 依學生性別過濾：男→男校/男女校，女→女校/男女校；未登入或無性別標註時不過濾。 */
function matchesStudentGender(
  gender: StudentGender | null | undefined,
  policy: string | null | undefined,
): boolean {
  if (!gender || !policy) return true;
  if (gender === 'boy') return policy === 'boys' || policy === 'coed';
  return policy === 'girls' || policy === 'coed';
}

/** 距今倒數：今天 / 明天 / 還有 X 天。 */
function countdownLabel(iso: string, now: Date): { label: string; tone: 'today' | 'soon' | 'later' } {
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (days <= 0) return { label: '今天', tone: 'today' };
  if (days === 1) return { label: '明天', tone: 'soon' };
  if (days <= 3) return { label: `${days} 天後`, tone: 'soon' };
  return { label: `${days} 天後`, tone: 'later' };
}

/** 事件時間：有自訂時間文字（多場）時優先使用，否則由 start_at 推算（例如「 · 上午9時」）。 */
function formatEventTime(iso: string, timeLabel?: string | null): string {
  if (timeLabel) return ` · ${timeLabel}`;
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

/** 營運精選事件：依性別過濾，個人看板另以「已加入學校名稱」比對。 */
function mapFeaturedEvents(
  rows: FeaturedEventRow[],
  gender: StudentGender | null | undefined,
  scopedNames: Set<string> | null,
): DisplayEvent[] {
  return rows
    .filter((row) => matchesStudentGender(gender, row.gender))
    .filter((row) => !scopedNames || scopedNames.has(row.school_name.trim()))
    .map((row) => ({
      schoolName: row.school_name,
      eventLabel: row.title,
      startAt: row.event_date,
      dateLabel: formatCardDateFull(new Date(row.event_date)),
    }));
}

/**
 * 個人看板：直接從學生已加入學校的 reactive tasks 推導事件，
 * 涵蓋學校公佈日期（含一面／二面區間）、家長自訂的面試日期、家長新增的自訂事件。
 * 由於 tasks 隨 currentStudent 更新，家長每次加入學校或修改日期，看板即時反映。
 * 只取日期，不顯示具體時間。
 */
function buildBoardEvents(schools: DashboardSchool[]): DisplayEvent[] {
  const events: DisplayEvent[] = [];
  const seen = new Set<string>();

  for (const school of schools) {
    const schoolName = school.nameZh || school.name_zh;
    if (!schoolName) continue;

    // 同校多入口（Prep Year / Year 1）；無 entryPoints 時退回 legacy 單一 tasks
    const taskLists: StudentTask[][] =
      school.entryPoints && school.entryPoints.length > 0
        ? school.entryPoints.map((entry) => entry.tasks ?? [])
        : [school.tasks ?? []];

    for (const tasks of taskLists) {
      for (const task of tasks) {
        // 已確認有日期的事件才進看板（N/A、日期待定、尚未自訂的 Rolling 行略過）
        if (task.date_status === 'na' || task.date_status === 'tbd') continue;

        // 家長自訂日期優先於學校公佈日期
        const overrideStart = task.private_override?.start_at ?? null;
        const startAt = overrideStart ?? task.start_at ?? null;
        if (!startAt) continue;

        const startDate = new Date(startAt);
        if (Number.isNaN(startDate.getTime())) continue;

        const dedupeKey = `${school.id}|${task.title}|${startDate.toDateString()}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        events.push({
          schoolName,
          eventLabel: task.title,
          startAt,
          // 自訂日期為單日；學校日期可能為區間（例如 23-25 Sep）
          dateLabel: overrideStart
            ? formatCardDateFull(startDate)
            : formatSchoolEventRangeLabel(task.start_at, task.end_at, task.date_status),
        });
      }
    }
  }

  return events;
}

export default function UpcomingEvents({
  gender,
  board = false,
  applicationType = 'primary',
  schools,
}: {
  gender?: StudentGender | null;
  /** 看板版：視覺上與學校單卡略作區分（微漸變底＋漸變日期框＋漸變標題）。 */
  board?: boolean;
  /** 依學生的申請階段過濾學校事件（登入頁預設只顯示小一）。 */
  applicationType?: 'kindergarten' | 'primary';
  /**
   * 個人看板：傳入學生已加入的學校（含 tasks）。
   * 提供時即為個人看板模式，事件直接由 tasks 推導並隨 currentStudent 即時更新；
   * 未提供時用於首頁／登入頁，僅查公開學校事件與營運精選事件。
   */
  schools?: DashboardSchool[];
}) {
  const [publicEvents, setPublicEvents] = useState<DisplayEvent[] | null>(null);
  const [featuredEvents, setFeaturedEvents] = useState<DisplayEvent[] | null>(null);

  // 以「內容字串」作為 effect 依賴，避免父層每次 render 產生新陣列造成重複查詢。
  const schoolNamesKey = Array.from(
    new Set(
      (schools ?? [])
        .flatMap((school) => [school.nameZh, school.name_zh, school.nameEn, school.name_en])
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).join('|');
  const isPersonalBoard = schools !== undefined;

  useEffect(() => {
    let active = true;

    // 範圍起點：今天 0 點（今天的事件即使已過時間也顯示，昨天及之前的不顯示）
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);

    const featuredQuery = supabase
      .from('featured_events')
      .select('school_name, title, event_date, gender')
      .gte('event_date', rangeStart.toISOString())
      .order('event_date', { ascending: true })
      .limit(20);

    // 個人看板：學校／自訂事件改由學生的 reactive tasks 推導（見 buildBoardEvents），
    // 這裡只需補上營運精選事件。
    if (isPersonalBoard) {
      const scopedNames = new Set(
        schoolNamesKey.split('|').map((name) => name.trim()).filter(Boolean),
      );
      void (async () => {
        try {
          const featuredRes = await featuredQuery;
          if (!active) return;
          if (featuredRes.error) {
            console.error('Error loading featured events:', featuredRes.error);
            setFeaturedEvents([]);
            return;
          }
          setFeaturedEvents(
            mapFeaturedEvents((featuredRes.data ?? []) as FeaturedEventRow[], gender, scopedNames),
          );
        } catch (error) {
          console.error('Error loading featured events:', error);
          if (active) setFeaturedEvents([]);
        }
      })();

      return () => {
        active = false;
      };
    }

    // 公開模式：查學校官方事件（不限天數，排序後於 render 取最接近的數筆）
    const schoolEventsQuery = supabase
      .from('school_events')
      .select(
        'id, event_type, start_at, time_label, school_cycles(school_id, application_level, academic_year, schools(name_zh, school_type, gender_policy))',
      )
      .eq('date_status', 'confirmed')
      .in('event_type', PUBLIC_EVENT_TYPES)
      .not('start_at', 'is', null)
      .gte('start_at', rangeStart.toISOString())
      .eq('school_cycles.status', 'published')
      .eq('school_cycles.application_level', applicationType);

    Promise.all([
      // 1. 學校官方事件（僅小學入口）
      schoolEventsQuery.order('start_at', { ascending: true }).limit(20),
      // 2. 營運方自訂的重點事件（與學校節點無關）
      featuredQuery,
    ])
      .then(([schoolRes, featuredRes]) => {
        if (!active) return;
        if (schoolRes.error) {
          console.error('Error loading upcoming events:', schoolRes.error);
          setPublicEvents([]);
          setFeaturedEvents([]);
          return;
        }

        const seen = new Set<string>();
        const sameDayEventCount = new Map<string, number>();
        const schoolList: DisplayEvent[] = [];
        for (const row of (schoolRes.data ?? []) as unknown as UpcomingEventRow[]) {
          const cycle = getSingle(row.school_cycles);
          const school = getSingle(cycle?.schools);
          if (!cycle || !school?.name_zh) continue;
          if (!matchesStudentGender(gender, school.gender_policy)) continue;

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
            dateLabel: formatCardDateFull(new Date(row.start_at)),
            timeLabel: row.time_label ?? null,
          });
        }

        setPublicEvents(schoolList);
        setFeaturedEvents(
          mapFeaturedEvents((featuredRes.data ?? []) as FeaturedEventRow[], gender, null),
        );
      })
      .catch((error) => {
        console.error('Error loading upcoming events:', error);
        if (active) {
          setPublicEvents([]);
          setFeaturedEvents([]);
        }
      });

    return () => {
      active = false;
    };
  }, [gender, applicationType, schoolNamesKey, isPersonalBoard]);

  const sourceEvents = isPersonalBoard ? buildBoardEvents(schools ?? []) : publicEvents;
  const isLoading = sourceEvents === null || featuredEvents === null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const events = isLoading
    ? []
    : [...sourceEvents, ...featuredEvents]
        .filter((event) => new Date(event.startAt).getTime() >= todayStart.getTime())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, MAX_EVENTS);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className={`flex h-full w-full flex-col rounded-[2rem] p-5 shadow-2xl lg:p-6 ${
        board
          ? 'border-4 border-indigo-300 bg-gradient-to-b from-white via-white to-indigo-50/80'
          : 'bg-white'
      }`}
     >
       <div className="flex flex-shrink-0 items-center justify-between gap-3">
         <div className="flex items-center gap-2.5">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
             <CalendarClock className="h-4 w-4 text-white" />
           </div>
           <h2 className={`text-base font-black text-slate-900 ${board ? 'theme-gradient-text' : ''}`}>近期重點事件</h2>
         </div>
       </div>

      <div className="mt-3 flex flex-1 flex-col divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            正在載入近期事件...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-sm leading-7 text-slate-400">
            {board ? (
              <>
                近期暫無已確認的重點事件
                <br />
                加入學校或新增面試日期後會顯示在這裡
              </>
            ) : (
              <>
                近期暫無已公佈的學校活動
                <br />
                晚點再回來看看
              </>
            )}
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
                <div
                className={`flex w-12 flex-shrink-0 flex-col items-center rounded-lg py-1 ${
                  board ? 'theme-gradient shadow-md' : 'bg-indigo-50'
                }`}
              >
                <span
                  className={`text-base font-black leading-tight ${
                    board ? 'text-white' : 'text-indigo-700'
                  }`}
                >
                  {date.getDate()}
                </span>
                <span className={`text-[10px] font-bold ${board ? 'text-white/80' : 'text-indigo-400'}`}>
                  {date.getMonth() + 1}月
                </span>
              </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-800">{event.schoolName}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {event.eventLabel}
                    {board ? ` · ${event.dateLabel}` : formatEventTime(event.startAt, event.timeLabel)}
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
