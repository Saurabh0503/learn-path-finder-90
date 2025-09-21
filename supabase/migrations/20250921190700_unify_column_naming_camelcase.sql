-- Unify column naming to camelCase across videos and quizzes tables
-- This migration ensures consistent naming convention throughout the project

-- =========================================================
-- 1. Update videos table to use camelCase columns
-- =========================================================

-- Check if snake_case columns exist and rename them to camelCase
DO $$
BEGIN
  -- Rename search_term to searchTerm if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'videos' AND column_name = 'search_term'
  ) THEN
    ALTER TABLE videos RENAME COLUMN search_term TO "searchTerm";
    RAISE NOTICE 'Renamed videos.search_term to videos.searchTerm';
  END IF;

  -- Rename learning_goal to learningGoal if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'videos' AND column_name = 'learning_goal'
  ) THEN
    ALTER TABLE videos RENAME COLUMN learning_goal TO "learningGoal";
    RAISE NOTICE 'Renamed videos.learning_goal to videos.learningGoal';
  END IF;
END $$;

-- =========================================================
-- 2. Update quizzes table to use camelCase columns
-- =========================================================

DO $$
BEGIN
  -- Rename search_term to searchTerm if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'search_term'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN search_term TO "searchTerm";
    RAISE NOTICE 'Renamed quizzes.search_term to quizzes.searchTerm';
  END IF;

  -- Rename learning_goal to learningGoal if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'learning_goal'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN learning_goal TO "learningGoal";
    RAISE NOTICE 'Renamed quizzes.learning_goal to quizzes.learningGoal';
  END IF;
END $$;

-- =========================================================
-- 3. Update indexes to use new column names
-- =========================================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_videos_search_goal;
DROP INDEX IF EXISTS idx_quizzes_search_goal;

-- Create new indexes with camelCase column names
CREATE INDEX IF NOT EXISTS idx_videos_search_goal ON videos("searchTerm", "learningGoal");
CREATE INDEX IF NOT EXISTS idx_quizzes_search_goal ON quizzes("searchTerm", "learningGoal");

-- =========================================================
-- 4. Verification and logging
-- =========================================================

DO $$
DECLARE
  videos_searchterm_exists BOOLEAN;
  videos_learninggoal_exists BOOLEAN;
  quizzes_searchterm_exists BOOLEAN;
  quizzes_learninggoal_exists BOOLEAN;
BEGIN
  -- Check if camelCase columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'videos' AND column_name = 'searchTerm'
  ) INTO videos_searchterm_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'videos' AND column_name = 'learningGoal'
  ) INTO videos_learninggoal_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'searchTerm'
  ) INTO quizzes_searchterm_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'learningGoal'
  ) INTO quizzes_learninggoal_exists;

  RAISE NOTICE '=== Column Naming Migration Results ===';
  RAISE NOTICE 'videos.searchTerm exists: %', videos_searchterm_exists;
  RAISE NOTICE 'videos.learningGoal exists: %', videos_learninggoal_exists;
  RAISE NOTICE 'quizzes.searchTerm exists: %', quizzes_searchterm_exists;
  RAISE NOTICE 'quizzes.learningGoal exists: %', quizzes_learninggoal_exists;
  
  IF videos_searchterm_exists AND videos_learninggoal_exists AND 
     quizzes_searchterm_exists AND quizzes_learninggoal_exists THEN
    RAISE NOTICE '✅ SUCCESS: All columns successfully renamed to camelCase!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some columns may not have been renamed. Check manually.';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE videos IS 'Stores YouTube videos with camelCase naming: searchTerm, learningGoal';
COMMENT ON TABLE quizzes IS 'Stores quiz questions with camelCase naming: searchTerm, learningGoal';
