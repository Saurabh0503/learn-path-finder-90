/**
 * Input Normalization Utility (TypeScript version)
 * 
 * This utility normalizes search terms and learning goals to ensure consistency
 * across the application and prevent duplicate content generation.
 */

export interface NormalizedTopicPair {
  searchTerm: string;
  learningGoal: string;
}

/**
 * Comprehensive normalization for both searchTerm and learningGoal
 */
export function normalizeTopicPair(searchTerm: string, learningGoal: string): NormalizedTopicPair {
  return {
    searchTerm: normalizeText(searchTerm),
    learningGoal: normalizeText(learningGoal)
  };
}

/**
 * Normalize a single text input with comprehensive rules
 */
export function normalizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Step 1: Trim and lowercase
  let normalized = input.toLowerCase().trim();

  // Step 2: Replace punctuation with spaces (except # and +)
  normalized = normalized.replace(/[^\w\s#+.-]/g, ' ');

  // Step 3: Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Step 4: Apply synonym mapping
  normalized = applySynonymMapping(normalized);

  return normalized;
}

/**
 * Apply comprehensive synonym mapping for common tech terms and learning goals
 */
function applySynonymMapping(text: string): string {
  // Technology synonyms
  const techSynonyms: Record<string, string> = {
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
    
    // .NET variations
    '.net': 'dotnet',
    'dot net': 'dotnet',
    'dotnet': 'dotnet',
    
    // CSS variations
    'css3': 'css',
    'css 3': 'css',
    
    // HTML variations
    'html5': 'html',
    'html 5': 'html',
    
    // DevOps variations
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'k8s': 'kubernetes',
    
    // Cloud variations
    'amazon web services': 'aws',
    'google cloud platform': 'gcp',
    'microsoft azure': 'azure'
  };

  // Learning goal synonyms
  const goalSynonyms: Record<string, string> = {
    // Beginner synonyms
    'basic': 'beginner',
    'intro': 'beginner',
    'introduction': 'beginner',
    'introductory': 'beginner',
    'starter': 'beginner',
    'fundamentals': 'beginner',
    'basics': 'beginner',
    'entry': 'beginner',
    'newbie': 'beginner',
    
    // Intermediate synonyms
    'intermediate': 'intermediate',
    'mid': 'intermediate',
    'middle': 'intermediate',
    'moderate': 'intermediate',
    
    // Advanced synonyms
    'advanced': 'advanced',
    'expert': 'advanced',
    'professional': 'advanced',
    'pro': 'advanced',
    'senior': 'advanced',
    'master': 'advanced',
    'mastery': 'advanced'
  };

  // Combine all synonyms
  const allSynonyms = { ...techSynonyms, ...goalSynonyms };

  // Apply direct mapping first
  if (allSynonyms[text]) {
    return allSynonyms[text];
  }

  // Handle "X level" patterns
  const levelPattern = /^(.+)\s+level$/;
  const levelMatch = text.match(levelPattern);
  if (levelMatch) {
    const baseGoal = levelMatch[1];
    if (goalSynonyms[baseGoal]) {
      return goalSynonyms[baseGoal];
    }
  }

  // Handle multi-word tech terms
  const words = text.split(' ');
  if (words.length > 1) {
    // Check if any combination matches
    const combinations = [
      words.join(''),           // "react redux" -> "reactredux"
      words.join('.'),          // "react redux" -> "react.redux"
      words.join('-'),          // "react redux" -> "react-redux"
      words.join('_')           // "react redux" -> "react_redux"
    ];

    for (const combo of combinations) {
      if (allSynonyms[combo]) {
        return allSynonyms[combo];
      }
    }

    // Map individual words and rejoin
    const mappedWords = words.map(word => allSynonyms[word] || word);
    if (mappedWords.some((word, index) => word !== words[index])) {
      return mappedWords.join(' ');
    }
  }

  return text;
}

/**
 * Check if a text is already normalized
 */
export function isNormalized(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalized = normalizeText(text);
  return text === normalized;
}

/**
 * Test the normalization utility with comprehensive test cases
 */
export function testNormalization(): { passed: number; failed: number; total: number } {
  const testCases = [
    // Basic normalization
    { input: '  PYTHON  ', expected: 'python' },
    { input: 'JavaScript', expected: 'javascript' },
    { input: 'React.js', expected: 'react' },
    
    // Synonym mapping
    { input: 'Node.JS', expected: 'node' },
    { input: 'c sharp', expected: 'c#' },
    { input: 'C++', expected: 'c++' },
    { input: 'TypeScript', expected: 'typescript' },
    
    // Learning goals
    { input: 'BEGINNER', expected: 'beginner' },
    { input: 'Basic', expected: 'beginner' },
    { input: 'Expert', expected: 'advanced' },
    { input: 'Intermediate Level', expected: 'intermediate' },
    
    // Complex cases
    { input: 'React & Redux', expected: 'react redux' },
    { input: 'Machine-Learning', expected: 'machine learning' },
    { input: 'Web   Development', expected: 'web development' },
    
    // Edge cases
    { input: '', expected: '' },
    { input: '   ', expected: '' }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }, index) => {
    const result = normalizeText(input);
    if (result === expected) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${input}" → "${result}"`);
    } else {
      failed++;
      console.error(`❌ Test ${index + 1}: "${input}" → "${result}" (expected: "${expected}")`);
    }
  });

  return { passed, failed, total: testCases.length };
}
