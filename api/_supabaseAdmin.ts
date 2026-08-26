import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

/** Server-only Supabase client using the service role key. Never import this from src/. */
export function getSupabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
