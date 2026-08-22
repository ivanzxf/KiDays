-- KiDays：Rolling Admissions（隨到隨審）學校支援
-- 目標：
-- 1) school_cycles 標記「該年度為 Rolling Admissions」
-- 2) 私有覆蓋表支援「沒有學校事件」的自訂行（Rolling 學校的固定四行）
--    —— Rolling 學校不設固定日期，四行（學校申請/一面/二面/結果公佈）的日期由家長自填，
--      只存於此私有表，嚴禁修改 school_events 主資料庫。

-- ---------------------------------------------------------
-- 1. school_cycles：新增 Rolling Admissions 標記
-- ---------------------------------------------------------
ALTER TABLE school_cycles
    ADD COLUMN IF NOT EXISTS is_rolling_admission BOOLEAN DEFAULT FALSE;

-- ---------------------------------------------------------
-- 2. student_application_event_overrides：支援無學校事件的覆蓋行
--    - school_event_id 改為可空：Rolling 學校的固定四行沒有對應的 school_events
--    - title：Rolling 行的識別鍵（「學校申請」「一面」「二面」「結果公佈」）
--    - completed / completed_at：Rolling 行的勾選狀態（一般學校仍用 progress 表，不寫這裡）
-- ---------------------------------------------------------
ALTER TABLE student_application_event_overrides
    ALTER COLUMN school_event_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Rolling 行（school_event_id 為 NULL）以 (student_application_id, title) 唯一
CREATE UNIQUE INDEX IF NOT EXISTS ux_student_application_event_overrides_rolling_title
    ON student_application_event_overrides (student_application_id, title)
    WHERE school_event_id IS NULL;
