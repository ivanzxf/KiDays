// 本地邏輯測試：用 v2 固定 7 列版 CSV 直接跑 buildSchoolCardTasks，
// 驗證單卡 6 行輸出（N/A / 日期待定 / 申請區間 / 只讀結果公佈）是否符合三態契約。
// 執行：npx tsx scripts/_test_build_tasks_from_v2.ts

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchoolCardTasks } from '../src/lib/buildSchoolCardTasks';
import type { SchoolEventDateStatus } from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v2Path = path.resolve(__dirname, 'import_format/03_school_events_v2.csv');

const raw = fs.readFileSync(v2Path, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const cols = l.split(',');
  const obj: Record<string, string> = {};
  header.forEach((h, i) => {
    obj[h.trim()] = (cols[i] ?? '').trim();
  });
  return obj;
});

const perSchool = new Map<string, Array<Record<string, string>>>();
for (const r of rows) {
  const key = `${r.school_key}::${r.academic_year}`;
  if (!perSchool.has(key)) perSchool.set(key, []);
  perSchool.get(key)!.push(r);
}

// 挑選有代表性的一批：N/A、全 TBD、申請區間、只讀放榜、完整 confirmed、額外事件（DS-15）
const SAMPLES = ['DS-01', 'DS-03', 'DS-04', 'DS-05', 'DS-06', 'DS-07', 'DS-15', 'DS-16', 'DS-17', 'DS-21'];

let totalSchools = 0;
let naShown = 0;
let tbdShown = 0;

for (const sk of SAMPLES) {
  const entry = [...perSchool.entries()].find(([k]) => k.startsWith(`${sk}::`));
  if (!entry) {
    console.log(`[${sk}] 找不到`);
    continue;
  }
  const [key, schoolRows] = entry;
  const events = schoolRows.map((r) => ({
    id: `${sk}:${r.event_type}`,
    title_zh: r.title_zh || null,
    event_type: r.event_type,
    date_status: (r.data_status ||
      (r.start_at ? 'confirmed' : 'tbd')) as SchoolEventDateStatus,
    sequence_no: r.sequence_no ? Number(r.sequence_no) : null,
    start_at: r.start_at || null,
    end_at: r.end_at || null,
  }));

  // 模擬「有額外事件」的學校：第二場開放日/簡介會、三面、家長會（無日期）
  if (sk === 'DS-16') {
    events.push(
      {
        id: `${sk}:open_day2`,
        title_zh: '開放日（第二場）',
        event_type: 'open_day',
        date_status: 'confirmed',
        sequence_no: 8,
        start_at: '2026-06-20T10:00:00+08:00',
        end_at: '2026-06-20T16:00:00+08:00',
      },
      {
        id: `${sk}:info_session2`,
        title_zh: '簡介會（第二場）',
        event_type: 'info_session',
        date_status: 'confirmed',
        sequence_no: 9,
        start_at: '2026-09-10T14:00:00+08:00',
        end_at: '2026-09-10T17:00:00+08:00',
      },
      {
        id: `${sk}:third_interview`,
        title_zh: '第三面',
        event_type: 'third_interview',
        date_status: 'confirmed',
        sequence_no: 10,
        start_at: '2027-01-15T00:00:00+08:00',
        end_at: '2027-01-15T23:59:00+08:00',
      },
      {
        id: `${sk}:parent_meeting`,
        title_zh: '家長會',
        event_type: 'parent_meeting',
        date_status: 'tbd',
        sequence_no: 11,
        start_at: null,
        end_at: null,
      },
    );
  }

  const tasks = buildSchoolCardTasks({
    schoolId: sk,
    studentApplicationId: 'test-app',
    events,
    progressMap: new Map(),
    appliedAt: null,
  });

  totalSchools++;
  console.log(`\n=== ${sk} (${key.split('::')[1]}) ===`);
  for (const t of tasks) {
    const flag = t.is_available === false ? '[N/A]' : t.is_toggleable ? '[可勾]' : '[禁勾]';
    if (t.description === 'N/A') naShown++;
    if (t.description === '日期待定') tbdShown++;
    console.log(`  ${t.title.padEnd(5, '　')}  ${(t.description ?? '').padEnd(26, '　')}  ${flag}`);
  }
}

console.log(`\n--- 統計（樣本 ${totalSchools} 校 × 6 行）---`);
console.log(`N/A 行數: ${naShown}`);
console.log(`日期待定 行數: ${tbdShown}`);
