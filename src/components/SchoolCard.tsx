'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { DashboardSchool, SchoolEntryPoint, StudentTask } from '@/types';
import { School as SchoolIcon, CheckCircle2, X, Move, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatCardDateFull, isDatePending, NA_LABEL, TBD_LABEL } from '@/lib/formatEventDateLabel';

type DragHandleListeners = Record<string, Function>;

/** 將 <input type="date"> 的 YYYY-MM-DD 值解析為本地日期（避免時區偏移）。 */
function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface SchoolCardProps {
  school: DashboardSchool;
  onTaskUpdate?: (schoolId: string, tasks: StudentTask[], applicationId?: string) => void;
  onDelete?: (schoolId: string) => void;
  onAddCustomEvent?: (schoolId: string, title: string, startAt: string, applicationId?: string) => void;
  onRemoveCustomEvent?: (schoolId: string, customEventId: string, applicationId?: string) => void;
  onRestoreDate?: (schoolId: string, taskId: string, applicationId?: string) => void;
  dragHandleAttributes?: React.HTMLAttributes<HTMLDivElement>;
  dragHandleListeners?: DragHandleListeners;
  dragHandleRef?: (element: HTMLElement | null) => void;
  isOverlay?: boolean;
}

export default function SchoolCard({
  school,
  onTaskUpdate,
  onDelete,
  onAddCustomEvent,
  onRemoveCustomEvent,
  onRestoreDate,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  isOverlay = false,
}: SchoolCardProps) {
  const { id, nameZh } = school;

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

  const [localTasks, setLocalTasks] = useState<StudentTask[]>(activeEntry?.tasks ?? []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrollIndicator, setScrollIndicator] = useState({ topPct: 0, heightPct: 0 });
  const [listHeight, setListHeight] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState('');
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
    if (!targetTask || targetTask.is_toggleable === false || targetTask.is_available === false) {
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

  const openEditDate = (task: StudentTask) => {
    setEditingTaskId(task.id);
    setEditDateValue('');
  };

  const closeEditDate = () => {
    setEditingTaskId(null);
    setEditDateValue('');
  };

  const saveEditDate = () => {
    if (!editingTaskId) return;
    const date = parseDateInput(editDateValue);
    if (!date) return;

    const startAt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const newTasks = localTasks.map(task =>
      task.id === editingTaskId
        ? {
            ...task,
            description: formatCardDateFull(date),
            date_status: 'confirmed' as const,
            is_toggleable: true,
            is_available: true,
            private_override: {
              date_label: formatCardDateFull(date),
              start_at: startAt,
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
    <div className="relative h-full w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white/30 overflow-hidden flex flex-col">
      {!isOverlay && (
        <div className="absolute right-0 top-0 flex items-center gap-0">
          <div 
            ref={dragHandleRef}
            {...dragHandleAttributes}
            {...dragHandleListeners}
            className="flex h-8 w-8 items-center justify-center text-gray-400 transition-all hover:theme-text cursor-grab active:cursor-grabbing"
            title="按住拖拽排序"
          >
            <Move className="h-4 w-4" />
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="-ml-2 flex h-8 w-8 items-center justify-center text-gray-400 transition-all hover:text-red-500"
              title="刪除學校"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="mb-1 min-h-[48px] pr-1">
        <div className={`flex min-w-0 items-center gap-3 ${entryPoints.length > 1 ? 'pr-12' : ''}`}>
          <div className="h-11 w-11 flex-shrink-0 self-center rounded-xl theme-gradient flex items-center justify-center shadow-lg">
            <SchoolIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1 self-center">
            <h3 className="break-words whitespace-normal text-[15px] font-extrabold leading-5 text-gray-800">
              {nameZh}
            </h3>
            {activeEntry?.isRollingAdmission && (
              <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold leading-4 text-indigo-600">
                Rolling Admissions
              </span>
            )}
          </div>
          {entryPoints.length > 1 && (
            <div className="flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
              {entryPoints.map((entry) => {
                const isActive = entry.studentApplicationId === activeEntry?.studentApplicationId;
                const label = entry.applicationLevel === 'kindergarten' ? 'Prep' : 'Year 1';
                return (
                  <button
                    key={entry.studentApplicationId}
                    type="button"
                    onClick={() => setActiveEntryId(entry.studentApplicationId)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold leading-4 transition-colors ${
                      isActive ? 'theme-gradient text-white' : 'text-gray-500 hover:text-gray-700'
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
        {localTasks.length > 0 ? localTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group flex items-start space-x-2 rounded-xl px-2 py-1.5 transition-all ${
              task.is_available === false ? 'opacity-60' : 'hover:bg-gray-50'
            }`}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTaskToggle(task.id)}
              disabled={task.is_toggleable === false || task.is_available === false}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                task.completed
                  ? 'border-transparent theme-gradient'
                  : task.is_toggleable === false || task.is_available === false
                    ? 'border-gray-100 bg-gray-50'
                  : 'border-gray-200 group-hover:theme-border'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </motion.button>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <label
                className={`min-w-0 flex-1 text-[12px] font-semibold leading-5 transition-all ${
                  task.completed
                    ? 'text-gray-300 line-through'
                    : task.is_available === false
                      ? 'text-gray-400'
                    : 'text-gray-600 group-hover:theme-text'
                }`}
              >
                {task.title}
              </label>
              <div className="relative flex flex-shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-5 ${
                    task.completed
                      ? 'bg-gray-100 text-gray-300 line-through'
                      : task.description === NA_LABEL || task.is_available === false
                        ? 'bg-gray-100 text-gray-400'
                      : isDatePending(task.date_status, undefined, task.description)
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {task.description ?? TBD_LABEL}
                </span>
                {task.is_editable_date && !isOverlay && (
                  <button
                    type="button"
                    onClick={() => openEditDate(task)}
                    className="absolute left-full top-1/2 ml-1 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-gray-300 transition-colors hover:text-gray-500"
                    title="自定義面試日期"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                {task.is_custom && !isOverlay && (
                  <button
                    type="button"
                    onClick={() => onRemoveCustomEvent?.(id, task.id, activeEntry?.studentApplicationId)}
                    className="absolute left-full top-1/2 ml-1 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-gray-200 transition-colors hover:text-red-400"
                    title="刪除自訂事件"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-4 text-xs font-semibold text-gray-400">
            這間學校暫時還沒有可勾選的申請項目
          </div>
        )}
        </div>
        {hasOverflow && (
          <div className="pointer-events-none absolute right-1.5 top-1 bottom-1 w-1 rounded-full bg-gray-200/80">
            <div
              className="absolute left-0 w-full rounded-full bg-gray-400/90"
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
        className={`${isOverlay ? 'invisible' : ''} mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 py-1.5 text-[11px] font-semibold text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600`}
        title="新增自訂事件"
      >
        <Plus className="h-3 w-3" />
        新增自訂事件
      </button>
    </div>
    {editingTask &&
      createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditDate} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-gray-800">
              自定義「{editingTask.title}」日期
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              請輸入您的面試日期，輸入後即可勾選該事項。
            </p>
            <input
              type="date"
              value={editDateValue}
              onChange={(event) => setEditDateValue(event.target.value)}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
            />
            <div className="mt-5 flex items-center justify-between gap-2">
              {editingTask.private_override?.start_at ? (
                <button
                  type="button"
                  onClick={handleRestoreDate}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-400 underline decoration-dotted transition-colors hover:text-gray-600"
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
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveEditDate}
                  disabled={!editDateValue}
                  className="theme-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
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
          <div className="absolute inset-0 bg-black/40" onClick={closeAddCustom} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-gray-800">新增自訂事件</h3>
            <p className="mt-1 text-xs text-gray-500">
              記錄學校未公佈、但對您重要的日子，例如三面、簡介會第二場等。
            </p>
            <input
              type="text"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="事件名稱（例如：三面）"
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
            />
            <input
              type="date"
              value={customDateValue}
              onChange={(event) => setCustomDateValue(event.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAddCustom}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveAddCustom}
                disabled={!customTitle.trim() || !customDateValue}
                className="theme-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
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
