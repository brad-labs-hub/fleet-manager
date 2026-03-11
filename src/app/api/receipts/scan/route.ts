import Anthropic from "@anthropic-ai/sdk";
import type { ImageBlockParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { NextRequest, NextResponse } from "next/server";
import { RECEIPT_CATEGORIES, type ReceiptCategory } from "@/types/database";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You are a receipt parser. Extract the following fields from this receipt and return ONLY valid JSON with no markdown, no code fences, no explanation:
{
  "vendor": "merchant or store name, or null if not found",
  "amount": total amount as a plain number (e.g. 45.23), or null if not found,
  "date": date in YYYY-MM-DD format, or null if not found,
  "category": pick the single best match from exactly these values: gas, detailing, parking, food, miscellaneous, ez_pass, auto_supplies, maintenance — or null if none fit,
  "notes": one short sentence describing key items purchased, or null if nothing notable
}`;

type ScanResult = {
  vendor: string | null;
  amount: number | null;
  date: string | null;
  category: ReceiptCategory | null;
  notes: string | null;
};

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ValidImageType = typeof VALID_IMAGE_TYPES[number];

function isValidImageType(type: string): type is ValidImageType {
  return (VALID_IMAGE_TYPES as readonly string[]).includes(type);
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const mimeType = file.type;
  const isPdf = mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = isValidImageType(mimeType);

  if (!isPdf && !isImage) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const textBlock: TextBlockParam = { type: "text", text: PROMPT };

    let rawText: string;

    if (isPdf) {
      // PDFs: use claude-3-5-sonnet which supports native PDF documents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBlock: any = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      };
      const msg = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        messages: [{ role: "user", content: [pdfBlock, textBlock] }],
      });
      rawText = msg.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");
    } else {
      const imageBlock: ImageBlockParam = {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as ValidImageType,
          data: base64,
        },
      };
      const msg = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 512,
        messages: [{ role: "user", content: [imageBlock, textBlock] }],
      });
      rawText = msg.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");
    }

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```[a-z]*\n?/gi, "").trim();

    let parsed: Partial<ScanResult>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    const result: ScanResult = {
      vendor: typeof parsed.vendor === "string" && parsed.vendor ? parsed.vendor : null,
      amount:
        typeof parsed.amount === "number" && isFinite(parsed.amount) && parsed.amount > 0
          ? Math.round(parsed.amount * 100) / 100
          : null,
      date:
        typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
          ? parsed.date
          : null,
      category:
        typeof parsed.category === "string" &&
        RECEIPT_CATEGORIES.includes(parsed.category as ReceiptCategory)
          ? (parsed.category as ReceiptCategory)
          : null,
      notes: typeof parsed.notes === "string" && parsed.notes ? parsed.notes : null,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Receipt scan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    );
  }
}
