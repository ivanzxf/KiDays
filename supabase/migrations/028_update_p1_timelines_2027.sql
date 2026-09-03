-- 依 p1tracker 監控更新（來源已核對官方網頁）：
-- 1. 聖保羅男女中學附屬小學：申請 9/7-9/11、簡介會 9/7
-- 2. 九龍塘宣道小學：申請 9/1-9/15、公開面試 10/23-24、結果 11/27
-- 3. 九龍塘學校(小學部)：申請 11/2-11/8、一面 12/15-19、二面 2027/3/11-13、結果 2027/5/12

-- 聖保羅男女中學附屬小學：簡介會 9/7 17:30-18:30（無需登記）
UPDATE school_events SET
  start_at = '2026-09-07T09:30:00+00:00',
  end_at = '2026-09-07T10:30:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '下午5時30分至6時30分',
  notes = '校舍禮堂舉行，毋須預先登記',
  source_url = 'https://www.spcc.edu.hk/chi/admissions/local-admissions/primary/p1',
  updated_at = now()
WHERE id = 'e4fc8567-01d1-422b-9f57-aa5dcec64fad';

-- 聖保羅男女中學附屬小學：申請開始 9/7 09:00
UPDATE school_events SET
  start_at = '2026-09-07T01:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午9時',
  source_url = 'https://www.spcc.edu.hk/chi/admissions/local-admissions/primary/p1',
  updated_at = now()
WHERE id = '5a01eb6c-03fb-49a8-8e9e-fbb2db9997b3';

-- 聖保羅男女中學附屬小學：申請截止 9/11 16:00
UPDATE school_events SET
  start_at = '2026-09-11T08:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '下午4時',
  source_url = 'https://www.spcc.edu.hk/chi/admissions/local-admissions/primary/p1',
  updated_at = now()
WHERE id = '070126ec-2bcb-4cc5-97de-a7dae5644971';

-- 九龍塘宣道小學：申請開始 9/1 09:00
UPDATE school_events SET
  start_at = '2026-09-01T01:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午9時',
  source_url = 'https://www.apskt.edu.hk/application.php',
  updated_at = now()
WHERE id = '1f7b7216-43d3-46d8-ac23-a51f70406a8d';

-- 九龍塘宣道小學：申請截止 9/15 23:59
UPDATE school_events SET
  start_at = '2026-09-15T15:59:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '晚上11時59分',
  source_url = 'https://www.apskt.edu.hk/application.php',
  updated_at = now()
WHERE id = '42b8ea28-8235-4cf6-a7f8-078a41ace08a';

-- 九龍塘宣道小學：公開面試 10/23-24
UPDATE school_events SET
  start_at = '2026-10-23T00:00:00+00:00',
  end_at = '2026-10-24T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '10月23日及24日',
  notes = '個別時間以電郵通知',
  source_url = 'https://www.apskt.edu.hk/application.php',
  updated_at = now()
WHERE id = '8bf403e8-bc12-4e72-b034-301f2e0edabc';

-- 九龍塘宣道小學：結果 11/27 電郵通知
UPDATE school_events SET
  start_at = '2026-11-27T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '電郵通知',
  notes = '取錄及候補名單均以電郵發出；註冊日 12/4 上午9時至10時半',
  source_url = 'https://www.apskt.edu.hk/application.php',
  updated_at = now()
WHERE id = '4da0f9c0-fcd6-4bd7-8cd9-d2e154cbc17d';

-- 九龍塘學校(小學部)：申請開始 11/2 09:00（另需親身交表 11/17-11/19）
UPDATE school_events SET
  start_at = '2026-11-02T01:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '上午9時',
  notes = '另需於 11/17-11/19 上午8時半至下午4時親身遞交文件',
  source_url = 'https://www.ktsps.edu.hk/9/01_2.html',
  updated_at = now()
WHERE id = '152a071d-1f2e-495d-9cb7-a537d04153e9';

-- 九龍塘學校(小學部)：申請截止 11/8 22:00
UPDATE school_events SET
  start_at = '2026-11-08T14:00:00+00:00',
  all_day = false,
  date_status = 'confirmed',
  time_label = '晚上10時',
  source_url = 'https://www.ktsps.edu.hk/9/01_2.html',
  updated_at = now()
WHERE id = '594a50ac-02f5-42d2-99fd-fa7b284409cd';

-- 九龍塘學校(小學部)：第一面 12/15、16、19
UPDATE school_events SET
  start_at = '2026-12-15T00:00:00+00:00',
  end_at = '2026-12-19T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '12月15、16及19日',
  source_url = 'https://www.ktsps.edu.hk/9/01_2.html',
  updated_at = now()
WHERE id = 'abce811a-b403-45b0-8fd4-a7de0f044133';

-- 九龍塘學校(小學部)：第二面 2027/3/11-13
UPDATE school_events SET
  start_at = '2027-03-11T00:00:00+00:00',
  end_at = '2027-03-13T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '3月11日至13日',
  notes = '二面名單及時間於 2027/2/16 公佈',
  source_url = 'https://www.ktsps.edu.hk/9/01_2.html',
  updated_at = now()
WHERE id = '59393adb-49dd-4269-abf6-e2091d0b6292';

-- 九龍塘學校(小學部)：結果 2027/5/12 書面通知
UPDATE school_events SET
  start_at = '2027-05-12T00:00:00+00:00',
  all_day = true,
  date_status = 'confirmed',
  time_label = '書面通知',
  source_url = 'https://www.ktsps.edu.hk/9/01_2.html',
  updated_at = now()
WHERE id = '32931836-671e-4234-aad4-b9b00d07043a';

-- 九龍塘學校(小學部)：不辦小一簡介會、開放日每五年一次 → 明確設為不適用
UPDATE school_events SET
  start_at = NULL,
  end_at = NULL,
  date_status = 'na',
  time_label = NULL,
  updated_at = now()
WHERE id IN ('a887da19-0d81-484f-9939-cfdd58745aa8', '351b84a3-bf0b-4c64-aea4-ee205addaebe');
