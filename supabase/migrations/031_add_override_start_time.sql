-- KiDays：家長自訂一面／二面的「具體時間」
-- 目的：學校只公佈日期區間（如 9月23-25日），家長得知名確面試時間後可自填「日期＋時間」。
--      start_at 仍是 DATE（排序用），新增 start_time 存 24 小時制時間（如 10:45），
--      只存在於家長私有覆蓋表，嚴禁修改 school_events 主資料庫。

ALTER TABLE student_application_event_overrides
    ADD COLUMN IF NOT EXISTS start_time TIME;
