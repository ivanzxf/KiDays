'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { School, StudentTask, Student, formatStudentForFrontend, formatSchoolForFrontend } from '@/types';
import { mockSchools } from '@/lib/mockData';

// 兼容性学生接口
interface CompatibleStudent extends Student {
  birthDate?: Date | null;
  applicationType?: 'kindergarten' | 'primary';
  addedSchools?: any[];
}

// Context 类型定义
interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentStudent: CompatibleStudent | null;
  setCurrentStudent: (student: CompatibleStudent | null) => void;
  students: CompatibleStudent[];
  addStudent: (student: { 
    name: string; 
    birthYear: number; 
    birthMonth: number; 
    gender: 'boy' | 'girl';
    applicationType: 'kindergarten' | 'primary';
  }) => void;
  removeStudent: (studentId: string) => void;
  addSchoolToStudent: (school: any) => void;
  removeSchoolFromStudent: (schoolId: string) => void;
  reorderStudentSchools: (schools: any[]) => void;
  updateStudentSchoolTasks: (schoolId: string, tasks: StudentTask[]) => void;
}

// 创建 Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// 模拟学生数据 - 使用兼容格式
const mockStudents: CompatibleStudent[] = [
  {
    ...formatStudentForFrontend({
      id: 's1',
      user_id: 'mock-user',
      name: '小明',
      gender: 'boy',
      birth_date: '2020-05-15',
      application_type: 'kindergarten',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    addedSchools: [
      mockSchools[0],
      mockSchools[2],
      mockSchools[3],
      mockSchools[5],
    ]
  },
  {
    ...formatStudentForFrontend({
      id: 's2',
      user_id: 'mock-user',
      name: '小紅',
      gender: 'girl',
      birth_date: '2018-08-20',
      application_type: 'primary',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    addedSchools: [
      mockSchools[1],
      mockSchools[4],
    ]
  },
];

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<CompatibleStudent[]>(mockStudents);
  const [currentStudent, setCurrentStudent] = useState<CompatibleStudent | null>(mockStudents[0]);

  const getSchoolOrderStorageKey = (studentId: string) => `kidays:schoolOrder:${studentId}`;

  const applyStoredOrder = (schools: any[], orderedIds: string[]) => {
    const map = new Map(schools.map(s => [s.id, s]));
    const ordered = orderedIds.map(id => map.get(id)).filter(Boolean);
    const remaining = schools.filter(s => !orderedIds.includes(s.id));
    return [...ordered, ...remaining];
  };

  const persistSchoolOrder = (studentId: string, schools: any[]) => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(getSchoolOrderStorageKey(studentId), JSON.stringify(schools.map(s => s.id)));
    } catch {}
  };

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      setStudents(prev => {
        const updated = prev.map(s => {
          const raw = window.localStorage.getItem(getSchoolOrderStorageKey(s.id));
          if (!raw) return s;
          const ids = JSON.parse(raw);
          if (!Array.isArray(ids)) return s;
          return {
            ...s,
            addedSchools: applyStoredOrder(s.addedSchools || [], ids),
          };
        });

        setCurrentStudent(cs => (cs ? updated.find(s => s.id === cs.id) || null : null));

        return updated;
      });
    } catch {}
  }, []);

  // 添加学生
  const addStudent = (studentData: { 
    name: string; 
    birthYear: number; 
    birthMonth: number; 
    gender: 'boy' | 'girl';
    applicationType: 'kindergarten' | 'primary';
  }) => {
    const birthDate = new Date(studentData.birthYear, studentData.birthMonth - 1, 15);
    const newStudent: CompatibleStudent = {
      id: `s${Date.now()}`,
      user_id: 'mock-user',
      name: studentData.name,
      gender: studentData.gender,
      birth_date: birthDate.toISOString(),
      application_type: studentData.applicationType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      birthDate: birthDate,
      applicationType: studentData.applicationType,
      addedSchools: []
    };
    setStudents([...students, newStudent]);
    if (!currentStudent) {
      setCurrentStudent(newStudent);
    }
  };

  // 删除学生
  const removeStudent = (studentId: string) => {
    const updatedStudents = students.filter(s => s.id !== studentId);
    setStudents(updatedStudents);
    if (currentStudent?.id === studentId) {
      setCurrentStudent(updatedStudents.length > 0 ? updatedStudents[0] : null);
    }
  };

  // 添加学校到当前学生
  const addSchoolToStudent = (school: any) => {
    if (!currentStudent) return;
    const updatedStudents = students.map(student => {
      if (student.id === currentStudent.id) {
        const newSchools = [...(student.addedSchools || []), school];
        persistSchoolOrder(student.id, newSchools);
        return {
          ...student,
          addedSchools: newSchools,
        };
      }
      return student;
    });
    setStudents(updatedStudents);
    setCurrentStudent(updatedStudents.find(s => s.id === currentStudent.id) || null);
  };

  // 從當前學生中移除學校
  const removeSchoolFromStudent = (schoolId: string) => {
    if (!currentStudent) return;
    const updatedStudents = students.map(student => {
      if (student.id === currentStudent.id) {
        const newSchools = (student.addedSchools || []).filter(s => s.id !== schoolId);
        persistSchoolOrder(student.id, newSchools);
        return {
          ...student,
          addedSchools: newSchools,
        };
      }
      return student;
    });
    setStudents(updatedStudents);
    setCurrentStudent(updatedStudents.find(s => s.id === currentStudent.id) || null);
  };

  // 重新排序當前學生的學校
  const reorderStudentSchools = (reorderedSchools: any[]) => {
    if (!currentStudent) return;
    const updatedStudents = students.map(student => {
      if (student.id === currentStudent.id) {
        persistSchoolOrder(student.id, reorderedSchools);
        return {
          ...student,
          addedSchools: reorderedSchools,
        };
      }
      return student;
    });
    setStudents(updatedStudents);
    setCurrentStudent(updatedStudents.find(s => s.id === currentStudent.id) || null);
  };

  // 更新学生的学校任务
  const updateStudentSchoolTasks = (schoolId: string, tasks: StudentTask[]) => {
    if (!currentStudent) return;
    const updatedStudents = students.map(student => {
      if (student.id === currentStudent.id) {
        return {
          ...student,
          addedSchools: (student.addedSchools || []).map(school => 
            school.id === schoolId ? { ...school, tasks } : school
          ),
        };
      }
      return student;
    });
    setStudents(updatedStudents);
    setCurrentStudent(updatedStudents.find(s => s.id === currentStudent.id) || null);
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

// 自定义 Hook 来使用 Context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
