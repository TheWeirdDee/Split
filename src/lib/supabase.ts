import { createClient } from '@supabase/supabase-js';

// Shared browser Supabase client (anon key). The placeholder fallbacks keep
// `next build` from throwing when env vars are absent (e.g. CI/preview without
// secrets); real requests require the actual NEXT_PUBLIC_SUPABASE_* values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
