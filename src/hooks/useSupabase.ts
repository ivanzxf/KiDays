'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { School, SchoolWithTasks, Task, Event, Student, StudentSchoolWithDetails } from '@/types'

// Get all schools by type
export function useSchools(type: 'kindergarten' | 'primary') {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSchools() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('type', type)
          .order('name_zh')

        if (error) throw error
        setSchools(data || [])
      } catch (error) {
        console.error('Error loading schools:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchools()
  }, [type])

  return { schools, loading }
}

// Get school with tasks
export function useSchoolWithTasks(schoolId: string) {
  const [school, setSchool] = useState<SchoolWithTasks | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSchool() {
      try {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single()

        if (schoolError) throw schoolError

        const { data: tasksData, error: tasksError } = await supabase
          .from('school_tasks')
          .select('*')
          .eq('school_id', schoolId)
          .order('sort_order')

        if (tasksError) throw tasksError

        setSchool({
          ...schoolData,
          tasks: tasksData || []
        })
      } catch (error) {
        console.error('Error loading school:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchool()
  }, [schoolId])

  return { school, loading }
}

// Get events by type
export function useEvents(type: 'kindergarten' | 'primary') {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('type', type)
          .order('date')

        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [type])

  return { events, loading }
}

// Get all events for calendar
export function useAllEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date')

        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return { events, loading }
}

// Get students for current user
export function useStudents(userId: string | null) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setStudents(data || [])
      } catch (error) {
        console.error('Error loading students:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [userId])

  return { students, loading }
}

// Get student's schools with details
export function useStudentSchools(studentId: string | null) {
  const [studentSchools, setStudentSchools] = useState<StudentSchoolWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }

    async function loadStudentSchools() {
      try {
        // Get student_schools with school data
        const { data: studentSchoolsData, error: ssError } = await supabase
          .from('student_schools')
          .select(`
            *,
            school:schools(*)
          `)
          .eq('student_id', studentId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (ssError) throw ssError

        // For each student_school, get the tasks with completion status
        const result: StudentSchoolWithDetails[] = []

        for (const ss of studentSchoolsData || []) {
          // Get all tasks for the school
          const { data: tasksData, error: tasksError } = await supabase
            .from('school_tasks')
            .select('*')
            .eq('school_id', ss.school_id)
            .order('sort_order')

          if (tasksError) throw tasksError

          // Get completion status for these tasks
          const { data: studentTasksData, error: stError } = await supabase
            .from('student_school_tasks')
            .select('*')
            .eq('student_school_id', ss.id)

          if (stError) throw stError

          // Merge task data with completion status
          const tasks = tasksData?.map(task => {
            const studentTask = studentTasksData?.find(st => st.task_id === task.id)
            return {
              ...task,
              completed: studentTask?.completed || false,
              completed_at: studentTask?.completed_at || null
            }
          }) || []

          result.push({
            ...ss,
            school: ss.school,
            tasks
          })
        }

        setStudentSchools(result)
      } catch (error) {
        console.error('Error loading student schools:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStudentSchools()
  }, [studentId])

  return { studentSchools, loading }
}
