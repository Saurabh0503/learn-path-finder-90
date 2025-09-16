-- Fix the get_course_progress function with proper search_path
create or replace function get_course_progress(p_user_id uuid, p_course_id uuid)
returns table (
  course_id uuid,
  title text,
  total_videos int,
  completed_videos int,
  percent numeric
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as course_id,
    c.title,
    count(cv.video_id) as total_videos,
    coalesce(sum(case when up.completed then 1 else 0 end), 0) as completed_videos,
    round(
      100.0 * coalesce(sum(case when up.completed then 1 else 0 end), 0)
      / nullif(count(cv.video_id), 0),
      2
    ) as percent
  from courses c
  join course_videos cv on cv.course_id = c.id
  left join user_progress up
    on up.video_id = cv.video_id
   and up.user_id = p_user_id
  where c.id = p_course_id
  group by c.id, c.title;
$$;