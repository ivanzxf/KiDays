-- Backfill the application-centric tables from legacy student-school links.
-- Keeps existing data readable while the frontend transitions to
-- student_applications / student_application_progress.

WITH latest_primary_cycles AS (
    SELECT
        sc.id AS school_cycle_id,
        sc.school_id,
        ROW_NUMBER() OVER (
            PARTITION BY sc.school_id
            ORDER BY sc.academic_year DESC, sc.created_at DESC, sc.id DESC
        ) AS row_no
    FROM school_cycles sc
    WHERE sc.application_level = 'primary'
),
legacy_links AS (
    SELECT
        ss.id AS student_school_id,
        ss.student_id,
        ss.school_id,
        COALESCE(ss.created_at, NOW()) AS created_at,
        lpc.school_cycle_id
    FROM student_schools ss
    JOIN latest_primary_cycles lpc
        ON lpc.school_id = ss.school_id
       AND lpc.row_no = 1
),
missing_applications AS (
    SELECT
        ll.student_id,
        ll.school_cycle_id,
        ROW_NUMBER() OVER (
            PARTITION BY ll.student_id
            ORDER BY ll.created_at ASC, ll.student_school_id ASC
        ) AS priority_order,
        ll.created_at
    FROM legacy_links ll
    LEFT JOIN student_applications sa
        ON sa.student_id = ll.student_id
       AND sa.school_cycle_id = ll.school_cycle_id
    WHERE sa.id IS NULL
)
INSERT INTO student_applications (
    student_id,
    school_cycle_id,
    status,
    priority_order,
    created_at,
    updated_at
)
SELECT
    ma.student_id,
    ma.school_cycle_id,
    'planned',
    ma.priority_order,
    ma.created_at,
    NOW()
FROM missing_applications ma;

INSERT INTO student_application_progress (
    student_application_id,
    school_event_id,
    status,
    completed_at,
    created_at,
    updated_at
)
SELECT
    sa.id,
    se.id,
    'pending',
    NULL,
    NOW(),
    NOW()
FROM student_applications sa
JOIN school_cycles sc
    ON sc.id = sa.school_cycle_id
JOIN school_events se
    ON se.school_cycle_id = sc.id
LEFT JOIN student_application_progress sap
    ON sap.student_application_id = sa.id
   AND sap.school_event_id = se.id
WHERE sap.id IS NULL;

WITH latest_primary_cycles AS (
    SELECT
        sc.id AS school_cycle_id,
        sc.school_id,
        ROW_NUMBER() OVER (
            PARTITION BY sc.school_id
            ORDER BY sc.academic_year DESC, sc.created_at DESC, sc.id DESC
        ) AS row_no
    FROM school_cycles sc
    WHERE sc.application_level = 'primary'
),
legacy_task_matches AS (
    SELECT
        sa.id AS student_application_id,
        se.id AS school_event_id,
        sst.completed,
        sst.completed_at
    FROM student_schools ss
    JOIN student_school_tasks sst
        ON sst.student_school_id = ss.id
    JOIN school_tasks st
        ON st.id = sst.task_id
    JOIN latest_primary_cycles lpc
        ON lpc.school_id = ss.school_id
       AND lpc.row_no = 1
    JOIN student_applications sa
        ON sa.student_id = ss.student_id
       AND sa.school_cycle_id = lpc.school_cycle_id
    JOIN school_events se
        ON se.school_cycle_id = lpc.school_cycle_id
       AND COALESCE(se.sequence_no, 0) = COALESCE(st.sort_order, 0)
)
UPDATE student_application_progress sap
SET
    status = CASE
        WHEN ltm.completed THEN 'completed'
        ELSE 'pending'
    END,
    completed_at = CASE
        WHEN ltm.completed THEN COALESCE(ltm.completed_at, sap.completed_at, NOW())
        ELSE NULL
    END,
    updated_at = NOW()
FROM legacy_task_matches ltm
WHERE sap.student_application_id = ltm.student_application_id
  AND sap.school_event_id = ltm.school_event_id;
