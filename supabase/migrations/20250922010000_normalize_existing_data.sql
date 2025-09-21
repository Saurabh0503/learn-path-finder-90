-- Retroactive Normalization Migration
-- This migration normalizes existing data and adds constraints to ensure future data consistency

-- =========================================================
-- 1. Create normalization function in PostgreSQL
-- =========================================================

CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  -- Step 1: Trim and lowercase
  input_text := LOWER(TRIM(input_text));
  
  -- Step 2: Replace punctuation with spaces (except # and +)
  input_text := REGEXP_REPLACE(input_text, '[^\w\s#+.-]', ' ', 'g');
  
  -- Step 3: Collapse multiple spaces
  input_text := REGEXP_REPLACE(input_text, '\s+', ' ', 'g');
  input_text := TRIM(input_text);
  
  -- Step 4: Apply common synonyms
  CASE 
    WHEN input_text IN ('javascript', 'js', 'ecmascript') THEN input_text := 'javascript';
    WHEN input_text IN ('node.js', 'nodejs', 'node js') THEN input_text := 'node';
    WHEN input_text IN ('react.js', 'reactjs', 'react js') THEN input_text := 'react';
    WHEN input_text IN ('vue.js', 'vuejs', 'vue js') THEN input_text := 'vue';
    WHEN input_text IN ('angular.js', 'angularjs', 'angular js') THEN input_text := 'angular';
    WHEN input_text IN ('c sharp', 'csharp', 'c-sharp', 'c #') THEN input_text := 'c#';
    WHEN input_text IN ('c plus plus', 'cplusplus', 'c plus', 'c + +') THEN input_text := 'c++';
    WHEN input_text IN ('python3', 'python 3', 'py') THEN input_text := 'python';
    WHEN input_text IN ('typescript', 'ts', 'type script') THEN input_text := 'typescript';
    WHEN input_text IN ('postgresql', 'postgres sql') THEN input_text := 'postgres';
    WHEN input_text IN ('mysql', 'my sql') THEN input_text := 'mysql';
    WHEN input_text IN ('mongodb', 'mongo db') THEN input_text := 'mongo';
    WHEN input_text IN ('next.js', 'next js') THEN input_text := 'nextjs';
    WHEN input_text IN ('nuxt.js', 'nuxt js') THEN input_text := 'nuxtjs';
    WHEN input_text IN ('express.js', 'express js') THEN input_text := 'express';
    -- Learning goal synonyms
    WHEN input_text IN ('basic', 'intro', 'introduction', 'introductory', 'starter', 'fundamentals', 'basics') THEN input_text := 'beginner';
    WHEN input_text IN ('intermediate', 'mid', 'middle', 'moderate') THEN input_text := 'intermediate';
    WHEN input_text IN ('advanced', 'expert', 'professional', 'pro', 'senior', 'master') THEN input_text := 'advanced';
    WHEN input_text IN ('beginner level', 'intermediate level', 'advanced level', 'entry level') THEN 
      input_text := REPLACE(input_text, ' level', '');
    ELSE
      -- No change needed
      NULL;
  END CASE;
  
  RETURN input_text;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 2. Normalize existing data in videos table
-- =========================================================

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting normalization of videos table...';
  
  -- Update videos table with normalized values
  UPDATE videos 
  SET 
    "searchTerm" = normalize_text("searchTerm"),
    "learningGoal" = normalize_text("learningGoal")
  WHERE 
    "searchTerm" IS NOT NULL OR "learningGoal" IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in videos table', updated_count;
END $$;

-- =========================================================
-- 3. Normalize existing data in quizzes table
-- =========================================================

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting normalization of quizzes table...';
  
  -- Update quizzes table with normalized values
  UPDATE quizzes 
  SET 
    "searchTerm" = normalize_text("searchTerm"),
    "learningGoal" = normalize_text("learningGoal")
  WHERE 
    "searchTerm" IS NOT NULL OR "learningGoal" IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in quizzes table', updated_count;
END $$;

-- =========================================================
-- 4. Normalize existing data in requested_topics table
-- =========================================================

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting normalization of requested_topics table...';
  
  -- Update requested_topics table with normalized values
  UPDATE requested_topics 
  SET 
    "searchTerm" = normalize_text("searchTerm"),
    "learningGoal" = normalize_text("learningGoal")
  WHERE 
    "searchTerm" IS NOT NULL OR "learningGoal" IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % rows in requested_topics table', updated_count;
END $$;

-- =========================================================
-- 5. Remove duplicate entries after normalization
-- =========================================================

-- Remove duplicate videos (keep the most recent)
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Removing duplicate videos...';
  
  DELETE FROM videos 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY "searchTerm", "learningGoal", title 
               ORDER BY created_at DESC
             ) as rn
      FROM videos
    ) t 
    WHERE t.rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removed % duplicate videos', deleted_count;
END $$;

-- Remove duplicate quizzes (keep the most recent)
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Removing duplicate quizzes...';
  
  DELETE FROM quizzes 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY "searchTerm", "learningGoal", video_id, question 
               ORDER BY created_at DESC
             ) as rn
      FROM quizzes
    ) t 
    WHERE t.rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removed % duplicate quizzes', deleted_count;
