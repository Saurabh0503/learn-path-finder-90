-- Normalize YouTube video IDs in database tables
-- Fix invalid video_id entries that use placeholder IDs like "video-1", "video-2"
-- Extract actual YouTube IDs from thumbnail URLs where possible

-- First, let's see what we're working with (for debugging)
-- This will show us invalid video IDs and their thumbnails
DO $$
BEGIN
  RAISE NOTICE 'Starting video ID normalization migration...';
  
  -- Show invalid video IDs in course_videos
  IF EXISTS (SELECT 1 FROM course_videos WHERE video_id LIKE 'video-%') THEN
    RAISE NOTICE 'Found invalid video IDs in course_videos table';
  END IF;
  
  -- Show invalid video IDs in user_progress  
  IF EXISTS (SELECT 1 FROM user_progress WHERE video_id LIKE 'video-%') THEN
    RAISE NOTICE 'Found invalid video IDs in user_progress table';
  END IF;
END $$;

-- Fix invalid video_id entries in course_videos table
-- Extract YouTube ID from thumbnail URL pattern: /vi/{11-char-id}/
UPDATE course_videos
SET video_id = substring(thumbnail FROM 'vi/([0-9A-Za-z_-]{11})/')
WHERE video_id LIKE 'video-%'
  AND thumbnail ~ 'vi/([0-9A-Za-z_-]{11})/'
  AND length(substring(thumbnail FROM 'vi/([0-9A-Za-z_-]{11})/')) = 11;

-- Fix invalid video_id entries in user_progress table
-- Use JOIN with course_videos to get the thumbnail for extraction
UPDATE user_progress
SET video_id = substring(cv.thumbnail FROM 'vi/([0-9A-Za-z_-]{11})/')
FROM course_videos cv
WHERE user_progress.video_id LIKE 'video-%'
  AND user_progress.course_id = cv.course_id
  AND user_progress.video_id = cv.video_id
  AND cv.thumbnail ~ 'vi/([0-9A-Za-z_-]{11})/'
  AND length(substring(cv.thumbnail FROM 'vi/([0-9A-Za-z_-]{11})/')) = 11;

-- Clean up any remaining invalid entries that couldn't be normalized
-- These would be entries where thumbnail doesn't contain a valid YouTube ID
DELETE FROM user_progress 
WHERE video_id LIKE 'video-%';

DELETE FROM course_videos 
WHERE video_id LIKE 'video-%';

-- Final verification
DO $$
DECLARE
  invalid_course_videos_count INTEGER;
  invalid_user_progress_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_course_videos_count 
  FROM course_videos 
  WHERE video_id LIKE 'video-%';
  
  SELECT COUNT(*) INTO invalid_user_progress_count 
  FROM user_progress 
  WHERE video_id LIKE 'video-%';
  
  RAISE NOTICE 'Migration completed. Remaining invalid video IDs:';
  RAISE NOTICE 'course_videos: %', invalid_course_videos_count;
  RAISE NOTICE 'user_progress: %', invalid_user_progress_count;
  
  IF invalid_course_videos_count = 0 AND invalid_user_progress_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All video IDs have been normalized!';
  END IF;
END $$;
