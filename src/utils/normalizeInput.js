/**
 * Input Normalization Utility for LearnHub
 * 
 * Provides consistent normalization of search terms and learning goals
 * to prevent duplicates and ensure data consistency across the platform.
 */

/**
 * Synonym mapping for common technology terms
 * Maps variations to canonical forms
 */
const SYNONYM_MAP = {
  // JavaScript variations
  'javascript': 'javascript',
  'js': 'javascript',
  'ecmascript': 'javascript',
  
  // Node.js variations
  'node.js': 'node',
  'nodejs': 'node',
  'node js': 'node',
  
  // React variations
  'react.js': 'react',
  'reactjs': 'react',
  'react js': 'react',
  
  // Vue variations
  'vue.js': 'vue',
  'vuejs': 'vue',
  'vue js': 'vue',
  
  // Angular variations
  'angular.js': 'angular',
  'angularjs': 'angular',
  'angular js': 'angular',
  
  // C# variations
  'c sharp': 'c#',
  'csharp': 'c#',
  'c-sharp': 'c#',
  'c #': 'c#',
  
  // C++ variations
  'c plus plus': 'c++',
  'cplusplus': 'c++',
  'c plus': 'c++',
  'c + +': 'c++',
  
  // Python variations
  'python3': 'python',
  'python 3': 'python',
  'py': 'python',
  
  // TypeScript variations
  'typescript': 'typescript',
  'ts': 'typescript',
  'type script': 'typescript',
  
  // Database variations
  'postgresql': 'postgres',
  'postgres sql': 'postgres',
  'mysql': 'mysql',
  'my sql': 'mysql',
  'mongodb': 'mongo',
  'mongo db': 'mongo',
  
  // Framework variations
  'next.js': 'nextjs',
  'next js': 'nextjs',
  'nuxt.js': 'nuxtjs',
  'nuxt js': 'nuxtjs',
  'express.js': 'express',
  'express js': 'express',
  
  // Learning goal synonyms
  'basic': 'beginner',
  'intro': 'beginner',
  'introduction': 'beginner',
  'introductory': 'beginner',
  'starter': 'beginner',
  'fundamentals': 'beginner',
  'basics': 'beginner',
  
  'intermediate': 'intermediate',
  'mid': 'intermediate',
  'middle': 'intermediate',
  'moderate': 'intermediate',
  
  'advanced': 'advanced',
  'expert': 'advanced',
  'professional': 'advanced',
  'pro': 'advanced',
  'senior': 'advanced',
  'master': 'advanced'
};

/**
 * Normalize a single input string
 * @param {string} input - The input string to normalize
 * @param {boolean} isLearningGoal - Whether this is a learning goal (affects synonym mapping)
 * @returns {string} - Normalized string
 */
