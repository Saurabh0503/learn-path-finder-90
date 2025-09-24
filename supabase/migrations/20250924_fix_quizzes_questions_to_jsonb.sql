-- Convert quizzes.questions from text to JSONB
ALTER TABLE quizzes
ALTER COLUMN questions TYPE jsonb
USING questions::jsonb;

-- Ensure default is an empty array
ALTER TABLE quizzes
ALTER COLUMN questions SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quizzes.questions IS 'Stores quiz questions as JSONB array';
