-- 依 p1tracker 監控更新（第二輪；來源為各校官方網頁）：
-- 德望小學暨幼稚園、真道書院、王錦輝中小學、宏信書院、聖嘉勒小學、蔡繼有學校

-- 德望小學暨幼稚園：第一面 8/26-27（後備日 8/28、8/31）
UPDATE school_events SET
  start_at = '2026-08-26T00:00:00+00:00',
  end_at = '2026-08-27T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = NULL,
  notes = '面試時間於 2026/8/3 上午10時後公布；若遇特殊情況順延：8/26 場次後備 8/28、8/27 場次後備 8/31',
  source_url = 'https://www1.ghs.edu.hk/admission/p1_admission/',
  updated_at = now()
WHERE id = '1f597075-4e44-496a-9cd8-5189578330d9';

-- 德望小學暨幼稚園：結果 10/5 上午10時
UPDATE school_events SET
  start_at = '2026-10-05T02:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午10時',
  notes = '取錄生註冊：2026/10/24 上午9時至11時',
  source_url = 'https://www1.ghs.edu.hk/admission/p1_admission/',
  updated_at = now()
WHERE id = '9bd1cc23-732c-4959-8a21-fc1863696920';

-- 香港華人基督教聯會真道書院(小學部)：第一面 10/3
UPDATE school_events SET
  start_at = '2026-10-03T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = NULL,
  notes = '面試通知電郵已於 2026/9/2 發出；未收到者請於 2026/9/8 前聯絡學校；二面（入圍者及家長）11 月中下旬',
  source_url = 'https://www.logosacademy.edu.hk/',
  updated_at = now()
WHERE id = '7a0a1214-1c94-4209-b6cb-fde9aff39bd7';

-- 香港浸會大學附屬學校王錦輝中小學：第一面 9/19-20（於學校查詢系統確認指定時間）
UPDATE school_events SET
  start_at = '2026-09-19T00:00:00+00:00',
  end_at = '2026-09-20T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = NULL,
  notes = '請於學校查詢系統確認獲編配的日期及時間；學校不接受面試改期',
  source_url = 'https://www.hkbuas.edu.hk/en/g1-admission',
  updated_at = now()
WHERE id = '633dd250-2108-4086-b408-175e3becc0e4';

-- 基督教香港信義會宏信書院：第一面 10/3（小組）
UPDATE school_events SET
  start_at = '2026-10-03T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = NULL,
  notes = '第一輪面試通知電郵於 2026/9/21 發出；首輪結果 10/14 電郵；入圍者另參與二面及家長會面（日期未公布）',
  source_url = 'https://www.luac.edu.hk/admissions/',
  updated_at = now()
WHERE id = '4023330f-bfdc-483f-8b99-47fb9183b2e7';

-- 基督教香港信義會宏信書院：Year 1 結果 11/25
UPDATE school_events SET
  start_at = '2026-11-25T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '電郵通知',
  notes = '取錄生註冊：2026/12/2 至 12/4',
  source_url = 'https://www.luac.edu.hk/admissions/',
  updated_at = now()
WHERE id = 'b9c12be2-750f-44f9-a4b1-f799a334a438';

-- 聖嘉勒小學：申請開始日 9/13 更正為 9/14
UPDATE school_events SET
  start_at = '2026-09-13T16:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  source_url = 'https://pri.scps.edu.hk/admission/',
  updated_at = now()
WHERE id = '345227a8-2627-45b7-85f0-188be9de14ca';

-- 保良局蔡繼有學校：一面 notes 補上面試確認電郵期限
UPDATE school_events SET
  notes = '小組面試，每場約1小時；申請者應為K3；第一輪無家長面試；面試確認電郵於 2026/9/10 或之前發出，若 9/11 前仍未收到請聯絡學校',
  source_url = 'https://www.cky.edu.hk/en/site/view?name=Admissions+Update',
  updated_at = now()
WHERE id = '8b375b5a-a043-48ef-8f95-0445e97e9f7f';
