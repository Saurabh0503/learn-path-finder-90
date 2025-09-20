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
