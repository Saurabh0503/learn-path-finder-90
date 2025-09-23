-- 20250922_seed_videos.sql
-- Migration: Seed videos table with YouTube data and fix foreign key relationships
-- This ensures videos exist before user_progress references them

-- Ensure correct type and key on videos.id
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_pkey;
ALTER TABLE videos
ALTER COLUMN id TYPE TEXT;
ALTER TABLE videos
ADD CONSTRAINT videos_pkey PRIMARY KEY (id);

-- Fix foreign key on user_progress.video_id
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_video_id_fkey;
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_video_id_fkey
FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

-- Seed videos table with known YouTube IDs
INSERT INTO videos (id, title, url, channel, created_at)
VALUES
  ('K5KVEU3aaeQ', 'Python Full Course for Beginners [2025]', 'https://youtube.com/watch?v=K5KVEU3aaeQ', 'Unknown', now()),
  ('ix9cRaBkVe0', 'Python Full Course for free', 'https://youtube.com/watch?v=ix9cRaBkVe0', 'Unknown', now()),
  ('gTqV-h_v8Pw', 'PYTHON 2026 | Tutorial for Beginners', 'https://youtube.com/watch?v=gTqV-h_v8Pw', 'Unknown', now()),
  ('NDVSMlVYxm8', 'Jira for Beginners (FREE COURSE!)', 'https://youtube.com/watch?v=NDVSMlVYxm8', 'Alvin the PM', now()),
  ('voLJ3CmaM1s', 'Learn JavaScript in 60 Minutes: The Ultimate Beginner Course!', 'https://youtube.com/watch?v=voLJ3CmaM1s', 'Unknown', now())
ON CONFLICT (id) DO NOTHING;
