import type { SchoolEventDateStatus, StudentTask, StudentTaskPrivateOverride } from '@/types';
import {
  CUSTOM_DATE_LABEL,
  formatCardDateFull,
  formatCardRange,
  formatSchoolCardDateLabel,
  NA_EVENT_SENTINEL,
  NA_LABEL,
  TBD_LABEL,
} from '@/lib/formatEventDateLabel';
import { resolveSchoolEventTitleZh } from '@/lib/schoolMetadata';

type SchoolCardEventRow = {
  id: string;
  title_zh: string | null;
  event_type: string;
  date_status?: SchoolEventDateStatus | null;
  sequence_no: number | null;
  start_at: string | null;
  end_at?: string | null;
  /** 是否為家長自訂事件（存在於私有表，非學校主資料）。 */
  is_custom?: boolean;
  custom_completed?: boolean;
  custom_completed_at?: string | null;
};

/** 家長自訂事件（來自 student_application_custom_events）。 */
export type SchoolCardCustomEvent = {
  id: string;
  title_zh: string;
  start_at: string;
  completed: boolean;
  completed_at: string | null;
};

type StudentApplicationProgressRow = {
  student_application_id: string;
  school_event_id: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at: string | null;
};

type BuildSchoolCardTasksParams = {
  schoolId: string;
  studentApplicationId: string;
  events: SchoolCardEventRow[];
  progressMap: Map<string, StudentApplicationProgressRow>;
  appliedAt?: string | null;
  /**
   * 家長私有覆蓋：key = `${studentApplicationId}:${schoolEventId}`（學校事件）
   * 或 `${studentApplicationId}:title:${title}`（Rolling 學校固定行）。
   * 顯示優先權：私有覆蓋 > 學校公開資訊 > TBD/N/A。
   */
  overrides?: Map<string, SchoolCardOverride>;
  /** 家長自訂事件：按日期插入標準 6 行之間。 */
  customEvents?: SchoolCardCustomEvent[];
  /** Rolling Admissions：5 行固定（學校參觀/學校申請/一面/二面/結果公佈），日期全部自填。 */
  isRollingAdmission?: boolean;
};

/** 家長私有覆蓋值。 */
export type SchoolCardOverride = {
  start_at: string;
  completed?: boolean;
  completed_at?: string | null;
};

/** 單卡固定顯示的 6 個標準列。 */
const CARD_ROW_CONFIG = [
  { key: 'open_day', title: '開放日', toggleable: true },
  { key: 'info_session', title: '簡介會', toggleable: true },
  { key: 'school_application', title: '學校申請', toggleable: true },
  { key: 'first_interview', title: '一面', toggleable: true },
  { key: 'second_interview', title: '二面', toggleable: true },
  { key: 'result_release', title: '結果公佈', toggleable: false },
] as const;

/** 會被標準列消耗「第一筆」的 event_type；多出來的才算額外事件。 */
const STANDARD_SINGLE_EVENT_TYPES = new Set<string>([
  'open_day',
  'info_session',
  'first_interview',
  'second_interview',
  'result_release',
]);

/** Rolling Admissions 學校的固定 5 行：無學校事件，日期全部由家長自填。 */
const ROLLING_ROW_CONFIG = [
  { key: 'school_tour', title: '學校參觀', completionSource: 'progress' as const },
  { key: 'school_application', title: '學校申請', completionSource: 'application' as const },
  { key: 'first_interview', title: '一面', completionSource: 'progress' as const },
  { key: 'second_interview', title: '二面', completionSource: 'progress' as const },
  { key: 'result_release', title: '結果公佈', completionSource: 'progress' as const },
];

type EventState = 'na' | 'tbd' | 'confirmed';

/**
 * 判斷某事件的狀態：
 * - 明確不存在（date_status=na，或 CSV 的 NA_EVENT 哨兵值）→ 'na'，卡片顯示 N/A、不可勾選
 * - 存在但日期未定（date_status=tbd 或無日期）→ 'tbd'
 * - 完全沒有這條 row → 保守視為 'tbd'，避免把「查不到」誤判成「不存在」
 */
