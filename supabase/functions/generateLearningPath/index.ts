import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import the shared generator logic
import { generateLearningPathCore } from '../../../src/lib/generateLearningPath.ts'
import { normalizeTopicPair } from '../../../src/utils/normalizeInput.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { searchTerm, learningGoal } = await req.json()

    // Validate input
    if (!searchTerm || !learningGoal) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: searchTerm and learningGoal' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Apply comprehensive normalization
    const { searchTerm: normalizedSearchTerm, learningGoal: normalizedLearningGoal } = 
      normalizeTopicPair(searchTerm, learningGoal)
    
    // Validate normalization results
    if (!normalizedSearchTerm || !normalizedLearningGoal) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input: searchTerm and learningGoal must contain valid characters' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🔍 Edge Function: Checking for existing content: ${normalizedSearchTerm} + ${normalizedLearningGoal}`)

    // Step 1: Check if videos already exist
    const { data: existingVideos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('searchTerm', normalizedSearchTerm)
      .eq('learningGoal', normalizedLearningGoal)

    if (videosError) {
      console.error('Error checking existing videos:', videosError)
      return new Response(
        JSON.stringify({ 
          error: 'Database query failed',
          details: videosError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If videos exist, return success with existing content
    if (existingVideos && existingVideos.length > 0) {
      console.log(`✅ Found ${existingVideos.length} existing videos`)
      return new Response(
        JSON.stringify({ 
          status: 'exists',
          videos: existingVideos,
          message: `Found ${existingVideos.length} videos for ${normalizedSearchTerm} + ${normalizedLearningGoal}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 2: Check if generation is already in progress
    const { data: existingRequest, error: requestError } = await supabase
      .from('requested_topics')
      .select('*')
      .eq('searchTerm', normalizedSearchTerm)
      .eq('learningGoal', normalizedLearningGoal)
      .single()

    if (requestError && requestError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking requested topics:', requestError)
      return new Response(
        JSON.stringify({ 
          error: 'Database query failed',
          details: requestError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If generation is already in progress
    if (existingRequest) {
      const minutesElapsed = Math.floor(
        (new Date().getTime() - new Date(existingRequest.created_at).getTime()) / (1000 * 60)
      )
      
      console.log(`⏳ Generation already in progress for ${minutesElapsed} minutes`)
      return new Response(
        JSON.stringify({ 
          status: 'in_progress',
          message: `Learning path generation in progress for ${normalizedSearchTerm} + ${normalizedLearningGoal}`,
          minutes_elapsed: minutesElapsed
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 3: Start generation process
    console.log(`🚀 Starting generation for: ${normalizedSearchTerm} + ${normalizedLearningGoal}`)

    // Mark as requested to prevent duplicate generations
    const { error: insertError } = await supabase
      .from('requested_topics')
      .insert({
        searchTerm: normalizedSearchTerm,
        learningGoal: normalizedLearningGoal
      })

    if (insertError) {
      console.error('Error inserting requested topic:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to start generation process',
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create generation log entry
    const logId = crypto.randomUUID()
    const { error: logError } = await supabase
      .from('generation_logs')
      .insert({
        id: logId,
        searchTerm: normalizedSearchTerm,
        learningGoal: normalizedLearningGoal,
        status: 'started',
        started_at: new Date().toISOString()
      })

    if (logError) {
      console.warn('Warning: Failed to create generation log:', logError)
    }

    try {
      // Step 4: Generate learning path using shared core logic
      const result = await generateLearningPathCore(
        normalizedSearchTerm, 
        normalizedLearningGoal,
        supabase
      )

      // Update generation log with success
      await supabase
        .from('generation_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          videos_count: result.videosCount,
          quizzes_count: result.quizzesCount
        })
        .eq('id', logId)

      // Remove from requested topics
      await supabase
        .from('requested_topics')
        .delete()
        .eq('searchTerm', normalizedSearchTerm)
        .eq('learningGoal', normalizedLearningGoal)

      console.log(`✅ Generation completed: ${result.videosCount} videos, ${result.quizzesCount} quizzes`)

      return new Response(
        JSON.stringify({ 
          status: 'success',
          inserted: {
            videos: result.videosCount,
            quizzes: result.quizzesCount
          },
          message: `Successfully generated learning path for ${normalizedSearchTerm} + ${normalizedLearningGoal}`,
          log_id: logId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (generationError) {
      console.error('Generation failed:', generationError)

      // Update generation log with failure
      await supabase
        .from('generation_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: generationError.message
        })
        .eq('id', logId)

      // Remove from requested topics to allow retry
      await supabase
        .from('requested_topics')
        .delete()
        .eq('searchTerm', normalizedSearchTerm)
        .eq('learningGoal', normalizedLearningGoal)

      return new Response(
        JSON.stringify({ 
          error: 'Generation failed',
          details: generationError.message,
          log_id: logId
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
