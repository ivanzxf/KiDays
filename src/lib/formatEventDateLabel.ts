import type { SchoolEventDateStatus } from '@/types';

export const TBD_LABEL = '日期待定';
export const NA_LABEL = 'N/A';
/** Rolling Admissions 學校：日期由家長自填的預設標籤。 */
export const CUSTOM_DATE_LABEL = '自定義';

/** CSV/原始資料中代表「明確不存在該事件」的佔位值。 */
export const NA_EVENT_SENTINEL = 'NA_EVENT';

/** 月份縮寫一律固定三個字母。 */
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const HK_PARTS_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Hong_Kong',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

export function getDateParts(d: Date): { day: string; month: string; year: string } {
  const parts = HK_PARTS_FORMAT.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const monthIndex = Math.max(1, Math.min(12, Number(get('month'))));
  return {
    day: get('day').replace(/^0/, ''),
    month: MONTHS_SHORT[monthIndex - 1],
    year: get('year'),
  };
}

/** 單日：6 Jul 2026 */
export function formatCardDateFull(d: Date): string {
  const p = getDateParts(d);
  return `${p.day} ${p.month} ${p.year}`;
}

/** 僅日期＋月（區間開頭用）：6 Jul */
export function formatCardDateShort(d: Date): string {
  const p = getDateParts(d);
  return `${p.day} ${p.month}`;
}

/** 區間：同年 12 Jun - 11 Jul 2026；跨年 12 Jun 2026 - 11 Jul 2027 */
export function formatCardRange(start: Date, end: Date): string {
  const s = getDateParts(start);
  const e = getDateParts(end);
  return s.year === e.year
    ? `${s.day} ${s.month} - ${e.day} ${e.month} ${e.year}`
    : `${s.day} ${s.month} ${s.year} - ${e.day} ${e.month} ${e.year}`;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Uniformly render a school event date label.
 * Order of precedence:
 *   1. date_status === 'na' / start_at 為 NA_EVENT   -> NA_LABEL
 *   2. date_status === 'tbd'          -> TBD_LABEL
 *   3. start_at is null/empty         -> TBD_LABEL (compatibility fallback)
 *   4. otherwise                      -> 6 Jul 2026
 */
export function formatEventDateLabel(
  startAt: string | null | undefined,
  dateStatus?: SchoolEventDateStatus | string | null,
): string {
  if (dateStatus === 'na' || startAt === NA_EVENT_SENTINEL) return NA_LABEL;
  if (dateStatus === 'tbd' || !startAt) return TBD_LABEL;
  const d = parseDate(startAt);
  return d ? formatCardDateFull(d) : TBD_LABEL;
}

export function formatSchoolCardDateLabel(
  startAt: string | null | undefined,
  dateStatus?: SchoolEventDateStatus | string | null,
): string {
  if (dateStatus === 'na' || startAt === NA_EVENT_SENTINEL) return NA_LABEL;
  if (dateStatus === 'tbd' || !startAt) return TBD_LABEL;
  const d = parseDate(startAt);
  return d ? formatCardDateFull(d) : TBD_LABEL;
}

/**
 * Resolve whether an event (or a task derived from one) should be
 * treated as "date pending" (TBD) in the UI.
 *
 * Order of precedence:
 *   1. `dateStatus === 'na'`                          -> false
 *   2. `dateStatus === 'tbd'`                         -> true
 *   3. `dateStatus === 'confirmed'`                   -> false
 *   4. Structured fallback: `startAt` is empty       -> true
 *   5. Presentation fallback: `descriptionHint` (already formatted label)
 *      matches TBD_LABEL                             -> true
 *   6. Otherwise                                      -> false
 *
 * Consumers should prefer this helper over string-matching descriptions
 * (e.g. `description === '日期待定'`) because the label text may change.
 */
export function isDatePending(
  dateStatus: SchoolEventDateStatus | string | null | undefined,
  startAt?: string | null,
  descriptionHint?: string | null,
): boolean {
  if (dateStatus === 'na') return false;
  if (dateStatus === 'tbd') return true;
  if (dateStatus === 'confirmed') return false;
  if (!startAt) {
    if (descriptionHint == null) return true;
    return descriptionHint === TBD_LABEL || descriptionHint.length === 0;
  }
  if (descriptionHint === TBD_LABEL) return true;
  return false;
}
