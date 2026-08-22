'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AppStudent,
  ApplicationStatus,
  ApplicationType,
  DashboardSchool,
  School,
  SchoolEntryPoint,
  SchoolEventDateStatus,
  Student,
  StudentTask,
  formatSchoolForFrontend,
  formatStudentForFrontend,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { buildSchoolCardTasks, SchoolCardCustomEvent, SchoolCardOverride } from '@/lib/buildSchoolCardTasks';

interface AppContextType {
  authReady: boolean;
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
  updateStudent: (
    studentId: string,
    student: {
      name: string;
      birthYear: number;
      birthMonth: number;
      gender: 'boy' | 'girl';
      applicationType: ApplicationType;
    },
  ) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  addSchoolToStudent: (school: DashboardSchool) => Promise<void>;
  removeSchoolFromStudent: (schoolId: string) => Promise<void>;
  reorderStudentSchools: (schools: DashboardSchool[]) => Promise<void>;
  updateStudentSchoolTasks: (
    schoolId: string,
    tasks: StudentTask[],
    applicationId?: string,
  ) => Promise<void>;
  addCustomEvent: (schoolId: string, title: string, startAt: string, applicationId?: string) => Promise<void>;
  removeCustomEvent: (schoolId: string, customEventId: string, applicationId?: string) => Promise<void>;
  restoreEventDate: (schoolId: string, taskId: string, applicationId?: string) => Promise<void>;
  /** 標註／清除某校的申請結果（取錄／候補／落選）；null 代表清除。 */
  updateSchoolResult: (
    schoolId: string,
    resultStatus: 'offered' | 'waitlisted' | 'rejected' | null,
    applicationId?: string,
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type StudentApplicationProgressRow = {
  student_application_id: string;
  school_event_id: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at: string | null;
};

/** 家長私有覆蓋：某申請的某事件的自訂日期（只存學生個人資料）。
 *  school_event_id 為 NULL 的列＝Rolling Admissions 學校的固定行，以 title 識別。 */
type StudentApplicationEventOverrideRow = {
  student_application_id: string;
  school_event_id: string | null;
  title: string | null;
  start_at: string;
  completed: boolean;
  completed_at: string | null;
};

/** 家長自訂事件（來自 student_application_custom_events）。 */
type StudentApplicationCustomEventRow = {
  id: string;
  student_application_id: string;
  title: string;
  start_at: string;
  completed: boolean;
  completed_at: string | null;
};

type SchoolCycleEventRow = {
  id: string;
  title_zh: string | null;
  event_type: string;
  date_status?: SchoolEventDateStatus | null;
  sequence_no: number | null;
  start_at: string | null;
  end_at: string | null;
};

type SchoolCycleRow = {
  id: string;
  school_id: string;
  academic_year: string;
  application_level?: 'kindergarten' | 'primary' | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_rolling_admission?: boolean;
  school: School | School[] | null;
  school_events: SchoolCycleEventRow[] | null;
};

type StudentApplicationRow = {
  id: string;
  student_id: string;
  school_cycle_id: string;
  status: string;
  priority_order: number | null;
  applied_at: string | null;
  result_at: string | null;
  created_at: string;
  school_cycle: SchoolCycleRow | SchoolCycleRow[] | null;
};

const getSingleRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

/** 把私有覆蓋 row 轉成 buildSchoolCardTasks 用的 map（event-keyed + title-keyed）。 */
const buildOverrideMap = (rows: StudentApplicationEventOverrideRow[]): Map<string, SchoolCardOverride> => {
  const map = new Map<string, SchoolCardOverride>();
  for (const row of rows) {
    if (row.school_event_id) {
      map.set(`${row.student_application_id}:${row.school_event_id}`, { start_at: row.start_at });
    } else if (row.title) {
      map.set(`${row.student_application_id}:title:${row.title}`, {
        start_at: row.start_at,
        completed: row.completed ?? false,
        completed_at: row.completed_at ?? null,
      });
    }
  }
  return map;
};

/** 從卡片的入口列表中找指定 applicationId 的入口；找不到退回 primary／第一個。 */
const findEntryPoint = (
  school: DashboardSchool,
  applicationId?: string | null,
): SchoolEntryPoint | null => {
  const entries = school.entryPoints ?? [];
  if (applicationId) {
    const match = entries.find((entry) => entry.studentApplicationId === applicationId);
    if (match) return match;
  }
  return entries.find((entry) => entry.applicationLevel === 'primary') ?? entries[0] ?? null;
};

/** 更新某入口後，同步卡片的 legacy 欄位（tasks / studentApplicationId 等指向 primary／第一個入口）。 */
const patchEntryPoints = (
  school: DashboardSchool,
  applicationId: string,
  patch: (entry: SchoolEntryPoint) => SchoolEntryPoint,
): DashboardSchool => {
  const entryPoints = (school.entryPoints ?? []).map((entry) =>
    entry.studentApplicationId === applicationId ? patch(entry) : entry,
  );
  const primary =
    entryPoints.find((entry) => entry.applicationLevel === 'primary') ?? entryPoints[0];
  return {
    ...school,
    entryPoints,
    tasks: primary?.tasks ?? [],
    studentApplicationId: primary?.studentApplicationId,
    schoolCycleId: primary?.schoolCycleId,
    applicationStatus: primary?.applicationStatus,
    priorityOrder: primary?.priorityOrder,
    isRollingAdmission: primary?.isRollingAdmission,
  };
};

const resolveNextApplicationStatus = (
  currentStatus: DashboardSchool['applicationStatus'],
  isCompleted: boolean,
): DashboardSchool['applicationStatus'] => {
  if (isCompleted) {
    if (currentStatus === 'planned' || currentStatus === 'interested' || currentStatus == null) {
      return 'applied';
    }
    return currentStatus;
  }

  if (currentStatus === 'applied') {
    return 'planned';
  }

  return currentStatus ?? 'planned';
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<AppStudent[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  const currentStudent = students.find((student) => student.id === currentStudentId) || null;
  const isLoggedIn = Boolean(authUserId);

  const setCurrentStudent = (student: AppStudent | null) => {
    setCurrentStudentId(student?.id ?? null);
  };

  const syncStudents = useCallback(
    (updatedStudents: AppStudent[], nextCurrentStudentId?: string | null) => {
      const preferredId = nextCurrentStudentId === undefined ? currentStudentId : nextCurrentStudentId;
      const resolvedCurrentStudentId =
        preferredId && updatedStudents.some((student) => student.id === preferredId)
          ? preferredId
          : updatedStudents[0]?.id ?? null;

      setStudents(updatedStudents);
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

      const { data: applicationRows, error: applicationError } = await supabase
        .from('student_applications')
        .select(`
          id,
          student_id,
          school_cycle_id,
          status,
          priority_order,
          applied_at,
          result_at,
          created_at,
          school_cycle:school_cycles(
            id,
            school_id,
            academic_year,
            application_level,
            status,
            notes,
            created_at,
            updated_at,
            is_rolling_admission,
            school:schools(*),
            school_events(*)
          )
        `)
        .in('student_id', studentIds);

      if (applicationError) {
        console.error('Error loading student applications:', applicationError);
        return;
      }

      const applications = ((applicationRows || []) as unknown) as StudentApplicationRow[];
      const applicationIds = applications.map((row) => row.id);

      const { data: progressRows, error: progressError } =
        applicationIds.length > 0
          ? await supabase
              .from('student_application_progress')
              .select('student_application_id, school_event_id, status, completed_at')
              .in('student_application_id', applicationIds)
          : { data: [], error: null };

      if (progressError) {
        console.error('Error loading application progress:', progressError);
        return;
      }

      const progressMap = new Map<string, StudentApplicationProgressRow>();
      for (const progress of ((progressRows || []) as StudentApplicationProgressRow[])) {
        progressMap.set(`${progress.student_application_id}:${progress.school_event_id}`, progress);
      }

      const { data: overrideRows, error: overridesError } =
        applicationIds.length > 0
          ? await supabase
              .from('student_application_event_overrides')
              .select('student_application_id, school_event_id, title, start_at, completed, completed_at')
              .in('student_application_id', applicationIds)
          : { data: [], error: null };

      if (overridesError) {
        console.error('Error loading event date overrides:', overridesError);
        return;
      }

      const overrides = buildOverrideMap((overrideRows || []) as StudentApplicationEventOverrideRow[]);

      const { data: customEventRows, error: customEventsError } =
        applicationIds.length > 0
          ? await supabase
              .from('student_application_custom_events')
              .select('id, student_application_id, title, start_at, completed, completed_at')
              .in('student_application_id', applicationIds)
              .order('start_at', { ascending: true })
          : { data: [], error: null };

      if (customEventsError) {
        console.error('Error loading custom events:', customEventsError);
        return;
      }

      const customEventsByApplication = new Map<string, SchoolCardCustomEvent[]>();
      for (const row of (customEventRows || []) as StudentApplicationCustomEventRow[]) {
        const list = customEventsByApplication.get(row.student_application_id) ?? [];
        list.push({
          id: row.id,
          title_zh: row.title,
          start_at: row.start_at,
          completed: row.completed,
          completed_at: row.completed_at,
        });
        customEventsByApplication.set(row.student_application_id, list);
      }

      const nextStudents = studentsFromDb.map((student) => {
        const formattedStudent = formatStudentForFrontend(student);
        const relatedApplications = applications
          .filter((row) => row.student_id === student.id)
          .sort((a, b) => {
            const orderA = a.priority_order ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.priority_order ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;
            return a.created_at.localeCompare(b.created_at);
          });

        // 依學校聚合：一張卡 = 同校的所有申請入口（primary + kindergarten）
        const appsBySchool = new Map<string, { school: School; apps: StudentApplicationRow[] }>();
        for (const application of relatedApplications) {
          const schoolCycle = getSingleRelation(application.school_cycle);
          const school = getSingleRelation(schoolCycle?.school);
          if (!schoolCycle || !school) continue;
          const group = appsBySchool.get(school.id) ?? { school, apps: [] };
          group.apps.push(application);
          appsBySchool.set(school.id, group);
        }

        const addedSchools = [...appsBySchool.values()].map(({ school, apps }) => {
          const entryPoints: SchoolEntryPoint[] = apps.map((application) => {
            const schoolCycle = getSingleRelation(application.school_cycle)!;
            const isRollingAdmission = schoolCycle.is_rolling_admission === true;
            return {
              studentApplicationId: application.id,
              schoolCycleId: schoolCycle.id,
              applicationLevel: (schoolCycle.application_level ??
                'primary') as SchoolEntryPoint['applicationLevel'],
              applicationStatus: application.status as ApplicationStatus,
              priorityOrder: application.priority_order,
              isRollingAdmission,
              tasks: buildSchoolCardTasks({
                schoolId: school.id,
                studentApplicationId: application.id,
                events: schoolCycle.school_events ?? [],
                progressMap,
                appliedAt: application.applied_at,
                overrides,
                customEvents: customEventsByApplication.get(application.id) ?? [],
                isRollingAdmission,
              }),
            };
          });

          const primary =
            entryPoints.find((entry) => entry.applicationLevel === 'primary') ?? entryPoints[0];

          return {
            ...formatSchoolForFrontend(school, primary?.tasks ?? []),
            entryPoints,
            studentApplicationId: primary?.studentApplicationId,
            schoolCycleId: primary?.schoolCycleId,
            applicationStatus: primary?.applicationStatus,
            priorityOrder: primary?.priorityOrder,
            isRollingAdmission: primary?.isRollingAdmission,
          };
        });

        return {
          ...formattedStudent,
          addedSchools,
        };
      });

      syncStudents(nextStudents);
    },
    [syncStudents]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        if (isMounted) {
          setAuthReady(true);
        }
        return;
      }

      if (!isMounted) return;

      const userId = data.session?.user?.id ?? null;
      setAuthUserId(userId);
      setAuthReady(true);
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setAuthUserId(userId);
      setAuthReady(true);
      if (!userId) {
        syncStudents([], null);
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
      if (authUserId) {
        void supabase.auth.signOut();
      }
    }
  };

  const persistStudentApplicationOrder = useCallback(
    async (schools: DashboardSchool[]) => {
      const updates = schools
        .flatMap((school, index) => {
          const entries = school.entryPoints ?? [];
          // 防呆：沒有 entryPoints 時退回 legacy 單一 application
          if (entries.length === 0) {
            return school.studentApplicationId
              ? [{ applicationId: school.studentApplicationId, priorityOrder: index + 1 }]
              : [];
          }
          return entries.map((entry) => ({
            applicationId: entry.studentApplicationId,
            priorityOrder: index + 1,
          }));
        })
        .filter((item): item is { applicationId: string; priorityOrder: number } => Boolean(item.applicationId));

      const results = await Promise.all(
        updates.map((item) =>
          supabase
            .from('student_applications')
            .update({ priority_order: item.priorityOrder })
            .eq('id', item.applicationId),
        ),
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        console.error('Error updating application priority order:', failed.error);
        return false;
      }

      return true;
    },
    [],
  );

  const addStudent = async (studentData: { 
    name: string; 
    birthYear: number; 
    birthMonth: number; 
    gender: 'boy' | 'girl';
    applicationType: ApplicationType;
  }) => {
    if (!authUserId) return;

    const birthDate = new Date(studentData.birthYear, studentData.birthMonth - 1, 15);

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

    syncStudents([...students, newStudent], newStudent.id);
  };

  const updateStudent = async (
    studentId: string,
    studentData: {
      name: string;
      birthYear: number;
      birthMonth: number;
      gender: 'boy' | 'girl';
      applicationType: ApplicationType;
    },
  ) => {
    if (!authUserId) return;

    const birthDate = new Date(studentData.birthYear, studentData.birthMonth - 1, 15);

    const { error } = await supabase
      .from('students')
      .update({
        name: studentData.name,
        gender: studentData.gender,
        birth_date: birthDate.toISOString().slice(0, 10),
        application_type: studentData.applicationType,
      })
      .eq('id', studentId)
      .eq('user_id', authUserId);

    if (error) {
      console.error('Error updating student:', error);
      return;
    }

    syncStudents(
      students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              name: studentData.name,
              gender: studentData.gender,
              birthDate,
              applicationType: studentData.applicationType,
            }
          : student,
      ),
      currentStudentId,
    );
  };

