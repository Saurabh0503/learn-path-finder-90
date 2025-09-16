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
      .map((video: any) => ({
        ...video,
        id: extractVideoId(video.id, video.thumbnail),
      }))
      .filter(v => v.id); // drop invalid ones
    
    console.log(`✅ Normalized ${normalizedVideos.length}/${rawVideos.length} videos with valid YouTube IDs`);
    normalizedVideos.forEach(v => console.log(`🎥 Video ID: ${v.id} - ${v.title}`));
    
    return { videos: normalizedVideos };
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

export type { VideoData, FetchVideosParams, FetchVideosResponse };