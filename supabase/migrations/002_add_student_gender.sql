ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('boy', 'girl'));
