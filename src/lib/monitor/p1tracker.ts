import { createHash } from 'node:crypto';

const P1TRACKER_BASE = 'https://www.p1tracker.com';

/** p1tracker 單一學校的原始資料（data.js 內）。 */
export interface P1TrackerSchool {
  name: string;
  cat?: string | null;
  dist?: string | null;
  track?: string | null;
  dISO?: string | null;
  dTime?: string | null;
  dText?: string | null;
  sISO?: string | null;
  sTime?: string | null;
  start?: string | null;
  window?: string | null;
  keyDates?: string | null;
  url?: string | null;
  status?: string | null;
  notes?: string | null;
  nameEn?: string | null;
  detailUrl?: string | null;
}

/** p1tracker data.js 的頂層結構。 */
export interface P1TrackerData {
  generatedAt?: string | null;
  updatedLabel?: string | null;
  timezone?: string | null;
  schools: P1TrackerSchool[];
}

/** 每校的資料摘要：只保留會影響家長的欄位，供逐欄位比對。 */
export interface SchoolSummary {
  name: string;
  cat?: string | null;
  dist?: string | null;
  track?: string | null;
  dISO?: string | null;
  dText?: string | null;
  dTime?: string | null;
  sISO?: string | null;
  start?: string | null;
  window?: string | null;
  keyDates?: string | null;
  url?: string | null;
  status?: string | null;
}

/** 把字串轉成 sha256 指紋。 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** 從 data.js 原始內容解析出結構化資料（去除 window.P1_TRACKER_DATA = 前綴）。 */
export function parseP1TrackerData(raw: string): P1TrackerData {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('data.js 內容無法解析');
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as P1TrackerData;
  if (!Array.isArray(parsed.schools)) {
    throw new Error('data.js 缺少 schools 陣列');
  }
  return parsed;
}

/** 從完整資料中提取每校摘要。 */
export function buildSchoolSummaries(data: P1TrackerData): SchoolSummary[] {
  return (data.schools ?? []).map((s) => ({
    name: s.name,
    cat: s.cat ?? null,
    dist: s.dist ?? null,
    track: s.track ?? null,
    dISO: s.dISO ?? null,
    dText: s.dText ?? null,
    dTime: s.dTime ?? null,
    sISO: s.sISO ?? null,
    start: s.start ?? null,
    window: s.window ?? null,
    keyDates: s.keyDates ?? null,
    url: s.url ?? null,
    status: s.status ?? null,
  }));
}

/** 對比新舊摘要，輸出人類可讀的變化清單；無變化回傳空陣列。 */
export function diffSchoolSummaries(
  prev: SchoolSummary[],
  curr: SchoolSummary[],
): string[] {
  const changes: string[] = [];
  const prevMap = new Map(prev.map((s) => [s.name, s]));
  const currMap = new Map(curr.map((s) => [s.name, s]));

  // 新增學校
  for (const s of curr) {
    if (!prevMap.has(s.name)) {
      changes.push(
        `新增學校：${s.name}${s.window ? `（申請期：${s.window}）` : ''}${
          s.url ? `\n  官方來源：${s.url}` : ''
        }`,
      );
    }
  }

  // 消失學校（停辦／下架）
  for (const s of prev) {
    if (!currMap.has(s.name)) {
      changes.push(`學校已從追蹤列表移除：${s.name}`);
    }
  }

  // 逐欄位比較
  const FIELDS: { key: keyof SchoolSummary; label: string }[] = [
    { key: 'window', label: '申請期' },
    { key: 'dISO', label: '截止日' },
    { key: 'sISO', label: '開始日' },
    { key: 'track', label: '狀態' },
    { key: 'keyDates', label: '重要日期' },
    { key: 'status', label: '狀態說明' },
  ];

  for (const currSchool of curr) {
    const prevSchool = prevMap.get(currSchool.name);
    if (!prevSchool) continue;

    const diffs: string[] = [];
    for (const field of FIELDS) {
      const before = (prevSchool[field.key] ?? '').trim();
      const after = (currSchool[field.key] ?? '').trim();
      if (before !== after) {
        diffs.push(`${field.label}：${before || '（無）'} → ${after || '（無）'}`);
      }
    }

    if (diffs.length > 0) {
      const urlLine = currSchool.url ? `\n  官方來源：${currSchool.url}` : '';
      changes.push(
        `${currSchool.name}\n${diffs.map((d) => `  ${d}`).join('\n')}${urlLine}`,
      );
    }
  }

  return changes;
}

/** 抓取 p1tracker：先取首頁找出 data.js 位址，再抓取並解析結構化資料。 */
export async function fetchP1TrackerData(): Promise<{
  data: P1TrackerData;
  updatedLabel: string;
}> {
  const pageResponse = await fetch(`${P1TRACKER_BASE}/`, {
    headers: {
      'User-Agent': 'KiDays-monitor/1.0 (daily update checker)',
      'Accept': 'text/html',
    },
    cache: 'no-store',
  });
  if (!pageResponse.ok) {
    throw new Error(`p1tracker page fetch failed: ${pageResponse.status}`);
  }
  const html = await pageResponse.text();
  const match = html.match(/src="(data\.js[^"]*)"/);
  if (!match) {
    throw new Error('找不到 data.js 位址');
  }
  const dataUrl = match[1].startsWith('http')
    ? match[1]
    : `${P1TRACKER_BASE}/${match[1]}`;

  const dataResponse = await fetch(dataUrl, {
    headers: { 'User-Agent': 'KiDays-monitor/1.0 (daily update checker)' },
    cache: 'no-store',
  });
  if (!dataResponse.ok) {
    throw new Error(`p1tracker data.js fetch failed: ${dataResponse.status}`);
  }
  const raw = await dataResponse.text();
  const data = parseP1TrackerData(raw);
  return { data, updatedLabel: data.updatedLabel ?? data.generatedAt ?? '' };
}

/** 整批摘要的指紋（用於快速判斷「是否有任何變化」）。 */
export function summariesHash(summaries: SchoolSummary[]): string {
  return hashContent(JSON.stringify(summaries));
}
