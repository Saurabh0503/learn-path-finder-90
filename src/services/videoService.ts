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
    const webhookUrl = `https://dhanwai.app.n8n.cloud/webhook-test/youtube-learning?topic=${encodeURIComponent(topic)}&goal=${encodeURIComponent(goal)}`;
    
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.WEBHOOK_KEY || '',
        'Content-Type': 'application/json',
      },
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