#!/usr/bin/env node

/**
 * Populate Test Data Script
 * 
 * This script creates the missing tables and populates your database
 * with sample videos and quizzes so you can test the application.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createRequestedTopicsTable() {
  console.log('📋 Creating requested_topics table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS requested_topics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "searchTerm" text NOT NULL,
        "learningGoal" text NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE("searchTerm", "learningGoal")
      );
      
      CREATE INDEX IF NOT EXISTS idx_requested_topics_created_at ON requested_topics(created_at);
      ALTER TABLE requested_topics ENABLE ROW LEVEL SECURITY;
    `
  });

  if (error) {
    console.error('❌ Error creating requested_topics table:', error);
    return false;
  }
  
  console.log('✅ requested_topics table created');
  return true;
}

async function populateTestVideos() {
  console.log('🎥 Adding test videos...');
  
  const testVideos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'JavaScript Fundamentals for Beginners',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      searchTerm: 'javascript',
      learningGoal: 'beginner',
      summary: 'Learn the basics of JavaScript programming including variables, functions, and control structures.',
      level: 'beginner',
      channel: 'Programming Academy',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    },
    {
      id: 'jNQXAC9IVRw',
      title: 'Python Programming Complete Course',
      url: 'https://youtube.com/watch?v=jNQXAC9IVRw',
      searchTerm: 'python',
      learningGoal: 'beginner',
      summary: 'Complete Python tutorial covering syntax, data structures, and object-oriented programming.',
      level: 'beginner',
      channel: 'Code Academy',
      thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg'
    },
    {
      id: 'y8Kyi0WNg40',
      title: 'React Hooks Deep Dive',
      url: 'https://youtube.com/watch?v=y8Kyi0WNg40',
      searchTerm: 'react',
      learningGoal: 'intermediate',
      summary: 'Advanced React concepts including custom hooks, useEffect, and state management.',
      level: 'intermediate',
      channel: 'React Masters',
      thumbnail_url: 'https://img.youtube.com/vi/y8Kyi0WNg40/hqdefault.jpg'
    }
  ];

  for (const video of testVideos) {
    const { error } = await supabase
      .from('videos')
      .upsert(video, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error adding video ${video.title}:`, error);
    } else {
      console.log(`✅ Added video: ${video.title}`);
    }
  }
}

async function populateTestQuizzes() {
  console.log('❓ Adding test quizzes...');
  
  const testQuizzes = [
    {
      video_id: 'dQw4w9WgXcQ',
      searchTerm: 'javascript',
      learningGoal: 'beginner',
      title: 'JavaScript Fundamentals for Beginners',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      level: 'beginner',
      difficulty: 'easy',
      question: 'What keyword is used to declare a variable in JavaScript?',
      answer: 'The "let" keyword is used to declare variables in modern JavaScript. You can also use "const" for constants and "var" for older-style declarations.'
    },
    {
      video_id: 'jNQXAC9IVRw',
      searchTerm: 'python',
      learningGoal: 'beginner',
      title: 'Python Programming Complete Course',
      url: 'https://youtube.com/watch?v=jNQXAC9IVRw',
      level: 'beginner',
      difficulty: 'easy',
      question: 'How do you print "Hello World" in Python?',
      answer: 'Use the print() function: print("Hello World"). This will output the text to the console.'
    },
    {
      video_id: 'y8Kyi0WNg40',
      searchTerm: 'react',
      learningGoal: 'intermediate',
      title: 'React Hooks Deep Dive',
      url: 'https://youtube.com/watch?v=y8Kyi0WNg40',
      level: 'intermediate',
      difficulty: 'medium',
      question: 'What is the purpose of the useEffect hook in React?',
      answer: 'useEffect is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM. It runs after the render and can be configured to run on specific dependency changes.'
    }
  ];

  for (const quiz of testQuizzes) {
    const { error } = await supabase
      .from('quizzes')
      .insert(quiz);

    if (error) {
      console.error(`❌ Error adding quiz for ${quiz.title}:`, error);
    } else {
      console.log(`✅ Added quiz for: ${quiz.title}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting database population...');
  console.log('');

  try {
    // Note: We'll skip creating requested_topics table via RPC since it might not be available
    // User should create it manually in Supabase Dashboard
    
    await populateTestVideos();
    console.log('');
    await populateTestQuizzes();
    
    console.log('');
    console.log('🎉 Database population completed!');
    console.log('');
    console.log('📋 Don\'t forget to create the requested_topics table manually in Supabase:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the CREATE TABLE statement for requested_topics');
    console.log('');
    console.log('🧪 Test your app by searching for:');
    console.log('   - JavaScript + Beginner');
    console.log('   - Python + Beginner');
    console.log('   - React + Intermediate');
    
  } catch (error) {
    console.error('💥 Error during population:', error);
    process.exit(1);
  }
}

main();
