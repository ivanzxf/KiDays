-- Add explicit date status to school events so cards can distinguish confirmed dates from TBD dates.

ALTER TABLE school_events
ADD COLUMN IF NOT EXISTS date_status TEXT
    CHECK (date_status = ANY (ARRAY['confirmed'::text, 'tbd'::text]))
    DEFAULT 'confirmed';

UPDATE school_events
SET date_status = CASE
    WHEN start_at IS NULL THEN 'tbd'
    ELSE 'confirmed'
END
WHERE date_status IS NULL
   OR date_status NOT IN ('confirmed', 'tbd');

-- Keep one dummy event as TBD so the UI can exercise the pending-date state.
UPDATE school_events
SET start_at = NULL,
    end_at = NULL,
    date_status = 'tbd',
    notes = COALESCE(notes, 'dummy event') || ' | date pending'
WHERE id = '00000000-0000-0000-0000-000000000331';
