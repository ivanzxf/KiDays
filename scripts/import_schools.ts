// 學校資料批量匯入腳本
//
// 用途：
// - 讀取 scripts/import_format/ 下三份 CSV（01_schools / 02_school_cycles / 03_school_events）
// - 透過 school_key + academic_year 當 join key，自動生成缺失的 UUID、補齊預設值、
//   自動推斷 date_status（start_at 空 => tbd；有值 => confirmed）
// - 最後用 Supabase client 依序 upsert 到三張正規化資料表
//
// 使用方式：
// - 先確認 .env.local 存在以下變數：
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   （若使用 service role，請額外提供 SUPABASE_SERVICE_ROLE_KEY，並在 buildSupabaseClient() 切換）
// - 本檔已內建極輕量 CSV parser（無需安裝額外套件）
// - 執行：`npx tsx scripts/import_schools.ts`
//   或先 `npm run build` 再用 Node 跑 dist 版本
//
// 格式說明：請參考 scripts/import_format/README.md

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type {
  ApplicationLevel,
  School,
  SchoolCycle,
  SchoolEvent,
  SchoolEventDateStatus,
  SchoolType,
} from '@/types';

// ---------- 載入 .env.local（Next.js 的 env loader 只有跑 dev/build 才會啟用） ----------
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trim = line.trim();
    if (!trim || trim.startsWith('#')) continue;
    const eq = trim.indexOf('=');
    if (eq === -1) continue;
    const k = trim.slice(0, eq).trim();
    let v = trim.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (typeof process.env[k] !== 'string') process.env[k] = v;
  }
} catch {
  // 沒有 .env.local 也不報錯，留給 buildSupabaseClient 去檢查必要變數
}

// ---------- 檔案路徑（對應 README 的三份 CSV，兼容 ESM / CJS） ----------
const __FILENAME__ = (typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url));
const __DIRNAME__ = path.dirname(__FILENAME__);
const FORMAT_DIR = path.resolve(__DIRNAME__, 'import_format');
// 若存在「固定 7 列版」v2 events 檔則優先使用（含 data_status / source_url / NA_EVENT 三態），
// 否則退回舊版 03_school_events.csv（僅靠 start_at 判 confirmed / tbd）。
const V2_EVENTS_PATH = path.join(FORMAT_DIR, '03_school_events_v2.csv');
const EVENTS_PATH = fs.existsSync(V2_EVENTS_PATH)
  ? V2_EVENTS_PATH
  : path.join(FORMAT_DIR, '03_school_events.csv');
const PATHS = {
  schools: path.join(FORMAT_DIR, '01_schools.csv'),
  cycles: path.join(FORMAT_DIR, '02_school_cycles.csv'),
  events: EVENTS_PATH,
} as const;

// ---------- CSV 原始列（直接從 CSV 讀出的 string 形式） ----------
interface SchoolRowRaw {
  school_key: string;
  name_zh: string;
  name_en?: string;
  district?: string;
  gender?: 'coed' | 'boys' | 'girls' | '';
  school_net?: string;
  school_type?: SchoolType | '';
  address_zh?: string;
  website?: string;
  phone?: string;
  email?: string;
}

interface CycleRowRaw {
  school_key: string;
  academic_year: string;
  /** 入口層級：kindergarten（Prep Year）| primary（Year 1） */
  application_level?: string;
  notes?: string;
}

interface EventRowRaw {
  school_key: string;
  academic_year: string;
  event_type: SchoolEvent['event_type'];
  sequence_no?: string;
  title_zh?: string;
  start_at?: string;
  end_at?: string;
  all_day?: 'true' | 'false' | '';
  /** v2 固定 7 列版：confirmed / tbd / na */
  data_status?: string;
  source_url?: string;
  /** 入口層級：kindergarten（Prep Year）| primary（Year 1） */
  application_level?: string;
  /** Rolling Admissions：true / false（同校同年度每列一致） */
  is_rolling_admission?: string;
}

