import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

export const createRouteClient = () => {
  return createRouteHandlerClient<Database>({ cookies });
};

export const createActionClient = () => {
  return createRouteHandlerClient<Database>({ cookies });
};
