// 学校资料批量导入脚本骨架
//
// 用途：
// - 后续替换 dummy 学校资料时，可直接把 CSV / JSON 转成 schools / school_cycles / school_events 三批数据
// - 脚本使用 Supabase service role 或普通 client 都能跑，但生产环境建议用 service role
//
// 使用方式：
// - 准备好你的源资料文件（CSV 或 JSON 都行），当前脚本里留了占位 INPUT_JSON 路径
// - 先确保 .env.local 存在以下变量：
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   （若使用 service role，请额外提供 SUPABASE_SERVICE_ROLE_KEY，并自行选择读取）
// - 执行：`npx tsx scripts/import_schools.ts`
//   或你如果不想加 tsx，也可以改写成 JS 版本

import * as fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { ApplicationLevel, School, SchoolCycle, SchoolEvent, SchoolType } from '@/types'

// ---------- 配置区 ----------
//
// 这里刻意留成函数参数，你之后接 CSV 时可以改成：
//   import Papa from 'papaparse'
//   const parsed = Papa.parse(fs.readFileSync(csvPath, 'utf8')).data

interface SchoolImportRow {
  // 学校基本资料
  id?: string
  name_zh: string
  name_en?: string | null
  district?: string | null
  gender_policy?: 'coed' | 'boys' | 'girls' | null
  school_type?: SchoolType | null
  application_level?: ApplicationLevel | null
  school_net?: string | null
  address_zh?: string | null
  address_en?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  remarks?: string | null
  is_active?: boolean | null
  // 招生周期
  academic_year: string
  // 关键日期：按你现有资料灵活填，这里只放最常见的几种示例
  open_day?: string | null // ISO timestamp
  info_session?: string | null
  application_open?: string | null
  application_deadline?: string | null
  first_interview?: string | null
  second_interview?: string | null
  third_interview?: string | null
  result_release?: string | null
  registration?: string | null
}

// 这里是占位示例，后续改成读真实 JSON / CSV
const SAMPLE_ROWS: SchoolImportRow[] = []

// ---------- Supabase Client ----------
function buildSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，請先確認 .env.local')
  }

  return createClient(url, anonKey)
}

// ---------- 转换函数 ----------
function toSchoolPayload(row: SchoolImportRow): Omit<School, 'created_at' | 'updated_at'> {
  return {
    id: row.id ?? crypto.randomUUID(),
    name_zh: row.name_zh,
    name_en: row.name_en ?? null,
    // 兼容旧字段：写入新字段时，把旧字段也一起填，保留向后兼容
    type: (row.application_level ?? 'primary') as ApplicationLevel,
    application_level: row.application_level ?? 'primary',
    district: row.district ?? null,
    gender: row.gender_policy ?? null,
    gender_policy: row.gender_policy ?? null,
    school_type: row.school_type ?? null,
    school_net: row.school_net ?? null,
    address_zh: row.address_zh ?? null,
    address_en: row.address_en ?? null,
    website: row.website ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    remarks: row.remarks ?? null,
    is_active: row.is_active ?? true,
  }
}

function toCyclePayload(schoolId: string, row: SchoolImportRow): Omit<SchoolCycle, 'id' | 'created_at' | 'updated_at'> {
  return {
    school_id: schoolId,
    academic_year: row.academic_year,
    application_level: row.application_level ?? 'primary',
    status: 'published',
    notes: row.remarks ?? null,
  }
}

function toEventsPayload(cycleId: string, row: SchoolImportRow): Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>[] {
  const events: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>[] = []

  const mapping: Array<{
    key: keyof Pick<
      SchoolImportRow,
      | 'open_day'
      | 'info_session'
      | 'application_open'
      | 'application_deadline'
      | 'first_interview'
      | 'second_interview'
      | 'third_interview'
      | 'result_release'
      | 'registration'
    >
    event_type: SchoolEvent['event_type']
    sequence_no: number
  }> = [
    { key: 'open_day', event_type: 'open_day', sequence_no: 1 },
    { key: 'info_session', event_type: 'info_session', sequence_no: 1 },
    { key: 'application_open', event_type: 'application_open', sequence_no: 1 },
    { key: 'application_deadline', event_type: 'application_deadline', sequence_no: 1 },
    { key: 'first_interview', event_type: 'first_interview', sequence_no: 1 },
    { key: 'second_interview', event_type: 'second_interview', sequence_no: 2 },
    { key: 'third_interview', event_type: 'third_interview', sequence_no: 3 },
    { key: 'result_release', event_type: 'result_release', sequence_no: 1 },
    { key: 'registration', event_type: 'registration', sequence_no: 1 },
  ]

  for (const item of mapping) {
    const value = row[item.key]
    if (!value) continue

    events.push({
      school_cycle_id: cycleId,
      event_type: item.event_type,
      sequence_no: item.sequence_no,
      title_zh: null,
      title_en: null,
      start_at: value,
      end_at: value,
      all_day: true,
      location: null,
      source_url: null,
      notes: null,
    })
  }

  return events
}

// ---------- 主流程 ----------
// 这里故意先不执行，保留骨架；你给真实资料后再跑。
export async function importSchools(rows: SchoolImportRow[]) {
  const supabase = buildSupabaseClient()

  for (const row of rows) {
    const schoolPayload = toSchoolPayload(row)

    const { data: schoolResult, error: schoolError } = await supabase
      .from('schools')
      .upsert(schoolPayload, { onConflict: 'id' })
      .select('id')
      .single()

    if (schoolError) {
      console.error('寫入 schools 失敗:', schoolError)
      continue
    }

    if (!schoolResult) continue
    const schoolId = schoolResult.id

    const cyclePayload = toCyclePayload(schoolId, row)
    const { data: cycleResult, error: cycleError } = await supabase
      .from('school_cycles')
      .upsert(cyclePayload, { onConflict: 'school_id,academic_year,application_level' })
      .select('id')
      .single()

    if (cycleError) {
      console.error('寫入 school_cycles 失敗:', cycleError)
      continue
    }

    if (!cycleResult) continue
    const cycleId = cycleResult.id

    const events = toEventsPayload(cycleId, row)
    if (events.length === 0) continue

    const { error: eventsError } = await supabase.from('school_events').upsert(events, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })

    if (eventsError) {
      console.error('寫入 school_events 失敗:', eventsError)
    }
  }
}

// 如果后续要支持读 JSON 文件，可以把下面打开：
// function loadInputFile(filePath: string): SchoolImportRow[] {
//   const raw = fs.readFileSync(path.resolve(filePath), 'utf8')
//   return JSON.parse(raw) as SchoolImportRow[]
// }

if (require.main === module) {
  // 占位：SAMPLE_ROWS 目前为空，后续换成 loadInputFile('.../your-file.json')
  void importSchools(SAMPLE_ROWS)
    .then(() => {
      console.log('匯入腳本執行完成（若 SAMPLE_ROWS 為空，則只是驗證骨架）')
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
