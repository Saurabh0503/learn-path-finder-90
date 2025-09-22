-- Ensure user_progress table exists with required schema for video completion tracking
-- This migration ensures the table has the exact structure needed for video_id based tracking

-- Create user_progress table if it doesn't exist
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  completed boolean default false,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add video_id column if it doesn't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'user_progress' and column_name = 'video_id') then
    alter table user_progress add column video_id text;
  end if;
end $$;

-- Add uniqueness constraint for user_id + video_id
alter table user_progress
  add constraint if not exists user_video_unique unique (user_id, video_id);

-- Create indexes for better query performance
create index if not exists idx_user_progress_user_id on user_progress(user_id);
create index if not exists idx_user_progress_video_id on user_progress(video_id);
create index if not exists idx_user_progress_completed on user_progress(completed);

-- Enable Row Level Security
alter table user_progress enable row level security;

-- Drop existing policies if they exist to avoid conflicts
drop policy if exists "Users can insert their own progress" on user_progress;
drop policy if exists "Users can view their own progress" on user_progress;
drop policy if exists "Users can update their own progress" on user_progress;

-- Create RLS policies
create policy "Users can insert their own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update their own progress"
  on user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function update_user_progress_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
drop trigger if exists update_user_progress_updated_at_trigger on user_progress;
create trigger update_user_progress_updated_at_trigger
  before update on user_progress
  for each row
  execute function update_user_progress_updated_at();

-- Add helpful comment
comment on table user_progress is 'Tracks video completion status for users. Uses video_id for completion tracking and quiz unlocking.';
