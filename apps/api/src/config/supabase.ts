import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client configuration
export const supabase = createClient(
  env.SUPABASE_URL || env.DATABASE_URL,
  env.SUPABASE_ANON_KEY || 'your-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper function to get Supabase client with service role key
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || env.DATABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  {
    auth: {
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  }
);

export default supabase;
