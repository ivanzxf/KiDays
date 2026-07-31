'use client'

import { useMemo, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ApplicationLevel,
  DashboardSchool,
  Event,
  School,
  SchoolCycle,
  SchoolCycleWithEvents,
  SchoolEvent,
  SchoolWithTasks,
  Student,
  StudentSchoolWithDetails,
  Task,
  formatSchoolForFrontend,
} from '@/types'

const FALLBACK_SCHOOLS: School[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    name_zh: '港島直資第一小學',
    name_en: 'HK Island Dummy Direct Subsidy Primary No.1',
    type: 'primary',
    application_level: 'primary',
    district: '港島區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'direct_subsidy',
    school_net: '12',
    address_zh: '香港島中西區半山區一號',
    address_en: '1 Mid-Levels, Central & Western District, Hong Kong Island',
    website: 'https://example-ps1.kidays.test',
    phone: '2812 3456',
    email: 'admission@ps1.kidays.test',
    remarks: 'fallback primary school',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    name_zh: '九龍男拔資助小學',
    name_en: 'Kowloon Boys Aided Dummy Primary No.2',
    type: 'primary',
    application_level: 'primary',
    district: '九龍區',
    gender: 'boys',
    gender_policy: 'boys',
    school_type: 'aided',
    school_net: '40',
    address_zh: '九龍旺角砵蘭街二號',
    address_en: '2 Portland Street, Mong Kok, Kowloon',
    website: 'https://example-ps2.kidays.test',
    phone: '2388 9910',
    email: 'admission@ps2.kidays.test',
    remarks: 'fallback primary school',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    name_zh: '新界國際小學',
    name_en: 'New Territories Dummy International Primary No.3',
    type: 'primary',
    application_level: 'primary',
    district: '新界區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'international',
    school_net: '91',
    address_zh: '新界沙田科學園三號',
    address_en: '3 Science Park, Sha Tin, New Territories',
    website: 'https://example-ps3.kidays.test',
    phone: '2699 0001',
    email: 'admission@ps3.kidays.test',
    remarks: 'fallback primary school',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    name_zh: '港島官立小學',
    name_en: 'HK Island Government Dummy Primary No.4',
    type: 'primary',
    application_level: 'primary',
    district: '港島區',
    gender: 'coed',
    gender_policy: 'coed',
    school_type: 'government',
    school_net: '18',
    address_zh: '香港島灣仔皇后大道東四號',
    address_en: "4 Queen's Road East, Wan Chai, Hong Kong Island",
    website: 'https://example-ps4.kidays.test',
    phone: '2528 7788',
    email: 'admission@ps4.kidays.test',
    remarks: 'fallback primary school',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    name_zh: '九龍私立名校小學',
    name_en: 'Kowloon Private Elite Dummy Primary No.5',
    type: 'primary',
    application_level: 'primary',
    district: '九龍區',
    gender: 'girls',
    gender_policy: 'girls',
    school_type: 'private',
    school_net: '34',
    address_zh: '九龍尖沙咀海防道五號',
    address_en: '5 Haiphong Road, Tsim Sha Tsui, Kowloon',
    website: 'https://example-ps5.kidays.test',
    phone: '2366 4321',
    email: 'admission@ps5.kidays.test',
    remarks: 'fallback primary school',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Get all schools by type
export function useSchools(type: ApplicationLevel, useMockFallback = true) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const fallbackSchools = useMemo(
    () =>
      FALLBACK_SCHOOLS.filter(
        (school) => (school.application_level ?? school.type) === type
      ),
    [type]
  )

  useEffect(() => {
    let active = true

    async function loadSchools() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .or(`type.eq.${type},application_level.eq.${type}`)
          .order('name_zh')

        if (error) throw error

        if (!active) return

        const rows = (data || []) as School[]

        if (!useMockFallback) {
          setSchools(rows)
          return
        }

        const existingIds = new Set(rows.map((row) => row.id))
        const mergedRows = [
          ...rows,
          ...fallbackSchools.filter((mock) => !existingIds.has(mock.id)),
        ].sort((a, b) => (a.name_zh ?? '').localeCompare(b.name_zh ?? '', 'zh-HK'))

        setSchools(mergedRows)
      } catch (error) {
        console.error('Error loading schools:', error)
        if (active && useMockFallback) {
          setSchools(fallbackSchools)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadSchools()

    return () => {
      active = false
    }
  }, [type, useMockFallback, fallbackSchools])

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
export function useEvents(type: ApplicationLevel) {
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

type SchoolCyclesWithEventsRow = SchoolCycle & {
  school_events: SchoolEvent[]
}

export function useSchoolsWithLatestCycle(
  type: ApplicationLevel,
  academicYear?: string
) {
  const [schools, setSchools] = useState<DashboardSchool[]>([])
  const [cyclesMap, setCyclesMap] = useState<Record<string, SchoolCycleWithEvents[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [{ data: schoolRows, error: schoolError }, { data: cycleRows, error: cycleError }] =
          await Promise.all([
            supabase
              .from('schools')
              .select('*')
              .or(`application_level.eq.${type},type.eq.${type}`)
              .order('name_zh'),
            supabase
              .from('school_cycles')
              .select('*, school_events(*)')
              .eq('application_level', type)
              .eq(academicYear ? 'academic_year' : 'status', academicYear ?? 'published')
              .order('academic_year', { ascending: false })
              .order('created_at', { ascending: true }),
          ])

        if (schoolError) throw schoolError
        if (cycleError) throw cycleError
        if (!active) return

        const schoolsList = (schoolRows || []) as School[]
        const existingIds = new Set(schoolsList.map((school) => school.id))
        const mergedSchools = [
          ...schoolsList,
          ...FALLBACK_SCHOOLS.filter(
            (school) =>
              (school.application_level ?? school.type) === type && !existingIds.has(school.id)
          ),
        ].sort((a, b) => (a.name_zh ?? '').localeCompare(b.name_zh ?? '', 'zh-HK'))

        setSchools(mergedSchools.map((row) => formatSchoolForFrontend(row)))

        const nextCyclesMap: Record<string, SchoolCycleWithEvents[]> = {}
        for (const cycle of (cycleRows || []) as SchoolCyclesWithEventsRow[]) {
          const events = (cycle.school_events || []).sort((a, b) => {
            if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at)
            return (a.sequence_no ?? 0) - (b.sequence_no ?? 0)
          })

          const item: SchoolCycleWithEvents = {
            ...cycle,
            school: mergedSchools.find((s) => s.id === cycle.school_id) ?? null,
            events,
          }

          const bucket = nextCyclesMap[cycle.school_id] ?? []
          bucket.push(item)
          nextCyclesMap[cycle.school_id] = bucket
        }

        setCyclesMap(nextCyclesMap)
      } catch (error) {
        console.error('Error loading schools with cycles:', error)
        if (active) {
          const mockByType = FALLBACK_SCHOOLS.filter(
            (school) => (school.application_level ?? school.type) === type
          )
          setSchools(mockByType.map((row) => formatSchoolForFrontend(row)))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [type, academicYear])

  return { schools, cyclesMap, loading }
}

export function usePrimarySchoolsWithLatestCycle(academicYear?: string) {
  return useSchoolsWithLatestCycle('primary', academicYear)
}

export function formatSchoolEventLabel(type: string, sequenceNo: number | null): string {
  switch (type) {
    case 'open_day':
      return '開放日'
    case 'info_session':
      return '簡介會'
    case 'application_open':
      return '申請開始'
    case 'application_deadline':
      return '申請截止'
    case 'assessment':
      return '入學評估'
    case 'first_interview':
      return `第一面${sequenceNo !== null && sequenceNo !== 1 ? `（${sequenceNo}）` : ''}`
    case 'second_interview':
      return '第二面'
    case 'third_interview':
      return '第三面'
    case 'result_release':
      return '放榜'
    case 'registration':
      return '註冊'
    case 'parent_meeting':
      return '家長會'
    case 'waiting_list':
      return '候補通知'
    default:
      return '其他'
  }
}

export function resolveApplicationLevel(school: School): ApplicationLevel {
  return school.application_level ?? school.type ?? 'primary'
}
