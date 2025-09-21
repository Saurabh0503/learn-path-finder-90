-- Create generation_logs table for monitoring learning path generation
-- This table tracks all generation jobs with their status and timing

CREATE TABLE IF NOT EXISTS generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "searchTerm" text NOT NULL,
  "learningGoal" text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'failed', 'in_progress')),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  videos_generated integer DEFAULT 0,
  quizzes_generated integer DEFAULT 0,
  
  -- Add index for efficient querying
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_logs_search_goal ON generation_logs("searchTerm", "learningGoal");
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_generation_logs_started_at ON generation_logs(started_at DESC);

-- Enable RLS
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view generation logs" ON generation_logs
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage generation logs" ON generation_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE generation_logs IS 'Tracks learning path generation jobs with status, timing, and results';

-- Verify table creation
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'generation_logs' 
ORDER BY column_name;
