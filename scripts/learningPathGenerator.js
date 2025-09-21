#!/usr/bin/env node

/**
 * Dynamic Learning Path Generator
 * 
 * Refactored from fetch_and_update.js to support dynamic topic/goal generation
 * Can be used both as a standalone script and as an importable module
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeTopicPair, isNormalized } from '../src/utils/normalizeInput.js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Main function to generate learning path for any topic/goal combination
 * @param {string} searchTerm - The topic to search for (e.g., "react", "python")
 * @param {string} learningGoal - The difficulty level (e.g., "beginner", "intermediate")
 * @returns {Promise<{videosCount: number, quizzesCount: number}>}
 */
export async function generateLearningPath(searchTerm, learningGoal) {
  // Apply normalization to ensure consistency
  const { searchTerm: normalizedSearchTerm, learningGoal: normalizedLearningGoal } = normalizeTopicPair(searchTerm, learningGoal);
  
  // Log normalization if values changed
  if (searchTerm !== normalizedSearchTerm || learningGoal !== normalizedLearningGoal) {
    console.log(`🔄 Normalized inputs: "${searchTerm}" → "${normalizedSearchTerm}", "${learningGoal}" → "${normalizedLearningGoal}"`);
  }
  
  console.log(`🚀 Starting learning path generation for: ${normalizedSearchTerm} + ${normalizedLearningGoal}`);
  
  try {
    // Step 1: Fetch videos from YouTube via n8n webhook
    const videos = await fetchVideosFromYouTube(normalizedSearchTerm, normalizedLearningGoal);
    console.log(`📹 Fetched ${videos.length} videos from YouTube`);

    if (videos.length === 0) {
      throw new Error(`No videos found for topic: ${normalizedSearchTerm}`);
    }

    // Step 2: Process videos with Groq LLM for ranking and summaries
    const processedVideos = await processVideosWithGroq(videos, normalizedSearchTerm, normalizedLearningGoal);
    console.log(`🧠 Processed ${processedVideos.length} videos with AI`);

    // Step 3: Generate quizzes for each video
    const quizzes = await generateQuizzesForVideos(processedVideos, normalizedSearchTerm, normalizedLearningGoal);
    console.log(`❓ Generated ${quizzes.length} quizzes`);

    // Step 4: Insert videos into Supabase (using normalized values)
    const videosToInsert = flattenVideosFromLearningPath(processedVideos, normalizedSearchTerm, normalizedLearningGoal);
    const { error: videosError } = await supabase
      .from('videos')
      .upsert(videosToInsert, { onConflict: 'id' });

    if (videosError) {
      throw new Error(`Failed to insert videos: ${videosError.message}`);
    }

    // Step 5: Insert quizzes into Supabase (using normalized values)
    const quizzesToInsert = flattenQuizzesFromLearningPath(quizzes, normalizedSearchTerm, normalizedLearningGoal);
    const { error: quizzesError } = await supabase
      .from('quizzes')
      .insert(quizzesToInsert);

    if (quizzesError) {
      console.warn(`Warning: Some quizzes failed to insert: ${quizzesError.message}`);
    }

    console.log(`✅ Successfully generated learning path:`);
    console.log(`   📹 Videos: ${videosToInsert.length}`);
    console.log(`   ❓ Quizzes: ${quizzesToInsert.length}`);

    return {
      videosCount: videosToInsert.length,
      quizzesCount: quizzesToInsert.length
    };

  } catch (error) {
    console.error(`❌ Failed to generate learning path for ${normalizedSearchTerm} + ${normalizedLearningGoal}:`, error);
    throw error;
  }
}

/**
 * Fetch videos from YouTube via n8n webhook
 */
async function fetchVideosFromYouTube(searchTerm, learningGoal) {
  if (!N8N_WEBHOOK_URL) {
    console.warn('⚠️  N8N_WEBHOOK_URL not configured, using mock data');
    return getMockVideos(searchTerm, learningGoal);
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: searchTerm,
        goal: learningGoal,
        maxResults: 10
      })
    });

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.videos || [];

  } catch (error) {
    console.warn(`⚠️  YouTube API failed, using mock data: ${error.message}`);
    return getMockVideos(searchTerm, learningGoal);
  }
}

/**
 * Process videos with Groq LLM for ranking and summaries
 */
