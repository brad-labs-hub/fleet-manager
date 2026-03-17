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
    return NextResponse.json({ error: "Forbidden — only controllers can re-invite users" }, { status: 403 });
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (() => { const u = new URL(request.url); return `${u.protocol}//${u.host}`; })();

  const { data: targetProfile } = await supabase
    .from("user_profiles")
    .select("email, name, role")
    .eq("id", userId)
    .single();

  if (!targetProfile?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    targetProfile.email,
    {
      data: { name: targetProfile.name, role: targetProfile.role },
      redirectTo: `${appUrl}/auth/callback?type=invite`,
    }
  );

  if (inviteError) {
    if (inviteError.message?.toLowerCase().includes("already been registered") ||
        inviteError.message?.toLowerCase().includes("already exists")) {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: targetProfile.email,
        options: { redirectTo: `${appUrl}/auth/callback` },
      });
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });
      return NextResponse.json({
        success: true,
        message: "User already exists. Magic link generated.",
        link: linkData.properties?.action_link,
      });
    }
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  await admin.from("user_profiles").upsert({
    id: inviteData.user.id,
    email: inviteData.user.email,
    name: targetProfile.name ?? null,
    role: targetProfile.role,
  });

  return NextResponse.json({ success: true, userId: inviteData.user.id });
}
