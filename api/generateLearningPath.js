/**
 * Dynamic Learning Path Generation API
 * 
 * POST /api/generateLearningPath
 * Body: { "searchTerm": "react", "learningGoal": "intermediate" }
 * 
 * Logic:
 * 1. Check if videos already exist for this searchTerm + learningGoal
 * 2. If exists, return them immediately
 * 3. If not exists:
 *    - Check if generation is already in progress
 *    - If in progress, return status
 *    - If not, start generation process
 *    - Return generation status
 */

import { createClient } from '@supabase/supabase-js';
import { generateLearningPath } from '../scripts/learningPathGenerator.js';
import { normalizeTopicPair, isNormalized } from '../src/utils/normalizeInput.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchTerm, learningGoal } = req.body;

    // Validate input
    if (!searchTerm || !learningGoal) {
      return res.status(400).json({ 
        error: 'Missing required fields: searchTerm and learningGoal' 
      });
    }

    // Apply comprehensive normalization
    const { searchTerm: normalizedSearchTerm, learningGoal: normalizedLearningGoal } = normalizeTopicPair(searchTerm, learningGoal);
    
    // Validate normalization results
    if (!normalizedSearchTerm || !normalizedLearningGoal) {
      return res.status(400).json({ 
        error: 'Invalid input: searchTerm and learningGoal must contain valid characters' 
      });
    }
    
    // Log normalization for debugging
    if (searchTerm !== normalizedSearchTerm || learningGoal !== normalizedLearningGoal) {
      console.log(`🔄 Normalized input: "${searchTerm}" → "${normalizedSearchTerm}", "${learningGoal}" → "${normalizedLearningGoal}"`);
    }

    console.log(`🔍 Checking for existing content: ${normalizedSearchTerm} + ${normalizedLearningGoal}`);

    // Step 1: Check if videos already exist
    const { data: existingVideos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('searchTerm', normalizedSearchTerm)
      .eq('learningGoal', normalizedLearningGoal);

    if (videosError) {
      console.error('Error checking existing videos:', videosError);
      return res.status(500).json({ error: 'Database error checking videos' });
    }

    // If videos exist, return them immediately
    if (existingVideos && existingVideos.length > 0) {
      console.log(`✅ Found ${existingVideos.length} existing videos`);
      return res.status(200).json({
        status: 'exists',
        videos: existingVideos,
        message: `Found ${existingVideos.length} videos for ${searchTerm} + ${learningGoal}`
      });
    }

    // Step 2: Check if generation is already in progress
    const { data: inProgressLogs, error: logsError } = await supabase
      .from('generation_logs')
      .select('*')
      .eq('searchTerm', normalizedSearchTerm)
      .eq('learningGoal', normalizedLearningGoal)
      .in('status', ['started', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(1);

    if (logsError) {
      console.error('Error checking generation logs:', logsError);
      return res.status(500).json({ error: 'Database error checking logs' });
    }

    // If generation is in progress, return status
    if (inProgressLogs && inProgressLogs.length > 0) {
      const recentLog = inProgressLogs[0];
      const minutesAgo = Math.floor((new Date() - new Date(recentLog.started_at)) / 60000);
      
      console.log(`⏳ Generation in progress (started ${minutesAgo} minutes ago)`);
      
      return res.status(202).json({
        status: 'in_progress',
        message: `Learning path generation in progress for ${searchTerm} + ${learningGoal}`,
        started_at: recentLog.started_at,
        minutes_elapsed: minutesAgo
      });
    }

    // Step 3: Check/add to requested_topics to prevent duplicates
    const { error: requestError } = await supabase
      .from('requested_topics')
      .upsert({
        searchTerm: normalizedSearchTerm,
        learningGoal: normalizedLearningGoal
      }, {
        onConflict: 'searchTerm,learningGoal'
      });

    if (requestError) {
      console.error('Error adding to requested_topics:', requestError);
      // Continue anyway - this is not critical
    }

    // Step 4: Start generation process
    console.log(`🚀 Starting generation for: ${normalizedSearchTerm} + ${normalizedLearningGoal}`);

    // Create generation log entry
    const { data: logEntry, error: logError } = await supabase
      .from('generation_logs')
      .insert({
        searchTerm: normalizedSearchTerm,
        learningGoal: normalizedLearningGoal,
        status: 'started'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating generation log:', logError);
      return res.status(500).json({ error: 'Failed to start generation process' });
    }

    // Start generation in background (don't await)
    generateLearningPathBackground(normalizedSearchTerm, normalizedLearningGoal, logEntry.id);

    return res.status(202).json({
      status: 'started',
      message: `Learning path generation started for ${searchTerm} + ${learningGoal}`,
      log_id: logEntry.id,
      estimated_time: '2-5 minutes'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Background generation function
 * Runs the actual learning path generation without blocking the API response
 */
async function generateLearningPathBackground(searchTerm, learningGoal, logId) {
  try {
    console.log(`📚 Background generation started for: ${searchTerm} + ${learningGoal}`);

    // Update status to in_progress
    await supabase
      .from('generation_logs')
      .update({ status: 'in_progress' })
      .eq('id', logId);

    // Run the actual generation
    const result = await generateLearningPath(searchTerm, learningGoal);

    // Update log with success
    await supabase
      .from('generation_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        videos_generated: result.videosCount || 0,
        quizzes_generated: result.quizzesCount || 0
      })
      .eq('id', logId);

    // Remove from requested_topics
    await supabase
      .from('requested_topics')
      .delete()
      .eq('searchTerm', searchTerm)
      .eq('learningGoal', learningGoal);

    console.log(`✅ Generation completed: ${result.videosCount} videos, ${result.quizzesCount} quizzes`);

  } catch (error) {
    console.error(`❌ Generation failed for ${searchTerm} + ${learningGoal}:`, error);

    // Update log with failure
    await supabase
      .from('generation_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', logId);

    // Keep in requested_topics for retry
  }
}
