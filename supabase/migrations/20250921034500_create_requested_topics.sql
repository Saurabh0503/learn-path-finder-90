-- Create requested_topics table for dynamic topic generation
create table if not exists requested_topics (
  id uuid primary key default gen_random_uuid(),
  searchTerm text not null,
  learningGoal text not null,
  created_at timestamp with time zone default now(),
  
  -- Prevent duplicate requests
  unique(searchTerm, learningGoal)
);

-- Add index for efficient querying
create index if not exists idx_requested_topics_created_at on requested_topics(created_at);

-- Add RLS policies (if RLS is enabled)
alter table requested_topics enable row level security;

-- Allow all users to insert new topic requests
create policy "Anyone can request topics" on requested_topics
  for insert with check (true);

-- Allow all users to read requested topics
create policy "Anyone can view requested topics" on requested_topics
  for select using (true);

-- Only allow service role to delete processed topics
create policy "Service role can delete processed topics" on requested_topics
  for delete using (auth.role() = 'service_role');

-- Create videos table if it doesn't exist (for the new backend)
create table if not exists videos (
  id text primary key, -- YouTube video ID
  search_term text not null,
  learning_goal text not null,
  title text not null,
  url text not null,
  summary text,
  level text,
  channel text,
  thumbnail text,
  created_at timestamp with time zone default now()
);

-- Add index for efficient filtering
create index if not exists idx_videos_search_goal on videos(search_term, learning_goal);
create index if not exists idx_videos_created_at on videos(created_at);

-- Create quizzes table if it doesn't exist
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  search_term text not null,
  learning_goal text not null,
  title text not null,
  url text not null,
  level text,
  difficulty text,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default now()
);

-- Add index for efficient filtering
create index if not exists idx_quizzes_search_goal on quizzes(search_term, learning_goal);
create index if not exists idx_quizzes_video_id on quizzes(video_id);
create index if not exists idx_quizzes_url on quizzes(url);

-- Enable RLS on videos and quizzes tables
alter table videos enable row level security;
alter table quizzes enable row level security;

-- Allow all users to read videos and quizzes
create policy "Anyone can view videos" on videos
  for select using (true);

create policy "Anyone can view quizzes" on quizzes
  for select using (true);

-- Only allow service role to insert/update/delete videos and quizzes
create policy "Service role can manage videos" on videos
  for all using (auth.role() = 'service_role');

create policy "Service role can manage quizzes" on quizzes
  for all using (auth.role() = 'service_role');
