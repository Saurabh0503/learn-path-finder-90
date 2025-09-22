/**
 * Core Learning Path Generation Logic
 * 
 * This module contains the shared logic for generating learning paths
 * that can be used by both the CLI script and the Supabase Edge Function.
 */

export interface GenerationResult {
  videosCount: number;
  quizzesCount: number;
}

export interface VideoData {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: string;
  description?: string;
  duration?: string;
  views?: string;
  published?: string;
}

export interface ProcessedVideo extends VideoData {
  summary: string;
  level: string;
  rank: number;
}

export interface QuizData {
  video_id: string;
  question: string;
  answer: string;
  difficulty: string;
}

/**
 * Main function to generate learning path for any topic/goal combination
 * This is the core logic that can be used by both CLI and Edge Function
 */
export async function generateLearningPathCore(
  searchTerm: string,
  learningGoal: string,
  supabaseClient?: any
): Promise<GenerationResult> {
  console.log(`🚀 Core: Starting learning path generation for: ${searchTerm} + ${learningGoal}`);
  
  try {
    // Step 1: Fetch videos from YouTube
    const videos = await fetchVideosFromYouTube(searchTerm, learningGoal);
    console.log(`📹 Core: Fetched ${videos.length} videos from YouTube`);

    if (videos.length === 0) {
      throw new Error(`No videos found for topic: ${searchTerm}`);
    }

    // Step 2: Process videos with Groq LLM for ranking and summaries
    const processedVideos = await processVideosWithGroq(videos, searchTerm, learningGoal);
    console.log(`🧠 Core: Processed ${processedVideos.length} videos with AI`);

    // Step 3: Generate quizzes for each video
    const quizzes = await generateQuizzesForVideos(processedVideos, searchTerm, learningGoal);
    console.log(`❓ Core: Generated ${quizzes.length} quizzes`);

    // Step 4: Insert videos into Supabase (using normalized values)
    const videosToInsert = flattenVideosFromLearningPath(processedVideos, searchTerm, learningGoal);
    
    if (supabaseClient) {
      const { error: videosError } = await supabaseClient
        .from('videos')
        .upsert(videosToInsert, { onConflict: 'id' });

      if (videosError) {
        throw new Error(`Failed to insert videos: ${videosError.message}`);
      }

      // Step 5: Insert quizzes into Supabase (using normalized values)
      const quizzesToInsert = flattenQuizzesFromLearningPath(quizzes, searchTerm, learningGoal);
      const { error: quizzesError } = await supabaseClient
        .from('quizzes')
        .insert(quizzesToInsert);

      if (quizzesError) {
        console.warn(`Warning: Some quizzes failed to insert: ${quizzesError.message}`);
      }
    }

    console.log(`✅ Core: Successfully generated learning path:`);
    console.log(`   📹 Videos: ${videosToInsert.length}`);
    console.log(`   ❓ Quizzes: ${quizzes.length}`);

    return {
      videosCount: videosToInsert.length,
      quizzesCount: quizzes.length
    };

  } catch (error) {
    console.error(`❌ Core: Failed to generate learning path for ${searchTerm} + ${learningGoal}:`, error);
    throw error;
  }
}

/**
 * Fetch videos from YouTube via direct API or fallback to mock data
 */