/** 學年度正規化：'2027/2028' -> '2027-2028'，統一以連字號為 canonical 格式。 */
function normalizeAcademicYear(year: string): string {
  return year.trim().replace(/\//g, '-');
}

/** 入口層級正規化：缺省視為 primary（相容舊檔）。 */
function normalizeApplicationLevel(level: string | undefined): 'kindergarten' | 'primary' {
  const t = (level ?? '').trim().toLowerCase();
  return t === 'kindergarten' ? 'kindergarten' : 'primary';
}

/** join key：school_key + 年度 + 入口層級。 */
function cycleJoinKey(schoolKey: string, year: string, level: string | undefined): string {
  return `${schoolKey}::${normalizeAcademicYear(year)}::${normalizeApplicationLevel(level)}`;
}

// ---------- Supabase Client ----------
function buildSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || (!anonKey && !serviceKey)) {
    throw new Error(
      '缺少 NEXT_PUBLIC_SUPABASE_URL + (NEXT_PUBLIC_SUPABASE_ANON_KEY 或 SUPABASE_SERVICE_ROLE_KEY)，請確認 .env.local',
    );
  }

  return createClient(url, serviceKey ?? anonKey!);
}

// ---------- 極輕量 CSV 解析（僅處理：逗號分隔、\n 換行、引號脫逸） ----------
// 為了不新增 papaparse 依賴，專門處理目前 3 份格式單純的 CSV。
// 若未來欄位中出現逗號或引號，請用 RFC-4180 規則（把欄位用 "" 包起來，內部引號寫 "" 脫逸）。
function parseSimpleCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cur.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((row) => row.length > 1 || (row.length === 1 && row[0].trim() !== ''));
}

function loadCsv<T extends object>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseSimpleCsv(content);
  if (rows.length < 2) throw new Error(`CSV 缺少 header 或內容 (${filePath})`);
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj as T;
  });
}

function nullableString(s: string | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

// ---------- 轉換：Row → DB Payload ----------
function schoolRowToPayload(
  row: SchoolRowRaw,
  cachedUuid?: string,
): Omit<School, 'created_at' | 'updated_at'> {
  const gender = nullableString(row.gender) as 'coed' | 'boys' | 'girls' | null;
  const schoolType = nullableString(row.school_type) as SchoolType | null;
  return {
    id: cachedUuid ?? crypto.randomUUID(),
    name_zh: row.name_zh.trim(),
    name_en: nullableString(row.name_en),
    // 舊欄位相容：同時寫 type 與 application_level，保留回溯相容
    type: 'primary' as ApplicationLevel,
    application_level: 'primary' as ApplicationLevel,
    district: nullableString(row.district),
    gender,
    gender_policy: gender,
    school_type: schoolType,
    school_net: nullableString(row.school_net),
    address_zh: nullableString(row.address_zh),
    address_en: null,
    website: nullableString(row.website),
    phone: nullableString(row.phone),
    email: nullableString(row.email),
    remarks: null,
    is_active: true,
  };
}

function cycleRowToPayload(
  schoolId: string,
  row: CycleRowRaw,
): Omit<SchoolCycle, 'id' | 'created_at' | 'updated_at'> {
  return {
    school_id: schoolId,
    academic_year: normalizeAcademicYear(row.academic_year),
    application_level: normalizeApplicationLevel(
      row.application_level,
    ) as SchoolCycle['application_level'],
    status: 'published',
    notes: nullableString(row.notes),
  };
}

function eventRowToPayload(
  cycleId: string,
  row: EventRowRaw,
): Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'> {
  const rawStart = (row.start_at ?? '').trim();
  const rawStatus = (row.data_status ?? '').trim().toLowerCase();

  // 三態：na（明確不存在）→ tbd（存在但日期未定）→ confirmed（有實際日期）
  let dateStatus: SchoolEventDateStatus;
  let startAt: string | null;
  let endAt: string | null;

  if (rawStatus === 'na' || rawStart === 'NA_EVENT') {
    dateStatus = 'na';
    startAt = null;
    endAt = null;
  } else if (rawStatus === 'tbd' || rawStart === '') {
    dateStatus = 'tbd';
    startAt = null;
    endAt = null;
  } else {
    dateStatus = 'confirmed';
    startAt = rawStart;
    endAt = nullableString(row.end_at);
  }

  return {
    school_cycle_id: cycleId,
    event_type: row.event_type,
    sequence_no: row.sequence_no ? Number(row.sequence_no) : null,
    title_zh: nullableString(row.title_zh),
    title_en: null,
    start_at: startAt,
    end_at: endAt,
    all_day: row.all_day === 'false' ? false : true,
    location: null,
    source_url: nullableString(row.source_url),
    notes: null,
    date_status: dateStatus,
  };
}

