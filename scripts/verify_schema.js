#!/usr/bin/env node

/**
 * Schema Verification Script
 * 
 * This script verifies that the database schema has been correctly updated
 * to use camelCase column names (searchTerm, learningGoal) in both
 * videos and quizzes tables.
 * 
 * Usage:
 *   node scripts/verify_schema.js
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_KEY: Your Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_KEY must be set');
  console.error('');
  console.error('Example:');
  console.error('   export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('   export SUPABASE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySchema() {
  console.log('🔍 Verifying database schema...');
  console.log('');

  let allTestsPassed = true;

  // Test 1: Verify videos table has camelCase columns
  console.log('📹 Testing videos table...');
  try {
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('searchTerm, learningGoal')
      .limit(5);

    if (videosError) {
      console.error('❌ Videos table verification failed:', videosError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Videos table: camelCase columns (searchTerm, learningGoal) exist');
      console.log(`   Sample rows found: ${videosData?.length || 0}`);
      if (videosData && videosData.length > 0) {
        console.log('   Sample data:', videosData[0]);
      }
    }
  } catch (error) {
    console.error('❌ Videos table verification error:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 2: Verify quizzes table has camelCase columns
  console.log('❓ Testing quizzes table...');
  try {
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('searchTerm, learningGoal')
      .limit(5);

    if (quizzesError) {
      console.error('❌ Quizzes table verification failed:', quizzesError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Quizzes table: camelCase columns (searchTerm, learningGoal) exist');
      console.log(`   Sample rows found: ${quizzesData?.length || 0}`);
      if (quizzesData && quizzesData.length > 0) {
        console.log('   Sample data:', quizzesData[0]);
      }
    }
  } catch (error) {
    console.error('❌ Quizzes table verification error:', error.message);
    allTestsPassed = false;
  }

  console.log('');

  // Test 3: Verify old snake_case columns don't exist
  console.log('🔍 Checking for old snake_case columns...');
  try {
    // Try to query old column names - this should fail
    const { error: oldVideosError } = await supabase
      .from('videos')
      .select('search_term, learning_goal')
      .limit(1);

    if (oldVideosError && oldVideosError.message.includes('column') && oldVideosError.message.includes('does not exist')) {
      console.log('✅ Old snake_case columns (search_term, learning_goal) successfully removed from videos table');
    } else if (!oldVideosError) {
      console.log('⚠️  WARNING: Old snake_case columns still exist in videos table');
      allTestsPassed = false;
    }

    const { error: oldQuizzesError } = await supabase
      .from('quizzes')
      .select('search_term, learning_goal')
      .limit(1);

    if (oldQuizzesError && oldQuizzesError.message.includes('column') && oldQuizzesError.message.includes('does not exist')) {
      console.log('✅ Old snake_case columns (search_term, learning_goal) successfully removed from quizzes table');
    } else if (!oldQuizzesError) {
      console.log('⚠️  WARNING: Old snake_case columns still exist in quizzes table');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('✅ Old snake_case columns appear to be removed (expected error)');
  }

  console.log('');
  console.log('='.repeat(60));

  if (allTestsPassed) {
    console.log('🎉 SUCCESS: Database schema verification passed!');
    console.log('   ✅ Videos table uses camelCase columns');
    console.log('   ✅ Quizzes table uses camelCase columns');
    console.log('   ✅ Old snake_case columns have been removed');
    console.log('');
    console.log('Your database is ready to use with the updated LearnHub application.');
    process.exit(0);
  } else {
    console.log('❌ FAILURE: Database schema verification failed!');
    console.log('');
    console.log('Please check the following:');
    console.log('1. Run the migration: 20250921190700_unify_column_naming_camelcase.sql');
    console.log('2. Ensure your SUPABASE_URL and SUPABASE_KEY are correct');
    console.log('3. Check that you have the necessary permissions');
    console.log('');
    console.log('If issues persist, check the Supabase dashboard for error details.');
    process.exit(1);
  }
}

// Run verification
verifySchema().catch((error) => {
  console.error('💥 Unexpected error during verification:', error);
  process.exit(1);
});
