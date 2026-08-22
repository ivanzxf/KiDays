-- PRV-22 國際基督教優質音樂中學暨小學 2027-2028 小一：恢復第二輪面試節點
-- 官方流程包含第一輪與第二輪面試；第二輪面試日期尚未公布 → 標記 tbd（可編輯），
-- 並清除 017 migration 誤標的 na 與 notes。第一面標題由「面試」還原為「第一面」。

-- 1. 第二面：na → tbd（日期待定，保留節點可編輯）
UPDATE school_events e
SET date_status = 'tbd',
    start_at = NULL,
    end_at = NULL,
    notes = '第二輪面試日期待定'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'second_interview';

-- 2. 第一面標題還原為「第一面」
UPDATE school_events e
SET title_zh = '第一面'
WHERE e.school_cycle_id IN (
    SELECT sc.id
    FROM schools s
    JOIN school_cycles sc ON sc.school_id = s.id
    WHERE s.name_zh = '國際基督教優質音樂中學暨小學'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
)
  AND e.event_type = 'first_interview';
