-- Fix user_progress to have composite primary key (user_id, course_id, video_id)
-- This ensures proper uniqueness constraints for progress tracking

-- 1. Drop existing primary key if it exists
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_pkey;

-- 2. Drop existing unique constraints that might conflict
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_video_unique;

-- 3. Drop the id column since we're using composite primary key
ALTER TABLE user_progress
DROP COLUMN IF EXISTS id;

-- 4. Ensure course_id column exists and is TEXT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_progress' AND column_name = 'course_id') THEN
    ALTER TABLE user_progress ADD COLUMN course_id TEXT;
  END IF;
END $$;

-- 5. Add composite primary key (user_id, course_id, video_id)
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_pkey
PRIMARY KEY (user_id, course_id, video_id);

-- 6. Add helpful comment
COMMENT ON CONSTRAINT user_progress_pkey ON user_progress 
IS 'Composite primary key ensuring unique progress records per user-course-video combination';
