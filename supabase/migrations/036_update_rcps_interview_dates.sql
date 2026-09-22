-- 更新高主教書院小學部（PRV-02）2027-2028 小一面見日期
-- 第一次面見：2026-09-12（星期六）
-- 第二次面見：2026-10-17（星期六）

UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-09-11T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  updated_at = now()
WHERE id = '9176b014-3b12-4d82-9ed6-4ff3d91bc7a3';

UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-10-16T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  updated_at = now()
WHERE id = '4b40e248-e0b6-4a4c-a705-96220c86b944';
