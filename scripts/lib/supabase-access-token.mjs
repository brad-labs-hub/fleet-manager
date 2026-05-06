/**
 * Resolves the Supabase Management API access token for scripts that call
 * https://api.supabase.com (create/delete API keys).
 *
 * Create a long-lived **Personal access token** at:
 *   https://supabase.com/dashboard/account/tokens
 *
 * Then: export SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Note: the token stored in macOS keychain for `supabase login` may not
 * be accepted as Bearer JWT on the Management API; use a PAT for rotation scripts.
 */
export function getSupabaseAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  return null;
}
