-- 更新兩間學校的 2027/28 申請日程（官方已公佈）：
-- 1. 拔萃男書院附屬小學：網上申請 8月29日9:00 至 9月4日17:00
-- 2. 保良局蔡繼有學校：網上申請 8月31日10:00 至 9月4日16:00；面試 9月16日至19日

-- 拔萃男書院附屬小學：申請開始（09:00 HKT）
UPDATE school_events SET
  start_at = '2026-08-29T01:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午9時',
  source_url = 'https://www.dbspd.edu.hk/g1-admission',
  updated_at = now()
WHERE id = 'b3c39fb5-3939-4095-8d0d-f0603a8448f2';

-- 拔萃男書院附屬小學：申請截止（17:00 HKT）
UPDATE school_events SET
  start_at = '2026-09-04T09:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '下午5時',
  source_url = 'https://www.dbspd.edu.hk/g1-admission',
  updated_at = now()
WHERE id = '51537746-a6cd-4129-880b-22d3c80bb098';

-- 保良局蔡繼有學校：申請開始（10:00 HKT）
UPDATE school_events SET
  start_at = '2026-08-31T02:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午10時',
  source_url = 'https://www.cky.edu.hk/en/site/view?name=Admissions+Update',
  updated_at = now()
WHERE id = '9e14a865-44d5-433b-a993-7adba2628620';

-- 保良局蔡繼有學校：申請截止（16:00 HKT）
UPDATE school_events SET
  start_at = '2026-09-04T08:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '下午4時',
  source_url = 'https://www.cky.edu.hk/en/site/view?name=Admissions+Update',
  updated_at = now()
WHERE id = '3ba01c73-5b29-44c8-9f18-4335f1f58e91';

-- 保良局蔡繼有學校：第一面（9月16日至19日，小組面試）
UPDATE school_events SET
  start_at = '2026-09-16T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '9月16日至19日',
  notes = '小組面試，每場約1小時；申請者應為K3；第一輪無家長面試',
  source_url = 'https://www.cky.edu.hk/en/site/view?name=Admissions+Update',
  updated_at = now()
WHERE id = '8b375b5a-a043-48ef-8f95-0445e97e9f7f';
