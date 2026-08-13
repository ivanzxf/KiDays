'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ApplicationLevel,
  DashboardSchool,
  School,
  SchoolCycle,
  SchoolCycleWithEvents,
  SchoolEvent,
  Student,
  formatSchoolForFrontend,
} from '@/types'

export function useSchools(type: ApplicationLevel) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSchools() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('is_active', true)
          .or(`type.eq.${type},application_level.eq.${type}`)
          .order('name_zh')

        if (error) throw error

        if (!active) return

        const rows = (data || []) as School[]
        setSchools(rows)
      } catch (error) {
        console.error('Error loading schools:', error)
        if (active) setSchools([])
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadSchools()

    return () => {
      active = false
    }
  }, [type])

  return { schools, loading }
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
              .eq('is_active', true)
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
        setSchools(schoolsList.map((row) => formatSchoolForFrontend(row)))

        const nextCyclesMap: Record<string, SchoolCycleWithEvents[]> = {}
        for (const cycle of (cycleRows || []) as SchoolCyclesWithEventsRow[]) {
          const events = (cycle.school_events || []).sort((a, b) => {
            if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at)
            return (a.sequence_no ?? 0) - (b.sequence_no ?? 0)
          })

          const item: SchoolCycleWithEvents = {
            ...cycle,
            school: schoolsList.find((s) => s.id === cycle.school_id) ?? null,
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
          setSchools([])
          setCyclesMap({})
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

export function resolveApplicationLevel(school: School): ApplicationLevel {
  return school.application_level ?? school.type ?? 'primary'
}
