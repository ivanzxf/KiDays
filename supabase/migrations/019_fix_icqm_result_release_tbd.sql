-- PRV-22 國際基督教優質音樂中學暨小學 2027-2028 小一：最終結果公布日期修正
-- 官網 2026-07-29 公告的「7月28日至8月1日分批發放」是「第一輪面試結果」，並非最終結果；
-- 第二輪面試尚未進行，最終結果公布日期未定 → result_release 改為 tbd（日期待定）

UPDATE school_events e
SET date_status = 'tbd',
    start_at = NULL,
    end_at = NULL,
    notes = '7月28日至8月1日公布的是第一輪面試結果；待第二輪面試後才公布最終結果，日期待定'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'result_release';
