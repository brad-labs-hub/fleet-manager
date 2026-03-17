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
    return NextResponse.json({ error: "Forbidden — only controllers can reset passwords" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfiguration: missing service role key" }, { status: 500 });
  }

  const { data: targetProfile } = await supabase
    .from("user_profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!targetProfile?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (() => { const u = new URL(request.url); return `${u.protocol}//${u.host}`; })();

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: targetProfile.email,
    options: { redirectTo: `${appUrl}/reset-password` },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actionLink = linkData.properties?.action_link;
  if (!actionLink) return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });

  return NextResponse.json({
    success: true,
    link: actionLink,
    message: "Copy this link and send it to the user. They can set a new password.",
  });
}
