#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config.json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Function to get requested topics from Supabase
async function getRequestedTopics() {
  try {
    const { data, error } = await supabase
      .from('requested_topics')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching requested topics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRequestedTopics:', error);
    return [];
  }
}

// Function to remove processed topic from requested_topics
async function removeRequestedTopic(id) {
  try {
    const { error } = await supabase
      .from('requested_topics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing requested topic:', error);
    } else {
      console.log(`✅ Removed processed topic: ${id}`);
    }
  } catch (error) {
    console.error('Error in removeRequestedTopic:', error);
  }
}

// Environment variables
const YT_API_KEY = process.env.YT_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Note: supabase client already initialized above

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  });
  
  return params;
}

// YouTube Search API
async function youtubeSearch(searchTerm, learningGoal) {
  const query = `${searchTerm} ${learningGoal} tutorial`;
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('maxResults', config.youtube.maxResults);
  url.searchParams.append('q', query);
  url.searchParams.append('type', 'video');
  url.searchParams.append('videoDuration', config.youtube.videoDuration);
  url.searchParams.append('safeSearch', config.youtube.safeSearch);
  url.searchParams.append('videoEmbeddable', config.youtube.videoEmbeddable);
  url.searchParams.append('key', YT_API_KEY);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`YouTube Search API error: ${data.error?.message || response.statusText}`);
  }
  
  return data.items || [];
}

// YouTube Statistics API
async function youtubeStats(videoIds) {
  if (!videoIds.length) return [];
  
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.append('part', 'statistics');
  url.searchParams.append('id', videoIds.join(','));
  url.searchParams.append('key', YT_API_KEY);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`YouTube Stats API error: ${data.error?.message || response.statusText}`);
  }
  
  return data.items || [];
}

// Merge search results with statistics
function mergeStats(searchResults, statsResults, searchTerm, learningGoal) {
  const statsById = {};
  statsResults.forEach(stat => {
    if (stat && stat.id) {
      statsById[stat.id] = stat.statistics || {};
    }
  });
  
  return searchResults.map(video => ({
    id: video.id.videoId,
    title: video.snippet.title,
    url: `https://youtube.com/watch?v=${video.id.videoId}`,
    publishedAt: video.snippet.publishedAt,
    channel: video.snippet.channelTitle,
    thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
    stats: statsById[video.id.videoId] || {},
    searchTerm,
    learningGoal,
    timestamp: new Date().toISOString()
  }));
}

// Rank videos based on engagement metrics
function rankVideos(videos) {
  function safeInt(value) {
    return parseInt(value || '0', 10);
  }
  
  // Find max views for normalization
  const maxViews = Math.max(...videos.map(v => safeInt(v.stats?.viewCount)), 1);
  
  const ranked = videos.map(v => {
    const views = safeInt(v.stats?.viewCount);
    const likes = safeInt(v.stats?.likeCount);
    const comments = safeInt(v.stats?.commentCount);
    
    const likeRatio = views > 0 ? likes / views : 0;
    const commentRatio = views > 0 ? comments / views : 0;
    
    const published = new Date(v.publishedAt);
    const ageYears = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const recency = 1 / (1 + ageYears);
    
    const viewsNorm = Math.log10(views + 1) / Math.log10(maxViews + 1);
    
    const score = 
      (viewsNorm * config.ranking.weights.views) +
      (likeRatio * config.ranking.weights.likeRatio) +
      (commentRatio * config.ranking.weights.commentRatio) +
      (recency * config.ranking.weights.recency);
    
    return {
      ...v,
      score: parseFloat(score.toFixed(4))
    };
  });
  
  // Sort by score and add rank
  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((v, idx) => ({ ...v, rank: idx + 1 }));
}

// Prepare top K videos for LLM
function prepareTopK(rankedVideos) {
  const topVideos = rankedVideos
    .slice(0, config.ranking.topK)
    .map(video => ({
      id: video.id,
      title: video.title,
      url: video.url,
      publishedAt: video.publishedAt,
      channel: video.channel,
      thumbnail: video.thumbnail,
      stats: video.stats,
      searchTerm: video.searchTerm,
      learningGoal: video.learningGoal,
      timestamp: video.timestamp,
      rank: video.rank
    }));
  
  return {
    videos: topVideos,
    searchTerm: topVideos[0]?.searchTerm || '',
    learningGoal: topVideos[0]?.learningGoal || ''
  };
}

