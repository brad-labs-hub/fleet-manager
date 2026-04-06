import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ParsedStoragePath = {
  bucket: string;
  objectPath: string;
};

function parseStorageUrl(rawUrl: string): ParsedStoragePath | null {
  try {
    const parsed = new URL(rawUrl);
    const marker = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/;
    const match = parsed.pathname.match(marker);
    if (!match || !match[1] || !match[2]) return null;
    return {
      bucket: decodeURIComponent(match[1]),
      objectPath: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("documentUrl");
  if (!raw) {
    return NextResponse.json({ error: "Missing documentUrl" }, { status: 400 });
  }

  const parsed = parseStorageUrl(raw);
  if (!parsed) {
    return NextResponse.redirect(raw);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.objectPath, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.redirect(raw);
    }

    return NextResponse.redirect(data.signedUrl);
  } catch {
    return NextResponse.redirect(raw);
  }
}
