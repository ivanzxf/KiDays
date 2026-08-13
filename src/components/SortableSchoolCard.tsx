'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SchoolCard from '@/components/SchoolCard';
import { DashboardSchool, StudentTask } from '@/types';

interface SortableSchoolCardProps {
  id: string;
  school: DashboardSchool;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[]) => void;
  setSchoolToDelete: (schoolId: string) => void;
}

export default function SortableSchoolCard({
  id,
  school,
  updateStudentSchoolTasks,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
      <div className="mx-auto w-full max-w-sm">
        <SchoolCard
          school={school}
          onTaskUpdate={updateStudentSchoolTasks}
          onDelete={(schoolId) => setSchoolToDelete(schoolId)}
          dragHandleAttributes={attributes}
          dragHandleListeners={listeners}
          dragHandleRef={setActivatorNodeRef}
        />
      </div>
    </div>
  );
}