async function fetchVideosFromYouTube(searchTerm: string, learningGoal: string): Promise<VideoData[]> {
  const ytApiKey = getEnvVar('YT_API_KEY');
  
  if (!ytApiKey) {
    console.warn('⚠️  YT_API_KEY not configured, using mock data');
    return getMockVideos(searchTerm, learningGoal);
  }

  try {
    // YouTube Data API v3 search
    const searchQuery = `${searchTerm} ${learningGoal} tutorial`;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&q=${encodeURIComponent(searchQuery)}&` +
      `maxResults=10&key=${ytApiKey}&order=relevance&videoDuration=medium`;

    console.log(`🔍 Searching YouTube for: "${searchQuery}"`);
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchData.error?.message || 'Unknown error'}`);
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.warn('No videos found from YouTube API, using mock data');
      return getMockVideos(searchTerm, learningGoal);
    }

    // Get video details for duration, views, etc.
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics&id=${videoIds}&key=${ytApiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Combine search results with details
    const videos: VideoData[] = searchData.items.map((item: any, index: number) => {
      const details = detailsData.items?.find((d: any) => d.id === item.id.videoId);
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        duration: details?.contentDetails?.duration || 'PT0S',
        views: details?.statistics?.viewCount || '0',
        published: item.snippet.publishedAt
      };
    });

    console.log(`✅ Fetched ${videos.length} videos from YouTube API`);
    return videos;

  } catch (error) {
    console.error('YouTube API error:', error);
    console.warn('Falling back to mock data');
    return getMockVideos(searchTerm, learningGoal);
  }
}

/**
 * Process videos with Groq LLM for ranking and summaries
 */
async function processVideosWithGroq(
  videos: VideoData[], 
  searchTerm: string, 
  learningGoal: string
): Promise<ProcessedVideo[]> {
  const groqApiKey = getEnvVar('GROQ_API_KEY');
  
  if (!groqApiKey) {
    console.warn('⚠️  GROQ_API_KEY not configured, using basic processing');
    return videos.map((video, index) => ({
      ...video,
      summary: `Learn ${searchTerm} concepts through this comprehensive ${learningGoal}-level tutorial. This video covers essential topics and practical examples.`,
      level: learningGoal,
      rank: index + 1
    }));
  }

  try {
    const prompt = `Analyze these ${searchTerm} videos for ${learningGoal} learners. For each video, provide:
1. A 2-sentence summary focusing on what students will learn
2. Difficulty level (beginner/intermediate/advanced)
3. Ranking (1-10) based on educational value for ${learningGoal} ${searchTerm} learners

Videos:
${videos.map((v, i) => `${i + 1}. "${v.title}" by ${v.channel}`).join('\n')}

Respond in JSON format:
[{"summary": "...", "level": "beginner", "rank": 8}, ...]`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    
    return videos.map((video, index) => ({
      ...video,
      summary: analysis[index]?.summary || `Learn ${searchTerm} with this ${learningGoal} tutorial.`,
      level: analysis[index]?.level || learningGoal,
      rank: analysis[index]?.rank || (index + 1)
    })).sort((a, b) => b.rank - a.rank); // Sort by rank descending

  } catch (error) {
    console.error('Groq processing error:', error);
    console.warn('Using basic processing fallback');
    
    return videos.map((video, index) => ({
      ...video,
      summary: `Learn ${searchTerm} concepts through this comprehensive ${learningGoal}-level tutorial.`,
      level: learningGoal,
      rank: index + 1
    }));
  }
}

/**
 * Generate quizzes for each video using Groq LLM
 */
