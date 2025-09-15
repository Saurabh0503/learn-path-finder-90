import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { topic, goal } = await req.json()
    
    if (!topic || !goal) {
      return new Response(
        JSON.stringify({ error: 'Missing topic or goal parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const webhookUrl = `https://dhanwai.app.n8n.cloud/webhook-test/youtube-learning?topic=${encodeURIComponent(topic)}&goal=${encodeURIComponent(goal)}`
    
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'x-api-key': Deno.env.get('WEBHOOK_KEY') || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error fetching videos:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch videos from learning platform' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})