import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-only client with elevated privileges for maintenance / storage policy validation
// NEVER import or call this in any Client Component.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key') {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey || 'placeholder-service-role-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
