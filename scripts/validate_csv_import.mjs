// CSV 格式驗證工具（不連 Supabase，單機可跑）
//
// 用途：
// - 在大量錄入學校資料後，正式匯入 Supabase 前先做靜態檢查，避免格式錯誤浪費 API token。
// - 可重複執行：`node scripts/validate_csv_import.mjs`
//
// 檢查項目：
//   1. 3 份 CSV 的 header 是否完全符合規範
//   2. school_key 不重複、cycles 與 events 的 school_key+year 都能在父表找到
//   3. 枚舉值（district / gender / school_type / event_type / all_day）合法
//   4. start_at / end_at 若非空則必須是合法 ISO 日期（建議帶 +08:00）
//   5. 統計 TBD 事件數量（作為 sanity check）

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORMAT_DIR = path.resolve(__dirname, 'import_format');
// 若存在「固定 7 列版」v2 events 檔則優先使用（含 data_status / source_url / NA_EVENT）
const V2_EVENTS_PATH = path.join(FORMAT_DIR, '03_school_events_v2.csv');
const HAS_V2 = fs.existsSync(V2_EVENTS_PATH);
const PATHS = {
  schools: path.join(FORMAT_DIR, '01_schools.csv'),
  cycles: path.join(FORMAT_DIR, '02_school_cycles.csv'),
  events: HAS_V2 ? V2_EVENTS_PATH : path.join(FORMAT_DIR, '03_school_events.csv'),
};

const ALLOWED = {
  gender: new Set(['coed', 'boys', 'girls', '']),
  district: new Set(['港島區', '九龍區', '新界東', '新界西', '離島區', '新界區', '']),
  school_type: new Set([
    'government',
    'aided',
    'direct_subsidy',
    'private',
    'pis',
    'international',
    'special',
    '',
  ]),
  event_type: new Set([
    'open_day',
    'info_session',
    'application_open',
    'application_deadline',
    'assessment',
    'first_interview',
    'second_interview',
    'third_interview',
    'result_release',
    'registration',
    'parent_meeting',
    'waiting_list',
    'other',
  ]),
};

const EXPECTED_HEADER = {
  schools: [
    'school_key',
    'name_zh',
    'name_en',
    'district',
    'gender',
    'school_net',
    'school_type',
    'address_zh',
    'website',
    'phone',
    'email',
  ],
  cycles: ['school_key', 'academic_year', 'application_level', 'notes'],
  events: HAS_V2
    ? [
        'school_key',
        'academic_year',
        'event_type',
        'sequence_no',
        'title_zh',
        'start_at',
        'end_at',
        'all_day',
        'data_status',
        'source_url',
        'application_level',
        'is_rolling_admission',
      ]
    : [
        'school_key',
        'academic_year',
        'event_type',
        'sequence_no',
        'title_zh',
        'start_at',
        'end_at',
        'all_day',
      ],
};

// ---------- 輕量 CSV 解析（支援引號脫逸 / CRLF / LF） ----------
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      cur.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else field += ch;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter(
    (r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''),
  );
}

function loadCsv(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  if (rows.length === 0) throw new Error(`CSV 是空的: ${filePath}`);
  const header = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((cols) => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj;
  });
  return { header, data };
}