async function generateQuizzesForVideos(
  videos: ProcessedVideo[], 
  searchTerm: string, 
  learningGoal: string
): Promise<QuizData[]> {
  const groqApiKey = getEnvVar('GROQ_API_KEY');
  
  if (!groqApiKey) {
    console.warn('⚠️  GROQ_API_KEY not configured, using basic quizzes');
    return videos.flatMap(video => 
      generateBasicQuizzes(video, searchTerm, learningGoal)
    );
  }

  const allQuizzes: QuizData[] = [];

  for (const video of videos) {
    try {
      const prompt = `Create 3 quiz questions for this ${searchTerm} video: "${video.title}"
      
Target audience: ${learningGoal} level learners
Video summary: ${video.summary}

Generate questions that test understanding of key concepts. Each question should:
- Be clear and specific
- Have a definitive correct answer
- Be appropriate for ${learningGoal} level

Respond in JSON format:
[
  {
    "question": "What is...",
    "answer": "The correct answer",
    "difficulty": "easy|medium|hard"
  }
]`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const questions = JSON.parse(data.choices[0].message.content);
        
        questions.forEach((q: any) => {
          allQuizzes.push({
            video_id: video.id,
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty || 'medium'
          });
        });
      } else {
        console.warn(`Quiz generation failed for video ${video.id}, using fallback`);
        allQuizzes.push(...generateBasicQuizzes(video, searchTerm, learningGoal));
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error generating quiz for video ${video.id}:`, error);
      allQuizzes.push(...generateBasicQuizzes(video, searchTerm, learningGoal));
    }
  }

  return allQuizzes;
}

/**
 * Generate basic fallback quizzes when AI is not available
 */
function generateBasicQuizzes(video: ProcessedVideo, searchTerm: string, learningGoal: string): QuizData[] {
  return [
    {
      video_id: video.id,
      question: `What is the main topic covered in "${video.title}"?`,
      answer: `${searchTerm} concepts and techniques for ${learningGoal} learners`,
      difficulty: 'easy'
    },
    {
      video_id: video.id,
      question: `Who created the video "${video.title}"?`,
      answer: video.channel,
      difficulty: 'easy'
    }
  ];
}

/**
 * Get mock videos for testing when APIs are not available
 */
function getMockVideos(searchTerm: string, learningGoal: string): VideoData[] {
  const mockId = Math.random().toString(36).substring(2, 13); // 11 chars like YouTube ID
  
  return [
    {
      id: `${mockId}1`,
      title: `${searchTerm} Tutorial for ${learningGoal}s - Complete Guide`,
      url: `https://www.youtube.com/watch?v=${mockId}1`,
      thumbnail: `https://img.youtube.com/vi/${mockId}1/hqdefault.jpg`,
      channel: `${searchTerm} Academy`,
      description: `Complete ${searchTerm} tutorial for ${learningGoal} level learners`,
      duration: 'PT15M30S',
      views: '125000',
      published: new Date().toISOString()
    },
    {
      id: `${mockId}2`,
      title: `Learn ${searchTerm} - ${learningGoal} Crash Course`,
      url: `https://www.youtube.com/watch?v=${mockId}2`,
      thumbnail: `https://img.youtube.com/vi/${mockId}2/hqdefault.jpg`,
      channel: 'Tech Learning Hub',
      description: `Fast-paced ${searchTerm} course for ${learningGoal}s`,
      duration: 'PT22M45S',
      views: '89000',
      published: new Date().toISOString()
    }
  ];
}

/**
 * Flatten processed videos for Supabase insertion
 */
function flattenVideosFromLearningPath(
  videos: ProcessedVideo[], 
  searchTerm: string, 
  learningGoal: string
): any[] {
  return videos.map(video => ({
    id: video.id,
    searchTerm: searchTerm,
    learningGoal: learningGoal,
    title: video.title,
    url: video.url,
    thumbnail: video.thumbnail,
    channel: video.channel,
    summary: video.summary,
    level: video.level,
    rank: video.rank,
    created_at: new Date().toISOString()
  }));
}

/**
 * Flatten quizzes for Supabase insertion
 */
function flattenQuizzesFromLearningPath(
  quizzes: QuizData[], 
  searchTerm: string, 
  learningGoal: string
): any[] {
  return quizzes.map(quiz => ({
    searchTerm: searchTerm,
    learningGoal: learningGoal,
    video_id: quiz.video_id,
    question: quiz.question,
    answer: quiz.answer,
    difficulty: quiz.difficulty,
    created_at: new Date().toISOString()
  }));
}

/**
 * Get environment variable (works in both Node.js and Deno)
 */
function getEnvVar(name: string): string | undefined {
  // Deno environment
  if (typeof Deno !== 'undefined') {
    return Deno.env.get(name);
  }
  
  // Node.js environment
  if (typeof process !== 'undefined') {
    return process.env[name];
  }
  
  return undefined;
}
