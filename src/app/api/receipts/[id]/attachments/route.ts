import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Body = { documentUrls?: string[] };

async function canManageReceipt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  receiptId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = profile?.role;
  if (role === "employee" || role === "controller") return true;
  if (role === "driver") {
    const { data: receipt } = await supabase
      .from("receipts")
      .select("created_by")
      .eq("id", receiptId)
      .single();
    return receipt?.created_by === userId;
  }
  return false;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: receiptId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await canManageReceipt(supabase, user.id, receiptId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const documentUrls = (body.documentUrls ?? []).filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  if (documentUrls.length === 0) {
    return NextResponse.json({ error: "No document URLs provided" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY (cannot save attachments)",
      },
      { status: 500 }
    );
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.from("receipt_attachments").insert(
    documentUrls.map((document_url) => ({ receipt_id: receiptId, document_url }))
  );

  if (error) {
    const hint =
      error.code === "42P01" || error.message.includes("receipt_attachments")
        ? " Database migration missing — run `npm run db:push` on the Supabase project."
        : "";
    return NextResponse.json(
      { error: `${error.message}${hint}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, count: documentUrls.length });
}
