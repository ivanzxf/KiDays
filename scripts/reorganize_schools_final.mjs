import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, 'import_format');

const SCHOOLS_HEADER = [
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

const CYCLES_HEADER = ['school_key', 'academic_year', 'notes'];

const TYPE_LABEL = {
  direct_subsidy: '直資',
  private: '私立',
  pis: '私立獨立',
  international: '國際',
  aided: '資助',
  government: '官立',
  special: '特殊',
};

const ALLOWED = {
  district: new Set(['港島區', '九龍區', '新界區', '新界東', '新界西', '離島區', '']),
  gender: new Set(['coed', 'boys', 'girls', '']),
  school_type: new Set([
    'direct_subsidy',
    'private',
    'pis',
    'international',
    'aided',
    'government',
    'special',
    '',
  ]),
};

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
        } else {
          inQ = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQ = true;
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

  return rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
}

function escapeCell(value) {
  const s = value ?? '';
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(header, rows) {
  const lines = [header.map(escapeCell).join(',')];
  for (const row of rows) lines.push(header.map((key) => escapeCell(row[key] ?? '')).join(','));
  return lines.join('\n') + '\n';
}

function normalizeRow(row) {
  const normalized = {};
  for (const key of SCHOOLS_HEADER) normalized[key] = (row[key] ?? '').trim();
  return normalized;
}

function loadDraftRows() {
  const raw = fs.readFileSync(path.join(DIR, '01_schools_draft.csv'), 'utf8');
  const rows = parseCsv(raw);
  if (rows.length === 0) throw new Error('01_schools_draft.csv 是空的');

  const header = rows[0].map((cell) => String(cell).trim());
  if (JSON.stringify(header) !== JSON.stringify(SCHOOLS_HEADER)) {
    throw new Error(`draft header 不符合預期: ${header.join(',')}`);
  }

  return rows.slice(1).map((cols, index) => {
    if (cols.length !== SCHOOLS_HEADER.length) {
      throw new Error(`draft 第 ${index + 2} 行欄位數錯誤: 預期 ${SCHOOLS_HEADER.length}，實際 ${cols.length}`);
    }
    const row = {};
    SCHOOLS_HEADER.forEach((key, i) => {
      row[key] = cols[i] ?? '';
    });
    return normalizeRow(row);
  });
}

function validateSchools(rows) {
  const seen = new Set();
  const errors = [];

  for (const row of rows) {
    if (!row.school_key) errors.push('缺少 school_key');
    if (!row.name_zh) errors.push(`[${row.school_key}] 缺少 name_zh`);
    if (seen.has(row.school_key)) errors.push(`[${row.school_key}] school_key 重複`);
    seen.add(row.school_key);

    if (!ALLOWED.district.has(row.district)) {
      errors.push(`[${row.school_key}] district=${row.district} 不合法`);
    }
    if (!ALLOWED.gender.has(row.gender)) {
      errors.push(`[${row.school_key}] gender=${row.gender} 不合法`);
    }
    if (!ALLOWED.school_type.has(row.school_type)) {
      errors.push(`[${row.school_key}] school_type=${row.school_type} 不合法`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`draft 驗證失敗:\n- ${errors.join('\n- ')}`);
  }
}

function loadEvents() {
  const raw = fs.readFileSync(path.join(DIR, '03_school_events.csv'), 'utf8');
  const rows = parseCsv(raw);
  if (rows.length === 0) throw new Error('03_school_events.csv 是空的');
  const header = rows[0].map((cell) => String(cell).trim());
  const data = rows.slice(1).map((cols) => {
    const row = {};
    header.forEach((key, i) => {
      row[key] = (cols[i] ?? '').trim();
    });
    return row;
  });
  return { header, data };
}

const schools = loadDraftRows();
validateSchools(schools);

const cycles = schools.map((row) => ({
  school_key: row.school_key,
  academic_year: '2027-2028',
  notes: '',
}));

const events = loadEvents();
const schoolKeys = new Set(schools.map((row) => row.school_key));
for (const event of events.data) {
  if (!schoolKeys.has(event.school_key)) {
    throw new Error(`event school_key 找不到對應學校: ${event.school_key}`);
  }
}

fs.writeFileSync(path.join(DIR, '01_schools.csv'), toCsv(SCHOOLS_HEADER, schools), 'utf8');
fs.writeFileSync(path.join(DIR, '02_school_cycles.csv'), toCsv(CYCLES_HEADER, cycles), 'utf8');
fs.writeFileSync(path.join(DIR, '03_school_events.csv'), toCsv(events.header, events.data), 'utf8');

const keyListing = [
  'school_key\tname_zh\tname_en\tdistrict\ttype',
  ...schools.map((row) =>
    `${row.school_key}\t${row.name_zh}\t${row.name_en}\t${row.district}\t${TYPE_LABEL[row.school_type] ?? row.school_type}`,
  ),
];
fs.writeFileSync(path.join(DIR, '_key_listing.tsv'), keyListing.join('\n') + '\n', 'utf8');

const counts = {};
for (const row of schools) counts[row.school_type] = (counts[row.school_type] ?? 0) + 1;
console.log(`✅ 已按 draft 重寫標準 CSV，共 ${schools.length} 間學校`);
console.log('各類型筆數：', counts);
