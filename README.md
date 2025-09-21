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

- **`videos`:** Stores processed YouTube videos with metadata and summaries
- **`quizzes`:** Contains generated quiz questions for each video
- **`requested_topics`:** Queue of user-requested topics for future processing
- **`user_progress`:** Tracks video completion status and quiz scores for users

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

## Video Progress Tracking & Quiz System

The application includes a comprehensive video completion tracking system that unlocks quizzes for completed videos.

### User Progress Table Schema

The project uses the existing `user_progress` table for tracking video completion. The table has been extended to support video URL tracking:

```sql
-- Core user_progress table structure
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  video_id text, -- YouTube video ID (11 characters)
  video_url text, -- Full YouTube URL for completion tracking
  completed boolean default false,
  completed_at timestamp with time zone,
  quiz_score integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_user_progress_user_id on user_progress(user_id);
create index if not exists idx_user_progress_video_url on user_progress(video_url);
create index if not exists idx_user_progress_user_video_url on user_progress(user_id, video_url);

-- Constraint to ensure either video_id or video_url is present
alter table user_progress add constraint check_video_identifier 
  check (video_id is not null or video_url is not null);

-- Enable Row Level Security (RLS)
alter table user_progress enable row level security;

-- RLS policies (if not already present)
create policy "Users can view their own progress" on user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert their own progress" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own progress" on user_progress
  for update using (auth.uid() = user_id);
```

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
