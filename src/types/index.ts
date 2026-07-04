// Supabase 原生类型（下划线命名）
export interface School {
  id: string;
  name_zh: string;
  name_en: string | null;
  type: 'kindergarten' | 'primary';
  district: string | null;
  gender: 'coed' | 'boys' | 'girls' | null;
  school_net: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudentTask extends Task {
  completed: boolean;
  completed_at: string | null;
}

export interface Event {
  id: string;
  date: string;
  title: string;
  type: 'kindergarten' | 'primary';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  gender: 'boy' | 'girl' | null;
  birth_date: string | null;
  application_type: 'kindergarten' | 'primary';
  created_at: string;
  updated_at: string;
}

export interface StudentSchool {
  id: string;
  student_id: string;
  school_id: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// 前端使用的兼容类型（驼峰命名，保持向后兼容）
export interface SchoolWithTasks extends School {
  tasks: StudentTask[];
}

export interface StudentSchoolWithDetails extends StudentSchool {
  school: School;
  tasks: StudentTask[];
}

// 兼容性包装器 - 将 Supabase 学校对象转换为前端可用的格式
export function formatSchoolForFrontend(school: School, tasks: StudentTask[] = []): School & {
  nameZh: string;
  nameEn: string | null;
  schoolNet: string | null;
  tasks: StudentTask[];
} {
  return {
    ...school,
    nameZh: school.name_zh,
    nameEn: school.name_en,
    schoolNet: school.school_net,
    tasks
  };
}

// 兼容性包装器 - 将 Supabase 学生对象转换为前端可用的格式
export function formatStudentForFrontend(student: Student): Student & {
  birthDate: Date | null;
  applicationType: 'kindergarten' | 'primary';
  addedSchools: SchoolWithTasks[];
} {
  return {
    ...student,
    birthDate: student.birth_date ? new Date(student.birth_date) : null,
    applicationType: student.application_type,
    addedSchools: []
  };
}
