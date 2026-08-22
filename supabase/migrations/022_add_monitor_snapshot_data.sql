-- 快照表新增「上次逐校摘要」欄位：供逐校比對，電郵列出哪間學校的哪個日期變了

ALTER TABLE site_monitor_snapshots
ADD COLUMN IF NOT EXISTS snapshot_data jsonb;
