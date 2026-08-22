-- 允許 school_events.date_status 存放第三態 'na'
-- 'na' 代表「明確不存在該事件」（例如官方寫明不設開放日、本年度沒有二面），
-- 與 'tbd'（事件存在但日期未定）語意不同。
-- 前端單卡需分別顯示：na → N/A（整行灰掉不可勾）、tbd → 日期待定（仍可勾選）。

ALTER TABLE school_events
DROP CONSTRAINT IF EXISTS school_events_date_status_check;

ALTER TABLE school_events
ADD CONSTRAINT school_events_date_status_check
CHECK (date_status = ANY (ARRAY['confirmed'::text, 'tbd'::text, 'na'::text]));