function getEventState(event: SchoolCardEventRow | null | undefined): EventState {
  if (!event) return 'tbd';
  const status = event.date_status;
  const start = event.start_at;
  if (status === 'na' || start === NA_EVENT_SENTINEL) return 'na';
  if (status === 'tbd' || !start) return 'tbd';
  return 'confirmed';
}

function sortEvents(events: SchoolCardEventRow[]): SchoolCardEventRow[] {
  return [...events].sort((a, b) => {
    if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at);
    return (a.sequence_no ?? 0) - (b.sequence_no ?? 0);
  });
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function createBaseTask(params: {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  sortOrder: number;
  dateStatus?: SchoolEventDateStatus | null;
  sourceEventIds?: string[];
  completionSource: 'progress' | 'application';
  isToggleable: boolean;
  isAvailable: boolean;
  isEditableDate?: boolean;
  privateOverride?: StudentTaskPrivateOverride | null;
  isCustom?: boolean;
  completed: boolean;
  completedAt?: string | null;
}): StudentTask {
  const now = new Date().toISOString();

  return {
    id: params.id,
    school_id: params.schoolId,
    title: params.title,
    description: params.description,
    date_status: params.dateStatus ?? null,
    source_event_ids: params.sourceEventIds ?? [],
    completion_source: params.completionSource,
    is_toggleable: params.isToggleable,
    is_available: params.isAvailable,
    is_editable_date: params.isEditableDate ?? false,
    private_override: params.privateOverride ?? null,
    is_custom: params.isCustom ?? false,
    completed: params.completed,
    completed_at: params.completed ? params.completedAt ?? now : null,
    sort_order: params.sortOrder,
    created_at: now,
    updated_at: now,
  };
}

function buildSingleEventTask(params: {
  schoolId: string;
  studentApplicationId: string;
  sortOrder: number;
  title: string;
  eventType: string;
  eventsByType: Map<string, SchoolCardEventRow[]>;
  progressMap: Map<string, StudentApplicationProgressRow>;
  isToggleable: boolean;
  /** 家長自訂日期（僅一面／二面），有值時優先顯示並可勾選。 */
  overrideDate?: Date | null;
  /** 自訂日期的原始字串（YYYY-MM-DD），寫入 private_override 用。 */
  overrideStartAt?: string | null;
}): StudentTask {
  const event = params.eventsByType.get(params.eventType)?.[0] ?? null;
  const state = getEventState(event);
  // 只有一面／二面開放家長自訂日期；事件明確不存在（N/A）時不開放
  const isInterviewEvent =
    params.eventType === 'first_interview' || params.eventType === 'second_interview';
  // 覆蓋優先權：家長自訂 > 學校公開資訊 > TBD
  const effectiveState =
    params.overrideDate && isInterviewEvent ? 'confirmed' : state;

  if (state === 'na') {
    return createBaseTask({
      id: `card-${params.eventType}-na`,
      schoolId: params.schoolId,
      title: params.title,
      description: NA_LABEL,
      sortOrder: params.sortOrder,
      dateStatus: 'na',
      sourceEventIds: [],
      completionSource: 'progress',
      isToggleable: false,
      isAvailable: false,
      completed: false,
    });
  }

  const progress = event
    ? params.progressMap.get(`${params.studentApplicationId}:${event.id}`)
    : undefined;

  return createBaseTask({
    id: event?.id ?? `card-${params.eventType}-tbd`,
    schoolId: params.schoolId,
    title: params.title,
    description:
      effectiveState === 'tbd' || !event
        ? TBD_LABEL
        : params.overrideDate
          ? formatCardDateFull(params.overrideDate)
          : formatSchoolCardDateLabel(event.start_at, event.date_status),
    sortOrder: params.sortOrder,
    dateStatus: effectiveState,
    sourceEventIds: event ? [event.id] : [],
    completionSource: 'progress',
    // 只有日期已確認（confirmed）才可勾選；日期待定＝事件尚未開放，禁掉
    // 但一面／二面仍開放家長自訂日期（is_editable_date），輸入後即可勾選
    isToggleable: params.isToggleable && effectiveState === 'confirmed',
    isAvailable: true,
    isEditableDate: isInterviewEvent,
    privateOverride:
      params.overrideDate && isInterviewEvent
        ? {
            date_label: formatCardDateFull(params.overrideDate),
            start_at: params.overrideStartAt ?? null,
          }
        : null,
    completed: progress?.status === 'completed',
    completedAt: progress?.completed_at,
  });
}

