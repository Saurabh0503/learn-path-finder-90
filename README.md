# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/56d1e286-7ba5-427f-9148-ea463b739ad1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/56d1e286-7ba5-427f-9148-ea463b739ad1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/56d1e286-7ba5-427f-9148-ea463b739ad1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Replacing n8n with code

This project has migrated from n8n workflow automation to a code-first approach for better maintainability and version control.

### Local Development

To run the learning path generation locally:

1. **Set up environment variables:**
   ```bash
   export YT_API_KEY="your_youtube_api_key"
   export GROQ_API_KEY="your_groq_api_key" 
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_KEY="your_supabase_anon_key"
   ```

2. **Run the script:**
   ```bash
   # Generate learning path for Python beginners
   npm run update-learning-path
   
   # Or run directly with custom parameters
   node scripts/fetch_and_update.js --topic=javascript --goal=intermediate
   ```

### Configuration

Edit `scripts/config.json` to customize:

- **YouTube API settings:** Search parameters, video filters
- **Ranking weights:** How videos are scored (views, likes, comments, recency)
- **LLM settings:** Model, temperature, prompt template
- **Top K videos:** Number of videos to process with LLM

### Required Secrets

Set these in your GitHub repository secrets for automated runs:

- `YT_API_KEY`: YouTube Data API v3 key
- `GROQ_API_KEY`: Groq API key for LLM processing
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/service key

### Automated Updates

The GitHub Actions workflow runs daily at 2 AM UTC and updates learning paths for:
- Python (beginner)
- JavaScript (beginner) 
- React (intermediate)
- Node.js (advanced)

You can also trigger manual updates via GitHub Actions with custom topics and goals.

### Fallback Behavior

If Supabase is unavailable, the script will save data to `out/videos.json` and `out/quizzes.json` as backup files.

## Frontend Supabase Integration

The frontend now connects directly to Supabase instead of using n8n webhooks for better performance and reliability.

### Environment Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Set your Supabase credentials in `.env`:**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### How It Works

- **Direct Database Queries:** Frontend queries `videos` and `quizzes` tables directly from Supabase
- **Dynamic Topic Requests:** When users search for unavailable topics, they're automatically added to `requested_topics` table
- **Automatic Generation:** GitHub Actions processes requested topics on the next scheduled run
- **Real-time Updates:** New learning paths appear automatically without manual intervention

### Database Tables

- **`videos`:** Stores processed YouTube videos with metadata and summaries (uses camelCase: `searchTerm`, `learningGoal`)
- **`quizzes`:** Contains generated quiz questions for each video (uses camelCase: `searchTerm`, `learningGoal`)
- **`requested_topics`:** Queue of user-requested topics for future processing (uses camelCase: `searchTerm`, `learningGoal`)
- **`user_progress`:** Tracks video completion status and quiz scores for users

#### Column Naming Convention

The project uses **camelCase** for all column names across database, backend, and frontend:
- `searchTerm` (not `search_term`)
- `learningGoal` (not `learning_goal`)

This ensures consistency and prevents schema mismatch errors.

### User Experience

1. User searches for a topic (e.g., "Machine Learning", "Advanced")
2. If content exists: Videos load instantly from Supabase
3. If content missing: Friendly message shows "Learning path being prepared"
4. Topic gets queued for next GitHub Actions run
5. Content becomes available within 24 hours

This architecture eliminates n8n dependency while providing seamless user experience and automatic content generation.

## Local Testing the Workflow

You can test and run the learning path generation workflow locally for immediate results without waiting for GitHub Actions.

### Environment Setup

1. **Set required environment variables:**
   ```bash
   export YT_API_KEY="your_youtube_api_key"
   export GROQ_API_KEY="your_groq_api_key"
   export SUPABASE_URL="your_supabase_project_url"
   export SUPABASE_KEY="your_supabase_service_role_key"
   ```

2. **Run the workflow locally:**
   ```bash
   # Generate learning path for default topic (Python beginner)
   npm run update-learning-path
   
   # Generate for specific topic and goal
   node scripts/fetch_and_update.js --topic=python --goal=beginner
   node scripts/fetch_and_update.js --topic=javascript --goal=intermediate
   node scripts/fetch_and_update.js --topic=react --goal=advanced
   ```

