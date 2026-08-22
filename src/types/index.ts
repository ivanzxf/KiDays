// 应用层统一枚举
export type ApplicationLevel = 'primary';
export type StudentGender = 'boy' | 'girl';
export type SchoolGenderPolicy = 'coed' | 'boys' | 'girls';
export type SchoolType =
  | 'government'
  | 'aided'
  | 'direct_subsidy'
  | 'private'
  | 'pis'
  | 'international'
  | 'special';

export type SchoolCycleStatus = 'draft' | 'published' | 'archived';
export type SchoolEventDateStatus = 'confirmed' | 'tbd' | 'na';
export type StudentTaskCompletionSource = 'progress' | 'application';

export type SchoolEventType =
  | 'open_day'
  | 'info_session'
  | 'application_open'
  | 'application_deadline'
  | 'assessment'
  | 'first_interview'
  | 'second_interview'
  | 'third_interview'
  | 'result_release'
  | 'registration'
  | 'parent_meeting'
  | 'waiting_list'
  | 'other';

export type ApplicationStatus =
  | 'planned'
  | 'interested'
  | 'applied'
  | 'interviewing'
  | 'waitlisted'
  | 'offered'
  | 'rejected'
  | 'accepted'
  | 'declined';

export type ProgressStatus = 'pending' | 'completed' | 'skipped';

/** 家長私有覆蓋資料（例如自訂的一面／二面日期），只存於學生個人資料，不改學校主資料庫。 */
export interface StudentTaskPrivateOverride {
  date_label?: string | null;
  start_at?: string | null;
}

// Supabase 原生类型（下划线命名）
export interface UserProfile {
  id: string;
  display_name: string | null;
  phone: string | null;
  preferred_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name_zh: string;
  name_en: string | null;
  type: ApplicationLevel;
  district: string | null;
  gender: SchoolGenderPolicy | null;
  school_net: string | null;
  created_at: string;
  updated_at: string;
  // 以下为 003 schema 新增字段
  address_zh: string | null;
  address_en: string | null;
  school_type: SchoolType | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  remarks: string | null;
  is_active: boolean;
  gender_policy: SchoolGenderPolicy | null;
  application_level: ApplicationLevel | null;
}

export interface Task {
  id: string;
  school_id: string;
  title: string;
  /** Date label displayed on the card row (MM/DD) or TBD_LABEL. */
  description: string | null;
  /**
   * Structured mirror of the underlying school_event.date_status.
   * Prefer this field for conditional UI (badges, colors) instead of
   * string-matching against `description`, since the label text may change.
   * Legacy tasks (not derived from a school_event) may omit this field.
   */
  date_status?: SchoolEventDateStatus | null;
  source_event_ids?: string[];
  completion_source?: StudentTaskCompletionSource;
  is_toggleable?: boolean;
  is_available?: boolean;
  /** 是否允許家長編輯此列日期（目前僅一面／二面）。 */
  is_editable_date?: boolean;
  /** 家長私有覆蓋資料；有值代表此列日期為家長自訂，優先於學校公開資訊。 */
  private_override?: StudentTaskPrivateOverride | null;
  /** 是否為家長新增的自訂事件（非學校主資料）。 */
  is_custom?: boolean;
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
  type: ApplicationLevel;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  gender: StudentGender | null;
  birth_date: string | null;
  application_type: ApplicationLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationType = Student['application_type'];

// 003 schema 正式招生流程新表
export interface SchoolCycle {
  id: string;
  school_id: string;
  academic_year: string;
  application_level: ApplicationLevel | null;
  status: SchoolCycleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolEvent {
  id: string;
  school_cycle_id: string;
  event_type: SchoolEventType;
  date_status?: SchoolEventDateStatus | null;
  sequence_no: number | null;
  title_zh: string | null;
  title_en: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentApplication {
  id: string;
  student_id: string;
  school_cycle_id: string;
  status: ApplicationStatus;
  priority_order: number | null;
  applied_at: string | null;
  result_at: string | null;
  is_shortlisted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentApplicationProgress {
  id: string;
  student_application_id: string;
  school_event_id: string;
  status: ProgressStatus;
  completed_at: string | null;
  reminder_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** 學校卡片中的一個申請入口（例如 Prep Year / Year 1）。 */
export interface SchoolEntryPoint {
  studentApplicationId: string;
  schoolCycleId?: string;
  /** kindergarten = Prep Year；primary = Year 1。 */
  applicationLevel: 'kindergarten' | 'primary';
  applicationStatus?: ApplicationStatus;
  priorityOrder?: number | null;
  isRollingAdmission?: boolean;
  tasks: StudentTask[];
}

export interface DashboardSchool extends School {
  nameZh: string;
  nameEn: string | null;
  schoolNet: string | null;
  studentApplicationId?: string;
  schoolCycleId?: string;
  applicationStatus?: ApplicationStatus;
  priorityOrder?: number | null;
  /** 該校該年度是否為 Rolling Admissions（無固定日期，日期由家長自填）。 */
  isRollingAdmission?: boolean;
  /** 同校所有申請入口（一般學校只有 primary 一個；國際學校可能有 Prep/Year1）。 */
  entryPoints?: SchoolEntryPoint[];
  tasks: StudentTask[];
}

export interface AppStudent extends Student {
  birthDate: Date | null;
  applicationType: ApplicationType;
  addedSchools: DashboardSchool[];
}

export interface SchoolCycleWithEvents extends SchoolCycle {
  school: School | null;
  events: SchoolEvent[];
}

export interface StudentApplicationWithDetails extends StudentApplication {
  school_cycle: SchoolCycleWithEvents;
  progress: StudentApplicationProgress[];
}

// 兼容性包装器 - 将 Supabase 学校对象转换为前端可用的格式
export function formatSchoolForFrontend(
  school: School,
  tasks: StudentTask[] = []
): DashboardSchool {
  return {
    ...school,
    nameZh: school.name_zh,
    nameEn: school.name_en,
    schoolNet: school.school_net,
    tasks
  };
}

// 兼容性包装器 - 将 Supabase 学生对象转换为前端可用的格式
export function formatStudentForFrontend(student: Student): AppStudent {
  return {
    ...student,
    birthDate: student.birth_date ? new Date(student.birth_date) : null,
    applicationType: student.application_type,
    addedSchools: []
  };
}
