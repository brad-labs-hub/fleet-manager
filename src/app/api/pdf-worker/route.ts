import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "build",
      "pdf.worker.min.js"
    );
    const source = await fs.readFile(workerPath, "utf8");

    return new NextResponse(source, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to load PDF worker", error);
    return NextResponse.json(
      { error: "Failed to load PDF worker" },
      { status: 500 }
    );
  }
}
