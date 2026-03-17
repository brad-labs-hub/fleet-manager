import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const allFactors = data?.factors ?? [];
  const totpFactors = allFactors.filter((f) => f.factor_type === "totp" && f.status === "verified");
  for (const factor of totpFactors) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId,
    });
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    removed: totpFactors.length,
    message: totpFactors.length > 0
      ? "MFA factors removed. User will need to set up MFA again on next login."
      : "No MFA factors were enrolled.",
  });
}
