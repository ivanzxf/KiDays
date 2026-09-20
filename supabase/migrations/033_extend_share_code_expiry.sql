-- KiDays：家長共享驗證碼有效期由 1 分鐘延長為 5 分鐘
-- 覆寫 create_share_code，其餘邏輯與 032 相同。

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
            VALUES (v_code, p_student_id, auth.uid(), now() + interval '5 minutes');
            RETURN v_code;
        EXCEPTION WHEN unique_violation THEN
            IF v_attempt >= 10 THEN
                RAISE EXCEPTION 'code_generation_failed';
            END IF;
        END;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_share_code(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_share_code(UUID) TO authenticated;
