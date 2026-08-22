-- KiDays：家長私有「自訂日期」覆蓋表
-- 目的：一面／二面等事件的日期，允許家長在自己的學生檔案中自訂，
--      只存在於此私有表，嚴禁修改 school_events 主資料庫。
-- 顯示優先權：家長私有覆蓋 > 學校公開資訊 > TBD / N/A

-- ---------------------------------------------------------
-- 1. student_application_event_overrides：某申請的某事件的自訂日期
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_application_event_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_application_id UUID REFERENCES student_applications(id) ON DELETE CASCADE NOT NULL,
    school_event_id UUID REFERENCES school_events(id) ON DELETE CASCADE NOT NULL,
    start_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_application_id, school_event_id)
);

-- ---------------------------------------------------------
-- 2. 索引
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_student_application_event_overrides_application_id
    ON student_application_event_overrides(student_application_id);
CREATE INDEX IF NOT EXISTS idx_student_application_event_overrides_event_id
    ON student_application_event_overrides(school_event_id);

-- ---------------------------------------------------------
-- 3. RLS：所屬使用者可讀寫（與 student_application_progress 同規則）
-- ---------------------------------------------------------
ALTER TABLE student_application_event_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event date overrides"
    ON student_application_event_overrides
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_event_overrides.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own event date overrides"
    ON student_application_event_overrides
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_event_overrides.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own event date overrides"
    ON student_application_event_overrides
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_event_overrides.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own event date overrides"
    ON student_application_event_overrides
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_event_overrides.student_application_id
          AND students.user_id = auth.uid()
    ));
