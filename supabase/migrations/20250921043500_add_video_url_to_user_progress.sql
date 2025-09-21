-- Add video_url field to user_progress table for video completion tracking
-- This allows tracking completion by full YouTube URL instead of just video_id

-- Add video_url column to user_progress table
alter table user_progress add column if not exists video_url text;

-- Create index for better query performance on video_url
create index if not exists idx_user_progress_video_url on user_progress(video_url);

-- Create index for user_id + video_url combination for completion checks
create index if not exists idx_user_progress_user_video_url on user_progress(user_id, video_url);

-- Add constraint to ensure either video_id or video_url is present
alter table user_progress add constraint check_video_identifier 
  check (video_id is not null or video_url is not null);

-- Update existing records to populate video_url from video_id where possible
-- This converts video_id to YouTube URL format for existing records
update user_progress 
set video_url = 'https://www.youtube.com/watch?v=' || video_id
where video_url is null 
  and video_id is not null 
  and length(video_id) = 11;

-- Add helpful comment
comment on column user_progress.video_url is 'Full YouTube URL for video completion tracking';
