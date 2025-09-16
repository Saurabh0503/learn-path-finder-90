-- =========================================================
-- ✅ Migration: Fix video_id in course_videos & user_progress
-- =========================================================

-- Backup old invalid video IDs before update
create table if not exists backup_invalid_video_ids as
select cv.id as course_video_id,
       cv.video_id as old_video_id,
       cv.thumbnail,
       up.id as user_progress_id,
       up.video_id as old_progress_video_id
from course_videos cv
left join user_progress up on cv.video_id = up.video_id
where cv.video_id like 'video-%';

-- Update invalid video_id in course_videos
update course_videos
set video_id = substring(thumbnail from 'vi/([0-9A-Za-z_-]{11})/')
where video_id like 'video-%'
  and thumbnail ~ 'vi/([0-9A-Za-z_-]{11})/';

-- Update invalid video_id in user_progress
update user_progress
set video_id = substring(cv.thumbnail from 'vi/([0-9A-Za-z_-]{11})/')
from course_videos cv
where user_progress.video_id like 'video-%'
  and user_progress.course_id = cv.course_id
  and cv.thumbnail ~ 'vi/([0-9A-Za-z_-]{11})/';

-- Add constraint to enforce valid YouTube IDs (11 chars)
alter table course_videos
  add constraint valid_video_id check (length(video_id) = 11);

alter table user_progress
  add constraint valid_user_progress_video_id check (length(video_id) = 11);

-- =========================================================
-- ✅ Rollback Section
-- =========================================================
-- If migration fails, restore old video_id values from backup:
-- update course_videos cv
-- set video_id = b.old_video_id
-- from backup_invalid_video_ids b
-- where cv.id = b.course_video_id;
--
-- update user_progress up
-- set video_id = b.old_progress_video_id
-- from backup_invalid_video_ids b
-- where up.id = b.user_progress_id;
