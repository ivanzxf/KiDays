'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AppStudent,
  ApplicationType,
  DashboardSchool,
  School,
  Student,
  StudentTask,
  formatSchoolForFrontend,
  formatStudentForFrontend,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { formatEventDateLabel } from '@/lib/formatEventDateLabel';
import { resolveSchoolEventTitleZh } from '@/lib/schoolMetadata';

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
  removeStudent: (studentId: string) => Promise<void>;
  addSchoolToStudent: (school: DashboardSchool) => Promise<void>;
  removeSchoolFromStudent: (schoolId: string) => Promise<void>;
  reorderStudentSchools: (schools: DashboardSchool[]) => Promise<void>;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type StudentApplicationProgressRow = {
  student_application_id: string;
  school_event_id: string;
  status: 'pending' | 'completed' | 'skipped';
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

type SchoolCycleRow = {
  id: string;
  school_id: string;
  academic_year: string;
  application_level: 'primary' | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  school: School | School[] | null;
  school_events: SchoolCycleEventRow[] | null;
};

type StudentApplicationRow = {
  id: string;
  student_id: string;
  school_cycle_id: string;
  status: string;
  priority_order: number | null;
  created_at: string;
  school_cycle: SchoolCycleRow | SchoolCycleRow[] | null;
};

const getSingleRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const buildTasksFromSchoolEvents = (
  schoolId: string,
  studentApplicationId: string,
  events: SchoolCycleEventRow[],
  progressMap: Map<string, StudentApplicationProgressRow>,
): StudentTask[] =>
  [...events]
    .sort((a, b) => {
      if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at);
      return (a.sequence_no ?? 0) - (b.sequence_no ?? 0);
    })
    .map((event, index) => {
      const dateStatus = (event.date_status ?? (event.start_at ? 'confirmed' : 'tbd')) as 'confirmed' | 'tbd';
      const progress = progressMap.get(`${studentApplicationId}:${event.id}`);
      return {
        id: event.id,
        school_id: schoolId,
        title: resolveSchoolEventTitleZh(event),
        description: formatEventDateLabel(event.start_at, event.date_status),
        date_status: dateStatus,
        completed: progress?.status === 'completed',
        completed_at: progress?.status === 'completed' ? progress.completed_at : null,
        sort_order: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

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

        const addedSchools = relatedApplications.flatMap((application) => {
          const schoolCycle = getSingleRelation(application.school_cycle);
          const school = getSingleRelation(schoolCycle?.school);
          if (!schoolCycle || !school) return [];

          return {
            ...formatSchoolForFrontend(
              school,
              buildTasksFromSchoolEvents(
                school.id,
                application.id,
                schoolCycle.school_events ?? [],
                progressMap,
              ),
            ),
            studentApplicationId: application.id,
            schoolCycleId: schoolCycle.id,
            applicationStatus: application.status as DashboardSchool['applicationStatus'],
            priorityOrder: application.priority_order,
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
        .map((school, index) => ({
          applicationId: school.studentApplicationId,
          priorityOrder: index + 1,
        }))
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

    syncStudents([...students, newStudent], currentStudent?.id ?? newStudent.id);
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

    const { data: cycleRows, error: cycleError } = await supabase
      .from('school_cycles')
      .select('id, school_events(id, title_zh, event_type, date_status, sequence_no, start_at)')
      .eq('school_id', school.id)
      .eq('application_level', 'primary')
      .order('academic_year', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (cycleError) {
      console.error('Error loading school cycle for application create:', cycleError);
      return;
    }

    const latestCycle = getSingleRelation((cycleRows || []) as SchoolCycleRow[]);
    if (!latestCycle) {
      console.error('No school cycle found for school:', school.id);
      return;
    }

    const latestCycleEvents = latestCycle.school_events ?? [];

    const { data: applicationRow, error: applicationError } = await supabase
      .from('student_applications')
      .insert({
        student_id: currentStudent.id,
        school_cycle_id: latestCycle.id,
        status: 'planned',
        priority_order: currentStudent.addedSchools.length + 1,
      })
      .select('id, status, priority_order')
      .single();

    if (applicationError) {
      console.error('Error creating student application:', applicationError);
      return;
    }

    if (latestCycleEvents.length > 0) {
      const { error: progressInsertError } = await supabase
        .from('student_application_progress')
        .insert(
          latestCycleEvents.map((event) => ({
            student_application_id: applicationRow.id,
            school_event_id: event.id,
            status: 'pending',
          })),
        );

      if (progressInsertError) {
        console.error('Error creating default application progress:', progressInsertError);
      }
    }

    const newSchool = {
      ...formatSchoolForFrontend(
        school,
        buildTasksFromSchoolEvents(school.id, applicationRow.id, latestCycleEvents, new Map()),
      ),
      studentApplicationId: applicationRow.id,
      schoolCycleId: latestCycle.id,
      applicationStatus: applicationRow.status as DashboardSchool['applicationStatus'],
      priorityOrder: applicationRow.priority_order,
    };

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: [...student.addedSchools, newSchool],
    }));
  };

  const removeSchoolFromStudent = async (schoolId: string) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool?.studentApplicationId) return;

    const { error } = await supabase
      .from('student_applications')
      .delete()
      .eq('id', targetSchool.studentApplicationId);

    if (error) {
      console.error('Error removing school from student applications:', error);
      return;
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

    const orderSaved = await persistStudentApplicationOrder(normalizedSchools);
    if (!orderSaved) return;

    updateCurrentStudent((student) => ({
      ...student,
      addedSchools: normalizedSchools,
    }));
  };

  const updateStudentSchoolTasks = async (schoolId: string, tasks: StudentTask[]) => {
    if (!currentStudent || !authUserId) return;

    const targetSchool = currentStudent.addedSchools.find((school) => school.id === schoolId);
    if (!targetSchool?.studentApplicationId) return;

    const payload = tasks.map((task) => ({
      student_application_id: targetSchool.studentApplicationId,
      school_event_id: task.id,
      status: task.completed ? 'completed' : 'pending',
      completed_at: task.completed ? task.completed_at ?? new Date().toISOString() : null,
    }));

    const { error } = await supabase
      .from('student_application_progress')
      .upsert(payload, { onConflict: 'student_application_id,school_event_id' });

    if (error) {
      console.error('Error updating student application progress:', error);
      return;
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
        authReady,
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