### What Happens

1. **YouTube Search:** Finds 50 relevant videos using YouTube Data API v3
2. **Statistics Gathering:** Fetches view counts, likes, comments for ranking
3. **Intelligent Ranking:** Scores videos based on engagement and recency
4. **LLM Processing:** Top 6 videos processed by Groq's llama-3.3-70b-versatile
5. **Content Generation:** Creates structured learning path with summaries and quizzes
6. **Database Update:** Upserts results directly into Supabase `videos` and `quizzes` tables

### Benefits of Local Testing

- **Immediate Results:** See new content in your frontend instantly
- **Development Speed:** Test changes without waiting for scheduled runs
- **Debugging:** View detailed logs and error messages
- **Custom Topics:** Generate content for any topic on-demand

The local workflow refreshes your Supabase database immediately, making new learning paths available in your frontend without any delay.

## Dynamic Learning Path Generation

LearnHub now supports **dynamic, on-demand learning path generation** powered by **Supabase Edge Functions**. The system automatically normalizes inputs and generates content in real-time using YouTube API and Groq LLM.

### 🚀 Supabase Edge Function

**Endpoint:** `POST /functions/v1/generateLearningPath`

```bash
# Production endpoint
curl -X POST https://csrggvuucfyeaxdunrjy.functions.supabase.co/generateLearningPath \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "searchTerm": "React.js",
    "learningGoal": "Intermediate"
  }'
```

**Response Examples:**

```json
// Content already exists
{
  "status": "exists",
  "videos": [...],
  "message": "Found 5 videos for react + intermediate"
}

// Generation completed successfully
{
  "status": "success",
  "inserted": {
    "videos": 5,
    "quizzes": 15
  },
  "message": "Successfully generated learning path for react + intermediate",
  "log_id": "uuid-here"
}

// Generation in progress
{
  "status": "in_progress",
  "message": "Learning path generation in progress for react + intermediate",
  "minutes_elapsed": 3
}
```

### 🔧 CLI Usage

The CLI script now uses the shared core logic:

```bash
# Using named arguments
node scripts/learningPathGenerator.js --topic=python --goal=beginner

# Using positional arguments
node scripts/learningPathGenerator.js react intermediate

# Complex topics with spaces
node scripts/learningPathGenerator.js "machine learning" advanced
```

**Environment Variables Required:**
```bash
export SUPABASE_URL="https://csrggvuucfyeaxdunrjy.supabase.co"
export SUPABASE_KEY="your-service-role-key"
export YT_API_KEY="your-youtube-api-key"        # Optional
export GROQ_API_KEY="your-groq-api-key"        # Optional
```

### Input Normalization

All inputs are automatically normalized to ensure consistency and prevent duplicates:

#### Normalization Rules

1. **Trim whitespace** and convert to **lowercase**
2. **Replace punctuation** (except `#` and `+`) with spaces
3. **Collapse multiple spaces** into single spaces
4. **Apply synonym mapping** for common variations

#### Synonym Examples

| Input | Normalized Output |
|-------|------------------|
| `"JavaScript"` | `"javascript"` |
| `"React.js"` | `"react"` |
| `"Node.JS"` | `"node"` |
| `"C#"` | `"c#"` |
| `"c sharp"` | `"c#"` |
| `"C++"` | `"c++"` |
| `"Python3"` | `"python"` |
| `"Next.js"` | `"nextjs"` |
| `"INTERMEDIATE"` | `"intermediate"` |
| `"Basic"` | `"beginner"` |
| `"Expert"` | `"advanced"` |

#### Complex Examples

| Input | Normalized Output |
|-------|------------------|
| `" PYTHON "` | `"python"` |
| `"React.js & Redux"` | `"react redux"` |
| `"Machine-Learning"` | `"machine learning"` |
| `"Web   Development"` | `"web development"` |
| `"Advanced Level"` | `"advanced"` |

## Database Schema & Error Handling

### Core Tables Schema

The project uses camelCase naming convention for all database columns:

