'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SchoolCard from '@/components/SchoolCard';
import { DashboardSchool, StudentTask } from '@/types';

interface SortableSchoolCardProps {
  id: string;
  school: DashboardSchool;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[], applicationId?: string) => void;
  addCustomEvent: (schoolId: string, title: string, startAt: string, applicationId?: string) => void;
  removeCustomEvent: (schoolId: string, customEventId: string, applicationId?: string) => void;
  restoreEventDate: (schoolId: string, taskId: string, applicationId?: string) => void;
  setSchoolToDelete: (schoolId: string) => void;
}

export default function SortableSchoolCard({
  id,
  school,
  updateStudentSchoolTasks,
  addCustomEvent,
  removeCustomEvent,
  restoreEventDate,
  setSchoolToDelete,
}: SortableSchoolCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition:
      !transform || (transform.x === 0 && transform.y === 0)
        ? undefined
        : transition ?? 'transform 150ms cubic-bezier(0.22, 0.61, 0.36, 1)',
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-full"
      aria-label={`school-card-${id}`}
    >
      <div data-school-card-inner="true" className="mx-auto w-full max-w-sm">
        <SchoolCard
          school={school}
          onTaskUpdate={updateStudentSchoolTasks}
          onAddCustomEvent={addCustomEvent}
          onRemoveCustomEvent={removeCustomEvent}
          onRestoreDate={restoreEventDate}
          onDelete={(schoolId) => setSchoolToDelete(schoolId)}
          dragHandleAttributes={attributes}
          dragHandleListeners={listeners}
          dragHandleRef={setActivatorNodeRef}
        />
      </div>
    </div>
  );
}
