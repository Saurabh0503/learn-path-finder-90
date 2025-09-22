-- creates table to track which videos a user completed
create table if not exists user_progress (
  user_id uuid not null,
  video_id text not null,
  completed boolean not null default true,
  completed_at timestamptz,
  primary key (user_id, video_id)
);

create index if not exists idx_user_progress_user on user_progress (user_id);
create index if not exists idx_user_progress_video on user_progress (video_id);
