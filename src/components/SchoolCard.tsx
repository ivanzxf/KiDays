'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { DashboardSchool, SchoolEntryPoint, StudentTask } from '@/types';
import { School as SchoolIcon, CheckCircle2, X, Move, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatCardDateTime, getDateParts, isDatePending, NA_LABEL, TBD_LABEL } from '@/lib/formatEventDateLabel';
import { useApp } from '@/context/AppContext';

type DragHandleListeners = Record<string, Function>;

/** 將 <input type="date"> 的 YYYY-MM-DD 值解析為本地日期（避免時區偏移）。 */
function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 資料庫 TIME 值（"10:45" / "10:45:00"）→ <input type="time"> 用的 "10:45"。 */
function toTimeInputValue(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/** 以「香港時區」取得日期的 YYYY-MM-DD 鍵，供跨時區比較。 */
function getHkDateKey(value: string | Date): string {
  const p = getDateParts(value instanceof Date ? value : new Date(value));
  const monthIndex =
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(p.month) + 1;
  return `${p.year}-${String(monthIndex).padStart(2, '0')}-${String(Number(p.day)).padStart(2, '0')}`;
}

/** 放榜日是否已到（今天 >= 放榜日）；無日期視為未到。 */
function isResultReleased(startAt?: string | null): boolean {
  if (!startAt) return false;
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return false;
  return getHkDateKey(new Date()) >= getHkDateKey(start);
}

interface SchoolCardProps {
  school: DashboardSchool;
  onTaskUpdate?: (schoolId: string, tasks: StudentTask[], applicationId?: string) => void;
  onDelete?: (schoolId: string) => void;
  onAddCustomEvent?: (schoolId: string, title: string, startAt: string, applicationId?: string) => void;
  onRemoveCustomEvent?: (schoolId: string, customEventId: string, applicationId?: string) => void;
  onRestoreDate?: (schoolId: string, taskId: string, applicationId?: string) => void;
  onUpdateResult?: (
    schoolId: string,
    resultStatus: 'offered' | 'waitlisted' | 'rejected' | null,
    applicationId?: string,
  ) => void;
  dragHandleAttributes?: React.HTMLAttributes<HTMLDivElement>;
  dragHandleListeners?: DragHandleListeners;
  dragHandleRef?: (element: HTMLElement | null) => void;
  isOverlay?: boolean;
}

/** 結果三態配置：選中深色高亮，未選淡色。 */
const RESULT_OPTIONS: {
  value: 'offered' | 'waitlisted' | 'rejected';
  label: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: 'offered',
    label: '取錄',
    activeClass: 'bg-green-600 border-green-600 text-white',
    idleClass: 'border-green-200 bg-green-50 text-green-700',
  },
  {
    value: 'waitlisted',
    label: '候補',
    activeClass: 'bg-amber-400 border-amber-400 text-white',
    idleClass: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  {
    value: 'rejected',
    label: '落選',
    activeClass: 'bg-rose-400 border-rose-400 text-white',
    idleClass: 'border-rose-200 bg-rose-50 text-rose-500',
  },
];

const RESULT_BADGE: Record<'offered' | 'waitlisted' | 'rejected', { label: string; className: string }> = {
  offered: { label: '已取錄', className: 'bg-green-50 text-green-700' },
  waitlisted: { label: '候補中', className: 'bg-amber-50 text-amber-600' },
  rejected: { label: '落選', className: 'bg-rose-50 text-rose-500' },
};

export default function SchoolCard({
  school,
  onTaskUpdate,
  onDelete,
  onAddCustomEvent,
  onRemoveCustomEvent,
  onRestoreDate,
  onUpdateResult,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  isOverlay = false,
}: SchoolCardProps) {
  const { id, nameZh } = school;
  const { currentStudent } = useApp();

  // 記憶「最後使用的入口」（Prep / Year 1）：以 學生+學校 為鍵，存於 localStorage
  const entryPreferenceKey = currentStudent
    ? `kidays.activeEntry.${currentStudent.id}.${school.id}`
    : null;

  // 同校多入口（Prep Year / Year 1）；防呆：無 entryPoints 時退回 legacy 單一入口
  const entryPoints: SchoolEntryPoint[] =
    (school.entryPoints ?? []).length > 0
      ? school.entryPoints!
      : school.studentApplicationId
        ? [
            {
              studentApplicationId: school.studentApplicationId,
              applicationLevel: 'primary',
              isRollingAdmission: school.isRollingAdmission,
              tasks: school.tasks,
            },
          ]
        : [];

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const activeEntry: SchoolEntryPoint | null =
    entryPoints.find((entry) => entry.studentApplicationId === activeEntryId) ??
    entryPoints.find((entry) => entry.applicationLevel === 'primary') ??
    entryPoints[0] ??
    null;

  // 讀回上次使用的入口（Prep / Year 1）；換學生或首次開啟時套用，無記憶時退回 Year 1
  useEffect(() => {
    if (!entryPreferenceKey) {
      setActiveEntryId(null);
      return;
    }
    try {
      const saved = localStorage.getItem(entryPreferenceKey);
      setActiveEntryId(
        saved && entryPoints.some((entry) => entry.studentApplicationId === saved)
          ? saved
          : null,
      );
    } catch {
      setActiveEntryId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPreferenceKey]);

  const handleSelectEntry = (applicationId: string) => {
    setActiveEntryId(applicationId);
    if (entryPreferenceKey) {
      try {
        localStorage.setItem(entryPreferenceKey, applicationId);
      } catch {
        /* ignore */
      }
    }
  };

  const [localTasks, setLocalTasks] = useState<StudentTask[]>(activeEntry?.tasks ?? []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrollIndicator, setScrollIndicator] = useState({ topPct: 0, heightPct: 0 });
  const [listHeight, setListHeight] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState('');
  const [editTimeValue, setEditTimeValue] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDateValue, setCustomDateValue] = useState('');

  // 切換入口或上層資料更新時，同步顯示該入口的事件
  useEffect(() => {
    setLocalTasks(activeEntry?.tasks ?? []);
  }, [activeEntry?.studentApplicationId, activeEntry?.tasks]);

  // 動態測量「前 6 行」的真實高度：卡片高度 = 6 行高度，
  // 所以剛好 6 行的卡片不會出現滾動條，超過 6 行才在內部滾動；
  // 不足 6 行（例如 Rolling 學校只有 5 行）時補足到 6 行高度，與一般卡片同尺寸
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const gap = 6; // space-y-1.5 = 0.375rem = 6px
    const children = Array.from(el.children) as HTMLElement[];
    const count = Math.min(6, children.length);
    let height = 0;
    for (let i = 0; i < count; i++) {
      height += children[i].offsetHeight;
      if (i < count - 1) height += gap;
    }
    if (children.length > 0 && children.length < 6) {
      const rowHeight = children[0].offsetHeight;
      height += (6 - children.length) * (rowHeight + gap);
    }
    setListHeight(height);
  }, [localTasks]);

  // 偵測事件區是否超過可視高度；超過時顯示常駐滾動指示條，並追蹤捲動位置
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      const heightPct = Math.max(8, (el.clientHeight / el.scrollHeight) * 100);
      setHasOverflow(max > 2);
      setScrollIndicator({
        heightPct,
        topPct: max > 0 ? (el.scrollTop / max) * (100 - heightPct) : 0,
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [localTasks, listHeight]);

  const handleTaskToggle = (taskId: string) => {
    const targetTask = localTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.is_toggleable === false || targetTask.is_available === false || targetTask.is_result === true) {
      return;
    }

    const toggledAt = !targetTask.completed ? new Date().toISOString() : null;

    const newTasks = localTasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, completed_at: toggledAt }
        : task
    );
    setLocalTasks(newTasks);
    if (onTaskUpdate) {
      onTaskUpdate(id, newTasks, activeEntry?.studentApplicationId);
    }
  };

  /** 目前該申請的結果狀態（offered / waitlisted / rejected），未標註為 null。 */
  const currentResultStatus: 'offered' | 'waitlisted' | 'rejected' | null = (() => {
    const status = activeEntry?.applicationStatus;
    return status === 'offered' || status === 'waitlisted' || status === 'rejected' ? status : null;
  })();

  /** 結果行三態選擇：再點一次已選狀態＝清除。 */
  const handleResultSelect = (task: StudentTask, status: 'offered' | 'waitlisted' | 'rejected') => {
    if (
      task.is_result !== true ||
      task.is_available === false ||
      task.date_status !== 'confirmed' ||
      !isResultReleased(task.start_at)
    ) {
      return;
    }
    if (!onUpdateResult) return;
    const next = currentResultStatus === status ? null : status;
    onUpdateResult(id, next, activeEntry?.studentApplicationId);
  };

  const openEditDate = (task: StudentTask) => {
    setEditingTaskId(task.id);
    const override = task.private_override;
    setEditDateValue(override?.start_at ?? '');
    setEditTimeValue(toTimeInputValue(override?.start_time));
  };

  const closeEditDate = () => {
    setEditingTaskId(null);
    setEditDateValue('');
    setEditTimeValue('');
  };

  const saveEditDate = () => {
    if (!editingTaskId) return;
    const date = parseDateInput(editDateValue);
    if (!date) return;

    const startAt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const startTime = editTimeValue || null;
    const dateLabel = formatCardDateTime(date, startTime);

    const newTasks = localTasks.map(task =>
      task.id === editingTaskId
        ? {
            ...task,
            description: dateLabel,
            date_status: 'confirmed' as const,
            start_at: startAt,
            is_toggleable: true,
            is_available: true,
            private_override: {
              date_label: dateLabel,
              start_at: startAt,
              start_time: startTime,
            },
          }
        : task
    );
    setLocalTasks(newTasks);
    if (onTaskUpdate) {
      onTaskUpdate(id, newTasks, activeEntry?.studentApplicationId);
    }
    closeEditDate();
  };

  const editingTask = localTasks.find((task) => task.id === editingTaskId) ?? null;

  // 右上角按鈕區（拖曳把手＋刪除鈕）在手機為 44px 觸控目標，
  // 標題列需預留相同寬度，避免標題／入口切換鈕被壓在按鈕底下。
  const actionClusterPadding = onDelete ? 'pr-[96px] sm:pr-[84px]' : 'pr-[52px] sm:pr-[44px]';

  const handleRestoreDate = () => {
    if (!editingTaskId || !onRestoreDate) return;
    onRestoreDate(id, editingTaskId, activeEntry?.studentApplicationId);
    closeEditDate();
  };

  const closeAddCustom = () => {
    setShowAddCustom(false);
    setCustomTitle('');
    setCustomDateValue('');
  };

  const saveAddCustom = () => {
    if (!customTitle.trim() || !customDateValue || !onAddCustomEvent) return;
    onAddCustomEvent(id, customTitle.trim(), customDateValue, activeEntry?.studentApplicationId);
    closeAddCustom();
  };

  return (
    <>
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
      {!isOverlay && (
        <div className="absolute right-0 top-0 flex items-center gap-1">
          <div
            ref={dragHandleRef}
            {...dragHandleAttributes}
            {...dragHandleListeners}
            aria-label="按住拖曳排序"
            title="按住拖曳排序"
            className="flex h-11 w-11 cursor-grab touch-none select-none items-center justify-center rounded-md text-slate-400 transition-colors [-webkit-touch-callout:none] active:bg-slate-100 active:text-slate-700 active:cursor-grabbing hover:theme-text sm:h-9 sm:w-9"
          >
            <Move className="h-5 w-5 sm:h-4 sm:w-4" />
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              aria-label="刪除學校"
              title="刪除學校"
              className="flex h-11 w-11 items-center justify-center rounded-md text-slate-400 transition-colors active:bg-slate-100 hover:text-red-500 sm:h-9 sm:w-9"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      )}

      <div className={`mb-1 min-h-[48px] ${actionClusterPadding}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 flex-shrink-0 self-center rounded-lg theme-solid flex items-center justify-center">
            <SchoolIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1 self-center">
            <h3 className="break-words whitespace-normal text-[15px] font-extrabold leading-5 text-slate-800">
              {nameZh}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              {activeEntry?.isRollingAdmission && (
                <span className="inline-flex w-fit items-center rounded bg-primary-soft px-2 py-0.5 text-[9px] font-bold leading-4 text-primary">
                  Rolling Admissions
                </span>
              )}
              {currentResultStatus && (
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9px] font-bold leading-4 ${RESULT_BADGE[currentResultStatus].className}`}
                >
                  {RESULT_BADGE[currentResultStatus].label}
                </span>
              )}
            </div>
          </div>
          {entryPoints.length > 1 && (
            <div className="flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
              {entryPoints.map((entry) => {
                const isActive = entry.studentApplicationId === activeEntry?.studentApplicationId;
                const label = entry.applicationLevel === 'kindergarten' ? 'Prep' : 'Year 1';
                return (
                  <button
                    key={entry.studentApplicationId}
                    type="button"
                    onClick={() => handleSelectEntry(entry.studentApplicationId)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold leading-4 transition-colors ${
                      isActive ? 'theme-solid text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Tasks */}
      {/* 固定 6 行高度；事件超過 6 行時在卡片內部滾動，卡片本身不變高 */}
      <div className="relative mt-3" style={{ height: listHeight ?? 'auto' }}>
        <div
          ref={scrollRef}
          className={`h-full space-y-1.5 pr-10 ${
            hasOverflow ? 'card-scrollbar' : 'overflow-y-hidden'
          }`}
        >
        {localTasks.length > 0 ? localTasks.map((task, index) => {
          const isResultRow = task.is_result === true;
          // 結果行可操作條件：事件存在、日期已確認、且今天已到放榜日；
          // TBD／N/A／放榜日未到 時整組禁用
          const resultDisabled =
            isResultRow &&
            (task.is_available === false ||
              task.date_status !== 'confirmed' ||
              !isResultReleased(task.start_at));
          return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group flex items-start space-x-2 rounded-lg px-2 py-1.5 transition-colors ${
              task.is_available === false ? 'opacity-60' : 'hover:bg-slate-50'
            }`}
          >
            {isResultRow ? (
              /* 結果公佈行：三態結果按鈕，與標題同一行；已選一態時其餘轉灰 */
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <label className="flex-shrink-0 text-[12px] font-semibold leading-5 text-slate-600 group-hover:theme-text">
                  {task.title}
                </label>
                <div className={`flex min-w-0 items-center gap-1 ${resultDisabled ? 'opacity-50' : ''}`}>
                  {RESULT_OPTIONS.map((option) => {
                    const selected = currentResultStatus === option.value;
                    const dimmed = currentResultStatus !== null && !selected;
                    const disabled = resultDisabled || dimmed;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleResultSelect(task, option.value)}
                        disabled={disabled}
                        aria-pressed={selected}
                        className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold leading-4 transition-colors disabled:cursor-not-allowed ${
                          selected
                            ? option.activeClass
                            : dimmed
                              ? 'border-slate-200 bg-slate-100 text-slate-400'
                              : option.idleClass
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative ml-auto flex flex-shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-5 ${
                      task.description === NA_LABEL || task.is_available === false
                        ? 'bg-slate-100 text-slate-400'
                      : isDatePending(task.date_status, undefined, task.description)
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {task.description ?? TBD_LABEL}
                  </span>
                  {task.is_editable_date && !isOverlay && (
                    <button
                      type="button"
                      onClick={() => openEditDate(task)}
                      disabled={task.completed}
                      className={`absolute left-full top-1/2 ml-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
                        task.completed
                          ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                          : 'theme-solid text-white hover:opacity-90'
                      }`}
                      title={task.completed ? '已完成，無法編輯' : '自定義結果公佈日期與時間'}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {task.is_custom && !isOverlay && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomEvent?.(id, task.id, activeEntry?.studentApplicationId)}
                      className="absolute left-full top-1/2 ml-1 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-slate-200 transition-colors hover:text-red-400"
                      title="刪除自訂事件"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTaskToggle(task.id)}
              disabled={task.is_toggleable === false || task.is_available === false}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                task.completed
                  ? 'border-transparent theme-solid'
                  : task.is_toggleable === false || task.is_available === false
                    ? 'border-slate-100 bg-slate-50'
                  : 'border-slate-200 group-hover:theme-border'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </motion.button>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <label
                className={`min-w-0 flex-1 text-[12px] font-semibold leading-5 transition-colors ${
                  task.completed
                    ? 'text-slate-300 line-through'
                    : task.is_available === false
                      ? 'text-slate-400'
                    : 'text-slate-600 group-hover:theme-text'
                }`}
              >
                {task.title}
              </label>
              <div className="relative flex flex-shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-5 ${
                    task.completed
                      ? 'bg-slate-100 text-slate-300 line-through'
                      : task.description === NA_LABEL || task.is_available === false
                        ? 'bg-slate-100 text-slate-400'
                      : isDatePending(task.date_status, undefined, task.description)
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {task.description ?? TBD_LABEL}
                </span>
                {task.is_editable_date && !isOverlay && (
                  <button
                    type="button"
                    onClick={() => openEditDate(task)}
                    disabled={task.completed}
                    className={`absolute left-full top-1/2 ml-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
                      task.completed
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'theme-solid text-white hover:opacity-90'
                    }`}
                    title={task.completed ? '已完成，無法編輯' : '自定義面試日期與時間'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {task.is_custom && !isOverlay && (
                  <button
                    type="button"
                    onClick={() => onRemoveCustomEvent?.(id, task.id, activeEntry?.studentApplicationId)}
                    className="absolute left-full top-1/2 ml-1 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-slate-200 transition-colors hover:text-red-400"
                    title="刪除自訂事件"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
              </>
            )}
          </motion.div>
          );
        }) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs font-semibold text-slate-400">
            這間學校暫時還沒有可勾選的申請項目
          </div>
        )}
        </div>
        {hasOverflow && (
          <div className="pointer-events-none absolute right-1.5 top-1 bottom-1 w-1 rounded-full bg-slate-200/80">
            <div
              className="absolute left-0 w-full rounded-full bg-slate-400/90"
              style={{
                top: `${scrollIndicator.topPct}%`,
                height: `${scrollIndicator.heightPct}%`,
              }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowAddCustom(true)}
        className={`${isOverlay ? 'invisible' : ''} mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600`}
        title="新增自訂事件"
      >
        <Plus className="h-3 w-3" />
        新增自訂事件
      </button>
    </div>
    {editingTask &&
      createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={closeEditDate} />
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-base font-bold text-slate-800">
              自定義「{editingTask.title}」日期與時間
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              學校只公佈日期區間時，請填上您的實際日期；如已知道具體時間，也可一併填寫。
            </p>
            <label className="mt-4 block text-[11px] font-semibold text-slate-500">日期</label>
            <input
              type="date"
              value={editDateValue}
              onChange={(event) => setEditDateValue(event.target.value)}
              className="mt-1 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
            />
            <label className="mt-3 block text-[11px] font-semibold text-slate-500">
              時間（選填，24 小時制）
            </label>
            <div className="mt-1 flex items-center gap-2">
              <select
                value={editTimeValue ? editTimeValue.slice(0, 2) : ''}
                onChange={(event) =>
                  setEditTimeValue(
                    event.target.value
                      ? `${event.target.value}:${editTimeValue.slice(3, 5) || '00'}`
                      : '',
                  )
                }
                className="flex-1 rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
              >
                <option value="">--</option>
                {Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-sm font-semibold text-slate-400">:</span>
              <select
                value={editTimeValue ? editTimeValue.slice(3, 5) : ''}
                onChange={(event) =>
                  setEditTimeValue(
                    event.target.value
                      ? `${editTimeValue.slice(0, 2) || '00'}:${event.target.value}`
                      : '',
                  )
                }
                className="flex-1 rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
              >
                <option value="">--</option>
                {Array.from(new Set(['00', '15', '30', '45', editTimeValue.slice(3, 5)]))
                  .filter(Boolean)
                  .map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              {editingTask.private_override?.start_at ? (
                <button
                  type="button"
                  onClick={handleRestoreDate}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 underline decoration-dotted transition-colors hover:text-slate-600"
                >
                  還原為學校日期
                </button>
              ) : (
                <span />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditDate}
                  className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveEditDate}
                  disabled={!editDateValue}
                  className="theme-solid rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    {showAddCustom &&
      createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={closeAddCustom} />
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-base font-bold text-slate-800">新增自訂事件</h3>
            <p className="mt-1 text-xs text-slate-500">
              記錄學校未公佈、但對您重要的日子，例如三面、簡介會第二場等。
            </p>
            <input
              type="text"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="事件名稱（例如：三面）"
              className="mt-4 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
            />
            <input
              type="date"
              value={customDateValue}
              onChange={(event) => setCustomDateValue(event.target.value)}
              className="mt-3 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAddCustom}
                className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveAddCustom}
                disabled={!customTitle.trim() || !customDateValue}
                className="theme-solid rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              >
                新增
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
