-- PRV-22 國際基督教優質音樂中學暨小學 2027-2028 小一入學時間線修正
-- 資料來源：學校官網 https://www.icqm.edu.hk
--   (1) 申請須知 PDF「2728_P1_info_r2.pdf」：截止 2026-04-26（日）；面試 6月18/20/26/27 四日；面試通知 5月30日前電郵發出
--   (2) 官網公告 2026-03-31：開始接受報名；2026-07-29：7月28日至8月1日分批電郵發放第一輪面試結果
-- 該校流程僅「申請 → 一輪面試（多日）→ 結果公布」：開放日、簡介會、第二面標記為 na（明確不存在）

-- 1. 開放日：官方無此活動 → na
UPDATE school_events e
SET date_status = 'na', start_at = NULL, end_at = NULL, notes = '官方未設開放日'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'open_day';

-- 2. 簡介會：官方無此活動 → na
UPDATE school_events e
SET date_status = 'na', start_at = NULL, end_at = NULL, notes = '官方未設簡介會'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'info_session';

-- 3. 申請開始：2026-03-31（官方公布開始接受報名）
UPDATE school_events e
SET date_status = 'confirmed',
    start_at = '2026-03-31T09:00:00+08:00',
    end_at = NULL,
    notes = '官方於 2026-03-31 公布開始接受網上報名'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'application_open';

-- 4. 申請截止：2026-04-26（日）23:59
UPDATE school_events e
SET date_status = 'confirmed',
    start_at = '2026-04-26T23:59:00+08:00',
    end_at = NULL,
    notes = NULL
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'application_deadline';

-- 5. 面試（一輪，多日）：6月18日(四)、20日(六)、26日(五)、27日(六)
UPDATE school_events e
SET date_status = 'confirmed',
    title_zh = '面試',
    start_at = '2026-06-18T09:00:00+08:00',
    end_at = '2026-06-27T18:00:00+08:00',
    notes = '面試日：6月18日(四)、6月20日(六)、6月26日(五)、6月27日(六)；面試通知於 5月30日前以電郵發出'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'first_interview';

-- 6. 第二面：該校僅一輪面試 → na
UPDATE school_events e
SET date_status = 'na', start_at = NULL, end_at = NULL, notes = '該校僅一輪面試，無第二面'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'second_interview';

-- 7. 結果公布：2026-07-28 至 08-01 分批電郵發放
UPDATE school_events e
SET date_status = 'confirmed',
    start_at = '2026-07-28T09:00:00+08:00',
    end_at = '2026-08-01T18:00:00+08:00',
    notes = '7月28日至8月1日分批以電郵發放第一輪面試結果'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'result_release';
