-- Create progress table for video completion tracking
-- This table tracks when users complete videos and unlock quizzes

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_url text not null,
  completed boolean default false,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create unique constraint to prevent duplicate entries
alter table progress add constraint unique_user_video unique (user_id, video_url);

-- Create indexes for better query performance
create index if not exists idx_progress_user_id on progress(user_id);
create index if not exists idx_progress_video_url on progress(video_url);
create index if not exists idx_progress_completed on progress(completed);
create index if not exists idx_progress_completed_at on progress(completed_at);

-- Enable Row Level Security (RLS)
alter table progress enable row level security;

-- Create RLS policies
create policy "Users can view their own progress" on progress
  for select using (auth.uid() = user_id);

create policy "Users can insert their own progress" on progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own progress" on progress
  for update using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function update_progress_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_progress_updated_at_trigger
  before update on progress
  for each row
  execute function update_progress_updated_at();

-- Add helpful comment
comment on table progress is 'Tracks video completion status for users to unlock quizzes';
