'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { School, Task, Student } from '@/types';

// Context 类型定义
interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'addedSchools'>) => void;
  removeStudent: (studentId: string) => void;
  addSchoolToStudent: (school: School) => void;
  updateStudentSchoolTasks: (schoolId: string, tasks: Task[]) => void;
}

// 创建 Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// 模拟学生数据
const mockStudents: Student[] = [
  {
    id: 's1',
    name: '小明',
    birthDate: new Date('2020-05-15'),
    applicationType: 'kindergarten',
    addedSchools: [],
  },
  {
    id: 's2',
    name: '小红',
    birthDate: new Date('2018-08-20'),
    applicationType: 'primary',
    addedSchools: [],
  },
];

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(mockStudents[0]);

  // 添加学生
  const addStudent = (studentData: Omit<Student, 'id' | 'addedSchools'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `s${Date.now()}`,
      addedSchools: [],
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
  const addSchoolToStudent = (school: School) => {
    if (!currentStudent) return;
    setStudents(students.map(student => {
      if (student.id === currentStudent.id) {
        return {
          ...student,
          addedSchools: [...student.addedSchools, school],
        };
      }
      return student;
    }));
    setCurrentStudent(prev => prev ? {
      ...prev,
      addedSchools: [...prev.addedSchools, school],
    } : null);
  };

  // 更新学生的学校任务
  const updateStudentSchoolTasks = (schoolId: string, tasks: Task[]) => {
    if (!currentStudent) return;
    setStudents(students.map(student => {
      if (student.id === currentStudent.id) {
        return {
          ...student,
          addedSchools: student.addedSchools.map(school => 
            school.id === schoolId ? { ...school, tasks } : school
          ),
        };
      }
      return student;
    }));
    setCurrentStudent(prev => prev ? {
      ...prev,
      addedSchools: prev.addedSchools.map(school => 
        school.id === schoolId ? { ...school, tasks } : school
      ),
    } : null);
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
