'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SchoolCard from '@/components/SchoolCard';
import { DashboardSchool, StudentTask } from '@/types';

interface SortableSchoolCardProps {
  id: string;
  school: DashboardSchool;
  cardSize: number;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[]) => void;
  setSchoolToDelete: (schoolId: string) => void;
}

export default function SortableSchoolCard({
  id,
  school,
  cardSize,
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
    <div ref={setNodeRef} style={style} className="relative" aria-label={`school-card-${id}`}>
      <div style={{ height: cardSize, width: cardSize }}>
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
