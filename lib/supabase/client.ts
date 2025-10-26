import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export const createSupabaseClient = () => {
  return createPagesBrowserClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
};

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = typeof window !== 'undefined'
  ? (supabaseInstance || (supabaseInstance = createSupabaseClient()))
  : createSupabaseClient();
