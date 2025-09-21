import { getVideos, getQuizzes, requestTopic, isTopicRequested, generateLearningPath, checkGenerationStatus } from '../lib/api';

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
  if (!topic) {
    throw new Error("Topic is required");
  }

  const normalizedGoal = goal || 'beginner';

  try {
    // Step 1: Check if videos already exist
    const supabaseVideos = await getVideos(topic, normalizedGoal);
    
    if (supabaseVideos.length === 0) {
      console.log(`🔍 No existing videos found for ${topic} + ${normalizedGoal}, starting dynamic generation...`);
      
      // Step 2: Trigger dynamic generation
      try {
        const generationResult = await generateLearningPath(topic, normalizedGoal);
        
        if (generationResult.status === 'exists' && generationResult.videos) {
          // Videos were found during generation call
          return await transformSupabaseVideosToResponse(generationResult.videos, topic, normalizedGoal);
        } else if (generationResult.status === 'in_progress') {
          // Generation is already in progress
          return {
            videos: [],
            status: 'in_progress',
            message: `Learning path is being prepared for ${topic} (${normalizedGoal}). Please wait...`
          };
        } else if (generationResult.status === 'started') {
          // Generation just started
          return {
            videos: [],
            status: 'generating',
            message: `Preparing learning path for ${topic} (${normalizedGoal}). This may take 2-5 minutes...`
          };
        }
      } catch (generationError) {
        console.error('Dynamic generation failed:', generationError);
        
        // Fallback to old request system
        const alreadyRequested = await isTopicRequested(topic, normalizedGoal);
        if (!alreadyRequested) {
          await requestTopic(topic, normalizedGoal);
          console.log(`📝 Fallback: Requested topic for batch processing: ${topic} (${normalizedGoal})`);
        }
        
        return {
          videos: [],
          status: 'generating',
          message: `Learning path will be prepared for ${topic} (${normalizedGoal}). Please check back later.`
        };
      }
    }
    
    // Step 3: Transform existing videos to response format
    return await transformSupabaseVideosToResponse(supabaseVideos, topic, normalizedGoal);
  } catch (error) {
    console.error('Error fetching videos from Supabase:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

/**
 * Transform Supabase videos to the expected VideoData format
 */
async function transformSupabaseVideosToResponse(supabaseVideos: any[], topic: string, goal: string): Promise<FetchVideosResponse> {
  try {
    // Fetch quizzes for these videos
    const supabaseQuizzes = await getQuizzes(topic, goal);
    
    // Group quizzes by video URL
    const quizzesByUrl: { [url: string]: any[] } = {};
    supabaseQuizzes.forEach(quiz => {
      if (!quizzesByUrl[quiz.url]) {
        quizzesByUrl[quiz.url] = [];
      }
      quizzesByUrl[quiz.url].push({
        question: quiz.question,
        options: [quiz.answer, "Option 2", "Option 3", "Option 4"], // Simplified for now
        correct: 0 // First option is always correct for now
      });
    });
    
    // Transform Supabase data to match existing VideoData interface
    const normalizedVideos: VideoData[] = supabaseVideos.map((video, index) => {
      const cleanId = extractVideoId(video.id, video.thumbnail) || video.id;
      
      return {
        id: cleanId,
        title: video.title,
        thumbnail: video.thumbnail || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
        channel: video.channel,
        difficulty: video.level,
        rank: index + 1, // Simple ranking based on order
        summary: video.summary,
        quiz: quizzesByUrl[video.url] || []
      };
    }).filter(v => v.id); // Filter out videos with invalid IDs
    
    console.log(`✅ Loaded ${normalizedVideos.length} videos from Supabase for ${topic} (${goal})`);
    
    return { videos: normalizedVideos };
  } catch (error) {
    console.error('Error transforming videos:', error);
    return { videos: [] };
  }
}

export type { VideoData, FetchVideosParams, FetchVideosResponse };