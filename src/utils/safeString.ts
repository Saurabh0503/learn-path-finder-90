/**
 * Safe String Utility
 * 
 * Provides null-safe string operations to prevent runtime errors
 * when dealing with potentially null or undefined values from APIs.
 */

/**
 * Safely converts any value to a string, handling null/undefined cases
 * @param value - The value to convert to string
 * @returns Empty string if value is null/undefined, otherwise string representation
 */
export function safeString(value?: string | null | undefined): string {
  return (value || '').toString();
}

/**
 * Safely converts a string to lowercase, handling null/undefined cases
 * @param value - The string value to convert
 * @returns Lowercase string, or empty string if value is null/undefined
 */
export function safeLowerCase(value?: string | null | undefined): string {
  return safeString(value).toLowerCase();
}

/**
 * Safely trims a string, handling null/undefined cases
 * @param value - The string value to trim
 * @returns Trimmed string, or empty string if value is null/undefined
 */
export function safeTrim(value?: string | null | undefined): string {
  return safeString(value).trim();
}

/**
 * Safely gets string length, handling null/undefined cases
 * @param value - The string value to measure
 * @returns Length of string, or 0 if value is null/undefined
 */
export function safeLength(value?: string | null | undefined): number {
  return safeString(value).length;
}

/**
 * Safely checks if a string contains a substring, handling null/undefined cases
 * @param value - The string to search in
 * @param searchString - The substring to search for
 * @returns True if substring is found, false otherwise
 */
export function safeIncludes(value?: string | null | undefined, searchString?: string | null | undefined): boolean {
  return safeString(value).includes(safeString(searchString));
}

/**
 * Provides safe default values for video-related fields
 */
export const videoDefaults = {
  title: '',
  channel: '',
  summary: '',
  searchTerm: '',
  learningGoal: '',
  level: 'Beginner',
  difficulty: 'easy',
  quizzes: [] as any[]
} as const;

/**
 * Safely normalizes a video object with default values
 * @param video - Raw video object from API
 * @returns Video object with safe default values
 */
export function safeVideoNormalize(video: any): any {
  return {
    id: safeString(video?.id),
    title: safeString(video?.title) || videoDefaults.title,
    channel: safeString(video?.channel) || videoDefaults.channel,
    summary: safeString(video?.summary) || videoDefaults.summary,
    searchTerm: safeString(video?.searchTerm) || videoDefaults.searchTerm,
    learningGoal: safeString(video?.learningGoal) || videoDefaults.learningGoal,
    level: safeString(video?.level) || videoDefaults.level,
    difficulty: safeString(video?.difficulty) || videoDefaults.difficulty,
    thumbnail: safeString(video?.thumbnail),
    url: safeString(video?.url),
    rank: video?.rank || 0,
    quiz: Array.isArray(video?.quiz) ? video.quiz : videoDefaults.quizzes,
    quizzes: Array.isArray(video?.quizzes) ? video.quizzes : videoDefaults.quizzes
  };
}
