// 從 01/02/03 三份 CSV 生成「學校招生資料摘要」，供另一外部 AI 複核使用。
// 執行：`node scripts/generate_summary.mjs`
// 輸出：docs/school_data_summary.md

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FORMAT_DIR = path.join(ROOT, 'scripts', 'import_format');

const EVENTS_PATH = path.join(FORMAT_DIR, '03_school_events_v2.csv');
const CYCLES_PATH = path.join(FORMAT_DIR, '02_school_cycles.csv');
const SCHOOLS_PATH = path.join(FORMAT_DIR, '01_schools.csv');
const OUT_PATH = path.join(ROOT, 'docs', 'school_data_summary.md');

// ---------- 輕量 CSV 解析 ----------
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { cur.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else field += ch;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

function loadCsv(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
}

const year = (v) => (v || '').trim().replace(/\//g, '-');
const level = (v) => {
  const t = (v || '').trim().toLowerCase();
  return t === 'kindergarten' ? 'kindergarten' : 'primary';
};
const cycleKey = (r) => `${r.school_key}::${year(r.academic_year)}::${level(r.application_level)}`;

const LEVEL_LABEL = { kindergarten: 'Prep Year（幼稚園）', primary: 'Year 1（小一）' };
const TYPE_LABEL = {
  government: '官立', aided: '資助', direct_subsidy: '直資',
  private: '私立', pis: '私立獨立', international: '國際', special: '特殊',
};

function eventLine(row) {
  const status = (row.data_status || '').trim().toLowerCase();
  const start = (row.start_at || '').trim();
  if (status === 'na' || start === 'NA_EVENT') return 'N/A（明確不存在）';
  if (status === 'tbd' || !start) return 'TBD（日期待定）';
  return start.slice(0, 10);
}

function main() {
  const schools = loadCsv(SCHOOLS_PATH);
  const cycles = loadCsv(CYCLES_PATH);
  const events = loadCsv(EVENTS_PATH);

  const eventsByCycle = new Map();
  for (const e of events) {
    const key = cycleKey(e);
    if (!eventsByCycle.has(key)) eventsByCycle.set(key, []);
    eventsByCycle.get(key).push(e);
  }
  for (const list of eventsByCycle.values()) {
    list.sort((a, b) => Number(a.sequence_no || 0) - Number(b.sequence_no || 0));
  }

  const cyclesBySchool = new Map();
  for (const c of cycles) {
    const key = cycleKey(c);
    if (!cyclesBySchool.has(c.school_key)) cyclesBySchool.set(c.school_key, []);
    cyclesBySchool.get(c.school_key).push(key);
  }

  const rollingByCycle = new Set();
  for (const e of events) {
    if ((e.is_rolling_admission || '').trim().toLowerCase() === 'true') {
      rollingByCycle.add(cycleKey(e));
    }
  }

  const lines = [];
  const today = new Date();
  lines.push('# KiDays 學校招生資料摘要（供複核）');
  lines.push('');
  lines.push(`> 產生日期：${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  lines.push('> 資料來源：scripts/import_format/ 下的 01_schools / 02_school_cycles / 03_school_events');
  lines.push('> 用途：請複核每一間學校的招生事件與日期是否正確、是否遺漏（尤其雙入口學校）。');
  lines.push('');
  lines.push('## 圖例');
  lines.push('- 事件後綴：`YYYY-MM-DD`＝已確認日期｜`TBD`＝學校未公佈（日期待定）｜`N/A`＝該校明確無此活動');
  lines.push('- `🌀 Rolling`＝隨到隨審（無固定日期，家長自行記錄）');
  lines.push('- 入口：`Year 1`＝小一（primary）｜`Prep Year`＝幼稚園級（kindergarten）');
  lines.push('');

  // 統計
  const schoolKeys = schools.map((s) => s.school_key).sort();
  const multiCount = [...cyclesBySchool.entries()].filter(([, keys]) => keys.length > 1).length;
  const rollingCount = rollingByCycle.size;
  lines.push(`## 總覽`);
  lines.push(`- 學校數：**${schools.length}**｜雙入口學校：**${multiCount}**｜Rolling 週期：**${rollingCount}**`);
  lines.push('');

  let schoolIndex = 0;
  for (const key of schoolKeys) {
    const s = schools.find((x) => x.school_key === key);
    if (!s) continue;
    schoolIndex++;
    const typeLabel = TYPE_LABEL[s.school_type] || s.school_type || '—';
    const genderLabel = s.gender === 'boys' ? '男校' : s.gender === 'girls' ? '女校' : s.gender === 'coed' ? '男女校' : '—';
    lines.push(`## ${schoolIndex}. ${key} ${s.name_zh}（${s.name_en || ''}）`);
    lines.push(`- 地區：${s.district || '—'}｜類型：${typeLabel}｜性別：${genderLabel}｜校網：${s.school_net || '—'}`);
    lines.push(`- 網站：${s.website || '—'}`);

    const cycleKeys = (cyclesBySchool.get(key) || []).sort((a, b) => {
      const la = level(a.split('::')[2]);
      const lb = level(b.split('::')[2]);
      return (lb === 'primary' ? 0 : -1) - (la === 'primary' ? 0 : -1); // kindergarten 在前
    });

    if (cycleKeys.length === 0) {
      lines.push('- ⚠️ 找不到招生週期（02/03 無資料）');
      lines.push('');
      continue;
    }

    for (const ck of cycleKeys) {
      const [, , lvl] = ck.split('::');
      const isRolling = rollingByCycle.has(ck);
      lines.push(`- **入口 ${LEVEL_LABEL[lvl] || lvl}**${isRolling ? '（🌀 Rolling Admissions）' : ''}：`);
      const evs = eventsByCycle.get(ck) || [];
      if (evs.length === 0) {
        lines.push(`  - ⚠️ 無事件資料`);
      } else {
        for (const e of evs) {
          lines.push(`  ${e.sequence_no || '·'}. ${e.title_zh || e.event_type} → ${eventLine(e)}`);
        }
      }
    }
    lines.push('');
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
  const cycleTotal = [...cyclesBySchool.values()].flat().length;
  console.log(`✅ 已生成：${OUT_PATH}`);
  console.log(`   學校 ${schoolKeys.length} 間｜週期 ${cycleTotal} 個｜事件 ${events.length} 筆`);
}

try {
  main();
} catch (err) {
  console.error('❌ 執行失敗:', err);
  process.exit(1);
}
