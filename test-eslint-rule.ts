// This file is for testing the ESLint rule - it should trigger an error
import { createClient } from '@supabase/supabase-js'

// This should be flagged by our custom ESLint rule
const supabase = createClient('url', 'key')

export { supabase }
