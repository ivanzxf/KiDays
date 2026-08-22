import csv
from collections import defaultdict
from pathlib import Path

p = Path('/Users/ivan/Documents/trae_projects/KiDays/scripts/import_format/03_school_events_v2.csv')
rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))

per = defaultdict(dict)
for r in rows:
    per[r['school_key']][r['event_type']] = (
        r['data_status'], r['start_at'], r.get('end_at',''), r.get('source_url',''))

print('=== 有至少 1 個 confirmed / na 的學校 (有查過資料的強烈訊號) ===')
count = 0
for sk in sorted(per.keys()):
    d = per[sk]
    conf = [k for k, v in d.items() if v[0] == 'confirmed']
    na = [k for k, v in d.items() if v[0] == 'na']
    if conf or na:
        count += 1
        print(f'{sk}: confirmed={conf} na={na}')
        for k in conf:
            ds, sa, ea, url = d[k]
            print(f'    {k}: {sa} ~ {ea}  src={url or "-"}')
        for k in na:
            ds, sa, ea, url = d[k]
            print(f'    {k}: NA_EVENT  src={url or "-"}')
print(f'共 {count} 間學校有 confirmed 或 na。')
print()

full_tbd = [
    sk for sk, v in per.items()
    if all(x[0] == 'tbd' for x in v.values())
]
print('=== 全部事件都是 tbd 的學校 (可能完全沒公開資訊，或 AI 沒查到) ===')
print(f'共 {len(full_tbd)} 間:')
for sk in sorted(full_tbd):
    print(f'  {sk}')

print()
print('=== 有 NA_EVENT 明確標示的學校 ===')
na_schools = [sk for sk, v in per.items() if any(x[0]=='na' for x in v.values())]
print(f'共 {len(na_schools)} 間')
for sk in sorted(na_schools):
    nas = [k for k,v in per[sk].items() if v[0]=='na']
    print(f'  {sk}: {nas}')
