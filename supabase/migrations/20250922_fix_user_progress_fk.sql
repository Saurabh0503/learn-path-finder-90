-- Fix user_progress foreign key constraint and primary key
-- This migration resolves 409 conflict errors when marking videos as completed

-- 1. Drop the broken foreign key constraint on user_progress.video_id
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_video_id_fkey;

-- 2. Add the correct foreign key so user_progress.video_id references videos(id)
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_video_id_fkey
FOREIGN KEY (video_id)
REFERENCES videos (id)
ON DELETE CASCADE;

-- 3. Ensure user_progress has a composite primary key on (user_id, video_id)
-- First drop existing primary key if it exists
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_pkey;

-- Add the composite primary key
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_pkey
PRIMARY KEY (user_id, video_id);

-- Add helpful comment
COMMENT ON CONSTRAINT user_progress_video_id_fkey ON user_progress 
IS 'Foreign key constraint ensuring video_id references valid videos table entries';

COMMENT ON CONSTRAINT user_progress_pkey ON user_progress 
IS 'Composite primary key ensuring unique progress records per user-video combination';
