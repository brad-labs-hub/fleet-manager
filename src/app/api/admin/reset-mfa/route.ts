import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { checkRateLimit, getRequestContext, logApiEvent } from "@/lib/api-ops";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { requestId, ip } = getRequestContext(request);
  const limiter = checkRateLimit({
    key: `admin-reset-mfa:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", requestId }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("user_profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "controller") {
    return NextResponse.json({ error: "Forbidden — only controllers can reset MFA" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfiguration: missing service role key" }, { status: 500 });
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error: listError } = await admin.auth.admin.mfa.listFactors({ userId });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  // Remove ALL factors regardless of type or status. Stale "unverified" factors
  // (left behind by an incomplete enrollment) otherwise block re-enrollment because
  // the setup page enrolls with a fixed friendlyName and Supabase rejects duplicates.
  const allFactors = data?.factors ?? [];
  for (const factor of allFactors) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId,
    });
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  logApiEvent("info", "/api/admin/reset-mfa", requestId, { ip, status: 200, userId });
  return NextResponse.json({
    success: true,
    removed: allFactors.length,
    message: allFactors.length > 0
      ? "MFA factors removed. User will need to set up MFA again on next login."
      : "No MFA factors were enrolled.",
    requestId,
  });
}
