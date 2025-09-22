import { getVideos, getQuizzes } from '../lib/api.js';
import { normalizeTopicPair } from '../utils/normalizeInput.js';
import { supabase } from "@/lib/supabaseClient";
import { safeString, safeVideoNormalize, videoDefaults } from '../utils/safeString.js';

// Normalizer (matches backend logic)
function normalizeInput(term: string, goal: string) {
  const cleanTerm = (term || "").toLowerCase().trim();
  const cleanGoal = (goal || "").toLowerCase().trim();

  const goalMap: Record<string, string> = {
    basic: "beginner",
    starter: "beginner",
    novice: "beginner",
    intermediate: "intermediate",
    mid: "intermediate",
    advanced: "advanced",
    expert: "advanced"
  };

  return {
    searchTerm: cleanTerm,
    learningGoal: goalMap[cleanGoal] || cleanGoal
  };
}

// Helper function to extract valid YouTube video ID
function extractVideoId(idOrUrl: string | undefined, thumbnail?: string): string {
  if (!idOrUrl) return "";
  
  // If it's already an 11-character YouTube ID, return it
  if (/^[0-9A-Za-z_-]{11}$/.test(idOrUrl)) {
    return idOrUrl;
  }
  
  // Try to extract from YouTube URL patterns
  const match = idOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  if (match) return match[1];
  
  // Fallback: extract from thumbnail (i.ytimg.com/vi/<id>/...)
  if (thumbnail) {
    const thumbMatch = thumbnail.match(/\/vi\/([0-9A-Za-z_-]{11})\//); 
    if (thumbMatch) return thumbMatch[1];
  }
  
  return "";
}

interface VideoData {
  id: string; // Always a valid 11-character YouTube ID
  title: string;
  thumbnail: string;
  channel: string;
  difficulty: string;
  rank: number;
  summary: string;
  quiz: {
    question: string;
    options: string[];
    correct: number;
  }[];
}

interface FetchVideosParams {
  topic: string;
  goal: string;
}

interface FetchVideosResponse {
  videos: VideoData[];
  status?: 'exists' | 'generating' | 'in_progress';
  message?: string;
}

export const fetchVideos = async ({ topic, goal }: FetchVideosParams): Promise<FetchVideosResponse> => {
  console.log("🔍 fetchVideos called with:", { topic, goal });
  
  if (!topic) {
    throw new Error("Topic is required");
  }

  const normalizedGoal = goal || 'beginner';
  
  // Apply normalization to ensure consistency
  const { searchTerm: normalizedTopic, learningGoal: normalizedGoalFinal } = normalizeTopicPair(topic, normalizedGoal);

  try {
    // Step 1: Check if videos already exist in Supabase
    console.log(`🔍 Checking for existing videos: ${normalizedTopic} + ${normalizedGoalFinal}`);
    const supabaseVideos = await getVideos(normalizedTopic, normalizedGoalFinal);
    
    if (supabaseVideos.length === 0) {
      console.log(`📡 No existing videos found, calling Edge Function for: ${normalizedTopic} + ${normalizedGoalFinal}`);
      
      // Step 2: Call Supabase Edge Function for dynamic generation
      try {
        const edgeFunctionResult = await callGenerationEdgeFunction(normalizedTopic, normalizedGoalFinal);
        
        if (edgeFunctionResult.status === 'exists' && edgeFunctionResult.videos) {
          // Videos were found during Edge Function call
          return await transformSupabaseVideosToResponse(edgeFunctionResult.videos, normalizedTopic, normalizedGoalFinal);
        } else if (edgeFunctionResult.status === 'in_progress') {
          // Generation is already in progress
          return {
            videos: [],
            status: 'in_progress',
            message: `Learning path is being prepared for ${normalizedTopic} (${normalizedGoalFinal}). Please wait...`
          };
        } else if (edgeFunctionResult.status === 'success') {
          // Generation completed successfully, refetch from Supabase
          console.log(`✅ Edge Function completed, refetching videos...`);
          const newVideos = await getVideos(normalizedTopic, normalizedGoalFinal);
          return await transformSupabaseVideosToResponse(newVideos, normalizedTopic, normalizedGoalFinal);
        }
        
        // Generation started
        return {
          videos: [],
          status: 'generating',
          message: `Preparing learning path for ${normalizedTopic} (${normalizedGoalFinal}). This may take 2-5 minutes...`
        };
        
      } catch (edgeFunctionError) {
        console.error('Edge Function call failed:', edgeFunctionError);
        
        return {
          videos: [],
          status: 'generating',
          message: `Learning path generation failed for ${normalizedTopic} (${normalizedGoalFinal}). Please try again later.`
        };
      }
    }
    
    // Step 3: Transform existing videos to response format
    console.log(`✅ Found ${supabaseVideos.length} existing videos for ${normalizedTopic} + ${normalizedGoalFinal}`);
    return await transformSupabaseVideosToResponse(supabaseVideos, normalizedTopic, normalizedGoalFinal);
    
  } catch (error) {
    console.error('Error in fetchVideos:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

/* Standardized Supabase function fetch — replace existing function calls with this */
const SUPER_TASK_URL = "https://csrggvuucfyeaxdunrjy.supabase.co/functions/v1/super-task";

async function callSuperTask(payload: any) {
  try {
    console.log("📡 Making fetch request to super-task with payload:", payload);
    const res = await fetch(SUPER_TASK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcmdndnV1Y2Z5ZWF4ZHVucmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTE4ODAsImV4cCI6MjA3MzUyNzg4MH0.Vzt39Inny0ZvsNBICr47HL_lXnK67zFa4ekYO2fguGE",
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 super-task response status:", res.status, res.statusText);

    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      console.error("❌ super-task failed:", { status: res.status, statusText: res.statusText, responseText: text });
      throw new Error(`Super-task failed: ${res.status} ${res.statusText} ${text || ''}` );
    }
    
    const data = await res.json();
    console.log("✅ super-task success response:", data);
    return data;
  } catch (err) {
    console.error("❌ Error in callSuperTask:", err);
    throw err;
  }
}

/**
 * Call the Supabase Edge Function for learning path generation
 */
async function callGenerationEdgeFunction(searchTerm: string, learningGoal: string): Promise<any> {
  try {
    console.log(`📡 Calling Edge Function: super-task for ${searchTerm} + ${learningGoal}`);
    
    const payload = { searchTerm, learningGoal };
    const data = await callSuperTask(payload);

    console.log(`✅ Edge Function response:`, data);
    return data;

  } catch (error) {
    console.error('Failed to call Edge Function:', error);
    throw error;
  }
}

/**
 * Transform Supabase videos to the expected VideoData format
 */
async function transformSupabaseVideosToResponse(supabaseVideos: any[], topic: string, goal: string): Promise<FetchVideosResponse> {
  try {
    // Fetch quizzes for these videos
    const supabaseQuizzes = await getQuizzes(topic, goal);
    
    // Group quizzes by video URL with safe string handling
    const quizzesByUrl: { [url: string]: any[] } = {};
    supabaseQuizzes.forEach(quiz => {
      const safeUrl = safeString(quiz?.url);
      if (!safeUrl) return; // Skip quizzes without valid URLs
      
      if (!quizzesByUrl[safeUrl]) {
        quizzesByUrl[safeUrl] = [];
      }
      quizzesByUrl[safeUrl].push({
        question: safeString(quiz?.question) || 'No question available',
        options: [
          safeString(quiz?.answer) || 'No answer available', 
          "Option 2", 
          "Option 3", 
          "Option 4"
        ], // Simplified for now
        correct: 0 // First option is always correct for now
      });
    });
    
    // Transform Supabase data to match existing VideoData interface with safe defaults
    const normalizedVideos: VideoData[] = supabaseVideos.map((video, index) => {
      const safeVideo = safeVideoNormalize(video);
      const cleanId = extractVideoId(safeVideo.id, safeVideo.thumbnail) || safeVideo.id;
      
      return {
        id: cleanId,
        title: safeVideo.title || videoDefaults.title,
        thumbnail: safeVideo.thumbnail || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
        channel: safeVideo.channel || videoDefaults.channel,
        difficulty: safeVideo.level || videoDefaults.level,
        rank: index + 1, // Simple ranking based on order
        summary: safeVideo.summary || videoDefaults.summary,
        quiz: Array.isArray(quizzesByUrl[safeVideo.url]) ? quizzesByUrl[safeVideo.url] : videoDefaults.quizzes
      };
    }).filter(v => safeString(v.id)); // Filter out videos with invalid IDs
    
    console.log(`✅ Loaded ${normalizedVideos.length} videos from Supabase for ${topic} (${goal})`);
    
    return { videos: normalizedVideos };
  } catch (error) {
    console.error('Error transforming videos:', error);
    return { videos: [] };
  }
}

export async function generateLearningPath(searchTerm: string, learningGoal: string) {
  const normalized = normalizeInput(searchTerm, learningGoal);

  try {
    console.log("Invoking Edge Function: super-task", normalized);

    const data = await callSuperTask(normalized);

    console.log("Function response:", data);
    return data;
  } catch (err: any) {
    console.error("generateLearningPath failed:", err.message || err);
    return { status: "error", message: err.message || "Unknown error" };
  }
}

export type { VideoData, FetchVideosParams, FetchVideosResponse };