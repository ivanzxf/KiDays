-- KiDays：兩位家長共享同一份學生檔案
-- 方案：students 新增 co_parent_id（第二位家長），並改寫 RLS 讓兩位家長都能讀寫該學生的所有資料。
-- 綁定：擁有者產生 8 位數字驗證碼（1 分鐘有效），另一位家長在自己的帳號輸入驗證碼即可連結。
-- 驗證碼只透過 SECURITY DEFINER 函式存取，資料表本身不開放任何 direct policy。

-- ---------------------------------------------------------
-- 1. students：新增第二位家長欄位
-- ---------------------------------------------------------
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS co_parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_co_parent_id ON students(co_parent_id);

-- ---------------------------------------------------------
-- 2. 存取判斷 helper（SECURITY DEFINER 繞過 RLS，避免 policy 遞迴）
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = target_student_id
          AND (s.user_id = auth.uid() OR s.co_parent_id = auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_application(target_application_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.can_access_student(a.student_id)
    FROM student_applications a
    WHERE a.id = target_application_id;
$$;

-- ---------------------------------------------------------
-- 3. students：改寫 RLS（擁有者或共同家長）
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own students" ON students;
CREATE POLICY "Users can view their own students"
    ON students
    FOR SELECT
    USING (user_id = auth.uid() OR co_parent_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own students" ON students;
CREATE POLICY "Users can insert their own students"
    ON students
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own students" ON students;
CREATE POLICY "Users can update their own students"
    ON students
    FOR UPDATE
    USING (user_id = auth.uid() OR co_parent_id = auth.uid())
    WITH CHECK (user_id = auth.uid() OR co_parent_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own students" ON students;
CREATE POLICY "Users can delete their own students"
    ON students
    FOR DELETE
    USING (user_id = auth.uid() OR co_parent_id = auth.uid());

-- ---------------------------------------------------------
-- 4. student_applications：改寫 RLS
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own student applications" ON student_applications;
CREATE POLICY "Users can view their own student applications"
    ON student_applications
    FOR SELECT
    USING (public.can_access_student(student_id));

DROP POLICY IF EXISTS "Users can insert their own student applications" ON student_applications;
CREATE POLICY "Users can insert their own student applications"
    ON student_applications
    FOR INSERT
    WITH CHECK (public.can_access_student(student_id));

DROP POLICY IF EXISTS "Users can update their own student applications" ON student_applications;
CREATE POLICY "Users can update their own student applications"
    ON student_applications
    FOR UPDATE
    USING (public.can_access_student(student_id))
    WITH CHECK (public.can_access_student(student_id));

DROP POLICY IF EXISTS "Users can delete their own student applications" ON student_applications;
CREATE POLICY "Users can delete their own student applications"
    ON student_applications
    FOR DELETE
    USING (public.can_access_student(student_id));

-- ---------------------------------------------------------
-- 5. student_application_progress：改寫 RLS
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own application progress" ON student_application_progress;
CREATE POLICY "Users can view their own application progress"
    ON student_application_progress
    FOR SELECT
    USING (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can insert their own application progress" ON student_application_progress;
CREATE POLICY "Users can insert their own application progress"
    ON student_application_progress
    FOR INSERT
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can update their own application progress" ON student_application_progress;
CREATE POLICY "Users can update their own application progress"
    ON student_application_progress
    FOR UPDATE
    USING (public.can_access_application(student_application_id))
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can delete their own application progress" ON student_application_progress;
CREATE POLICY "Users can delete their own application progress"
    ON student_application_progress
    FOR DELETE
    USING (public.can_access_application(student_application_id));

-- ---------------------------------------------------------
-- 6. student_application_event_overrides：改寫 RLS
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own event date overrides" ON student_application_event_overrides;
CREATE POLICY "Users can view their own event date overrides"
    ON student_application_event_overrides
    FOR SELECT
    USING (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can insert their own event date overrides" ON student_application_event_overrides;
CREATE POLICY "Users can insert their own event date overrides"
    ON student_application_event_overrides
    FOR INSERT
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can update their own event date overrides" ON student_application_event_overrides;
CREATE POLICY "Users can update their own event date overrides"
    ON student_application_event_overrides
    FOR UPDATE
    USING (public.can_access_application(student_application_id))
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can delete their own event date overrides" ON student_application_event_overrides;
CREATE POLICY "Users can delete their own event date overrides"
    ON student_application_event_overrides
    FOR DELETE
    USING (public.can_access_application(student_application_id));

-- ---------------------------------------------------------
-- 7. student_application_custom_events：改寫 RLS
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own custom events" ON student_application_custom_events;
CREATE POLICY "Users can view their own custom events"
    ON student_application_custom_events
    FOR SELECT
    USING (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can insert their own custom events" ON student_application_custom_events;
CREATE POLICY "Users can insert their own custom events"
    ON student_application_custom_events
    FOR INSERT
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can update their own custom events" ON student_application_custom_events;
CREATE POLICY "Users can update their own custom events"
    ON student_application_custom_events
    FOR UPDATE
    USING (public.can_access_application(student_application_id))
    WITH CHECK (public.can_access_application(student_application_id));

DROP POLICY IF EXISTS "Users can delete their own custom events" ON student_application_custom_events;
CREATE POLICY "Users can delete their own custom events"
    ON student_application_custom_events
    FOR DELETE
    USING (public.can_access_application(student_application_id));

-- ---------------------------------------------------------
-- 8. student_share_codes：共享驗證碼（8 位數字、1 分鐘有效）
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_share_codes (
    code TEXT PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_share_codes_student_id
    ON student_share_codes(student_id);

-- 只經 SECURITY DEFINER 函式存取，不開放任何 direct policy
ALTER TABLE student_share_codes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- 9. create_share_code：擁有者產生 8 位數字驗證碼
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_share_code(p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code TEXT;
    v_attempt INTEGER := 0;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM students
        WHERE id = p_student_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'not_student_owner';
    END IF;

    IF EXISTS (
        SELECT 1 FROM students
        WHERE id = p_student_id AND co_parent_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'student_already_shared';
    END IF;

    -- 每次產生新碼時清掉該學生先前未用的舊碼
    DELETE FROM student_share_codes
    WHERE student_id = p_student_id AND used_at IS NULL;

    LOOP
        v_attempt := v_attempt + 1;
        v_code := lpad((floor(random() * 100000000))::bigint::text, 8, '0');

        BEGIN
            INSERT INTO student_share_codes (code, student_id, created_by, expires_at)
            VALUES (v_code, p_student_id, auth.uid(), now() + interval '1 minute');
            RETURN v_code;
        EXCEPTION WHEN unique_violation THEN
            IF v_attempt >= 10 THEN
                RAISE EXCEPTION 'code_generation_failed';
            END IF;
        END;
    END LOOP;
END;
$$;

-- ---------------------------------------------------------
-- 10. redeem_share_code：另一位家長輸入驗證碼後連結
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_share_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row student_share_codes%ROWTYPE;
    v_owner UUID;
    v_co_parent UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;

    SELECT * INTO v_row
    FROM student_share_codes
    WHERE code = btrim(p_code)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_code';
    END IF;

    IF v_row.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'code_used';
    END IF;

    IF v_row.expires_at <= now() THEN
        RAISE EXCEPTION 'code_expired';
    END IF;

    SELECT user_id, co_parent_id INTO v_owner, v_co_parent
    FROM students
    WHERE id = v_row.student_id;

    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'invalid_code';
    END IF;

    IF v_owner = auth.uid() THEN
        RAISE EXCEPTION 'already_owner';
    END IF;

    IF v_co_parent IS NOT NULL AND v_co_parent <> auth.uid() THEN
        RAISE EXCEPTION 'student_already_shared';
    END IF;

    -- students.co_parent_id 有指向 user_profiles 的 FK，確保欄位存在
    INSERT INTO user_profiles (id) VALUES (auth.uid())
    ON CONFLICT (id) DO NOTHING;

    UPDATE students
    SET co_parent_id = auth.uid(), updated_at = now()
    WHERE id = v_row.student_id;

    UPDATE student_share_codes
    SET used_at = now(), redeemed_by = auth.uid()
    WHERE code = v_row.code;

    RETURN v_row.student_id;
END;
$$;

-- ---------------------------------------------------------
-- 11. 權限：只開放 authenticated 呼叫
-- ---------------------------------------------------------
REVOKE ALL ON FUNCTION public.can_access_student(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_application(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_share_code(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_share_code(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_access_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_share_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_share_code(TEXT) TO authenticated;
