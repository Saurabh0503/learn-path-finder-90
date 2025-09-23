-- 20250923_fix_courses_id_to_text.sql
-- Migration: Change courses.id from UUID to TEXT (course slugs)
-- Also fix user_progress foreign key to match

-- 1. Drop the foreign key constraint on user_progress.course_id
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_course_id_fkey;

-- 2. Drop default UUID id from courses (if exists)
ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_pkey;

ALTER TABLE courses
ALTER COLUMN id DROP DEFAULT;

-- 3. Change id column type to TEXT
ALTER TABLE courses
ALTER COLUMN id TYPE text USING id::text;

-- 4. Set id as PRIMARY KEY
ALTER TABLE courses
ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

-- 5. Recreate the foreign key from user_progress.course_id → courses.id
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;
