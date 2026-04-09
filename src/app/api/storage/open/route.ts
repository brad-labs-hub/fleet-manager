import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ParsedStoragePath = {
  bucket: string;
  objectPath: string;
};

function parseStorageUrl(rawUrl: string): ParsedStoragePath | null {
  try {
    const parsed = new URL(rawUrl);
    const marker = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/;
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
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex"
    );
    return response;
  }

  const raw = request.nextUrl.searchParams.get("documentUrl");
  if (!raw) {
    return NextResponse.json({ error: "Missing documentUrl" }, { status: 400 });
  }

  const parsed = parseStorageUrl(raw);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .download(parsed.objectPath);

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await data.arrayBuffer();
    const filename = parsed.objectPath.split("/").pop() || "document";
    const contentType = data.type || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag":
          "noindex, nofollow, noarchive, nosnippet, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to open document" }, { status: 500 });
  }
}
