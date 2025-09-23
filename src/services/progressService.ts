import { supabase } from "@/lib/supabaseClient";
import { Video } from "@/lib/api";
import { upsertVideo } from "@/services/videoService";

// Helper function to get current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Not authenticated");
  return data.user;
}

/**
 * markVideoCompleted(videoId)
 * - Marks the given video as completed for the currently logged-in user.
 * - Returns { data, error } from Supabase.
 */
export async function markVideoCompleted(videoId: string) {
  console.log("🔍 markVideoCompleted called with videoId:", videoId);

  const userResp = await supabase.auth.getUser();
  const user = userResp?.data?.user;

  if (!user) {
    console.error("❌ markVideoCompleted failed: user not authenticated");
    return { error: { message: "You must be logged in to mark progress." } };
  }

  if (!videoId) {
    console.error("❌ markVideoCompleted failed: missing videoId");
    return { error: { message: "Invalid video. Missing videoId." } };
  }

  const payload = {
    user_id: user.id,
    video_id: videoId,
    completed: true,
    completed_at: new Date().toISOString(),
  };

  console.log("📦 markVideoCompleted payload:", payload);
  console.log("📦 Upserting progress with video_id:", payload.video_id);

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(payload, { onConflict: ["user_id", "video_id"] });

  if (error) {
    console.error("❌ Supabase upsert error in markVideoCompleted:", error);
    return { error };
  }

  console.log("✅ Video marked completed successfully:", data);
  return { data };
}

/**
 * getCompletedVideoIdsForUser(videoIds[])
 * - Returns an array of video_id strings that are marked completed for the current user.
 */
export async function getCompletedVideoIdsForUser(videoIds = []) {
  const userResp = await supabase.auth.getUser();
  const user = userResp?.data?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_progress")
    .select("video_id")
    .in("video_id", videoIds)
    .eq("user_id", user.id)
    .eq("completed", true);

  if (error) {
    console.error("Error fetching user progress:", error);
    return [];
  }
  return (data || []).map((r) => r.video_id);
}

// 1. Enroll in a Course
export async function enrollInCourse(courseId: string) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: courseId },
      { onConflict: "user_id,course_id" }
    );

  if (error) throw error;
  return data;
}

// 2. Mark Video as Complete
export async function markVideoComplete(videoId: string, courseId: string) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        video_id: videoId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id,video_id" }
    );

  if (error) throw error;
  return data;
}

// 3. Save Quiz Score
export async function saveQuizScore(
  videoId: string,
  courseId: string,
  score: number
) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        video_id: videoId,
        quiz_score: score,
      },
      { onConflict: "user_id,course_id,video_id" }
    );

  if (error) throw error;
  return data;
}

// 4A. Get Course Progress (RPC version)
export async function getCourseProgressRPC(courseId: string) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const { data, error: rpcError } = await supabase.rpc("get_course_progress", {
    p_user_id: user.id,
    p_course_id: courseId,
  });

  if (rpcError) throw rpcError;
  return data?.[0] || null; // Return first result or null
}

// 4B. Get Course Progress (client-side fallback)
export async function getCourseProgressClient(courseId: string) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  // Fetch course videos
  const { data: videos, error: videoError } = await supabase
    .from("course_videos")
    .select("video_id")
    .eq("course_id", courseId);

  if (videoError) throw videoError;
  if (!videos?.length) return { percent: 0, completedCount: 0, totalVideos: 0 };

  // Fetch user progress
  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("video_id, completed")
    .eq("course_id", courseId)
    .eq("user_id", user.id);

  if (progressError) throw progressError;

  const completedCount = progress?.filter((p) => p.completed).length || 0;
  const totalVideos = videos.length;
  const percent = Math.round((completedCount / totalVideos) * 100);

  return { percent, completedCount, totalVideos };
}

// 5. Get Overall Progress Stats
export async function getOverallProgressStats() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  // Get enrolled courses count
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id);

  if (enrollmentError) throw enrollmentError;

  // Get completed videos count
  const { data: completedVideos, error: completedError } = await supabase
    .from("user_progress")
    .select("video_id")
    .eq("user_id", user.id)
    .eq("completed", true);

  if (completedError) throw completedError;

  // Get total learning time (approximate based on completed videos)
  const { data: learningTime, error: timeError } = await supabase
    .from("user_progress")
    .select("created_at, completed_at")
    .eq("user_id", user.id)
    .eq("completed", true)
    .not("completed_at", "is", null);

  if (timeError) throw timeError;

  // Calculate learning streak (days with activity in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentActivity, error: activityError } = await supabase
    .from("user_progress")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("completed_at", thirtyDaysAgo.toISOString());

  if (activityError) throw activityError;

  // Calculate unique days with activity
  const uniqueDays = new Set(
    recentActivity?.map(activity => 
      activity.completed_at ? new Date(activity.completed_at).toDateString() : null
    ).filter(Boolean)
  );

  const estimatedHours = Math.round((completedVideos?.length || 0) * 0.5); // Estimate 30 min per video

  return {
    enrolledCourses: enrollments?.length || 0,
    completedVideos: completedVideos?.length || 0,
    totalLearningHours: estimatedHours,
    learningStreak: uniqueDays.size
  };
}

// 6. Get Enrolled Courses with Progress
export async function getEnrolledCoursesWithProgress() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select(`
      course_id,
      enrolled_at,
      courses (
        id,
        title,
        description
      )
    `)
    .eq("user_id", user.id);

  if (enrollmentError) throw enrollmentError;

  // Get progress for each course
  const coursesWithProgress = await Promise.all(
    (enrollments || []).map(async (enrollment) => {
      const progress = await getCourseProgressClient(enrollment.course_id);
      return {
        ...enrollment,
        progress
      };
    })
  );

  return coursesWithProgress;
}

/**
 * Mark video with progress - ensures video exists in database before tracking progress
 */
export async function markVideoWithProgress(userId: string, video: Video) {
  console.log("🎬 markVideoWithProgress called for:", video.id);
  
  try {
    // Step 1: Ensure video exists in database
    console.log("📦 Step 1: Upserting video to database...");
    await upsertVideo(video);
    console.log("✅ Step 1 complete: Video upserted successfully");
    
    // Step 2: Mark video as completed for user
    console.log("📝 Step 2: Marking video as completed...");
    const result = await markVideoCompleted(video.id);
    console.log("✅ Step 2 complete: Video marked as completed");
    
    return result;
  } catch (error) {
    console.error("❌ markVideoWithProgress failed:", error);
    throw error;
  }
}