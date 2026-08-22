-- KiDays：家長新增的「自訂事件」
-- 目的：家長可在自己的學生檔案中新增額外事件（如三面、簡介會第二場等），
--      只存在於此私有表，嚴禁修改 school_events 主資料庫。
-- 顯示：按日期插入單卡的標準 6 行之間，可勾選。

-- ---------------------------------------------------------
-- 1. student_application_custom_events：某申請下的自訂事件
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_application_custom_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_application_id UUID REFERENCES student_applications(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_at DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. 索引
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_student_application_custom_events_application_id
    ON student_application_custom_events(student_application_id);
CREATE INDEX IF NOT EXISTS idx_student_application_custom_events_start_at
    ON student_application_custom_events(start_at);

-- ---------------------------------------------------------
-- 3. RLS：所屬使用者可讀寫（與 student_application_progress 同規則）
-- ---------------------------------------------------------
ALTER TABLE student_application_custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom events"
    ON student_application_custom_events
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_custom_events.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own custom events"
    ON student_application_custom_events
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_custom_events.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own custom events"
    ON student_application_custom_events
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_custom_events.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own custom events"
    ON student_application_custom_events
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_custom_events.student_application_id
          AND students.user_id = auth.uid()
    ));
