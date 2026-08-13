-- Remove old dummy primary-school seed data so the remote dataset matches current CSV imports.

DELETE FROM schools
WHERE name_zh IN (
    '港島直資第一小學',
    '九龍男拔資助小學',
    '新界國際小學',
    '港島官立小學',
    '九龍私立名校小學'
)
AND application_level = 'primary';