export function normalizeInput(input, isLearningGoal = false) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Step 1: Trim whitespace
  let normalized = input.trim();
  
  // Step 2: Convert to lowercase
  normalized = normalized.toLowerCase();
  
  // Step 3: Replace punctuation and special characters with spaces
  // Keep # for C#, + for C++, and . for version numbers initially
  normalized = normalized.replace(/[^\w\s#+.-]/g, ' ');
  
  // Step 4: Handle special cases before general cleanup
  // Preserve important punctuation in known terms
  const specialTerms = ['c#', 'c++', 'f#', '.net', 'asp.net'];
  let preservedTerms = [];
  
  specialTerms.forEach((term, index) => {
    const placeholder = `__SPECIAL_${index}__`;
    if (normalized.includes(term)) {
      normalized = normalized.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
      preservedTerms[index] = term;
    }
  });
  
  // Step 5: Replace remaining punctuation with spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  
  // Step 6: Restore preserved terms
  preservedTerms.forEach((term, index) => {
    if (term) {
      const placeholder = `__SPECIAL_${index}__`;
      normalized = normalized.replace(new RegExp(placeholder, 'g'), term);
    }
  });
  
  // Step 7: Collapse multiple spaces into one
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Step 8: Apply synonym mapping
  if (SYNONYM_MAP[normalized]) {
    normalized = SYNONYM_MAP[normalized];
  }
  
  // Step 9: Additional cleanup for learning goals
  if (isLearningGoal) {
    // Ensure learning goals are single words when possible
    const learningGoalMap = {
      'beginner level': 'beginner',
      'intermediate level': 'intermediate',
      'advanced level': 'advanced',
      'entry level': 'beginner',
      'senior level': 'advanced'
    };
    
    if (learningGoalMap[normalized]) {
      normalized = learningGoalMap[normalized];
    }
  }
  
  return normalized;
}

/**
 * Normalize search term specifically
 * @param {string} searchTerm - The search term to normalize
 * @returns {string} - Normalized search term
 */
export function normalizeSearchTerm(searchTerm) {
  return normalizeInput(searchTerm, false);
}

/**
 * Normalize learning goal specifically
 * @param {string} learningGoal - The learning goal to normalize
 * @returns {string} - Normalized learning goal
 */
export function normalizeLearningGoal(learningGoal) {
  return normalizeInput(learningGoal, true);
}

/**
 * Normalize both search term and learning goal together
 * @param {string} searchTerm - The search term
 * @param {string} learningGoal - The learning goal
 * @returns {{searchTerm: string, learningGoal: string}} - Normalized values
 */
export function normalizeTopicPair(searchTerm, learningGoal) {
  return {
    searchTerm: normalizeSearchTerm(searchTerm),
    learningGoal: normalizeLearningGoal(learningGoal)
  };
}

/**
 * Validate that a string is properly normalized
 * @param {string} input - The input to validate
 * @returns {boolean} - True if properly normalized
 */
export function isNormalized(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  // Check for uppercase letters
  if (input !== input.toLowerCase()) {
    return false;
  }
  
  // Check for leading/trailing whitespace
  if (input !== input.trim()) {
    return false;
  }
  
  // Check for multiple consecutive spaces
  if (input.includes('  ')) {
    return false;
  }
  
  // Check for disallowed punctuation (except # and + for special cases)
  const disallowedChars = /[^\w\s#+.-]/;
  if (disallowedChars.test(input)) {
    return false;
  }
  
  return true;
}

/**
 * Get all synonym mappings for debugging/documentation
 * @returns {Object} - The complete synonym map
 */
export function getSynonymMap() {
  return { ...SYNONYM_MAP };
}

/**
 * Test normalization with examples
 * Used for debugging and verification
 */
export function testNormalization() {
  const testCases = [
    // Search terms
    { input: 'JavaScript', expected: 'javascript' },
    { input: ' React.js ', expected: 'react' },
    { input: 'Node.JS', expected: 'node' },
    { input: 'C#', expected: 'c#' },
    { input: 'c sharp', expected: 'c#' },
    { input: 'C++', expected: 'c++' },
    { input: 'Python3', expected: 'python' },
    { input: 'Vue.js', expected: 'vue' },
    { input: 'Next.js', expected: 'nextjs' },
    
    // Learning goals
    { input: 'Beginner', expected: 'beginner', isLearningGoal: true },
    { input: ' INTERMEDIATE ', expected: 'intermediate', isLearningGoal: true },
    { input: 'Advanced Level', expected: 'advanced', isLearningGoal: true },
    { input: 'Basic', expected: 'beginner', isLearningGoal: true },
    { input: 'Expert', expected: 'advanced', isLearningGoal: true },
    
    // Complex cases
    { input: 'React.js & Redux', expected: 'react redux' },
    { input: 'Machine-Learning', expected: 'machine learning' },
    { input: 'Web   Development', expected: 'web development' }
  ];
  
  console.log('🧪 Testing normalization...');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ input, expected, isLearningGoal = false }) => {
    const result = normalizeInput(input, isLearningGoal);
    const success = result === expected;
    
    console.log(`${success ? '✅' : '❌'} "${input}" → "${result}" ${success ? '' : `(expected: "${expected}")`}`);
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed, total: testCases.length };
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeInput,
    normalizeSearchTerm,
    normalizeLearningGoal,
    normalizeTopicPair,
    isNormalized,
    getSynonymMap,
    testNormalization
  };
}