END $$;

-- Remove duplicate requested topics
DO $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Removing duplicate requested topics...';
  
  DELETE FROM requested_topics 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY "searchTerm", "learningGoal" 
               ORDER BY created_at DESC
             ) as rn
      FROM requested_topics
    ) t 
    WHERE t.rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removed % duplicate requested topics', deleted_count;
END $$;

-- =========================================================
-- 6. Add constraints to prevent future duplicates
-- =========================================================

-- Add unique constraint to videos table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'videos_search_goal_title_unique'
  ) THEN
    ALTER TABLE videos 
    ADD CONSTRAINT videos_search_goal_title_unique 
    UNIQUE ("searchTerm", "learningGoal", title);
    RAISE NOTICE 'Added unique constraint to videos table';
  END IF;
END $$;

-- Ensure existing unique constraint on requested_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'requested_topics_searchTerm_learningGoal_key'
  ) THEN
    ALTER TABLE requested_topics 
    ADD CONSTRAINT requested_topics_searchTerm_learningGoal_key 
    UNIQUE ("searchTerm", "learningGoal");
    RAISE NOTICE 'Added unique constraint to requested_topics table';
  END IF;
END $$;

-- =========================================================
-- 7. Add validation constraints
-- =========================================================

-- Add check constraint to ensure normalized format
DO $$
BEGIN
  -- Videos table constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'videos_normalized_searchterm'
  ) THEN
    ALTER TABLE videos 
    ADD CONSTRAINT videos_normalized_searchterm 
    CHECK ("searchTerm" = LOWER(TRIM("searchTerm")) AND "searchTerm" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to videos.searchTerm';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'videos_normalized_learninggoal'
  ) THEN
    ALTER TABLE videos 
    ADD CONSTRAINT videos_normalized_learninggoal 
    CHECK ("learningGoal" = LOWER(TRIM("learningGoal")) AND "learningGoal" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to videos.learningGoal';
  END IF;
  
  -- Quizzes table constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quizzes_normalized_searchterm'
  ) THEN
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_normalized_searchterm 
    CHECK ("searchTerm" = LOWER(TRIM("searchTerm")) AND "searchTerm" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to quizzes.searchTerm';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quizzes_normalized_learninggoal'
  ) THEN
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_normalized_learninggoal 
    CHECK ("learningGoal" = LOWER(TRIM("learningGoal")) AND "learningGoal" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to quizzes.learningGoal';
  END IF;
  
  -- Requested topics table constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'requested_topics_normalized_searchterm'
  ) THEN
    ALTER TABLE requested_topics 
    ADD CONSTRAINT requested_topics_normalized_searchterm 
    CHECK ("searchTerm" = LOWER(TRIM("searchTerm")) AND "searchTerm" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to requested_topics.searchTerm';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'requested_topics_normalized_learninggoal'
  ) THEN
    ALTER TABLE requested_topics 
    ADD CONSTRAINT requested_topics_normalized_learninggoal 
    CHECK ("learningGoal" = LOWER(TRIM("learningGoal")) AND "learningGoal" !~ '\s{2,}');
    RAISE NOTICE 'Added normalization constraint to requested_topics.learningGoal';
  END IF;
END $$;

-- =========================================================
-- 8. Verification
-- =========================================================

DO $$
DECLARE
  videos_count INTEGER;
  quizzes_count INTEGER;
  topics_count INTEGER;
  unnormalized_count INTEGER := 0;
BEGIN
  -- Count records in each table
  SELECT COUNT(*) INTO videos_count FROM videos;
  SELECT COUNT(*) INTO quizzes_count FROM quizzes;
  SELECT COUNT(*) INTO topics_count FROM requested_topics;
  
  -- Check for any unnormalized data
  SELECT COUNT(*) INTO unnormalized_count FROM (
    SELECT "searchTerm", "learningGoal" FROM videos 
    WHERE "searchTerm" != LOWER(TRIM("searchTerm")) OR "learningGoal" != LOWER(TRIM("learningGoal"))
    UNION ALL
    SELECT "searchTerm", "learningGoal" FROM quizzes 
    WHERE "searchTerm" != LOWER(TRIM("searchTerm")) OR "learningGoal" != LOWER(TRIM("learningGoal"))
    UNION ALL
    SELECT "searchTerm", "learningGoal" FROM requested_topics 
    WHERE "searchTerm" != LOWER(TRIM("searchTerm")) OR "learningGoal" != LOWER(TRIM("learningGoal"))
  ) unnormalized;
  
  RAISE NOTICE '=== Normalization Migration Results ===';
  RAISE NOTICE 'Videos: % records', videos_count;
  RAISE NOTICE 'Quizzes: % records', quizzes_count;
  RAISE NOTICE 'Requested Topics: % records', topics_count;
  RAISE NOTICE 'Unnormalized records remaining: %', unnormalized_count;
  
  IF unnormalized_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All data successfully normalized!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % unnormalized records found. Manual review needed.', unnormalized_count;
  END IF;
END $$;

-- Clean up the normalization function (optional)
-- DROP FUNCTION IF EXISTS normalize_text(TEXT);
