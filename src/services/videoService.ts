// Helper function to extract valid YouTube video ID
function extractVideoId(idOrUrl: string | undefined): string {
  if (!idOrUrl) return "";
  
  // If it's already an 11-character YouTube ID, return it
  if (/^[0-9A-Za-z_-]{11}$/.test(idOrUrl)) {
    return idOrUrl;
  }
  
  // Try to extract from YouTube URL patterns
  const urlPatterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11})/, // Standard YouTube URLs
    /youtu\.be\/([0-9A-Za-z_-]{11})/, // Shortened URLs
    /embed\/([0-9A-Za-z_-]{11})/, // Embed URLs
  ];
  
  for (const pattern of urlPatterns) {
    const match = idOrUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return "";
}

// Helper to extract YouTube ID from thumbnail URL
function extractVideoIdFromThumbnail(thumbnail: string): string {
  if (!thumbnail) return "";
  
  // YouTube thumbnail patterns: https://img.youtube.com/vi/{ID}/... or https://i.ytimg.com/vi/{ID}/...
  const match = thumbnail.match(/\/vi\/([0-9A-Za-z_-]{11})\//); 
  return match ? match[1] : "";
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

  const url = `https://dhanwai.app.n8n.cloud/webhook/youtube-learning?topic=${encodeURIComponent(topic)}&goal=${encodeURIComponent(goal || '')}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "x-api-key": "mySecretKey123" 
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`n8n webhook failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const rawVideos = Array.isArray(data) ? data[0]?.videos : data.videos;
    
    if (!Array.isArray(rawVideos)) {
      return { videos: [] };
    }
    
    // Normalize and filter videos to ensure valid YouTube IDs
    const normalizedVideos = rawVideos
      .map((video: any) => {
        // Try to extract valid YouTube ID from multiple sources
        let cleanId = extractVideoId(video.id);
        
        // If video.id doesn't give us a valid ID, try the thumbnail
        if (!cleanId && video.thumbnail) {
          cleanId = extractVideoIdFromThumbnail(video.thumbnail);
        }
        
        // If we still don't have a valid ID, skip this video
        if (!cleanId) {
          console.warn(`⚠️ Skipping video with invalid ID: ${video.id || 'unknown'}`);
          return null;
        }
        
        console.log(`✅ Normalized videoId: ${cleanId} (from: ${video.id})`);
        
        return {
          ...video,
          id: cleanId, // Always use the normalized YouTube ID
        };
      })
      .filter(Boolean); // Remove null entries
    
    return { videos: normalizedVideos };
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

export type { VideoData, FetchVideosParams, FetchVideosResponse };