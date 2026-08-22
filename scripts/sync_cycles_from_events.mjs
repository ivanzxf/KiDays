// 依最新 03_school_events_v2.csv 對齊 02_school_cycles.csv
//
// 用途：
// - 外部 AI 只負責更新 03（事件資料），本腳本從 03 中萃取出
//   (school_key, academic_year, application_level) 的組合，生成 02 的週期列。
// - 規則：只新增缺失的週期列，永不刪除既有列（符合資料契約）。
//   既有列的 notes 保留。
// - 同時檢查 03 中的學校是否都存在於 01_schools.csv，缺則警告。
//
// 執行：`node scripts/sync_cycles_from_events.mjs`
// 輸出：直接覆寫 scripts/import_format/02_school_cycles.csv

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORMAT_DIR = path.resolve(__dirname, 'import_format');

const EVENTS_PATH = path.join(FORMAT_DIR, '03_school_events_v2.csv');
const CYCLES_PATH = path.join(FORMAT_DIR, '02_school_cycles.csv');
const SCHOOLS_PATH = path.join(FORMAT_DIR, '01_schools.csv');

// ---------- 輕量 CSV 解析（與 validate_csv_import.mjs 相同） ----------
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
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
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

function normalizeYear(year) {
  return (year || '').trim().replace(/\//g, '-');
}

function normalizeLevel(level) {
  const t = (level || '').trim().toLowerCase();
  return t === 'kindergarten' ? 'kindergarten' : 'primary';
}

function main() {
  if (!fs.existsSync(EVENTS_PATH)) {
    console.error(`找不到 ${EVENTS_PATH}，請確認外部 AI 已更新 03 檔案。`);
    process.exit(1);
  }

  const events = loadCsv(EVENTS_PATH);

  // 1. 從 03 萃取出 (school_key, year, level) 組合
  const combos = new Map(); // key -> { school_key, academic_year, application_level }
  for (const e of events.data) {
    const key = `${e.school_key}::${normalizeYear(e.academic_year)}::${normalizeLevel(e.application_level)}`;
    if (!combos.has(key)) {
      combos.set(key, {
        school_key: e.school_key,
        academic_year: normalizeYear(e.academic_year),
        application_level: normalizeLevel(e.application_level),
      });
    }
  }

  // 2. 讀現有 02（保留 notes）
  const existingNotes = new Map();
  if (fs.existsSync(CYCLES_PATH)) {
    const cycles = loadCsv(CYCLES_PATH);
    for (const c of cycles.data) {
      existingNotes.set(
        `${c.school_key}::${normalizeYear(c.academic_year)}::${normalizeLevel(c.application_level)}`,
        (c.notes || '').trim(),
      );
    }
  }

  // 3. 合併：既有週期全保留，補上 03 有的新週期
  const merged = new Map(existingNotes);
  for (const [key, combo] of combos) {
    if (!merged.has(key)) merged.set(key, '');
  }

  // 4. 排序：school_key → level（kindergarten 在前）→ academic_year
  const sortedKeys = [...merged.keys()].sort((a, b) => {
    const [ka, ya, la] = a.split('::');
    const [kb, yb, lb] = b.split('::');
    if (ka !== kb) return ka.localeCompare(kb);
    if (la !== lb) return lb.localeCompare(la); // kindergarten < primary（reverse locale）
    return ya.localeCompare(yb);
  });

  const rows = ['school_key,academic_year,application_level,notes'];
  for (const key of sortedKeys) {
    const [school_key, academic_year, application_level] = key.split('::');
    const notes = merged.get(key) ?? '';
    rows.push([school_key, academic_year, application_level, notes].join(','));
  }

  fs.writeFileSync(CYCLES_PATH, rows.join('\n') + '\n', 'utf8');

  // 5. 檢查 03 的學校是否都存在於 01
  const schoolKeys = new Set();
  if (fs.existsSync(SCHOOLS_PATH)) {
    const schools = loadCsv(SCHOOLS_PATH);
    for (const s of schools.data) schoolKeys.add(s.school_key);
  }
  const missing = [...new Set(events.data.map((e) => e.school_key))].filter(
    (k) => !schoolKeys.has(k),
  );

  const added = sortedKeys.filter((k) => !existingNotes.has(k)).length;

  console.log(`✅ 02_school_cycles.csv 已更新`);
  console.log(`   週期總數: ${sortedKeys.length}（新增 ${added}，保留既有 ${existingNotes.size}）`);
  console.log(`   入口分布: kindergarten=${sortedKeys.filter((k) => k.endsWith('::kindergarten')).length} / primary=${sortedKeys.filter((k) => k.endsWith('::primary')).length}`);
  if (missing.length > 0) {
    console.log(`\n⚠️  以下 school_key 存在於 03 但 01_schools.csv 沒有，匯入時會被跳過：`);
    missing.forEach((k) => console.log(`  - ${k}`));
  }
}

try {
  main();
} catch (err) {
  console.error('❌ 執行失敗:', err);
  process.exit(1);
}