// ---------- 主流程 ----------
export async function importSchoolsFromCsv() {
  const supabase = buildSupabaseClient();

  // 1. 讀 CSV
  const schoolRows = loadCsv<SchoolRowRaw>(PATHS.schools);
  const cycleRows = loadCsv<CycleRowRaw>(PATHS.cycles);
  const eventRows = loadCsv<EventRowRaw>(PATHS.events);
  console.log(
    `[import] 讀取完成：schools=${schoolRows.length} cycles=${cycleRows.length} events=${eventRows.length}`,
  );

  if (schoolRows.length === 0) throw new Error('01_schools.csv 是空的，請至少提供一間學校。');

  // 2. 先取回現有 primary schools，讓重跑匯入時能重用既有 UUID，避免重複插入
  const { data: existingSchools, error: existingSchoolsError } = await supabase
    .from('schools')
    .select('id, name_zh, application_level')
    .eq('application_level', 'primary');
  if (existingSchoolsError) {
    throw new Error(`讀取現有 schools 失敗: ${existingSchoolsError.message}`);
  }

  const existingSchoolIdByName = new Map<string, string>();
  for (const school of existingSchools ?? []) {
    if (school.name_zh) existingSchoolIdByName.set(school.name_zh, school.id);
  }

  // 3. schools：用 name_zh 對應既有資料，沒找到才建立新 UUID
  const schoolIdByKey = new Map<string, string>();
  const incomingSchoolNames = new Set<string>();
  for (const row of schoolRows) {
    if (!row.school_key || !row.name_zh) {
      console.warn('[import] 跳過 school row（缺少 school_key / name_zh）:', row);
      continue;
    }
    const existingId = existingSchoolIdByName.get(row.name_zh.trim());
    const payload = schoolRowToPayload(row, existingId);
    schoolIdByKey.set(row.school_key, payload.id);
    incomingSchoolNames.add(payload.name_zh);

    const { error } = await supabase.from('schools').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw new Error(`[import] 寫入 schools 失敗 (key=${row.school_key}): ${error.message}`);
    }
  }

  // 4. 將本次 CSV 不再存在的 primary schools 標成 inactive，保留歷史但不再顯示為有效
  const staleSchoolIds = (existingSchools ?? [])
    .filter((school) => school.name_zh && !incomingSchoolNames.has(school.name_zh))
    .map((school) => school.id);
  if (staleSchoolIds.length > 0) {
    const { error } = await supabase
      .from('schools')
      .update({ is_active: false })
      .in('id', staleSchoolIds);
    if (error) {
      throw new Error(`[import] 標記舊 schools 為 inactive 失敗: ${error.message}`);
    }
  }

  // 5. 先讀現有 cycles，避免重跑匯入時重新產生新 UUID
  //    注意：必須抓「全部」level（含 kindergarten 與歷史遺留的 NULL level），
  //    否則快取 miss 會產生新 UUID，upsert 時把既有 id 換掉，被 school_events 的 FK 擋下。
  const currentSchoolIds = [...schoolIdByKey.values()];
  const { data: existingCycles, error: existingCyclesError } = await supabase
    .from('school_cycles')
    .select('id, school_id, academic_year, application_level')
    .in('school_id', currentSchoolIds);
  if (existingCyclesError) {
    throw new Error(`讀取現有 school_cycles 失敗: ${existingCyclesError.message}`);
  }

  const existingCycleIdByKeyYear = new Map<string, string>();
  for (const cycle of existingCycles ?? []) {
    existingCycleIdByKeyYear.set(
      `${cycle.school_id}::${normalizeAcademicYear(cycle.academic_year)}::${normalizeApplicationLevel(cycle.application_level)}`,
      cycle.id,
    );
  }

  // 6. cycles：school_key → school_id，同樣先算 cycleId 快取
  const cycleIdByKeyYear = new Map<string, string>();
  for (const row of cycleRows) {
    const schoolId = schoolIdByKey.get(row.school_key);
    if (!schoolId) {
      console.warn(`[import] 跳過 cycle：school_key=${row.school_key} 找不到學校。`);
      continue;
    }
    const joinKey = cycleJoinKey(row.school_key, row.academic_year, row.application_level);
    const cycleId =
      existingCycleIdByKeyYear.get(`${schoolId}::${normalizeAcademicYear(row.academic_year)}::${normalizeApplicationLevel(row.application_level)}`) ??
      crypto.randomUUID();
    cycleIdByKeyYear.set(joinKey, cycleId);
    const payload = { id: cycleId, ...cycleRowToPayload(schoolId, row) };

    // 用 id 當衝突鍵：cycleId 已由快取決定（既有 cycle 復用其 id，新 cycle 才用新 UUID），
    // 避免 upsert 時改動既有 id 而觸發 school_events 的 FK 錯誤。
    const { error } = await supabase.from('school_cycles').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw new Error(
        `[import] 寫入 school_cycles 失敗 (key=${row.school_key} year=${row.academic_year}): ${error.message}`,
      );
    }
  }

  // 7. events：只重寫「本次檔案有提到」的 cycle（避免批次更新時，清掉檔案內沒有的學校）
  const eventCycleKeys = new Set(
    eventRows.map((row) => cycleJoinKey(row.school_key, row.academic_year, row.application_level)),
  );
  const cycleIds = [...eventCycleKeys]
    .map((key) => cycleIdByKeyYear.get(key))
    .filter((id): id is string => Boolean(id));
  if (cycleIds.length > 0) {
    const { error } = await supabase
      .from('school_events')
      .delete()
      .in('school_cycle_id', cycleIds);
    if (error) {
      throw new Error(`[import] 清理既有 school_events 失敗: ${error.message}`);
    }
  }

  // 7.5 Rolling Admissions 標記同步（03 檔案為權威來源）：
  //     任一 row 標 true → true；本次未標記的週期一律重設 false，避免殘留舊標記
  const rollingByKeyYear = new Map<string, boolean>();
  for (const row of eventRows) {
    const key = cycleJoinKey(row.school_key, row.academic_year, row.application_level);
    if ((row.is_rolling_admission ?? '').trim().toLowerCase() === 'true') {
      rollingByKeyYear.set(key, true);
    }
  }
  for (const key of eventCycleKeys) {
    const cycleId = cycleIdByKeyYear.get(key);
    if (!cycleId) continue;
    const isRolling = rollingByKeyYear.get(key) === true;
    const { error } = await supabase
      .from('school_cycles')
      .update({ is_rolling_admission: isRolling })
      .eq('id', cycleId);
    if (error) {
      throw new Error(`[import] 更新 is_rolling_admission 失敗 (key=${key}): ${error.message}`);
    }
  }

  // 8. events：school_key + academic_year + application_level → cycle_id
  const eventPayloads: Array<Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>> = [];
  for (const row of eventRows) {
    const cycleId = cycleIdByKeyYear.get(
      cycleJoinKey(row.school_key, row.academic_year, row.application_level),
    );
    if (!cycleId) {
      console.warn(
        `[import] 跳過 event：school_key=${row.school_key} year=${row.academic_year} level=${normalizeApplicationLevel(row.application_level)} 找不到對應週期。`,
      );
      continue;
    }
    eventPayloads.push(eventRowToPayload(cycleId, row));
  }

  if (eventPayloads.length > 0) {
    const { error } = await supabase.from('school_events').insert(eventPayloads);
    if (error) {
      throw new Error(`[import] 寫入 school_events 失敗 (rows=${eventPayloads.length}): ${error.message}`);
    }
  }

  // 9. 基本驗證
  const naCount = eventRows.filter(
    (r) => (r.data_status ?? '').trim().toLowerCase() === 'na' || r.start_at?.trim() === 'NA_EVENT',
  ).length;
  const tbdCount = eventRows.filter(
    (r) => (r.data_status ?? '').trim().toLowerCase() === 'tbd' || (!r.start_at?.trim() && (r.data_status ?? '').trim().toLowerCase() !== 'na' && r.start_at?.trim() !== 'NA_EVENT'),
  ).length;
  console.log(
    `[import] 完成。共 schools=${schoolIdByKey.size} / cycles=${cycleIdByKeyYear.size} / events=${eventPayloads.length} / deactivated=${staleSchoolIds.length} (其中 TBD=${tbdCount} / N/A=${naCount})`,
  );
}

// CLI 入口
if (require.main === module) {
  void importSchoolsFromCsv()
    .then(() => {
      console.log('[import] 腳本執行完成。');
    })
    .catch((error) => {
      console.error('[import] 腳本執行失敗：', error);
      process.exit(1);
    });
}