// ---------- 主流程 ----------
function main() {
  const errors = [];
  const warns = [];

  const schools = loadCsv(PATHS.schools);
  const cycles = loadCsv(PATHS.cycles);
  const events = loadCsv(PATHS.events);

  console.log(
    `📋 schools=${schools.data.length}, cycles=${cycles.data.length}, events=${events.data.length}`,
  );

  // 1. Header
  for (const [k, exp] of Object.entries(EXPECTED_HEADER)) {
    const actual = { schools, cycles, events }[k].header;
    if (JSON.stringify(actual) !== JSON.stringify(exp)) {
      errors.push(
        `${k} header 錯誤\n  預期: ${exp.join(',')}\n  實際: ${actual.join(',')}`,
      );
    }
  }

  // 2. Schools
  const schoolKeys = new Set();
  for (const s of schools.data) {
    if (!s.school_key) errors.push(`schools 缺少 school_key: ${JSON.stringify(s)}`);
    else if (schoolKeys.has(s.school_key))
      errors.push(`schools school_key 重複: ${s.school_key}`);
    else schoolKeys.add(s.school_key);
    if (!s.name_zh) errors.push(`schools 缺少 name_zh: ${s.school_key}`);
    if (!ALLOWED.gender.has(s.gender?.trim() ?? ''))
      errors.push(
        `[${s.school_key}] gender=${s.gender} 不在 {coed, boys, girls}`,
      );
    if (!ALLOWED.district.has(s.district?.trim() ?? ''))
      errors.push(
        `[${s.school_key}] district=${s.district} 不在 {港島區, 九龍區, 新界東, 新界西, 離島區}`,
      );
    if (!ALLOWED.school_type.has(s.school_type?.trim() ?? ''))
      errors.push(
        `[${s.school_key}] school_type=${s.school_type} 不在 {government, aided, direct_subsidy, private, pis, international, special}`,
      );
  }

  // 3. Cycles
  const cycleKeys = new Set();
  const ALLOWED_LEVEL = new Set(['kindergarten', 'primary']);
  for (const c of cycles.data) {
    if (!schoolKeys.has(c.school_key))
      errors.push(`cycles 的 school_key=${c.school_key} 找不到 schools 資料`);
    const level = (c.application_level || '').trim().toLowerCase();
    if (!ALLOWED_LEVEL.has(level))
      errors.push(
        `[${c.school_key}] application_level=${c.application_level} 只允許 kindergarten/primary`,
      );
    const pair = `${c.school_key}::${c.academic_year}::${level}`;
    if (cycleKeys.has(pair)) errors.push(`cycles 重複: ${pair}`);
    cycleKeys.add(pair);
    if (c.academic_year?.trim() !== '2027-2028')
      warns.push(
        `cycles academic_year=${c.academic_year} 不是 2027-2028 (key=${c.school_key})，若你是故意測試未來學年可忽略`,
      );
  }

  // 4. Events
  let tbdCount = 0;
  let naCount = 0;
  const ALLOWED_DATA_STATUS = new Set(['', 'confirmed', 'tbd', 'na']);
  const ALLOWED_ROLLING = new Set(['', 'true', 'false']);
  const rollingByPair = new Map();
  for (const e of events.data) {
    const year = (e.academic_year || '').trim().replace(/\//g, '-');
    const level = (e.application_level || '').trim().toLowerCase();
    if (!ALLOWED_LEVEL.has(level))
      errors.push(
        `[${e.school_key}] application_level=${e.application_level} 只允許 kindergarten/primary`,
      );
    const pair = `${e.school_key}::${year}::${level}`;
    if (!cycleKeys.has(pair))
      errors.push(
        `event 的 school_key+academic_year+application_level 找不到對應 cycle: ${pair}（event_type=${e.event_type}）`,
      );
    if (!ALLOWED.event_type.has(e.event_type?.trim()))
      errors.push(
        `[${e.school_key}] event_type=${e.event_type} 不在合法列表（見 ALLOWED.event_type）`,
      );
    const ad = e.all_day?.trim().toLowerCase();
    if (ad !== '' && ad !== 'true' && ad !== 'false')
      errors.push(`[${e.school_key}] all_day=${e.all_day} 只允許 true/false`);
    if (e.sequence_no && Number.isNaN(Number(e.sequence_no)))
      errors.push(`[${e.school_key}] sequence_no 不是數字: ${e.sequence_no}`);

    const rolling = (e.is_rolling_admission || '').trim().toLowerCase();
    if (!ALLOWED_ROLLING.has(rolling))
      errors.push(
        `[${e.school_key}] is_rolling_admission=${e.is_rolling_admission} 只允許 true/false`,
      );
    const prevRolling = rollingByPair.get(pair);
    if (prevRolling !== undefined && prevRolling !== rolling)
      errors.push(
        `[${e.school_key} / ${year}] is_rolling_admission 同校同年度不一致: ${prevRolling || '(空)'} vs ${rolling || '(空)'}`,
      );
    else rollingByPair.set(pair, rolling);

    const ds = (e.data_status || '').trim().toLowerCase();
    if (!ALLOWED_DATA_STATUS.has(ds))
      errors.push(
        `[${e.school_key} / ${e.event_type}] data_status=${e.data_status} 只允許 confirmed/tbd/na`,
      );
    const startAt = e.start_at?.trim() || '';

    if (startAt === 'NA_EVENT') {
      naCount++;
      if (ds !== 'na')
        warns.push(
          `[${e.school_key} / ${e.event_type}] start_at=NA_EVENT 但 data_status=${e.data_status || '(空)'}，建議標 na`,
        );
    } else if (startAt) {
      const d = new Date(startAt);
      if (Number.isNaN(d.getTime()))
        errors.push(
          `[${e.school_key} / ${e.event_type}] start_at 非法 ISO 日期: ${startAt}`,
        );
      else if (!/\+08:00$/.test(startAt) && !/Z$/.test(startAt))
        warns.push(
          `[${e.school_key} / ${e.event_type}] start_at 未指定時區，建議加 +08:00`,
        );
      if (ds === 'na')
        warns.push(
          `[${e.school_key} / ${e.event_type}] data_status=na 但 start_at 有日期 ${startAt}，應改用 NA_EVENT 或留空`,
        );
      if (ds === 'tbd')
        warns.push(
          `[${e.school_key} / ${e.event_type}] data_status=tbd 但 start_at 有日期 ${startAt}，應為 confirmed`,
        );
    } else {
      if (ds === 'na') naCount++;
      else tbdCount++;
      if (ds === 'confirmed')
        warns.push(
          `[${e.school_key} / ${e.event_type}] data_status=confirmed 但 start_at 留空，應補日期或改 tbd`,
        );
    }
    if (e.end_at) {
      const d = new Date(e.end_at);
      if (Number.isNaN(d.getTime()))
        errors.push(
          `[${e.school_key} / ${e.event_type}] end_at 非法 ISO 日期: ${e.end_at}`,
        );
    }
  }

  console.log(`🟡 TBD（日期待定）事件數量: ${tbdCount}`);
  if (naCount > 0) console.log(`🚫 N/A（明確不存在）事件數量: ${naCount}`);

  if (warns.length > 0) {
    console.log(`\n⚠️  Warnings (${warns.length}):`);
    warns.forEach((w) => console.log('  - ' + w));
  }
  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
  console.log('\n✅ 全部格式正確，可接著執行 npx tsx scripts/import_schools.ts 匯入 Supabase。');
}

try {
  main();
} catch (err) {
  console.error('❌ 執行失敗:', err);
  process.exit(1);
}
