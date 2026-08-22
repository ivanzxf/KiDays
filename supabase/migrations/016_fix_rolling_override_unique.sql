-- KiDays：修正 Rolling 覆蓋行的唯一鍵
-- 原因：PostgREST 的 onConflict 無法使用 partial unique index，
--       需改為真正的 UNIQUE 約束才能命中。
-- 方式：(student_application_id, title) 唯一
--       - 一般學校的覆蓋行（school_event_id 有值）：title 為 NULL → NULL 互不相等，不受約束影響
--       - Rolling 學校的固定行（school_event_id 為 NULL）：title 為「學校參觀/學校申請/一面/二面/結果公佈」→ 受約束
-- 原先的 partial index 一併刪除。

DROP INDEX IF EXISTS ux_student_application_event_overrides_rolling_title;

ALTER TABLE student_application_event_overrides
    ADD CONSTRAINT ux_student_application_event_overrides_rolling_title
    UNIQUE (student_application_id, title);