function buildApplicationTask(params: {
  schoolId: string;
  sortOrder: number;
  eventsByType: Map<string, SchoolCardEventRow[]>;
  appliedAt?: string | null;
}): StudentTask {
  const applicationOpen = params.eventsByType.get('application_open')?.[0] ?? null;
  const applicationDeadline = params.eventsByType.get('application_deadline')?.[0] ?? null;
  const openState = getEventState(applicationOpen);
  const deadlineState = getEventState(applicationDeadline);

  const bothAbsent =
    (!applicationOpen || openState === 'na') &&
    (!applicationDeadline || deadlineState === 'na');

  if (bothAbsent) {
    return createBaseTask({
      id: 'card-school-application-na',
      schoolId: params.schoolId,
      title: '學校申請',
      description: NA_LABEL,
      sortOrder: params.sortOrder,
      dateStatus: 'na',
      sourceEventIds: [],
      completionSource: 'application',
      isToggleable: false,
      isAvailable: false,
      completed: false,
    });
  }

  const openDate =
    applicationOpen && openState === 'confirmed' ? parseDate(applicationOpen.start_at) : null;
  const deadlineDate =
    applicationDeadline && deadlineState === 'confirmed'
      ? parseDate(applicationDeadline.start_at)
      : null;

  // 兩端都是 TBD → 日期待定、禁勾
  if (!openDate && !deadlineDate) {
    return createBaseTask({
      id: 'card-school-application-tbd',
      schoolId: params.schoolId,
      title: '學校申請',
      description: TBD_LABEL,
      sortOrder: params.sortOrder,
      dateStatus: 'tbd',
      sourceEventIds: [
        applicationOpen ? applicationOpen.id : undefined,
        applicationDeadline ? applicationDeadline.id : undefined,
      ].filter((value): value is string => Boolean(value)),
      completionSource: 'application',
      isToggleable: false,
      isAvailable: true,
      completed: false,
    });
  }

  // 正常情況：開始與截止都有日期 → 顯示區間（同年只顯示一次年份，跨年兩端都帶年）
  let label: string;
  let dateStatus: SchoolEventDateStatus;
  if (openDate && deadlineDate) {
    label = formatCardRange(openDate, deadlineDate);
    dateStatus = 'confirmed';
  } else if (deadlineDate) {
    // 防呆：只有截止（理論上不會發生，因為都會提供開始日期）
    label = formatCardDateFull(deadlineDate);
    dateStatus = 'tbd';
  } else {
    // 防呆：只有開始
    label = `${formatCardDateFull(openDate!)} 起`;
    dateStatus = 'tbd';
  }

  return createBaseTask({
    id: 'card-school-application',
    schoolId: params.schoolId,
    title: '學校申請',
    description: label,
    sortOrder: params.sortOrder,
    dateStatus,
    sourceEventIds: [
      applicationOpen && openState !== 'na' ? applicationOpen.id : undefined,
      applicationDeadline && deadlineState !== 'na'
        ? applicationDeadline.id
        : undefined,
    ].filter((value): value is string => Boolean(value)),
    completionSource: 'application',
    isToggleable: dateStatus === 'confirmed',
    isAvailable: true,
    completed: Boolean(params.appliedAt),
    completedAt: params.appliedAt ?? null,
  });
}

