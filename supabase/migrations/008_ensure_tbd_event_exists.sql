-- Idempotent: ensure at least one school event exists with date_status = 'tbd'
-- so the dashboard can exercise the "日期待定" UI path in school cards.

DO $$
DECLARE
    target_id UUID;
BEGIN
    -- If any TBD row already exists, do nothing.
    IF EXISTS (SELECT 1 FROM school_events WHERE date_status = 'tbd') THEN
        RETURN;
    END IF;

    -- Prefer a deterministic existing event: a second_interview of the 2027-2028 primary cycle.
    SELECT se.id
    INTO target_id
    FROM school_events se
    JOIN school_cycles sc ON sc.id = se.school_cycle_id
    WHERE se.event_type = 'second_interview'
      AND sc.academic_year = '2027-2028'
      AND sc.application_level = 'primary'
    ORDER BY se.id ASC
    LIMIT 1;

    -- Fallback 1: any interview event on a 2027-2028 primary cycle.
    IF target_id IS NULL THEN
        SELECT se.id
        INTO target_id
        FROM school_events se
        JOIN school_cycles sc ON sc.id = se.school_cycle_id
        WHERE sc.academic_year = '2027-2028'
          AND sc.application_level = 'primary'
        ORDER BY se.event_type = 'second_interview' DESC, se.id ASC
        LIMIT 1;
    END IF;

    -- Fallback 2: pick the very first event in the table.
    IF target_id IS NULL THEN
        SELECT id INTO target_id FROM school_events ORDER BY id ASC LIMIT 1;
    END IF;

    IF target_id IS NOT NULL THEN
        UPDATE school_events
        SET start_at = NULL,
            end_at = NULL,
            date_status = 'tbd',
            notes = COALESCE(notes, 'event') || ' | date pending'
        WHERE id = target_id;
    END IF;
END $$;
