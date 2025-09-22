# Supabase Edge Function Setup Guide

This guide explains how to deploy and configure the LearnHub Edge Function for dynamic learning path generation.

## 🚀 Edge Function Deployment

### 1. Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref csrggvuucfyeaxdunrjy
```

### 2. Deploy the Edge Function

```bash
# Deploy the super-task function
supabase functions deploy super-task

# Verify deployment
supabase functions list
```

### 3. Configure Environment Variables

In your Supabase Dashboard → Settings → Edge Functions → Environment Variables, add:

```bash
# Required Variables
SUPABASE_URL=https://csrggvuucfyeaxdunrjy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional API Keys (function will use mock data if missing)
YT_API_KEY=your_youtube_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## 🔧 Environment Variable Setup

### YouTube API Key (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials → API Key
5. Restrict the key to YouTube Data API v3
6. Add to Supabase Edge Function environment

### Groq API Key (Optional)

1. Sign up at [Groq Console](https://console.groq.com/)
2. Create a new API key
3. Add to Supabase Edge Function environment

### Supabase Service Role Key

1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (not the `anon` key)
3. Add to Edge Function environment

## 📡 Edge Function Endpoints

### Production Endpoint
```
POST https://csrggvuucfyeaxdunrjy.functions.supabase.co/super-task
```

### Local Development Endpoint
```
POST http://localhost:54321/functions/v1/super-task
```

## 🧪 Testing the Edge Function

### Using curl

```bash
# Test the Edge Function
curl -X POST https://csrggvuucfyeaxdunrjy.functions.supabase.co/super-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "searchTerm": "python",
    "learningGoal": "beginner"
  }'
```

### Expected Responses

**Content Already Exists:**
```json
{
  "status": "exists",
  "videos": [...],
  "message": "Found 5 videos for python + beginner"
}
```

**Generation Started:**
```json
{
  "status": "success",
  "inserted": {
    "videos": 5,
    "quizzes": 15
  },
  "message": "Successfully generated learning path for python + beginner",
  "log_id": "uuid-here"
}
```

**Generation In Progress:**
```json
{
  "status": "in_progress",
  "message": "Learning path generation in progress for python + beginner",
  "minutes_elapsed": 2
}
```

## 🔍 Monitoring & Debugging

### View Edge Function Logs

```bash
# Real-time logs
supabase functions logs super-task --follow

# Recent logs
supabase functions logs super-task
```

### Database Monitoring

```sql
-- Check generation logs
SELECT * FROM generation_logs 
ORDER BY started_at DESC 
LIMIT 10;

-- Check requested topics
SELECT * FROM requested_topics 
ORDER BY created_at DESC;

-- View generated content
SELECT DISTINCT "searchTerm", "learningGoal", COUNT(*) as video_count
FROM videos 
GROUP BY "searchTerm", "learningGoal"
ORDER BY video_count DESC;
```

## 🚨 Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Ensure function is deployed: `supabase functions list`
   - Check project linking: `supabase status`

2. **"Environment variable not set" error**
   - Verify variables in Supabase Dashboard → Settings → Edge Functions
   - Redeploy function after adding variables

3. **"Database connection failed" error**
   - Check SUPABASE_SERVICE_ROLE_KEY is correct
   - Ensure RLS policies allow service role access

4. **"YouTube API quota exceeded" error**
   - Function will fallback to mock data
   - Consider upgrading YouTube API quota

5. **"Groq API rate limit" error**
   - Function will fallback to basic processing
   - Consider upgrading Groq plan

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=true
```

## 🔄 Local Development

### Run Edge Function Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test locally
curl -X POST http://localhost:54321/functions/v1/super-task \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "react",
    "learningGoal": "intermediate"
  }'
```

### Environment Variables for Local Development

Create `.env` file in project root:
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
YT_API_KEY=your_youtube_api_key
GROQ_API_KEY=your_groq_api_key
```

## 📊 Performance Considerations

- **Cold Start**: First request may take 2-3 seconds
- **Concurrent Requests**: Function handles multiple requests efficiently
- **Rate Limiting**: YouTube API has daily quotas
- **Timeout**: Function has 60-second timeout limit
- **Memory**: Function uses up to 512MB memory

## 🔐 Security

- Service role key has full database access
- API keys are stored securely in Supabase
- All requests are logged for monitoring
- Input validation prevents injection attacks
- CORS headers allow frontend access

## 📈 Scaling

The Edge Function automatically scales based on demand:
- **Low traffic**: Single instance
- **High traffic**: Multiple instances
- **Global**: Deployed to multiple regions
- **Monitoring**: Built-in metrics and logging
