-- Remove kindergarten dummy data and keep current demo focused on primary-school admissions only.

DELETE FROM schools
WHERE id IN (
  '00000000-0000-0000-0000-000000000111',
  '00000000-0000-0000-0000-000000000112',
  '00000000-0000-0000-0000-000000000113'
);
