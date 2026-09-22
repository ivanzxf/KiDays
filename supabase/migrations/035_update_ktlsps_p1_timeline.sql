-- 更新九龍真光中學(小學部)（PRV-12）2027-2028 小一入學時間表
-- 來源：https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf
-- 簡介會來源：https://www.ktlsps.edu.hk/202627p1-admission/
-- 時間慣例：全日事件以 HKT 當日 00:00 = 前一日 16:00 UTC 儲存

-- 開放日：官方無舉辦開放日
UPDATE school_events SET
  date_status = 'na',
  start_at = NULL,
  end_at = NULL,
  source_url = 'https://www.ktlsps.edu.hk/',
  updated_at = now()
WHERE id = '797cca17-1a9b-43ee-b055-aced80307b63';

-- 簡介會：2026-09-12（六）下午 2:00–3:30
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-09-12T06:00:00+00:00',
  end_at = '2026-09-12T07:30:00+00:00',
  all_day = false,
  time_label = '下午2時至3時30分',
  source_url = 'https://www.ktlsps.edu.hk/202627p1-admission/',
  updated_at = now()
WHERE id = 'ad7ba901-b165-4e13-be2d-65a9d43e9b66';

-- 申請開始（網上報名）：2026-08-12
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-08-11T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  source_url = 'https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf',
  updated_at = now()
WHERE id = 'bcfbd470-5bf3-4068-b295-fdb5427ce2a3';

-- 申請截止（網上報名）：2026-09-27
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-09-26T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  source_url = 'https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf',
  updated_at = now()
WHERE id = '9f0e7e67-70b7-4d34-bfd6-d27cdb680648';

-- 首輪面見：2026-10-24 至 2026-10-25
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-10-23T16:00:00+00:00',
  end_at = '2026-10-25T16:00:00+00:00',
  all_day = true,
  source_url = 'https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf',
  updated_at = now()
WHERE id = '61ab7c25-ffae-4353-bd14-329bcaa5a5d1';

-- 次輪面見：2026-11-07
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-11-06T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  source_url = 'https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf',
  updated_at = now()
WHERE id = '81be1394-118c-4ccf-9614-110d61fa96d2';

-- 結果公佈（次輪面見結果）：2026-11-18
UPDATE school_events SET
  date_status = 'confirmed',
  start_at = '2026-11-17T16:00:00+00:00',
  end_at = NULL,
  all_day = true,
  source_url = 'https://www.ktlsps.edu.hk/wp-content/uploads/2026/09/2027-2028-P1-Admission-Schedule-1.pdf',
  updated_at = now()
WHERE id = '2b942989-b374-469c-94bd-338825e00441';
