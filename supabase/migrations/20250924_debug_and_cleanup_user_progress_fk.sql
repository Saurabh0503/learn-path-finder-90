-- Debug and cleanup user_progress foreign key issues
-- This migration helps identify and fix invalid course_id references

-- 1. Find invalid rows in user_progress that point to non-existent courses
-- Run this first to see what data needs cleaning
SELECT 
  up.id,
  up.user_id,
  up.course_id,
  up.video_id,
  up.completed,
  up.created_at,
  'INVALID: course_id does not exist in courses table' as issue
FROM user_progress up
LEFT JOIN courses c ON up.course_id = c.id
WHERE c.id IS NULL;

-- 2. Count invalid rows for reporting
SELECT 
  COUNT(*) as invalid_rows_count,
  'user_progress rows with invalid course_id' as description
FROM user_progress up
LEFT JOIN courses c ON up.course_id = c.id
WHERE c.id IS NULL;

-- 3. Show distinct invalid course_ids to understand the pattern
SELECT 
  DISTINCT up.course_id,
  COUNT(*) as occurrence_count
FROM user_progress up
LEFT JOIN courses c ON up.course_id = c.id
WHERE c.id IS NULL
GROUP BY up.course_id
ORDER BY occurrence_count DESC;

-- 4. Clean up invalid rows (UNCOMMENT TO EXECUTE)
-- WARNING: This will delete data! Make sure to backup first
/*
DELETE FROM user_progress 
WHERE id IN (
  SELECT up.id
  FROM user_progress up
  LEFT JOIN courses c ON up.course_id = c.id
  WHERE c.id IS NULL
);
*/

-- 5. Optional: Create missing courses for common patterns
-- If you find that some course_ids follow a pattern and should exist
-- Example: Create courses for topic-goal patterns
/*
INSERT INTO courses (id, title, description, created_at)
SELECT DISTINCT 
  up.course_id,
  CASE 
    WHEN up.course_id LIKE '%-%' THEN 
      REPLACE(REPLACE(up.course_id, '-', ' - '), '_', ' ')
    ELSE up.course_id
  END as title,
  'Auto-generated course from user progress data' as description,
  NOW() as created_at
FROM user_progress up
LEFT JOIN courses c ON up.course_id = c.id
WHERE c.id IS NULL
  AND up.course_id IS NOT NULL
  AND up.course_id != ''
ON CONFLICT (id) DO NOTHING;
*/

-- 6. Verify cleanup - this should return 0 rows after cleanup
SELECT 
  COUNT(*) as remaining_invalid_rows
FROM user_progress up
LEFT JOIN courses c ON up.course_id = c.id
WHERE c.id IS NULL;