  const removeStudent = async (studentId: string) => {
    if (!authUserId) return;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('user_id', authUserId);

    if (error) {
      console.error('Error deleting student:', error);
      return;
    }

    const updatedStudents = students.filter((student) => student.id !== studentId);
    const nextCurrentStudentId =
      currentStudent?.id === studentId ? updatedStudents[0]?.id ?? null : currentStudent?.id ?? null;

    syncStudents(updatedStudents, nextCurrentStudentId);
  };

  const addSchoolToStudent = async (school: DashboardSchool) => {
    if (!currentStudent || !authUserId) return;

    if (currentStudent.addedSchools.some((item) => item.id === school.id)) {
      return;
    }

    const nextPriority = currentStudent.addedSchools.length + 1;
    const optimisticApplicationId = `optimistic-${school.id}-${Date.now()}`;
    const targetStudentId = currentStudent.id;

    const patchTargetStudent = (updater: (student: AppStudent) => AppStudent) => {
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === targetStudentId ? updater(student) : student
        )
      );
    };

    const optimisticSchool: DashboardSchool = {
      ...formatSchoolForFrontend(school, []),
      entryPoints: [
        {
          studentApplicationId: optimisticApplicationId,
          applicationLevel: 'primary',
          applicationStatus: 'planned',
          priorityOrder: nextPriority,
          tasks: [],
        },
      ],
      studentApplicationId: optimisticApplicationId,
      schoolCycleId: undefined,
      applicationStatus: 'planned',
      priorityOrder: nextPriority,
    };

    const removeOptimisticIfExists = () => {
      patchTargetStudent((student) => ({
        ...student,
        addedSchools: student.addedSchools.filter(
          (item) => !(item.id === school.id && item.studentApplicationId === optimisticApplicationId),
        ),
      }));
    };

    patchTargetStudent((student) => ({
      ...student,
      addedSchools: [...student.addedSchools, optimisticSchool],
    }));

    const { data: cycleRows, error: cycleError } = await supabase
      .from('school_cycles')
      .select('id, application_level, is_rolling_admission, school_events(id, title_zh, event_type, date_status, sequence_no, start_at, end_at)')
      .eq('school_id', school.id)
      .in('application_level', ['kindergarten', 'primary'])
      .order('academic_year', { ascending: false })
      .order('created_at', { ascending: true });

    if (cycleError) {
      console.error('Error loading school cycle for application create:', cycleError);
      removeOptimisticIfExists();
      return;
    }

    // 每個入口（level）取最新的一個 cycle
    const cyclesByLevel = new Map<string, SchoolCycleRow>();
    for (const cycle of (cycleRows || []) as SchoolCycleRow[]) {
      const level = cycle.application_level ?? 'primary';
      if (!cyclesByLevel.has(level)) cyclesByLevel.set(level, cycle);
    }

    if (cyclesByLevel.size === 0) {
      console.error('No school cycle found for school:', school.id);
      removeOptimisticIfExists();
      return;
    }

    const entryPoints: SchoolEntryPoint[] = [];
    for (const cycle of cyclesByLevel.values()) {
      const events = cycle.school_events ?? [];
      const { data: applicationRow, error: applicationError } = await supabase
        .from('student_applications')
        .insert({
          student_id: currentStudent.id,
          school_cycle_id: cycle.id,
          status: 'planned',
          priority_order: nextPriority,
        })
        .select('id, status, priority_order')
        .single();

      if (applicationError) {
        console.error('Error creating student application:', applicationError);
        removeOptimisticIfExists();
        return;
      }

      if (events.length > 0) {
        const { error: progressInsertError } = await supabase
          .from('student_application_progress')
          .insert(
            events.map((event) => ({
              student_application_id: applicationRow.id,
              school_event_id: event.id,
              status: 'pending',
            })),
          );

        if (progressInsertError) {
          console.error('Error creating default application progress:', progressInsertError);
        }
      }

      const isRollingAdmission = cycle.is_rolling_admission === true;
      entryPoints.push({
        studentApplicationId: applicationRow.id,
        schoolCycleId: cycle.id,
        applicationLevel: (cycle.application_level ?? 'primary') as SchoolEntryPoint['applicationLevel'],
        applicationStatus: applicationRow.status as ApplicationStatus,
        priorityOrder: applicationRow.priority_order,
        isRollingAdmission,
        tasks: buildSchoolCardTasks({
          schoolId: school.id,
          studentApplicationId: applicationRow.id,
          events,
          progressMap: new Map(),
          appliedAt: null,
          isRollingAdmission,
        }),
      });
    }

    const primary =
      entryPoints.find((entry) => entry.applicationLevel === 'primary') ?? entryPoints[0];

    const newSchool: DashboardSchool = {
      ...formatSchoolForFrontend(school, primary?.tasks ?? []),
      entryPoints,
      studentApplicationId: primary?.studentApplicationId,
      schoolCycleId: primary?.schoolCycleId,
      applicationStatus: primary?.applicationStatus,
      priorityOrder: primary?.priorityOrder,
      isRollingAdmission: primary?.isRollingAdmission,
    };

    patchTargetStudent((student) => ({
      ...student,
      addedSchools: student.addedSchools.map((item) =>
        item.id === school.id && item.studentApplicationId === optimisticApplicationId
          ? newSchool
          : item,
      ),
    }));
  };

  const removeSchoolFromStudent = async (schoolId: string) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    const applicationIds = (targetSchool?.entryPoints ?? [])
      .map((entry) => entry.studentApplicationId)
      .filter(Boolean);
    if (applicationIds.length === 0 && targetSchool?.studentApplicationId) {
      applicationIds.push(targetSchool.studentApplicationId);
    }
    if (applicationIds.length === 0) return;

    for (const applicationId of applicationIds) {
      const { error } = await supabase
        .from('student_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('Error removing school from student applications:', error);
        return;
      }
    }

    const reorderedSchools = currentStudent.addedSchools
      .filter((school) => school.id !== schoolId)
      .map((school, index) => ({
        ...school,
        priorityOrder: index + 1,
      }));

    const orderSaved = await persistStudentApplicationOrder(reorderedSchools);
    if (!orderSaved) return;

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: reorderedSchools,
    }));
  };

  const reorderStudentSchools = async (reorderedSchools: DashboardSchool[]) => {
    if (!currentStudent || !authUserId) return;

    const normalizedSchools = reorderedSchools.map((school, index) => ({
      ...school,
      priorityOrder: index + 1,
    }));

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: normalizedSchools,
    }));

    void persistStudentApplicationOrder(normalizedSchools);
  };

  const updateStudentSchoolTasks = async (
    schoolId: string,
    tasks: StudentTask[],
    applicationId?: string,
  ) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool) return;
    const appId = applicationId ?? targetSchool.studentApplicationId ?? '';
    if (!appId) return;
    const entry = findEntryPoint(targetSchool, appId);
    if (!entry) return;

    const normalizedTasks = tasks.map((task) => ({
      ...task,
      completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
    }));

    const progressTasks = normalizedTasks.filter(
      (task) =>
        task.completion_source !== 'application' &&
        task.is_toggleable !== false &&
        task.is_available !== false &&
        task.source_event_ids &&
        task.source_event_ids.length > 0,
    );

    if (progressTasks.length > 0) {
      const payload = progressTasks.flatMap((task) =>
        (task.source_event_ids ?? []).map((eventId) => ({
          student_application_id: appId,
          school_event_id: eventId,
          status: task.completed ? 'completed' : 'pending',
          completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
        })),
      );

      const { error } = await supabase
        .from('student_application_progress')
        .upsert(payload, { onConflict: 'student_application_id,school_event_id' });

      if (error) {
        console.error('Error updating student application progress:', error);
        return;
      }
    }

    const applicationTask = normalizedTasks.find((task) => task.completion_source === 'application');

    // 持久化家長自訂日期：只寫該學生的私有覆蓋表，不影響學校主資料庫
    // - 有 school_event_id 的可編輯列（一面/二面）→ 以事件為鍵
    // - 沒有事件、但可編輯的列（Rolling 學校固定行）→ 以 title 為鍵，並一起存勾選狀態
    const eventOverridePayload: {
      student_application_id: string;
      school_event_id: string;
      start_at: string;
    }[] = [];
    const titleOverridePayload: {
      student_application_id: string;
      school_event_id: null;
      title: string;
      start_at: string;
      completed: boolean;
      completed_at: string | null;
    }[] = [];

    for (const task of normalizedTasks) {
      const startAt = task.private_override?.start_at;
      if (!startAt || task.is_editable_date !== true) continue;

      const eventId = task.source_event_ids?.[0];
      if (eventId) {
        eventOverridePayload.push({
          student_application_id: appId,
          school_event_id: eventId,
          start_at: startAt,
        });
      } else if (task.title) {
        titleOverridePayload.push({
          student_application_id: appId,
          school_event_id: null,
          title: task.title,
          start_at: startAt,
          completed: task.completed,
          completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
        });
      }
    }

    if (eventOverridePayload.length > 0) {
      const { error } = await supabase
        .from('student_application_event_overrides')
        .upsert(eventOverridePayload, { onConflict: 'student_application_id,school_event_id' });

      if (error) {
        console.error('Error saving event date override:', error);
      }
    }

    if (titleOverridePayload.length > 0) {
      const { error } = await supabase
        .from('student_application_event_overrides')
        .upsert(titleOverridePayload, { onConflict: 'student_application_id,title' });

      if (error) {
        console.error('Error saving rolling date override:', error);
      }
    }

    if (applicationTask && applicationTask.is_available !== false) {
      const nextAppliedAt = applicationTask.completed
        ? applicationTask.completed_at ?? new Date().toISOString()
        : null;
      const nextStatus = resolveNextApplicationStatus(
        entry.applicationStatus,
        applicationTask.completed,
      );

      const { error } = await supabase
        .from('student_applications')
        .update({
          applied_at: nextAppliedAt,
          status: nextStatus,
        })
        .eq('id', appId);

      if (error) {
        console.error('Error updating student application status:', error);
        return;
      }
    }

    // 同步覆蓋清除：沒有自訂日期的可編輯列 → 刪掉對應的私有覆蓋（無 row 則為 no-op）
    for (const task of normalizedTasks) {
      if (task.is_editable_date !== true) continue;
      if (task.private_override?.start_at) continue;

      const eventId = task.source_event_ids?.[0];
      if (eventId) {
        const { error } = await supabase
          .from('student_application_event_overrides')
          .delete()
          .eq('student_application_id', appId)
          .eq('school_event_id', eventId);

        if (error) {
          console.error('Error clearing event date override:', error);
        }
      } else if (task.title) {
        const { error } = await supabase
          .from('student_application_event_overrides')
          .delete()
          .eq('student_application_id', appId)
          .eq('title', task.title)
          .is('school_event_id', null);

        if (error) {
          console.error('Error clearing rolling date override:', error);
        }
      }
    }

    // 同步自訂事件勾選狀態（id 即 student_application_custom_events 的主鍵）
    const customTasks = normalizedTasks.filter((task) => task.is_custom === true);
    for (const task of customTasks) {
      const { error } = await supabase
        .from('student_application_custom_events')
        .update({
          completed: task.completed,
          completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating custom event completion:', error);
      }
    }

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: student.addedSchools.map((school) =>
        school.id === schoolId
          ? patchEntryPoints(school, appId, (current) => ({
              ...current,
              applicationStatus:
                applicationTask && applicationTask.is_available !== false
                  ? resolveNextApplicationStatus(current.applicationStatus, applicationTask.completed)
                  : current.applicationStatus,
              tasks: normalizedTasks,
            }))
          : school
      ),
    }));
  };

  /**
   * 重新組裝某張卡的某個入口：從資料庫抓事件＋進度＋覆蓋＋自訂事件，
   * 統一經由 buildSchoolCardTasks 重算，確保排序與顯示邏輯單一來源。
   */
  const refreshSchoolTasks = useCallback(
    async (school: DashboardSchool, applicationId: string) => {
      const entry = findEntryPoint(school, applicationId);
      if (!authUserId || !entry?.studentApplicationId || !entry.schoolCycleId) return;

      const appId = entry.studentApplicationId;

      const [cycleRes, progressRes, overrideRes, customRes] = await Promise.all([
        supabase
          .from('school_cycles')
          .select('application_level, is_rolling_admission, school_events(id, title_zh, event_type, date_status, sequence_no, start_at, end_at)')
          .eq('id', entry.schoolCycleId)
          .maybeSingle(),
        supabase
          .from('student_application_progress')
          .select('student_application_id, school_event_id, status, completed_at')
          .eq('student_application_id', appId),
        supabase
          .from('student_application_event_overrides')
          .select('student_application_id, school_event_id, title, start_at, completed, completed_at')
          .eq('student_application_id', appId),
        supabase
          .from('student_application_custom_events')
          .select('id, title, start_at, completed, completed_at')
          .eq('student_application_id', appId)
          .order('start_at', { ascending: true }),
      ]);

      if (cycleRes.error || progressRes.error || overrideRes.error || customRes.error) {
        console.error('Error refreshing school tasks:', {
          cycle: cycleRes.error,
          progress: progressRes.error,
          override: overrideRes.error,
          custom: customRes.error,
        });
        return;
      }

      const cycle = getSingleRelation((cycleRes.data as SchoolCycleRow | null));
      const events = cycle?.school_events ?? [];
      const isRollingAdmission = cycle?.is_rolling_admission === true;
      const applicationLevel = (cycle?.application_level ??
        'primary') as SchoolEntryPoint['applicationLevel'];

      const progressMap = new Map<string, StudentApplicationProgressRow>();
      for (const progress of (progressRes.data || []) as StudentApplicationProgressRow[]) {
        progressMap.set(`${progress.student_application_id}:${progress.school_event_id}`, progress);
      }

      const overrides = buildOverrideMap((overrideRes.data || []) as StudentApplicationEventOverrideRow[]);

      const customEvents: SchoolCardCustomEvent[] = ((customRes.data || []) as StudentApplicationCustomEventRow[])
        .map((row) => ({
          id: row.id,
          title_zh: row.title,
          start_at: row.start_at,
          completed: row.completed,
          completed_at: row.completed_at,
        }));

      const builtTasks = buildSchoolCardTasks({
        schoolId: school.id,
        studentApplicationId: appId,
        events,
        progressMap,
        overrides,
        customEvents,
        isRollingAdmission,
      });

      updateCurrentStudent((student) => ({
        ...student,
        addedSchools: student.addedSchools.map((item) =>
          item.id === school.id
            ? patchEntryPoints(item, appId, (current) => ({
                ...current,
                tasks: builtTasks,
                isRollingAdmission,
                applicationLevel,
              }))
            : item,
        ),
      }));
    },
    [authUserId, updateCurrentStudent],
  );

  const addCustomEvent = async (schoolId: string, title: string, startAt: string, applicationId?: string) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool) return;
    const appId = applicationId ?? targetSchool.studentApplicationId ?? '';
    if (!appId) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const { error } = await supabase
      .from('student_application_custom_events')
      .insert({
        student_application_id: appId,
        title: trimmedTitle,
        start_at: startAt,
      });

    if (error) {
      console.error('Error creating custom event:', error);
      return;
    }

    await refreshSchoolTasks(targetSchool, appId);
  };

  const removeCustomEvent = async (schoolId: string, customEventId: string, applicationId?: string) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool) return;
    const appId = applicationId ?? targetSchool.studentApplicationId ?? '';
    if (!appId) return;

    const { error } = await supabase
      .from('student_application_custom_events')
      .delete()
      .eq('id', customEventId)
      .eq('student_application_id', appId);

    if (error) {
      console.error('Error deleting custom event:', error);
      return;
    }

    await refreshSchoolTasks(targetSchool, appId);
  };

  const restoreEventDate = async (schoolId: string, taskId: string, applicationId?: string) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool) return;
    const appId = applicationId ?? targetSchool.studentApplicationId ?? '';
    if (!appId) return;

    const entry = findEntryPoint(targetSchool, appId);
    const task = (entry?.tasks ?? targetSchool.tasks).find((item) => item.id === taskId);
    const eventId = task?.source_event_ids?.[0];
    let query = supabase
      .from('student_application_event_overrides')
      .delete()
      .eq('student_application_id', appId);

    if (eventId) {
      query = query.eq('school_event_id', eventId);
    } else if (task?.title) {
      query = query.eq('title', task.title).is('school_event_id', null);
    } else {
      return;
    }

    const { error } = await query;

    if (error) {
      console.error('Error restoring event date:', error);
      return;
    }

    await refreshSchoolTasks(targetSchool, appId);
  };

  const updateSchoolResult = async (
    schoolId: string,
    resultStatus: 'offered' | 'waitlisted' | 'rejected' | null,
    applicationId?: string,
  ) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool) return;
    const appId = applicationId ?? targetSchool.studentApplicationId ?? '';
    if (!appId) return;
    const entry = findEntryPoint(targetSchool, appId);
    if (!entry) return;

    // 清除結果 → 回到「已申請」；標註 → 寫入對應結果狀態（樂觀 UI，先更新本地）
    const nextStatus: ApplicationStatus = resultStatus ?? 'applied';

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: student.addedSchools.map((school) =>
        school.id === schoolId
          ? patchEntryPoints(school, appId, (current) => ({
              ...current,
              applicationStatus: nextStatus,
            }))
          : school
      ),
    }));

    const { error } = await supabase
      .from('student_applications')
      .update({
        status: nextStatus,
        result_at: resultStatus ? new Date().toISOString() : null,
      })
      .eq('id', appId);

    if (error) {
      console.error('Error updating school result:', error);
      // 寫入失敗時回滾，重新載入遠端資料
      await refreshSchoolTasks(targetSchool, appId);
    }
  };

  return (
    <AppContext.Provider
      value={{
        authReady,
        isLoggedIn,
        setIsLoggedIn,
        currentStudent,
        setCurrentStudent,
        students,
        addStudent,
        updateStudent,
        removeStudent,
        addSchoolToStudent,
        removeSchoolFromStudent,
        reorderStudentSchools,
        updateStudentSchoolTasks,
        addCustomEvent,
        removeCustomEvent,
        restoreEventDate,
        updateSchoolResult,
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
