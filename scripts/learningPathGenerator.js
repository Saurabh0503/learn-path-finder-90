#!/usr/bin/env node

/**
 * Dynamic Learning Path Generator CLI
 * 
 * This script provides a command-line interface for the learning path generator.
 * The core logic is now shared with the Supabase Edge Function.
 * 
 * Usage:
 *   node scripts/learningPathGenerator.js --topic=python --goal=beginner
 *   node scripts/learningPathGenerator.js python beginner
 */

import { createClient } from '@supabase/supabase-js';
import { generateLearningPathCore } from '../src/lib/generateLearningPath.js';
import { normalizeTopicPair } from '../src/utils/normalizeInput.js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  showUsage();
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * CLI wrapper for the core generation logic
 * @param {string} searchTerm - The topic to search for (e.g., "react", "python")
 * @param {string} learningGoal - The difficulty level (e.g., "beginner", "intermediate")
 * @returns {Promise<{videosCount: number, quizzesCount: number}>}
 */
export async function generateLearningPath(searchTerm, learningGoal) {
  // Apply normalization to ensure consistency
  const { searchTerm: normalizedSearchTerm, learningGoal: normalizedLearningGoal } = normalizeTopicPair(searchTerm, learningGoal);
  
  // Log normalization if values changed
  if (searchTerm !== normalizedSearchTerm || learningGoal !== normalizedLearningGoal) {
    console.log(`🔄 CLI: Normalized inputs: "${searchTerm}" → "${normalizedSearchTerm}", "${learningGoal}" → "${normalizedLearningGoal}"`);
  }
  
  console.log(`🚀 CLI: Starting learning path generation for: ${normalizedSearchTerm} + ${normalizedLearningGoal}`);
  
  try {
    // Use the shared core logic
    const result = await generateLearningPathCore(normalizedSearchTerm, normalizedLearningGoal, supabase);
    
    console.log(`✅ CLI: Generation completed successfully!`);
    return result;

  } catch (error) {
    console.error(`❌ CLI: Failed to generate learning path for ${normalizedSearchTerm} + ${normalizedLearningGoal}:`, error);
    throw error;
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  // Handle --topic=value --goal=value format
  const namedArgs = {};
  const positionalArgs = [];
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      namedArgs[key] = value;
    } else {
      positionalArgs.push(arg);
    }
  }
  
  // Extract searchTerm and learningGoal
  const searchTerm = namedArgs.topic || positionalArgs[0];
  const learningGoal = namedArgs.goal || positionalArgs[1];
  
  return { searchTerm, learningGoal };
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('');
  console.log('🎓 Dynamic Learning Path Generator CLI');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/learningPathGenerator.js --topic=<topic> --goal=<goal>');
  console.log('  node scripts/learningPathGenerator.js <topic> <goal>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/learningPathGenerator.js --topic=python --goal=beginner');
  console.log('  node scripts/learningPathGenerator.js react intermediate');
  console.log('  node scripts/learningPathGenerator.js "machine learning" advanced');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  SUPABASE_URL          - Your Supabase project URL');
  console.log('  SUPABASE_KEY          - Your Supabase service role key');
  console.log('  YT_API_KEY            - YouTube Data API key (optional, uses mock data if missing)');
  console.log('  GROQ_API_KEY          - Groq API key (optional, uses basic processing if missing)');
  console.log('');
}


// CLI usage - if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { searchTerm, learningGoal } = parseArguments();

  if (!searchTerm || !learningGoal) {
    console.error('❌ Missing required arguments: topic and goal');
    showUsage();
    process.exit(1);
  }

  console.log(`🚀 CLI: Generating learning path for "${searchTerm}" at "${learningGoal}" level...`);
  console.log('');

  generateLearningPath(searchTerm, learningGoal)
    .then(result => {
      console.log('');
      console.log('🎉 CLI: Generation completed successfully!');
      console.log(`   📹 Videos inserted: ${result.videosCount}`);
      console.log(`   ❓ Quizzes generated: ${result.quizzesCount}`);
      console.log('');
      console.log('💡 You can now view the generated content in your LearnHub application.');
      process.exit(0);
    })
    .catch(error => {
      console.log('');
      console.error('💥 CLI: Generation failed:', error.message);
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Check your environment variables (SUPABASE_URL, SUPABASE_KEY)');
      console.log('   - Ensure your Supabase database has the required tables');
      console.log('   - Run: node scripts/verify_schema.js to check your setup');
      process.exit(1);
    });
}