```sql
-- Videos table with camelCase columns
create table if not exists videos (
  id text primary key, -- YouTube video ID
  searchTerm text not null,
  learningGoal text not null,
  title text not null,
  url text not null,
  summary text,
  level text,
  channel text,
  thumbnail text,
  created_at timestamp with time zone default now()
);

-- Quizzes table with camelCase columns
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  searchTerm text not null,
  learningGoal text not null,
  title text not null,
  url text not null,
  level text,
  difficulty text,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default now()
);

-- Requested topics table
create table if not exists requested_topics (
  id uuid primary key default gen_random_uuid(),
  searchTerm text not null,
  learningGoal text not null,
  created_at timestamp with time zone default now(),
  unique(searchTerm, learningGoal)
);
```

### Improved Error Handling

The API functions now include enhanced error handling:

- **Schema Mismatch Detection**: Automatically detects column name mismatches and provides clear error messages
- **User-Friendly Errors**: Frontend displays helpful messages instead of technical database errors
- **Detailed Logging**: Console logs include full Supabase error objects for debugging
- **Graceful Fallbacks**: Functions handle errors gracefully without breaking the UI

#### Error Message Examples

- If a query fails due to column mismatch: `"Supabase query failed. Check that column names match the schema (searchTerm, learningGoal)."`
- User-facing error: `"Database schema mismatch detected. Please contact support."`
- Generic fallback: `"Failed to fetch videos. Please try again."`

### Migration Notes

The project includes multiple migrations for schema consistency:

1. **`20250921190700_unify_column_naming_camelcase.sql`**:
   - Renames existing `search_term` columns to `searchTerm`
   - Renames existing `learning_goal` columns to `learningGoal`
   - Updates indexes to use the new column names

2. **`20250922010000_normalize_existing_data.sql`**:
   - Normalizes all existing data to consistent format
   - Removes duplicate entries after normalization
   - Adds database constraints to enforce normalization
   - Includes comprehensive verification

#### Running the Migration

1. **Apply the migration** in your Supabase dashboard or via CLI:
   ```bash
   # If using Supabase CLI
   supabase db push
   
   # Or manually run the SQL in Supabase dashboard
   ```

2. **Verify the schema and normalization** using the automated verification script:
   ```bash
   # Set environment variables
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-service-role-key"
   
   # Run comprehensive verification
   node scripts/verify_schema.js
   ```

The verification script will:
- ✅ Test normalization utility functions
- ✅ Test that `videos` table has `searchTerm` and `learningGoal` columns
- ✅ Test that `quizzes` table has `searchTerm` and `learningGoal` columns  
- ✅ Confirm old snake_case columns have been removed
- ✅ Verify all data is properly normalized (lowercase, no extra spaces)
- ✅ Check for any unnormalized values in the database
- 📊 Display sample data to verify everything works correctly

#### Expected Output

```
🔍 Verifying database schema and normalization...

🧪 Testing normalization utility...
✅ Normalization utility tests passed: 15/15

📹 Testing videos table...
✅ Videos table: camelCase columns (searchTerm, learningGoal) exist
   Sample rows found: 5

❓ Testing quizzes table...
✅ Quizzes table: camelCase columns (searchTerm, learningGoal) exist
   Sample rows found: 3

🔍 Checking for old snake_case columns...
✅ Old snake_case columns successfully removed

🔧 Testing data normalization...
   Checking videos table...
   ✅ videos: All 3 unique pairs are normalized
   Checking quizzes table...
   ✅ quizzes: All 2 unique pairs are normalized
   Checking requested_topics table...
   ✅ requested_topics: All 1 unique pairs are normalized
✅ All data is properly normalized

🎉 SUCCESS: Database schema and normalization verification passed!
   ✅ Videos table uses camelCase columns
   ✅ Quizzes table uses camelCase columns
   ✅ Old snake_case columns have been removed
   ✅ All data is properly normalized
   ✅ Normalization utility works correctly
```

### 📊 Generation Monitoring

Monitor learning path generation with SQL queries:

```sql
-- View recent generation logs
SELECT * FROM generation_logs 
ORDER BY started_at DESC 
LIMIT 10;

-- Check generation status for specific topic
SELECT * FROM generation_logs 
WHERE "searchTerm" = 'react' AND "learningGoal" = 'intermediate'
ORDER BY started_at DESC;

-- View all normalized topic pairs in database
SELECT DISTINCT "searchTerm", "learningGoal" 
FROM videos 
ORDER BY "searchTerm", "learningGoal";
```

