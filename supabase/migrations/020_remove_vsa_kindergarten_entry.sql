-- 移除滬江維多利亞學校(小學部) 誤建的 kindergarten（Prep Year）入口
-- 依據：VSA 官網 admissions 僅設 Year 1 與 Year 2-11 兩個入口，無幼稚園部（Prep Year）
-- 清除該 kindergarten cycle 及其 events、以及測試期的 student_application 關聯資料

-- 1. 刪除該入口的進度勾選
DELETE FROM student_application_progress sap
WHERE sap.student_application_id IN (
    SELECT sa.id
    FROM student_applications sa
    JOIN school_cycles sc ON sc.id = sa.school_cycle_id
    JOIN schools s ON s.id = sc.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'kindergarten'
);

-- 2. 刪除該入口的日期覆蓋
DELETE FROM student_application_event_overrides saeo
WHERE saeo.student_application_id IN (
    SELECT sa.id
    FROM student_applications sa
    JOIN school_cycles sc ON sc.id = sa.school_cycle_id
    JOIN schools s ON s.id = sc.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'kindergarten'
);

-- 3. 刪除該入口的自訂事件
DELETE FROM student_application_custom_events sace
WHERE sace.student_application_id IN (
    SELECT sa.id
    FROM student_applications sa
    JOIN school_cycles sc ON sc.id = sa.school_cycle_id
    JOIN schools s ON s.id = sc.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'kindergarten'
);

-- 4. 刪除該入口的學生申請
DELETE FROM student_applications sa
WHERE sa.school_cycle_id IN (
    SELECT sc.id
    FROM school_cycles sc
    JOIN schools s ON s.id = sc.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'kindergarten'
);

-- 5. 刪除該 cycle 的事件
DELETE FROM school_events se
WHERE se.school_cycle_id IN (
    SELECT sc.id
    FROM school_cycles sc
    JOIN schools s ON s.id = sc.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'kindergarten'
);

-- 6. 刪除該 cycle
DELETE FROM school_cycles sc
WHERE sc.id IN (
    SELECT c.id
    FROM school_cycles c
    JOIN schools s ON s.id = c.school_id
    WHERE s.name_zh = '滬江維多利亞學校(小學部)'
      AND c.academic_year = '2027-2028'
      AND c.application_level = 'kindergarten'
);