async function processVideosWithGroq(videos, searchTerm, learningGoal) {
  if (!GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not configured, using basic processing');
    return videos.map(video => ({
      ...video,
      summary: `Learn ${searchTerm} concepts at ${learningGoal} level through this comprehensive video tutorial.`,
      level: learningGoal,
      score: Math.random() * 100
    }));
  }

  try {
    // Use Groq to rank and summarize videos
    const prompt = `
      Analyze these YouTube videos for learning ${searchTerm} at ${learningGoal} level.
      Rank them by educational value and create summaries.
      
      Videos: ${JSON.stringify(videos.map(v => ({ title: v.title, description: v.description })))}
      
      Return JSON with ranked videos including summaries and scores (0-100).
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data = await response.json();
    const processedData = JSON.parse(data.choices[0].message.content);
    
    return processedData.videos || videos;

  } catch (error) {
    console.warn(`⚠️  Groq processing failed, using basic processing: ${error.message}`);
    return videos.map(video => ({
      ...video,
      summary: `Learn ${searchTerm} concepts at ${learningGoal} level through this comprehensive video tutorial.`,
      level: learningGoal,
      score: Math.random() * 100
    }));
  }
}

/**
 * Generate quizzes for videos using Groq LLM
 */
async function generateQuizzesForVideos(videos, searchTerm, learningGoal) {
  const quizzes = [];

  for (const video of videos.slice(0, 5)) { // Limit to first 5 videos
    try {
      const quiz = await generateQuizForVideo(video, searchTerm, learningGoal);
      if (quiz) {
        quizzes.push({
          video,
          quizzes: [quiz]
        });
      }
    } catch (error) {
      console.warn(`⚠️  Failed to generate quiz for video ${video.title}: ${error.message}`);
    }
  }

  return quizzes;
}

/**
 * Generate a single quiz for a video
 */
async function generateQuizForVideo(video, searchTerm, learningGoal) {
  if (!GROQ_API_KEY) {
    return {
      difficulty: learningGoal === 'beginner' ? 'easy' : learningGoal === 'advanced' ? 'hard' : 'medium',
      question: `What is a key concept covered in this ${searchTerm} video?`,
      answer: `This video covers important ${searchTerm} concepts suitable for ${learningGoal} level learners.`
    };
  }

  try {
    const prompt = `
      Create a quiz question for this ${searchTerm} video at ${learningGoal} level:
      Title: ${video.title}
      Summary: ${video.summary || video.description}
      
      Return JSON with: { "difficulty": "easy|medium|hard", "question": "...", "answer": "..." }
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);

  } catch (error) {
    console.warn(`Quiz generation failed: ${error.message}`);
    return {
      difficulty: learningGoal === 'beginner' ? 'easy' : learningGoal === 'advanced' ? 'hard' : 'medium',
      question: `What is a key concept covered in this ${searchTerm} video?`,
      answer: `This video covers important ${searchTerm} concepts suitable for ${learningGoal} level learners.`
    };
  }
}

/**
 * Flatten videos from learning path for database insertion
 */
function flattenVideosFromLearningPath(learningPath, searchTerm, learningGoal) {
  return learningPath.map((video, idx) => {
    const videoId = video.url?.match(/v=([0-9A-Za-z_-]{11})/)?.[1] || video.url || `video-${idx + 1}`;
    
    return {
      id: videoId,
      searchTerm: searchTerm,
      learningGoal: learningGoal,
      title: video.title || 'Untitled Video',
      url: video.url || '',
      summary: video.summary || 'No summary available.',
      level: video.level || learningGoal,
      channel: video.channel || 'Unknown Channel',
      thumbnail_url: video.thumbnail || (videoId && !videoId.startsWith('video-') 
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
        : ''),
      score: video.score || 0,
      rank: idx + 1,
      created_at: new Date().toISOString()
    };
  });
}

/**
 * Flatten quizzes from learning path for database insertion
 */
function flattenQuizzesFromLearningPath(quizData, searchTerm, learningGoal) {
  const quizzes = [];
  
  quizData.forEach(item => {
    const videoId = item.video.url?.match(/v=([0-9A-Za-z_-]{11})/)?.[1] || item.video.url;
    
    if (Array.isArray(item.quizzes)) {
      item.quizzes.forEach(quiz => {
        quizzes.push({
          video_id: videoId,
          searchTerm: searchTerm,
          learningGoal: learningGoal,
          title: item.video.title || '',
          url: item.video.url || '',
          level: item.video.level || learningGoal,
          difficulty: quiz.difficulty || 'medium',
          question: quiz.question || '',
          answer: quiz.answer || '',
          created_at: new Date().toISOString()
        });
      });
    }
  });
  
  return quizzes;
}

/**
 * Get mock videos for testing when APIs are not available
 */
function getMockVideos(searchTerm, learningGoal) {
  return [
    {
      title: `${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} Tutorial for ${learningGoal.charAt(0).toUpperCase() + learningGoal.slice(1)}s`,
      url: `https://youtube.com/watch?v=mock${Date.now()}`,
      description: `Comprehensive ${searchTerm} tutorial designed for ${learningGoal} level learners`,
      channel: 'Learning Academy',
      thumbnail: `https://img.youtube.com/vi/mock${Date.now()}/hqdefault.jpg`
    },
    {
      title: `Advanced ${searchTerm} Concepts`,
      url: `https://youtube.com/watch?v=mock${Date.now() + 1}`,
      description: `Deep dive into ${searchTerm} for ${learningGoal} developers`,
      channel: 'Tech Masters',
      thumbnail: `https://img.youtube.com/vi/mock${Date.now() + 1}/hqdefault.jpg`
    }
  ];
}

// CLI usage - if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const searchTerm = process.argv[2];
  const learningGoal = process.argv[3];

  if (!searchTerm || !learningGoal) {
    console.error('Usage: node learningPathGenerator.js <searchTerm> <learningGoal>');
    console.error('Example: node learningPathGenerator.js react intermediate');
    process.exit(1);
  }

  generateLearningPath(searchTerm, learningGoal)
    .then(result => {
      console.log('🎉 Generation completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Generation failed:', error);
      process.exit(1);
    });
}
