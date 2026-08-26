import { createClient } from '@supabase/supabase-js';

// No generated Database types yet (small internal tool, one table) — using `any` here
// keeps .from('orders').select(...) usable without fighting Supabase's strict generic
// inference, which otherwise resolves unknown tables to `never`.
let client: ReturnType<typeof createClient<any>> | null = null;

/** Server-only Supabase client using the service role key. Never import this from src/. */
export function getSupabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
    }
    client = createClient<any>(url, key, { auth: { persistSession: false } });
  }
  return client;
}