/** 額外事件（第 8、9 行等）：名稱取自 CSV 的 title_zh，勾選規則與標準行一致。 */
function buildExtraEventTask(params: {
  schoolId: string;
  studentApplicationId: string;
  event: SchoolCardEventRow;
  progressMap: Map<string, StudentApplicationProgressRow>;
}): { task: StudentTask; date: Date | null } {
  const { event } = params;
  const state = getEventState(event);
  const date = state === 'confirmed' ? parseDate(event.start_at) : null;

  if (state === 'na') {
    return {
      task: createBaseTask({
        id: `card-extra-${event.id}-na`,
        schoolId: params.schoolId,
        title: resolveSchoolEventTitleZh(event),
        description: NA_LABEL,
        sortOrder: 0,
        dateStatus: 'na',
        sourceEventIds: [event.id],
        completionSource: 'progress',
        isToggleable: false,
        isAvailable: false,
        completed: false,
      }),
      date: null,
    };
  }

  const progress = params.progressMap.get(`${params.studentApplicationId}:${event.id}`);
  const isCustom = event.is_custom === true;
  return {
    task: createBaseTask({
      id: event.id,
      schoolId: params.schoolId,
      title: resolveSchoolEventTitleZh(event),
      description:
        state === 'tbd'
          ? TBD_LABEL
          : formatSchoolCardDateLabel(event.start_at, event.date_status),
      sortOrder: 0,
      dateStatus: state,
      sourceEventIds: [event.id],
      completionSource: 'progress',
      isToggleable: state === 'confirmed',
      isAvailable: true,
      isCustom,
      // 自訂事件的勾選狀態直接來自私有表，而非 student_application_progress
      completed: isCustom ? event.custom_completed === true : progress?.status === 'completed',
      completedAt: isCustom ? event.custom_completed_at ?? null : progress?.completed_at,
    }),
    date,
  };
}

type CardRow = { task: StudentTask; date: Date | null };

/**
 * Rolling Admissions 學校的固定行：沒有對應學校事件，
 * 日期由家長自填（title-keyed 覆蓋），填了日期後才可勾選。
 */
function buildRollingTask(params: {
  schoolId: string;
  key: string;
  title: string;
  sortOrder: number;
  completionSource: 'progress' | 'application';
  overrideRow?: SchoolCardOverride | null;
  appliedAt?: string | null;
}): CardRow {
  const overrideDate = params.overrideRow?.start_at ? parseDate(params.overrideRow.start_at) : null;

  return {
    task: createBaseTask({
      id: `rolling-${params.key}`,
      schoolId: params.schoolId,
      title: params.title,
      description: overrideDate ? formatCardDateFull(overrideDate) : CUSTOM_DATE_LABEL,
      sortOrder: params.sortOrder,
      dateStatus: overrideDate ? 'confirmed' : 'tbd',
      sourceEventIds: [],
      completionSource: params.completionSource,
      isToggleable: Boolean(overrideDate),
      isAvailable: true,
      isEditableDate: true,
      privateOverride: overrideDate
        ? {
            date_label: formatCardDateFull(overrideDate),
            start_at: params.overrideRow?.start_at ?? null,
          }
        : null,
      completed:
        params.completionSource === 'application'
          ? Boolean(params.appliedAt)
          : params.overrideRow?.completed === true,
      completedAt:
        params.completionSource === 'application'
          ? params.appliedAt ?? null
          : params.overrideRow?.completed_at ?? null,
    }),
    date: overrideDate,
  };
}