### 🔧 Edge Function Setup

For detailed setup instructions, see [EDGE_FUNCTION_SETUP.md](./EDGE_FUNCTION_SETUP.md).

**Quick Setup:**

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy generateLearningPath
   ```

2. **Configure Environment Variables** in Supabase Dashboard:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key
   - `YT_API_KEY` - YouTube Data API key (optional)
   - `GROQ_API_KEY` - Groq API key (optional)

3. **Test the Function:**
   ```bash
   curl -X POST https://your-project.functions.supabase.co/generateLearningPath \
     -H "Content-Type: application/json" \
     -d '{"searchTerm":"python","learningGoal":"beginner"}'
   ```

### 🎯 Frontend Integration

The frontend automatically calls the Edge Function when no content exists:

1. **User searches** for a topic (e.g., "Python", "Beginner")
2. **Frontend checks** Supabase for existing videos
3. **If none exist**, calls Edge Function for generation
4. **Shows status** ("Preparing learning path...")
5. **Polls database** until content appears
6. **Displays videos** when generation completes

**No user intervention required** - the system handles everything automatically!

## Video Progress Tracking & Quiz System

The application includes a comprehensive video completion tracking system that unlocks quizzes for completed videos.

### User Progress Table Schema

The project uses the `user_progress` table for tracking video completion. The table schema ensures uniqueness per user/video pair:

```sql
-- Core user_progress table structure
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_url text not null,
  completed boolean default false,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Uniqueness constraint for user_id + video_url
alter table user_progress
  add constraint if not exists user_video_unique unique (user_id, video_url);

-- Indexes for performance
create index if not exists idx_user_progress_user_id on user_progress(user_id);
create index if not exists idx_user_progress_video_url on user_progress(video_url);
create index if not exists idx_user_progress_completed on user_progress(completed);

-- Enable Row Level Security (RLS)
alter table user_progress enable row level security;

-- RLS policies
create policy if not exists "Users can insert their own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can view their own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy if not exists "Users can update their own progress"
  on user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Key Features:**
- **Uniqueness**: The `user_video_unique` constraint ensures each user can have only one progress record per video URL
- **Video URL Tracking**: Uses full YouTube URLs (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`) for completion tracking
- **Upsert Support**: API functions use upserts with `user_id + video_url` to handle duplicate entries gracefully
- **Row Level Security**: Users can only access their own progress records

### How Video Completion Works

1. **Mark as Completed Button**: Users can mark videos as completed below the video player
2. **Progress Tracking**: Completion status is stored in the `user_progress` table with user ID and video URL
3. **Quiz Unlocking**: Once marked as completed, quizzes become available for that specific video
4. **State Management**: React state automatically refreshes to show unlocked quizzes
5. **Persistent Storage**: Completion status persists across sessions and page reloads

### Quiz System Features

- **Conditional Display**: Quizzes are only shown after video completion
- **Dynamic Loading**: Up to 6 quiz questions are fetched from Supabase filtered by:
  - Video URL (exact match)
  - Search term (optional)
  - Learning goal (optional)
- **Difficulty Badges**: Each quiz question displays its difficulty level (easy, medium, hard)
- **Clean UI**: Questions are displayed in card format with answers revealed
- **Loading States**: Proper loading indicators while fetching quiz data

### API Functions

The following helper functions are available in `src/lib/api.ts`:

- `markVideoCompleted(userId, videoUrl)`: Marks a video as completed
- `getQuizzesByVideo(videoUrl, searchTerm?, learningGoal?)`: Fetches quizzes for a video
- `isVideoCompleted(userId, videoUrl)`: Checks if a video is completed

### User Experience Flow

1. User watches a video on the Video page
2. Below the video player, they see a "Mark as Completed" button
3. After clicking, the button changes to "Completed ✅" and becomes disabled
4. The Quiz section automatically refreshes and displays available quizzes
5. If no quizzes exist, a friendly message is shown
6. Quiz questions are displayed with difficulty badges and structured answers
