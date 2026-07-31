'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AppStudent,
  ApplicationType,
  DashboardSchool,
  School,
  Student,
  StudentTask,
  Task,
  formatSchoolForFrontend,
  formatStudentForFrontend,
} from '@/types';
import { mockSchools } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentStudent: AppStudent | null;
  setCurrentStudent: (student: AppStudent | null) => void;
  students: AppStudent[];
  addStudent: (student: { 
    name: string; 
    birthYear: number; 
    birthMonth: number; 
    gender: 'boy' | 'girl';
    applicationType: ApplicationType;
  }) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  addSchoolToStudent: (school: DashboardSchool) => Promise<void>;
  removeSchoolFromStudent: (schoolId: string) => Promise<void>;
  reorderStudentSchools: (schools: DashboardSchool[]) => Promise<void>;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockStudents: AppStudent[] = [
  {
    ...formatStudentForFrontend({
      id: 's1',
      user_id: 'mock-user',
      name: '小紅',
      gender: 'girl',
      birth_date: '2018-08-20',
      application_type: 'primary',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    addedSchools: [
      mockSchools[0],
      mockSchools[1],
    ]
  },
  {
    ...formatStudentForFrontend({
      id: 's2',
      user_id: 'mock-user',
      name: '小哲',
      gender: 'boy',
      birth_date: '2018-03-12',
      application_type: 'primary',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    addedSchools: [
      mockSchools[2],
      mockSchools[3],
      mockSchools[4],
    ]
  },
];

type StudentSchoolRow = {
  id: string;
  student_id: string;
  school_id: string;
  school: School;
};

type StudentSchoolTaskRow = {
  student_school_id: string;
  task_id: string;
  completed: boolean | null;
  completed_at: string | null;
};

type SchoolCycleEventRow = {
  id: string;
  title_zh: string | null;
  event_type: string;
  date_status?: 'confirmed' | 'tbd' | null;
  sequence_no: number | null;
  start_at: string | null;
};

type SchoolCycleWithEventsRow = {
  id: string;
  school_events: SchoolCycleEventRow[];
};

const formatEventTaskTitle = (event: SchoolCycleEventRow) => {
  if (event.title_zh) return event.title_zh;

  switch (event.event_type) {
    case 'open_day':
      return '開放日';
    case 'info_session':
      return '簡介會';
    case 'application_open':
      return '申請開始';
    case 'application_deadline':
      return '申請截止';
    case 'assessment':
      return '入學評估';
    case 'first_interview':
      return '第一面';
    case 'second_interview':
      return '第二面';
    case 'third_interview':
      return '第三面';
    case 'result_release':
      return '放榜';
    case 'registration':
      return '註冊';
    case 'parent_meeting':
      return '家長會';
    case 'waiting_list':
      return '候補通知';
    default:
      return '待辦事項';
  }
};

const formatEventDateLabel = (event: SchoolCycleEventRow) => {
  if (event.date_status === 'tbd' || !event.start_at) {
    return '日期待定';
  }

  return new Date(event.start_at).toLocaleDateString('zh-HK', {
    month: '2-digit',
    day: '2-digit',
  });
};

const buildTasksFromSchoolEvents = (schoolId: string, events: SchoolCycleEventRow[]): Task[] =>
  [...events]
    .sort((a, b) => {
      if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at);
      return (a.sequence_no ?? 0) - (b.sequence_no ?? 0);
    })
    .map((event, index) => ({
      id: event.id,
      school_id: schoolId,
      title: formatEventTaskTitle(event),
      description: formatEventDateLabel(event),
      sort_order: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

const getSchoolOrderStorageKey = (studentId: string) => `KiDays:schoolOrder:${studentId}`;

const applyStoredOrder = (schools: DashboardSchool[], orderedIds: string[]) => {
  const map = new Map(schools.map((school) => [school.id, school]));
  const ordered = orderedIds.map((id) => map.get(id)).filter(Boolean);
  const remaining = schools.filter((school) => !orderedIds.includes(school.id));
  return [...ordered, ...remaining] as DashboardSchool[];
};

const applyStoredOrderToStudent = (student: AppStudent) => {
  try {
    if (typeof window === 'undefined') return student;

    const raw = window.localStorage.getItem(getSchoolOrderStorageKey(student.id));
    if (!raw) return student;

    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return student;

    return {
      ...student,
      addedSchools: applyStoredOrder(student.addedSchools, ids),
    };
  } catch {
    return student;
  }
};

const persistSchoolOrder = (studentId: string, schools: DashboardSchool[]) => {
  try {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      getSchoolOrderStorageKey(studentId),
      JSON.stringify(schools.map((school) => school.id))
    );
  } catch {}
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [manualLoggedIn, setManualLoggedIn] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<AppStudent[]>(mockStudents);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(mockStudents[0]?.id ?? null);

  const currentStudent = students.find((student) => student.id === currentStudentId) || null;
  const isLoggedIn = Boolean(authUserId) || manualLoggedIn;

  const setCurrentStudent = (student: AppStudent | null) => {
    setCurrentStudentId(student?.id ?? null);
  };

  const syncStudents = useCallback(
    (updatedStudents: AppStudent[], nextCurrentStudentId?: string | null) => {
      const nextStudents = updatedStudents.map(applyStoredOrderToStudent);
      const preferredId = nextCurrentStudentId === undefined ? currentStudentId : nextCurrentStudentId;
      const resolvedCurrentStudentId =
        preferredId && nextStudents.some((student) => student.id === preferredId)
          ? preferredId
          : nextStudents[0]?.id ?? null;

      setStudents(nextStudents);
      setCurrentStudentId(resolvedCurrentStudentId);
    },
    [currentStudentId]
  );

  const updateCurrentStudent = useCallback(
    (updater: (student: AppStudent) => AppStudent) => {
      if (!currentStudent) return;

      const updatedStudents = students.map((student) =>
        student.id === currentStudent.id ? updater(student) : student
      );

      syncStudents(updatedStudents, currentStudent.id);
    },
    [currentStudent, students, syncStudents]
  );

  const loadRemoteStudents = useCallback(
    async (userId: string) => {
      const { data: studentRows, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (studentError) {
        console.error('Error loading students:', studentError);
        return;
      }

      const studentsFromDb = ((studentRows || []) as Student[]).filter(
        (student) => student.application_type === 'primary'
      );

      if (studentsFromDb.length === 0) {
        syncStudents([], null);
        return;
      }

      const studentIds = studentsFromDb.map((student) => student.id);

      const { data: studentSchoolRows, error: studentSchoolError } = await supabase
        .from('student_schools')
        .select(`
          id,
          student_id,
          school_id,
          school:schools(*)
        `)
        .in('student_id', studentIds);

      if (studentSchoolError) {
        console.error('Error loading student schools:', studentSchoolError);
        return;
      }

      const studentSchools = (studentSchoolRows || []) as StudentSchoolRow[];
      const schoolIds = Array.from(new Set(studentSchools.map((row) => row.school_id)));
      const studentSchoolIds = studentSchools.map((row) => row.id);

      const [{ data: taskRows, error: taskError }, { data: studentTaskRows, error: studentTaskError }] =
        await Promise.all([
          schoolIds.length > 0
            ? supabase.from('school_tasks').select('*').in('school_id', schoolIds).order('sort_order')
            : Promise.resolve({ data: [], error: null }),
          studentSchoolIds.length > 0
            ? supabase.from('student_school_tasks').select('student_school_id, task_id, completed, completed_at').in('student_school_id', studentSchoolIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (taskError) {
        console.error('Error loading school tasks:', taskError);
        return;
      }

      if (studentTaskError) {
        console.error('Error loading student school tasks:', studentTaskError);
        return;
      }

      const taskMap = new Map<string, Task[]>();
      for (const task of ((taskRows || []) as Task[])) {
        const currentTasks = taskMap.get(task.school_id) ?? [];
        currentTasks.push(task);
        taskMap.set(task.school_id, currentTasks);
      }

      const studentTaskMap = new Map<string, StudentSchoolTaskRow>();
      for (const studentTask of ((studentTaskRows || []) as StudentSchoolTaskRow[])) {
        studentTaskMap.set(`${studentTask.student_school_id}:${studentTask.task_id}`, studentTask);
      }

      const nextStudents = studentsFromDb.map((student) => {
        const formattedStudent = formatStudentForFrontend(student);
        const relatedStudentSchools = studentSchools.filter((row) => row.student_id === student.id);

        const addedSchools = relatedStudentSchools.map((row) => {
          const tasksForSchool = (taskMap.get(row.school_id) ?? []).map((task) => {
            const studentTask = studentTaskMap.get(`${row.id}:${task.id}`);
            return {
              ...task,
              completed: studentTask?.completed ?? false,
              completed_at: studentTask?.completed_at ?? null,
            };
          });

          return {
            ...formatSchoolForFrontend(row.school, tasksForSchool),
            studentSchoolId: row.id,
          };
        });

        return applyStoredOrderToStudent({
          ...formattedStudent,
          addedSchools,
        });
      });

      syncStudents(nextStudents);
    },
    [syncStudents]
  );

  useEffect(() => {
    setStudents((prev) => prev.map(applyStoredOrderToStudent));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (!isMounted) return;

      const userId = data.session?.user?.id ?? null;
      setAuthUserId(userId);

      if (userId) {
        setManualLoggedIn(false);
      }
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setAuthUserId(userId);

      if (userId) {
        setManualLoggedIn(false);
      } else {
        syncStudents(mockStudents, mockStudents[0]?.id ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncStudents]);

  useEffect(() => {
    if (!authUserId) return;

    const ensureProfileAndLoad = async () => {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ id: authUserId }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error ensuring user profile:', profileError);
        return;
      }

      await loadRemoteStudents(authUserId);
    };

    void ensureProfileAndLoad();
  }, [authUserId, loadRemoteStudents]);

  const setIsLoggedIn = (value: boolean) => {
    if (!value) {
      setManualLoggedIn(false);
      if (authUserId) {
        void supabase.auth.signOut();
      }
      return;
    }

    if (!authUserId) {
      setManualLoggedIn(true);
    }
  };

  const addStudent = async (studentData: { 
    name: string; 
    birthYear: number; 
    birthMonth: number; 
    gender: 'boy' | 'girl';
    applicationType: ApplicationType;
  }) => {
    const birthDate = new Date(studentData.birthYear, studentData.birthMonth - 1, 15);

    if (authUserId) {
      const { data, error } = await supabase
        .from('students')
        .insert({
          user_id: authUserId,
          name: studentData.name,
          gender: studentData.gender,
          birth_date: birthDate.toISOString().slice(0, 10),
          application_type: studentData.applicationType,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating student:', error);
        return;
      }

      const newStudent = formatStudentForFrontend(data as Student);
      syncStudents([...students, newStudent], currentStudent?.id ?? newStudent.id);
      return;
    }

    const newStudent = formatStudentForFrontend({
      id: `s${Date.now()}`,
      user_id: 'mock-user',
      name: studentData.name,
      gender: studentData.gender,
      birth_date: birthDate.toISOString(),
      application_type: studentData.applicationType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    syncStudents([...students, newStudent], currentStudent?.id ?? newStudent.id);
  };

  const removeStudent = async (studentId: string) => {
    if (authUserId) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('user_id', authUserId);

      if (error) {
        console.error('Error deleting student:', error);
        return;
      }
    }

    const updatedStudents = students.filter((student) => student.id !== studentId);
    const nextCurrentStudentId =
      currentStudent?.id === studentId ? updatedStudents[0]?.id ?? null : currentStudent?.id ?? null;

    syncStudents(updatedStudents, nextCurrentStudentId);
  };

  const addSchoolToStudent = async (school: DashboardSchool) => {
    if (!currentStudent) return;

    if (currentStudent.addedSchools.some((item) => item.id === school.id)) {
      return;
    }

    if (authUserId) {
      const loadLatestCycleEvents = async () => {
        const { data: cycleRows, error: cycleError } = await supabase
          .from('school_cycles')
          .select('id, school_events(id, title_zh, event_type, sequence_no, start_at)')
          .eq('school_id', school.id)
          .eq('application_level', 'primary')
          .order('academic_year', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1);

        if (cycleError) {
          console.error('Error loading school events for task fallback:', cycleError);
          return [] as SchoolCycleEventRow[];
        }

        const latestCycle = (cycleRows?.[0] ?? null) as SchoolCycleWithEventsRow | null;
        return latestCycle?.school_events ?? [];
      };

      const { data: relationRow, error: relationError } = await supabase
        .from('student_schools')
        .insert({
          student_id: currentStudent.id,
          school_id: school.id,
        })
        .select('id')
        .single();

      if (relationError) {
        console.error('Error adding school to student:', relationError);
        return;
      }

      const ensureSchoolTasks = async () => {
        const latestCycleEvents = await loadLatestCycleEvents();

        const { data: existingTaskRows, error: existingTaskError } = await supabase
          .from('school_tasks')
          .select('*')
          .eq('school_id', school.id)
          .order('sort_order');

        if (existingTaskError) {
          console.error('Error loading school tasks after add:', existingTaskError);
          return [] as Task[];
        }

        if ((existingTaskRows || []).length > 0) {
          const fallbackTasks = buildTasksFromSchoolEvents(school.id, latestCycleEvents);
          return ((existingTaskRows || []) as Task[]).map((task, index) => ({
            ...task,
            description: task.description ?? fallbackTasks[index]?.description ?? null,
          }));
        }

        const fallbackTasks = buildTasksFromSchoolEvents(school.id, latestCycleEvents);

        if (fallbackTasks.length === 0) {
          return [] as Task[];
        }

        const insertPayload = fallbackTasks.map((task) => ({
          school_id: task.school_id,
          title: task.title,
          description: task.description,
          sort_order: task.sort_order,
        }));

        const { data: insertedTaskRows, error: insertedTaskError } = await supabase
          .from('school_tasks')
          .insert(insertPayload)
          .select('*')
          .order('sort_order');

        if (insertedTaskError) {
          console.error('Error creating fallback school tasks from school events:', insertedTaskError);
          return fallbackTasks;
        }

        return ((insertedTaskRows || []) as Task[]).length > 0
          ? ((insertedTaskRows || []) as Task[])
          : fallbackTasks;
      };

      const taskRows = await ensureSchoolTasks();

      const newSchool = {
        ...formatSchoolForFrontend(school, (taskRows || []).map((task) => ({
          ...task,
          completed: false,
          completed_at: null,
        }))),
        studentSchoolId: relationRow.id,
      };

      updateCurrentStudent((student) => {
        const newSchools = [...student.addedSchools, newSchool];
        persistSchoolOrder(student.id, newSchools);

        return {
          ...student,
          addedSchools: newSchools,
        };
      });

      return;
    }

    updateCurrentStudent((student) => {
      const newSchools = [...student.addedSchools, {
        ...school,
        tasks: school.tasks ?? [],
      }];
      persistSchoolOrder(student.id, newSchools);

      return {
        ...student,
        addedSchools: newSchools,
      };
    });
  };

  const removeSchoolFromStudent = async (schoolId: string) => {
    if (!currentStudent) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);

    if (authUserId && targetSchool?.studentSchoolId) {
      const { error } = await supabase
        .from('student_schools')
        .delete()
        .eq('id', targetSchool.studentSchoolId);

      if (error) {
        console.error('Error removing school from student:', error);
        return;
      }
    }

    updateCurrentStudent((student) => {
      const newSchools = student.addedSchools.filter((school) => school.id !== schoolId);
      persistSchoolOrder(student.id, newSchools);

      return {
        ...student,
        addedSchools: newSchools,
      };
    });
  };

  const reorderStudentSchools = async (reorderedSchools: DashboardSchool[]) => {
    if (!currentStudent) return;

    updateCurrentStudent((student) => {
      persistSchoolOrder(student.id, reorderedSchools);

      return {
        ...student,
        addedSchools: reorderedSchools,
      };
    });
  };

  const updateStudentSchoolTasks = async (schoolId: string, tasks: StudentTask[]) => {
    if (!currentStudent) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);

    if (authUserId && targetSchool?.studentSchoolId) {
      const payload = tasks.map((task) => ({
        student_school_id: targetSchool.studentSchoolId,
        task_id: task.id,
        completed: task.completed,
        completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
      }));

      const { error } = await supabase
        .from('student_school_tasks')
        .upsert(payload, { onConflict: 'student_school_id,task_id' });

      if (error) {
        console.error('Error updating student school tasks:', error);
        return;
      }
    }

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: student.addedSchools.map((school) =>
        school.id === schoolId ? { ...school, tasks } : school
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        currentStudent,
        setCurrentStudent,
        students,
        addStudent,
        removeStudent,
        addSchoolToStudent,
        removeSchoolFromStudent,
        reorderStudentSchools,
        updateStudentSchoolTasks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
