-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (this will be managed by Supabase Auth, but we can have a profile table)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    application_type TEXT NOT NULL CHECK (application_type IN ('kindergarten', 'primary')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_zh TEXT NOT NULL,
    name_en TEXT,
    type TEXT NOT NULL CHECK (type IN ('kindergarten', 'primary')),
    district TEXT,
    gender TEXT CHECK (gender IN ('coed', 'boys', 'girls')),
    school_net TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create school_tasks table
CREATE TABLE IF NOT EXISTS school_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_schools table (junction table for student-school relationships)
CREATE TABLE IF NOT EXISTS student_schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, school_id)
);

-- Create student_school_tasks table (tracks task completion for each student-school pair)
CREATE TABLE IF NOT EXISTS student_school_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_school_id UUID REFERENCES student_schools(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES school_tasks(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_school_id, task_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('kindergarten', 'primary')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_school_tasks_school_id ON school_tasks(school_id);
CREATE INDEX IF NOT EXISTS idx_student_schools_student_id ON student_schools(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schools_school_id ON student_schools(school_id);
CREATE INDEX IF NOT EXISTS idx_student_school_tasks_student_school_id ON student_school_tasks(student_school_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_school_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY "Users can view their own students"
    ON students
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
    ON students
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
    ON students
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
    ON students
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for schools (public read access)
CREATE POLICY "Everyone can view schools"
    ON schools
    FOR SELECT
    USING (true);

-- RLS Policies for school_tasks (public read access)
CREATE POLICY "Everyone can view school tasks"
    ON school_tasks
    FOR SELECT
    USING (true);

-- RLS Policies for student_schools
CREATE POLICY "Users can view their own student schools"
    ON student_schools
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_schools.student_id
        AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own student schools"
    ON student_schools
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_schools.student_id
        AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own student schools"
    ON student_schools
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_schools.student_id
        AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own student schools"
    ON student_schools
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_schools.student_id
        AND students.user_id = auth.uid()
    ));

-- RLS Policies for student_school_tasks
CREATE POLICY "Users can view their own student school tasks"
    ON student_school_tasks
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_schools
        JOIN students ON students.id = student_schools.student_id
        WHERE student_schools.id = student_school_tasks.student_school_id
        AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own student school tasks"
    ON student_school_tasks
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM student_schools
        JOIN students ON students.id = student_schools.student_id
        WHERE student_schools.id = student_school_tasks.student_school_id
        AND students.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own student school tasks"
    ON student_school_tasks
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM student_schools
        JOIN students ON students.id = student_schools.student_id
        WHERE student_schools.id = student_school_tasks.student_school_id
        AND students.user_id = auth.uid()
    ));

-- RLS Policies for events (public read access)
CREATE POLICY "Everyone can view events"
    ON events
    FOR SELECT
    USING (true);
