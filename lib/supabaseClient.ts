import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://csrggvuucfyeaxdunrjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcmdndnV1Y2Z5ZWF4ZHVucmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTE4ODAsImV4cCI6MjA3MzUyNzg4MH0.Vzt39Inny0ZvsNBICr47HL_lXnK67zFa4ekYO2fguGE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
})