// Call Groq LLM API
async function callLLM(topVideosData) {
  const prompt = config.llm.prompt
    .replace('{searchTerm}', topVideosData.searchTerm)
    .replace('{learningGoal}', topVideosData.learningGoal)
    .replace('{videos}', JSON.stringify(topVideosData.videos));
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${data.error?.message || response.statusText}`);
  }
  
  return data.choices[0].message.content;
}

// Sanitize LLM output
function sanitizeLLMOutput(rawOutput) {
  // Remove code fences
  let sanitized = rawOutput
    .replace(/```json/i, '')
    .replace(/```/g, '')
    .trim();
  
  // Fix unescaped newlines inside JSON strings
  sanitized = sanitized.replace(/"(?:[^"\\]|\\.)*"/gs, (match) => {
    return match.replace(/\n/g, '\\n');
  });
  
  // Clean tabs/carriage returns
  sanitized = sanitized
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u0000/g, '');
  
  try {
    const parsed = JSON.parse(sanitized);
    return parsed;
  } catch (e) {
    throw new Error(`Invalid JSON after sanitization: ${e.message}`);
  }
}

// Flatten videos from learning path
function flattenVideosFromLearningPath(learningPath, searchTerm, learningGoal) {
  return learningPath.map((video, idx) => {
    const videoId = video.url?.match(/v=([0-9A-Za-z_-]{11})/)?.[1] || video.url || `video-${idx + 1}`;
    
    return {
      id: videoId,
      search_term: searchTerm,
      learning_goal: learningGoal,
      title: video.title || 'Untitled Video',
      url: video.url || '',
      summary: video.summary || 'No summary available.',
      level: video.level || 'Beginner',
      channel: video.channel || 'Unknown Channel',
      thumbnail: video.thumbnail || (videoId && !videoId.startsWith('video-') 
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
        : ''),
      created_at: new Date().toISOString()
    };
  });
}

// Flatten quizzes from learning path
function flattenQuizzesFromLearningPath(learningPath, searchTerm, learningGoal) {
  const quizzes = [];
  
  learningPath.forEach(video => {
    const videoId = video.url?.match(/v=([0-9A-Za-z_-]{11})/)?.[1] || video.url;
    
    if (Array.isArray(video.quizzes)) {
      video.quizzes.forEach(quiz => {
        quizzes.push({
          video_id: videoId,
          search_term: searchTerm,
          learning_goal: learningGoal,
          title: video.title || '',
          url: video.url || '',
          level: video.level || '',
          difficulty: quiz.difficulty || '',
          question: quiz.question || '',
          answer: quiz.answer || '',
          created_at: new Date().toISOString()
        });
      });
    }
  });
  
  return quizzes;
}

// Save to Supabase or fallback to JSON files
async function saveToSupabase(videos, quizzes) {
  if (supabase) {
    try {
      console.log('💾 Saving to Supabase...');
      
      // Upsert videos
      const { error: videosError } = await supabase
        .from(config.supabase.tables.videos)
        .upsert(videos, { onConflict: 'id' });
      
      if (videosError) throw videosError;
      
      // Upsert quizzes
      const { error: quizzesError } = await supabase
        .from(config.supabase.tables.quizzes)
        .upsert(quizzes, { onConflict: 'video_id,question' });
      
      if (quizzesError) throw quizzesError;
      
      console.log(`✅ Successfully saved ${videos.length} videos and ${quizzes.length} quizzes to Supabase`);
      return true;
    } catch (error) {
      console.error('❌ Supabase save failed:', error.message);
      console.log('📁 Falling back to JSON files...');
    }
  }
  
  // Fallback to JSON files
  const outDir = path.join(__dirname, '..', 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outDir, 'videos.json'), JSON.stringify(videos, null, 2));
  fs.writeFileSync(path.join(outDir, 'quizzes.json'), JSON.stringify(quizzes, null, 2));
  
  console.log(`📁 Saved ${videos.length} videos and ${quizzes.length} quizzes to JSON files`);
  return false;
}

// Main orchestrator function
async function main() {
  const args = parseArgs();
  let topicsToProcess = [];
  
  // Check if specific topic/goal provided via CLI
  if (args.topic || args.goal) {
    const topic = args.topic || 'python';
    const goal = args.goal || 'beginner';
    topicsToProcess.push({ searchTerm: topic, learningGoal: goal, id: null });
  } else {
    // Get requested topics from database
    console.log('📋 Checking for requested topics...');
    const requestedTopics = await getRequestedTopics();
    
    if (requestedTopics.length === 0) {
      console.log('ℹ️ No requested topics found. Processing default topics...');
      // Default topics if none requested
      topicsToProcess = [
        { searchTerm: 'python', learningGoal: 'beginner', id: null },
        { searchTerm: 'javascript', learningGoal: 'beginner', id: null },
        { searchTerm: 'react', learningGoal: 'intermediate', id: null },
        { searchTerm: 'nodejs', learningGoal: 'advanced', id: null }
      ];
    } else {
      console.log(`📝 Found ${requestedTopics.length} requested topics`);
      topicsToProcess = requestedTopics.map(topic => ({
        searchTerm: topic.searchTerm,
        learningGoal: topic.learningGoal,
        id: topic.id
      }));
    }
  }
  
  // Validate environment variables
  if (!YT_API_KEY) {
    console.error('❌ Missing YT_API_KEY environment variable');
    process.exit(1);
  }
  
  if (!GROQ_API_KEY) {
    console.error('❌ Missing GROQ_API_KEY environment variable');
    process.exit(1);
  }
  
  // Process each topic
  for (const topicData of topicsToProcess) {
    const { searchTerm: topic, learningGoal: goal, id } = topicData;
    
    console.log(`\n🚀 Starting learning path generation for: ${topic} (${goal})`);
    
    try {
      // Step 1: YouTube search
      console.log('🔍 Searching YouTube...');
      const searchResults = await youtubeSearch(topic);
      
      // Step 2: Get video statistics
      console.log('📊 Fetching video statistics...');
      const statsResults = await youtubeStats(searchResults);
      
      // Step 3: Merge data
      console.log('🔗 Merging search and stats data...');
      const mergedData = mergeStats(searchResults, statsResults);
      
      // Step 4: Rank videos
      console.log('🏆 Ranking videos...');
      const rankedVideos = rankVideos(mergedData);
      
      // Step 5: Prepare top K for LLM
      console.log(`🎯 Selecting top ${config.ranking.topK} videos...`);
      const topVideosData = prepareTopK(rankedVideos);
      
      // Step 6: Call LLM
      console.log('🤖 Generating learning path with LLM...');
      const llmOutput = await callLLM(topVideosData);
      
      // Step 7: Sanitize output
      console.log('🧹 Sanitizing LLM output...');
      const sanitizedData = sanitizeLLMOutput(llmOutput);
      const learningPath = sanitizedData.learning_path || [];
      
      if (learningPath.length === 0) {
        console.log('❌ No learning path generated');
        continue;
      }
      
      // Step 8: Flatten data
      console.log('📋 Flattening data for storage...');
      const videos = flattenVideosFromLearningPath(learningPath, topic, goal);
      const quizzes = flattenQuizzesFromLearningPath(learningPath, topic, goal);
      
      // Step 9: Save to database
      await saveToSupabase(videos, quizzes);
      
      // Step 10: Remove from requested_topics if it was a user request
      if (id) {
        await removeRequestedTopic(id);
      }
      
      console.log(`🎉 Learning path generation completed for ${topic} (${goal})!`);
      
    } catch (error) {
      console.error(`💥 Error processing ${topic} (${goal}):`, error.message);
      // Continue with next topic instead of exiting
      continue;
    }
  }
  
  console.log('\n✅ All topics processed successfully!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  youtubeSearch,
  youtubeStats,
  mergeStats,
  rankVideos,
  prepareTopK,
  callLLM,
  sanitizeLLMOutput,
  flattenVideosFromLearningPath,
  flattenQuizzesFromLearningPath,
  saveToSupabase,
  main
};
