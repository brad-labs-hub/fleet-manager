import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "driver" | "employee" | "controller";

type AuthorizedContext = {
  supabase: SupabaseClient;
  userId: string;
  role: AppRole | null;
};

type GuardResult =
  | { ok: true; context: AuthorizedContext }
  | { ok: false; response: NextResponse };

/**
 * Gate a route on an authenticated session whose profile role is in `allowed`.
 * Mirrors the pattern used in /api/admin/invite-user. Returns the anon-key
 * client so downstream queries still run under the caller's RLS context.
 */
export async function requireRole(allowed: AppRole[]): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as AppRole | undefined) ?? null;
  if (!role || !allowed.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, context: { supabase, userId: user.id, role } };
}
