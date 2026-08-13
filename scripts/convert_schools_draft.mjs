// 把 01_schools_draft.csv（Markdown table 格式）轉成三份標準 CSV
//  1. 解析 Markdown table（| 分隔 + 跳過分隔線）
//  2. RFC-4180 標準 CSV：欄位內若有 , 或 " 或換行會自動加引號脫逸
//  3. 同步產生 02_school_cycles.csv（每間學校 1 筆 2027-2028）
//  4. 03_school_events.csv 保留原狀（你後續錄 events 才會動到）
//
// 使用：node scripts/convert_schools_draft.mjs

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, 'import_format');
const DRAFT = path.join(DIR, '01_schools_draft.csv');
const OUT_SCHOOLS = path.join(DIR, '01_schools.csv');
const OUT_CYCLES = path.join(DIR, '02_school_cycles.csv');

const EXPECTED_HEADER = [
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
];

function escapeCell(v) {
  const s = v ?? '';
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function toCsv(header, rows) {
  const lines = [header.map(escapeCell).join(',')];
  for (const r of rows) lines.push(header.map((h) => escapeCell(r[h])).join(','));
  return lines.join('\n') + '\n';
}

function parseMdTable(raw) {
  const outRows = [];
  let header = null;
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // 非 table 列（例如 draft 第 1 行 "csv"）直接忽略
    if (!t.startsWith('|')) continue;
    const cells = t
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());
    if (!header) {
      header = cells;
      continue;
    }
    // Markdown 分隔線列（|---|...|）跳過
    if (cells.every((c) => /^:?-{3,}:?$/.test(c) || c === '')) continue;
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    outRows.push(row);
  }
  return { header, rows: outRows };
}

function main() {
  if (!fs.existsSync(DRAFT)) {
    console.error(`找不到 draft 檔案: ${DRAFT}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(DRAFT, 'utf8');
  const { header, rows } = parseMdTable(raw);
  console.log(`draft 解析：header=${JSON.stringify(header)}，rows=${rows.length}`);

  // 欄位對齊：如果 header 順序不完全等同 EXPECTED_HEADER，就按名稱 map，缺的填空
  const aligned = rows.map((r) => {
    const obj = {};
    for (const h of EXPECTED_HEADER) obj[h] = r[h] ?? '';
    // 修剪明顯的尾空白
    for (const k of Object.keys(obj)) obj[k] = (obj[k] ?? '').trim();
    return obj;
  });

  const schoolKeys = new Set();
  for (const r of aligned) {
    if (!r.school_key) throw new Error('有 school_key 空的列');
    if (schoolKeys.has(r.school_key)) throw new Error(`重複 school_key: ${r.school_key}`);
    schoolKeys.add(r.school_key);
    if (!r.name_zh) throw new Error(`${r.school_key} 缺少 name_zh`);
    if (!r.school_type) r.school_type = 'direct_subsidy'; // 你目前填的都是直資
  }
  console.log(`✅ school_key 不重複：${aligned.length} 間（${[...schoolKeys].join('、')}）`);

  fs.writeFileSync(OUT_SCHOOLS, toCsv(EXPECTED_HEADER, aligned), 'utf8');
  console.log(`✅ 已寫入 ${OUT_SCHOOLS}`);

  // 產生 21 筆 cycles（academic_year=2027-2028, notes 空）
  const cycleRows = [...schoolKeys].map((k) => ({
    school_key: k,
    academic_year: '2027-2028',
    notes: '',
  }));
  fs.writeFileSync(OUT_CYCLES, toCsv(['school_key', 'academic_year', 'notes'], cycleRows), 'utf8');
  console.log(`✅ 已寫入 ${OUT_CYCLES}（${cycleRows.length} 筆 2027-2028 週期）`);

  console.log(`ℹ️  03_school_events.csv 保留原狀，等你錄 events 時再補即可。`);
}

try {
  main();
} catch (err) {
  console.error('❌ 轉換失敗:', err);
  process.exit(1);
}
