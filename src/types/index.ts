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

export interface SchoolWithTasks extends School {
  tasks: Task[];
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

export interface StudentSchoolWithDetails extends StudentSchool {
  school: School;
  tasks: StudentTask[];
}
