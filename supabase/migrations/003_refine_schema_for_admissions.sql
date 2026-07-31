-- KiDays 数据库结构扩展：面向正式招生流程
-- 设计稿参考：supabase/schema_design_20260729.md
-- 目标：
-- 1) 扩展现有 user_profiles / students / schools 字段
-- 2) 新增 school_cycles（学校招生年度）
-- 3) 新增 school_events（申请周期关键日期事件）
-- 4) 新增 student_applications（学生对某学校某年度的申请）
-- 5) 新增 student_application_progress（学生对每个事件节点的进度）
-- 6) 补齐必要的 RLS 与索引

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. user_profiles：扩展用户基本资料字段
-- ---------------------------------------------------------
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS preferred_language TEXT;

-- ---------------------------------------------------------
-- 2. students：扩展学生资料，并补 gender 枚举一致性
-- ---------------------------------------------------------
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'students_gender_check'
    ) THEN
        ALTER TABLE students
            ADD CONSTRAINT students_gender_check
            CHECK (gender = ANY (ARRAY['boy'::text, 'girl'::text]));
    END IF;
END $$;

-- 现有的 application_type 语义对齐 application_level（兼容先不改名）
-- 如后续统一重命名，再单独写 migration。

-- ---------------------------------------------------------
-- 3. schools：扩展学校固定资料
-- ---------------------------------------------------------
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS address_zh TEXT,
    ADD COLUMN IF NOT EXISTS address_en TEXT,
    ADD COLUMN IF NOT EXISTS school_type TEXT
        CHECK (school_type = ANY (ARRAY['government'::text, 'aided'::text, 'direct_subsidy'::text, 'private'::text, 'international'::text, 'special'::text])),
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 语义对齐：保留原 gender / type 列，增加可选同名列供新逻辑使用
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS gender_policy TEXT
        CHECK (gender_policy = ANY (ARRAY['coed'::text, 'boys'::text, 'girls'::text])),
    ADD COLUMN IF NOT EXISTS application_level TEXT
        CHECK (application_level = ANY (ARRAY['kindergarten'::text, 'primary'::text]));

-- ---------------------------------------------------------
-- 4. school_cycles：学校某一年的申请周期
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_cycles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    academic_year TEXT NOT NULL,
    application_level TEXT CHECK (application_level = ANY (ARRAY['kindergarten'::text, 'primary'::text])),
    status TEXT DEFAULT 'draft'
        CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, academic_year, application_level)
);

-- ---------------------------------------------------------
-- 5. school_events：申请周期中的关键日期事件
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_cycle_id UUID REFERENCES school_cycles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL
        CHECK (event_type = ANY (ARRAY[
            'open_day'::text,
            'info_session'::text,
            'application_open'::text,
            'application_deadline'::text,
            'assessment'::text,
            'first_interview'::text,
            'second_interview'::text,
            'third_interview'::text,
            'result_release'::text,
            'registration'::text,
            'parent_meeting'::text,
            'waiting_list'::text,
            'other'::text
        ])),
    sequence_no INTEGER,
    title_zh TEXT,
    title_en TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT TRUE,
    location TEXT,
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 6. student_applications：某学生申请某学校的某一年度
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    school_cycle_id UUID REFERENCES school_cycles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL
        CHECK (status = ANY (ARRAY[
            'planned'::text,
            'interested'::text,
            'applied'::text,
            'interviewing'::text,
            'waitlisted'::text,
            'offered'::text,
            'rejected'::text,
            'accepted'::text,
            'declined'::text
        ])),
    priority_order INTEGER,
    applied_at TIMESTAMPTZ,
    result_at TIMESTAMPTZ,
    is_shortlisted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, school_cycle_id)
);

-- ---------------------------------------------------------
-- 7. student_application_progress：每个申请事件节点的进度
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_application_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_application_id UUID REFERENCES student_applications(id) ON DELETE CASCADE NOT NULL,
    school_event_id UUID REFERENCES school_events(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL
        CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'skipped'::text])),
    completed_at TIMESTAMPTZ,
    reminder_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_application_id, school_event_id)
);

-- ---------------------------------------------------------
-- 8. 索引
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_school_cycles_school_id ON school_cycles(school_id);
CREATE INDEX IF NOT EXISTS idx_school_cycles_academic_year ON school_cycles(academic_year);
CREATE INDEX IF NOT EXISTS idx_school_cycles_application_level ON school_cycles(application_level);

CREATE INDEX IF NOT EXISTS idx_school_events_school_cycle_id ON school_events(school_cycle_id);
CREATE INDEX IF NOT EXISTS idx_school_events_start_at ON school_events(start_at);
CREATE INDEX IF NOT EXISTS idx_school_events_event_type ON school_events(event_type);

CREATE INDEX IF NOT EXISTS idx_student_applications_student_id ON student_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_school_cycle_id ON student_applications(school_cycle_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_status ON student_applications(status);

CREATE INDEX IF NOT EXISTS idx_student_application_progress_application_id ON student_application_progress(student_application_id);
CREATE INDEX IF NOT EXISTS idx_student_application_progress_event_id ON student_application_progress(school_event_id);

CREATE INDEX IF NOT EXISTS idx_schools_application_level ON schools(application_level);
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district);
CREATE INDEX IF NOT EXISTS idx_schools_school_type ON schools(school_type);

-- ---------------------------------------------------------
-- 9. RLS：确保默认都启用
-- ---------------------------------------------------------
ALTER TABLE school_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_application_progress ENABLE ROW LEVEL SECURITY;

-- 学校主资料与年度周期、关键事件：前台一律可读，写入建议由后台或服务角色处理
CREATE POLICY "Everyone can view school cycles"
    ON school_cycles
    FOR SELECT
    USING (true);

CREATE POLICY "Everyone can view school events"
    ON school_events
    FOR SELECT
    USING (true);

-- student_applications：所属学生的用户可读写
CREATE POLICY "Users can view their own student applications"
    ON student_applications
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_applications.student_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own student applications"
    ON student_applications
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_applications.student_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own student applications"
    ON student_applications
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_applications.student_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own student applications"
    ON student_applications
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_applications.student_id
          AND students.user_id = auth.uid()
    ));

-- student_application_progress：所属用户读写
CREATE POLICY "Users can view their own application progress"
    ON student_application_progress
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_progress.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own application progress"
    ON student_application_progress
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_progress.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own application progress"
    ON student_application_progress
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_progress.student_application_id
          AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own application progress"
    ON student_application_progress
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM student_applications
        JOIN students ON students.id = student_applications.student_id
        WHERE student_applications.id = student_application_progress.student_application_id
          AND students.user_id = auth.uid()
    ));
