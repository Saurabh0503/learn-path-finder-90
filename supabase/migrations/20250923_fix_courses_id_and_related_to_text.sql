-- Fix courses.id and related FKs to TEXT

-- 1. Drop foreign keys
ALTER TABLE course_videos
DROP CONSTRAINT IF EXISTS course_videos_course_id_fkey;

ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;

ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_course_id_fkey;

-- 2. Drop primary key
ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_pkey;

-- 3. Convert courses.id uuid → text
ALTER TABLE courses
ALTER COLUMN id TYPE TEXT
USING id::text;

-- 4. Convert referencing columns to text
ALTER TABLE course_videos
ALTER COLUMN course_id TYPE TEXT
USING course_id::text;

ALTER TABLE enrollments
ALTER COLUMN course_id TYPE TEXT
USING course_id::text;

ALTER TABLE user_progress
ALTER COLUMN course_id TYPE TEXT
USING course_id::text;

-- 5. Re-add primary key
ALTER TABLE courses
ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

-- 6. Re-add foreign keys
ALTER TABLE course_videos
ADD CONSTRAINT course_videos_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses (id)
ON DELETE CASCADE;

ALTER TABLE enrollments
ADD CONSTRAINT enrollments_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses (id)
ON DELETE CASCADE;

ALTER TABLE user_progress
ADD CONSTRAINT user_progress_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses (id)
ON DELETE CASCADE;
