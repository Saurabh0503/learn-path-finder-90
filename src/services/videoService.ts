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
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ topic, goal }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from learning platform');
  }
};

export type { VideoData, FetchVideosParams, FetchVideosResponse };