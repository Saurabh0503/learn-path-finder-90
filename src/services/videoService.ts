interface VideoData {
  id: string;
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
    const videos = Array.isArray(data) ? data[0]?.videos : data.videos;
    
    return { videos: videos || [] };
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

export type { VideoData, FetchVideosParams, FetchVideosResponse };