-- 20250922_fix_videos_id_to_text.sql
-- Migration: Change videos.id from UUID to TEXT (YouTube IDs)
-- Also fix user_progress foreign key to match

-- 1. Drop the foreign key constraint on user_progress
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_video_id_fkey;

-- 2. Drop default UUID id from videos (if exists)
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_pkey;

ALTER TABLE videos
ALTER COLUMN id DROP DEFAULT;

-- 3. Change id column type to TEXT
ALTER TABLE videos
ALTER COLUMN id TYPE text USING id::text;

-- 4. Set id as PRIMARY KEY
ALTER TABLE videos
ADD CONSTRAINT videos_pkey PRIMARY KEY (id);

-- 5. Recreate the foreign key from user_progress.video_id → videos.id
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_video_id_fkey
FOREIGN KEY (video_id)
REFERENCES videos(id)
ON DELETE CASCADE;
