-- 更新高主教書院小學部（PRV-02）與救恩學校（PRV-03）2027-2028 小一入學時間表
-- 高主教來源：https://rcps.ievent.hk/event/2870?lang=zh（報名/面見/結果）
--            https://rcps.ievent.hk/event/2871?lang=zh（小一入學簡介會）
-- 救恩來源：https://www.kauyan.edu.hk/primary/admissions/p1/（簡介會/報名/面試）
--          https://kauyanadmission.ievent.hk/event/3063（報名與結果詳情）
-- 時間慣例：全日事件以 HKT 當日 00:00 = 前一日 16:00 UTC 儲存；有時段者存實際 UTC

-- ========== 高主教書院小學部（PRV-02） ==========

-- 簡介會：2026-07-11（六）上午10:00-11:30、下午2:30-4:00
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-07-11T02:00:00+00:00',
  end_at = '2026-07-11T08:00:00+00:00',
  all_day = false,
  time_label = '上午10時至11時30分 / 下午2時30分至4時',
  notes = '兩場簡介會；須預先網上報名（7月2日上午9:00起，額滿即止）',
  source_url = 'https://rcps.ievent.hk/event/2871?lang=zh',
  updated_at = now()
WHERE id = '9ea7ea1e-a759-4a9d-8af0-3849e3506221';

-- 申請開始：2026-07-06（一）上午9:00（網上報名）
UPDATE school_events SET
  time_label = '上午9時',
  source_url = 'https://rcps.ievent.hk/event/2870?lang=zh',
  updated_at = now()
WHERE id = 'a8f0f2f9-e63d-45c3-8a34-22232925bd1e';

-- 申請截止：2026-08-21（五）下午11:59（另需 7/11-8/22 親身遞交文件）
UPDATE school_events SET
  time_label = '下午11時59分',
  notes = '親身遞交報名表及文件：2026年7月11日至8月22日；報名費HK$100',
  source_url = 'https://rcps.ievent.hk/event/2870?lang=zh',
  updated_at = now()
WHERE id = '1908e621-793a-474d-9205-a1bc8ddef06c';

-- 第一次面見：2026-09-12（六）
UPDATE school_events SET
  notes = '第一次面見結果將於九月下旬公佈',
  source_url = 'https://rcps.ievent.hk/event/2870?lang=zh',
  updated_at = now()
WHERE id = '9176b014-3b12-4d82-9ed6-4ff3d91bc7a3';

-- 第二次面見：2026-10-17（六）
UPDATE school_events SET
  source_url = 'https://rcps.ievent.hk/event/2870?lang=zh',
  updated_at = now()
WHERE id = '4b40e248-e0b6-4a4c-a705-96220c86b944';

-- 結果公佈：取錄通知將於十一月上旬公佈
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-10-31T16:00:00+00:00',
  end_at = '2026-11-09T16:00:00+00:00',
  all_day = true,
  time_label = '11月上旬',
  notes = '取錄通知將於十一月上旬公佈（第一次面見結果另於九月下旬公佈）',
  source_url = 'https://rcps.ievent.hk/event/2870?lang=zh',
  updated_at = now()
WHERE id = 'd0e004db-7e23-42a7-9aa6-2cff3da76182';

-- ========== 救恩學校（PRV-03） ==========

-- 開放日：2026-04-25（六）上午10:00-下午4:00
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-04-25T02:00:00+00:00',
  end_at = '2026-04-25T08:00:00+00:00',
  all_day = false,
  time_label = '上午10時至下午4時',
  source_url = 'https://topschool.hket.com/article/4115362/',
  updated_at = now()
WHERE id = 'f32c23b4-9aab-427e-9850-0660cde7256e';

-- 簡介會：2026-06-18（四）晚上7:30-9:00
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-06-18T11:30:00+00:00',
  end_at = '2026-06-18T13:00:00+00:00',
  all_day = false,
  time_label = '晚上7時30分至9時',
  notes = '地點：救恩堂三樓禮堂；須預先網上留座（5月18日上午9:00起，額滿即止）',
  source_url = 'https://www.kauyan.edu.hk/primary/admissions/p1/',
  updated_at = now()
WHERE id = 'bb98f8ea-6766-491b-8732-cc25ca8f2e26';

-- 申請開始：2026-06-22（一）上午9:00（網上申請）
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-06-22T01:00:00+00:00',
  end_at = NULL,
  all_day = false,
  time_label = '上午9時',
  source_url = 'https://www.kauyan.edu.hk/primary/admissions/p1/',
  updated_at = now()
WHERE id = 'b5a40a28-9a22-4e75-8ed7-3c15e9c831e7';

-- 申請截止：2026-07-24（五）下午5:00
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-07-24T09:00:00+00:00',
  end_at = NULL,
  all_day = false,
  time_label = '下午5時',
  notes = '只接受網上申請，不派發申請表格；報名費HK$400',
  source_url = 'https://www.kauyan.edu.hk/primary/admissions/p1/',
  updated_at = now()
WHERE id = 'f323f0f6-8720-433b-a42f-a3029c6b8b87';

-- 第一次面見：2026-09-18（五）、09-19（六）或 09-25（五）
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-09-17T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  time_label = '9月18、19及25日',
  notes = '家長可選其中一天；2026年8月24日中午12時起於校網查閱獲編排的日期及時間',
  source_url = 'https://www.kauyan.edu.hk/primary/admissions/p1/',
  updated_at = now()
WHERE id = 'ad5e78ff-9b79-44d1-897f-ec6d5740eccc';

-- 第二次面見：官方只設一次面試
UPDATE school_events SET
  date_status = 'na',
  start_at = NULL,
  end_at = NULL,
  time_label = NULL,
  source_url = 'https://www.kauyan.edu.hk/primary/admissions/p1/',
  updated_at = now()
WHERE id = '7b65a140-c18b-48b3-9f35-37474217e7d0';

-- 結果公佈：2026-10-21（三）中午12:00
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-10-21T04:00:00+00:00',
  end_at = NULL,
  all_day = false,
  time_label = '中午12時',
  notes = '家長可於校網查詢取錄結果',
  source_url = 'https://kauyanadmission.ievent.hk/event/3063',
  updated_at = now()
WHERE id = '87e5ec12-78f8-4389-9216-de9ddfb498c8';
