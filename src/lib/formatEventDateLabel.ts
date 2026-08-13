import type { SchoolEventDateStatus } from '@/types';

export const TBD_LABEL = '日期待定';

/**
 * Uniformly render a school event date label.
 * Order of precedence:
 *   1. date_status === 'tbd'          -> TBD_LABEL
 *   2. start_at is null/empty         -> TBD_LABEL (compatibility fallback)
 *   3. otherwise                      -> MM/DD formatted date
 */
export function formatEventDateLabel(
  startAt: string | null | undefined,
  dateStatus?: SchoolEventDateStatus | string | null,
): string {
  if (dateStatus === 'tbd' || !startAt) return TBD_LABEL;
  try {
    const d = new Date(startAt);
    if (Number.isNaN(d.getTime())) return TBD_LABEL;
    return d.toLocaleDateString('zh-HK', { month: '2-digit', day: '2-digit' });
  } catch {
    return TBD_LABEL;
  }
}

/**
 * Resolve whether an event (or a task derived from one) should be
 * treated as "date pending" (TBD) in the UI.
 *
 * Order of precedence:
 *   1. `dateStatus === 'tbd'`                        -> true
 *   2. `dateStatus === 'confirmed'`                  -> false
 *   3. Structured fallback: `startAt` is empty       -> true
 *   4. Presentation fallback: `descriptionHint` (already formatted label)
 *      matches TBD_LABEL                             -> true
 *   5. Otherwise                                      -> false
 *
 * Consumers should prefer this helper over string-matching descriptions
 * (e.g. `description === '日期待定'`) because the label text may change.
 */
export function isDatePending(
  dateStatus: SchoolEventDateStatus | string | null | undefined,
  startAt?: string | null,
  descriptionHint?: string | null,
): boolean {
  if (dateStatus === 'tbd') return true;
  if (dateStatus === 'confirmed') return false;
  if (!startAt) {
    if (descriptionHint == null) return true;
    return descriptionHint === TBD_LABEL || descriptionHint.length === 0;
  }
  if (descriptionHint === TBD_LABEL) return true;
  return false;
}
