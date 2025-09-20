import { getVideos, getQuizzes, requestTopic, isTopicRequested } from '../lib/api';

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
}

export const fetchVideos = async ({ topic, goal }: FetchVideosParams): Promise<FetchVideosResponse> => {
  if (!topic) {
    throw new Error("Topic is required");
  }

  try {
    // Fetch videos from Supabase
    const supabaseVideos = await getVideos(topic, goal || 'beginner');
    
    if (supabaseVideos.length === 0) {
      // No videos found, check if topic is already requested
      const alreadyRequested = await isTopicRequested(topic, goal || 'beginner');
      
      if (!alreadyRequested) {
        // Request this topic for future generation
        await requestTopic(topic, goal || 'beginner');
        console.log(`📝 Requested new topic: ${topic} (${goal || 'beginner'})`);
      }
      
      return { videos: [] };
    }
    
    // Fetch quizzes for these videos
    const supabaseQuizzes = await getQuizzes(topic, goal || 'beginner');
    
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
    
    console.log(`✅ Loaded ${normalizedVideos.length} videos from Supabase for ${topic} (${goal || 'beginner'})`);
    
    return { videos: normalizedVideos };
  } catch (error) {
    console.error('Error fetching videos from Supabase:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

export type { VideoData, FetchVideosParams, FetchVideosResponse };