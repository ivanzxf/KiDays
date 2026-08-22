import csv
from collections import defaultdict, Counter
from datetime import datetime
from pathlib import Path

root = Path('/Users/ivan/Documents/trae_projects/KiDays/scripts/import_format')
v2_path = root / '03_school_events_v2.csv（固定7列版）.csv'
schools_path = root / '01_schools.csv'

EVENT_ORDER = [
    'open_day',
    'info_session',
    'application_open',
    'application_deadline',
    'first_interview',
    'second_interview',
    'result_release',
]

TITLE_MAP = {
    'open_day': '開放日',
    'info_session': '簡介會',
    'application_open': '申請開始',
    'application_deadline': '申請截止',
    'first_interview': '第一面',
    'second_interview': '第二面',
    'result_release': '結果公佈',
}


def read_csv(p: Path):
    with open(p, newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def parse_iso(value: str):
    if not value:
        return False
    try:
        if value.endswith('Z'):
            datetime.fromisoformat(value.replace('Z', '+00:00'))
        else:
            datetime.fromisoformat(value)
        return True
    except Exception:
        return False


def main():
    rows_01 = read_csv(schools_path)
    expected_keys = set(r['school_key'] for r in rows_01)

    rows_v2 = read_csv(v2_path)
    per_school = defaultdict(list)
    for r in rows_v2:
        per_school[(r['school_key'], r['academic_year'])].append(r)

    errors = []
    warnings = []
    coverage = {et: {'confirmed': 0, 'tbd': 0, 'na': 0} for et in EVENT_ORDER}
    status_counts = Counter()
    iso_issues = []
    all_day_issues = []
    title_issues = []

    for key, group in per_school.items():
        sk, ay = key
        if len(group) != 7:
            errors.append(f'SCHOOL {sk} {ay}: 事件列數不是 7，是 {len(group)}')
            continue

        seq_sorted = sorted(group, key=lambda r: int(r['sequence_no']))
        types = [r['event_type'] for r in seq_sorted]
        seqs = [int(r['sequence_no']) for r in seq_sorted]

        if seqs != [1, 2, 3, 4, 5, 6, 7]:
            errors.append(f'SCHOOL {sk} {ay}: sequence_no 不是 1-7: {seqs}')
        if types != EVENT_ORDER:
            errors.append(f'SCHOOL {sk} {ay}: event_type 順序不正確: {types}')

        for r in group:
            et = r['event_type']
            ds = (r.get('data_status') or '').strip()
            sa = (r.get('start_at') or '').strip()
            ea = (r.get('end_at') or '').strip()
            title = (r.get('title_zh') or '').strip()
            ad = (r.get('all_day') or '').strip().lower()

            status_counts[ds] += 1
            if et in coverage and ds in coverage[et]:
                coverage[et][ds] += 1

            expected_title = TITLE_MAP.get(et)
            if expected_title and title != expected_title:
                title_issues.append(
                    f'{sk} {et}: title_zh={title!r}, 應為 {expected_title!r}'
                )

            if ad not in ('true', 'false'):
                all_day_issues.append(f'{sk} {et}: all_day={ad}')

            if ds == 'na':
                if sa != 'NA_EVENT':
                    iso_issues.append(
                        f'{sk} {et}: data_status=na 但 start_at={sa!r}, 應為 NA_EVENT'
                    )
                if ea:
                    warnings.append(
                        f'{sk} {et}: na 狀態下 end_at 不應有值，但為 {ea!r}'
                    )
            elif ds == 'tbd':
                if sa != '':
                    iso_issues.append(
                        f'{sk} {et}: data_status=tbd 但 start_at={sa!r}, 應留空'
                    )
            elif ds == 'confirmed':
                if not sa:
                    iso_issues.append(f'{sk} {et}: data_status=confirmed 但 start_at 是空')
                else:
                    if not parse_iso(sa):
                        iso_issues.append(
                            f'{sk} {et}: start_at 無法解析為 ISO 8601: {sa!r}'
                        )
                if ea and not parse_iso(ea):
                    iso_issues.append(
                        f'{sk} {et}: end_at 無法解析為 ISO 8601: {ea!r}'
                    )
            else:
                iso_issues.append(
                    f'{sk} {et}: data_status={ds!r} 非法，只能 confirmed/tbd/na'
                )

    actual_schools = {sk for (sk, ay) in per_school.keys()}
    missing_in_v2 = expected_keys - actual_schools
    extra_in_v2 = actual_schools - expected_keys

    print('=== 基本結構 ===')
    print(f'01 schools.csv 學校數: {len(expected_keys)}')
    print(f'v2 events.csv 學校數: {len(actual_schools)}')
    print(f'v2 總列數: {len(rows_v2)}')
    print(f'v2 學年度組合數: {len(per_school)}')
    print()

    academic_years = Counter(ay for (sk, ay) in per_school.keys())
    print('學年度分佈:')
    for ay, c in sorted(academic_years.items()):
        print(f'  {ay}: {c} 校')
    print()

    if missing_in_v2:
        print(f'[錯誤] 01 有但 v2 缺少的學校 ({len(missing_in_v2)}):')
        for sk in sorted(missing_in_v2)[:30]:
            print(f'  {sk}')
        if len(missing_in_v2) > 30:
            print(f'  ... 共 {len(missing_in_v2)}')
        print()

    if extra_in_v2:
        print(f'[警告] v2 有但 01 沒有的學校 ({len(extra_in_v2)}):')
        for sk in sorted(extra_in_v2):
            print(f'  {sk}')
        print()

    print('=== data_status 總體計數 ===')
    for k, v in status_counts.most_common():
        print(f'  {k or "<空>"}: {v}')
    print()

    print('=== 各事件類型覆蓋率 (confirmed / tbd / na) ===')
    for et in EVENT_ORDER:
        c = coverage[et]
        total = c['confirmed'] + c['tbd'] + c['na']
        print(
            f'  {TITLE_MAP[et]:<6} {et:<22} '
            f'confirmed={c["confirmed"]:<4} '
            f'tbd={c["tbd"]:<4} '
            f'na={c["na"]:<4} '
            f'total={total}'
        )
    print()

    if errors:
        print(f'=== 結構錯誤 ({len(errors)}) ===')
        for e in errors[:40]:
            print(f'  {e}')
        if len(errors) > 40:
            print(f'  ... 共 {len(errors)}')
        print()

    if title_issues:
        print(f'=== title_zh 不符合規範 ({len(title_issues)}) ===')
        for e in title_issues[:30]:
            print(f'  {e}')
        if len(title_issues) > 30:
            print(f'  ... 共 {len(title_issues)}')
        print()

    if all_day_issues:
        print(f'=== all_day 非法值 ({len(all_day_issues)}) ===')
        for e in all_day_issues[:30]:
            print(f'  {e}')
        if len(all_day_issues) > 30:
            print(f'  ... 共 {len(all_day_issues)}')
        print()

    if iso_issues:
        print(f'=== start_at/data_status 不一致或日期格式錯誤 ({len(iso_issues)}) ===')
        for e in iso_issues[:60]:
            print(f'  {e}')
        if len(iso_issues) > 60:
            print(f'  ... 共 {len(iso_issues)}')
        print()

    if warnings:
        print(f'=== 其他警告 ({len(warnings)}) ===')
        for w in warnings[:30]:
            print(f'  {w}')
        if len(warnings) > 30:
            print(f'  ... 共 {len(warnings)}')
        print()

    if not (errors or title_issues or all_day_issues or iso_issues):
        print('✅ 整體格式檢查 PASS：每校剛好 7 列、event/順序/data_status/日期格式都符合規則。')
    else:
        print('❌ 有需要修正的項目，請先處理上面列出的錯誤。')


if __name__ == '__main__':
    main()