export function buildSchoolCardTasks({
  schoolId,
  studentApplicationId,
  events,
  progressMap,
  appliedAt,
  overrides,
  customEvents,
  isRollingAdmission,
}: BuildSchoolCardTasksParams): StudentTask[] {
  // 自訂事件轉成統一的事件 row，與學校事件一起參與「按日期插入」排序
  const customRows: SchoolCardEventRow[] = (customEvents ?? []).map((event) => ({
    id: event.id,
    title_zh: event.title_zh,
    event_type: 'custom',
    date_status: 'confirmed',
    sequence_no: null,
    start_at: event.start_at,
    is_custom: true,
    custom_completed: event.completed,
    custom_completed_at: event.completed_at,
  }));

  const allEvents = [...events, ...customRows];
  const eventsByType = new Map<string, SchoolCardEventRow[]>();

  for (const event of sortEvents(allEvents)) {
    const current = eventsByType.get(event.event_type) ?? [];
    current.push(event);
    eventsByType.set(event.event_type, current);
  }

  // 1. 標準行（固定順序）：一般學校 6 行；Rolling 學校 5 行（全部自填日期）
  const standardRows: CardRow[] = [];

  if (isRollingAdmission) {
    for (const config of ROLLING_ROW_CONFIG) {
      standardRows.push(
        buildRollingTask({
          schoolId,
          key: config.key,
          title: config.title,
          sortOrder: standardRows.length + 1,
          completionSource: config.completionSource,
          overrideRow: overrides?.get(`${studentApplicationId}:title:${config.title}`) ?? null,
          appliedAt: config.completionSource === 'application' ? appliedAt : undefined,
        }),
      );
    }
  } else {
  for (const config of CARD_ROW_CONFIG) {
    if (config.key === 'school_application') {
      const task = buildApplicationTask({
        schoolId,
        sortOrder: standardRows.length + 1,
        eventsByType,
        appliedAt,
      });
      const open = eventsByType.get('application_open')?.[0] ?? null;
      const close = eventsByType.get('application_deadline')?.[0] ?? null;
      const openDate =
        open && getEventState(open) === 'confirmed' ? parseDate(open.start_at) : null;
      const closeDate =
        close && getEventState(close) === 'confirmed' ? parseDate(close.start_at) : null;
      standardRows.push({ task, date: openDate ?? closeDate });
    } else {
      const event = eventsByType.get(config.key)?.[0] ?? null;
      const isInterview =
        config.key === 'first_interview' || config.key === 'second_interview';
      const override = event
        ? overrides?.get(`${studentApplicationId}:${event.id}`)?.start_at ?? null
        : null;
      const overrideDate = override ? parseDate(override) : null;
      const task = buildSingleEventTask({
        schoolId,
        studentApplicationId,
        sortOrder: standardRows.length + 1,
        title: config.title,
        eventType: config.key,
        eventsByType,
        progressMap,
        isToggleable: config.toggleable,
        overrideDate: isInterview ? overrideDate : null,
        overrideStartAt: isInterview ? override : null,
      });
      // 排序用的日期：優先採用家長自訂日期
      const date =
        isInterview && overrideDate
          ? overrideDate
          : event && getEventState(event) === 'confirmed'
            ? parseDate(event.start_at)
            : null;
      standardRows.push({ task, date });
    }
  }
  }

  // 2. 額外事件：標準型別的第二筆以後、以及所有非標準型別（三面/家長會/自訂…）
  //    Rolling 學校忽略學校事件，只保留自訂事件
  const extraRows: CardRow[] = [];
  for (const [type, list] of eventsByType) {
    if (isRollingAdmission && type !== 'custom') continue;
    if (type === 'application_open' || type === 'application_deadline' || STANDARD_SINGLE_EVENT_TYPES.has(type)) {
      for (const event of list.slice(1)) {
        extraRows.push(
          buildExtraEventTask({ schoolId, studentApplicationId, event, progressMap }),
        );
      }
    } else {
      for (const event of list) {
        extraRows.push(
          buildExtraEventTask({ schoolId, studentApplicationId, event, progressMap }),
        );
      }
    }
  }

  // 3. 合併：有日期的額外事件（含自訂事件）一律按日期插入標準行之間；沒日期的排在最後
  const datedExtras = extraRows
    .filter((row) => row.date)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const undatedExtras = extraRows.filter((row) => !row.date);

  const finalRows: CardRow[] = [];
  let extraIdx = 0;
  for (const standard of standardRows) {
    while (
      extraIdx < datedExtras.length &&
      standard.date &&
      datedExtras[extraIdx].date!.getTime() < standard.date.getTime()
    ) {
      finalRows.push(datedExtras[extraIdx]);
      extraIdx++;
    }
    finalRows.push(standard);
  }
  while (extraIdx < datedExtras.length) {
    finalRows.push(datedExtras[extraIdx]);
    extraIdx++;
  }
  for (const extra of undatedExtras) {
    finalRows.push(extra);
  }

  return finalRows.map((row, index) => ({ ...row.task, sort_order: index + 1 }));
}
