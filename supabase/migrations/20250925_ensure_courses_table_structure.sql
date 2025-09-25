-- Ensure courses table has proper structure for topic/goal filtering
-- This migration adds missing columns if they don't exist

-- Add topic column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'topic') THEN
        ALTER TABLE courses ADD COLUMN topic TEXT;
    END IF;
END $$;

-- Add goal column if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'goal') THEN
        ALTER TABLE courses ADD COLUMN goal TEXT;
    END IF;
END $$;

-- Add other useful columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'thumbnail') THEN
        ALTER TABLE courses ADD COLUMN thumbnail TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'instructor') THEN
        ALTER TABLE courses ADD COLUMN instructor TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'level') THEN
        ALTER TABLE courses ADD COLUMN level TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'duration_hours') THEN
        ALTER TABLE courses ADD COLUMN duration_hours INTEGER;
    END IF;
END $$;

-- Create indexes for better performance on topic/goal filtering
CREATE INDEX IF NOT EXISTS idx_courses_topic ON courses(topic);
CREATE INDEX IF NOT EXISTS idx_courses_goal ON courses(goal);
CREATE INDEX IF NOT EXISTS idx_courses_topic_goal ON courses(topic, goal);

-- Insert some sample courses if the table is empty
INSERT INTO courses (id, title, description, topic, goal, level, instructor, thumbnail, duration_hours, created_at)
VALUES 
  ('python-beginner', 'Python for Beginners', 'Learn Python programming from scratch', 'Python', 'beginner', 'Beginner', 'AI Instructor', '/api/placeholder/300/200', 40, NOW()),
  ('python-web-development', 'Python Web Development', 'Build web applications with Python and Django', 'Python', 'web development', 'Intermediate', 'AI Instructor', '/api/placeholder/300/200', 60, NOW()),
  ('javascript-fundamentals', 'JavaScript Fundamentals', 'Master JavaScript basics and ES6+', 'JavaScript', 'fundamentals', 'Beginner', 'AI Instructor', '/api/placeholder/300/200', 35, NOW()),
  ('react-development', 'React Development', 'Build modern web apps with React', 'React', 'web development', 'Intermediate', 'AI Instructor', '/api/placeholder/300/200', 50, NOW()),
  ('machine-learning-basics', 'Machine Learning Basics', 'Introduction to ML concepts and algorithms', 'Machine Learning', 'basics', 'Intermediate', 'AI Instructor', '/api/placeholder/300/200', 80, NOW()),
  ('data-science-python', 'Data Science with Python', 'Analyze data using Python and pandas', 'Python', 'data science', 'Intermediate', 'AI Instructor', '/api/placeholder/300/200', 70, NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  topic = EXCLUDED.topic,
  goal = EXCLUDED.goal,
  level = EXCLUDED.level,
  instructor = EXCLUDED.instructor,
  thumbnail = EXCLUDED.thumbnail,
  duration_hours = EXCLUDED.duration_hours;

-- Show the current courses table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;
