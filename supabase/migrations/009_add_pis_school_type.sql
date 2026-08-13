-- Allow Private Independent Schools as a first-class school_type.

ALTER TABLE schools
    DROP CONSTRAINT IF EXISTS schools_school_type_check;

ALTER TABLE schools
    ADD CONSTRAINT schools_school_type_check
    CHECK (school_type = ANY (ARRAY[
        'government'::text,
        'aided'::text,
        'direct_subsidy'::text,
        'private'::text,
        'pis'::text,
        'international'::text,
        'special'::text
    ]));
