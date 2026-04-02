import { NextRequest, NextResponse } from "next/server";
import { PassThrough } from "stream";
import archiver from "archiver";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

function sanitizeFilename(str: string): string {
  return str.replace(/[/\\:*?"<>|]/g, "-").trim() || "Receipt";
}

function formatReceiptFilename(
  amount: number,
  vendor: string | null,
  notes: string | null,
  usedNames: Set<string>
): string {
  const label = (vendor || notes || "Receipt").trim();
  const safe = sanitizeFilename(label);
  const base = `$${Number(amount).toFixed(2)} ${safe}`;
  let name = base;
  let n = 1;
  while (usedNames.has(name.toLowerCase())) {
    name = `${base} (${++n})`;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function getExtension(url: string): string {
  const path = url.split("?")[0];
  const ext = path.split(".").pop()?.toLowerCase();
  return ext && ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)
    ? `.${ext}`
    : ".pdf";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, receiptIds } = body as {
      startDate?: string;
      endDate?: string;
      receiptIds?: string[];
    };

    if (receiptIds && !Array.isArray(receiptIds)) {
      return NextResponse.json(
        { error: "receiptIds must be an array of receipt IDs" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from("receipts")
      .select("id, date, category, amount, vendor, notes, document_url, vehicle:vehicles(make, model, year)")
      .order("date", { ascending: true });

    if (receiptIds && receiptIds.length > 0) {
      query = query.in("id", receiptIds);
    } else {
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);
    }

    const { data: receipts, error } = await query;
    if (error) throw error;

    const list = receipts ?? [];
    const usedNames = new Set<string>();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Fleet Manager";
    const sheet = workbook.addWorksheet("Receipts");
    sheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Vendor", key: "vendor", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Vehicle", key: "vehicle", width: 25 },
    ];
    list.forEach((r) => {
      const v = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
      sheet.addRow({
        date: r.date,
        category: (r.category ?? "").replace("_", " "),
        amount: Number(r.amount),
        vendor: r.vendor ?? "",
        notes: r.notes ?? "",
        vehicle: v ? `${v.year} ${v.make} ${v.model}` : "",
      });
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    const archive = archiver("zip", { zlib: { level: 9 } });
    const output = new PassThrough();
    archive.pipe(output);
    const chunks: Buffer[] = [];
    output.on("data", (chunk: Buffer) => chunks.push(chunk));

    const archiveDone = new Promise<void>((resolve, reject) => {
      output.on("end", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
    });

    archive.append(Buffer.from(excelBuffer), { name: "transactions.xlsx" });

    for (const r of list) {
      const docUrl = (r as { document_url?: string | null }).document_url;
      if (!docUrl) continue;

      try {
        const resp = await fetch(docUrl);
        if (!resp.ok) continue;
        const buf = Buffer.from(await resp.arrayBuffer());
        const ext = getExtension(docUrl);
        const baseName = formatReceiptFilename(
          Number((r as { amount: number }).amount),
          (r as { vendor: string | null }).vendor,
          (r as { notes: string | null }).notes,
          usedNames
        );
        archive.append(buf, { name: `attachments/${baseName}${ext}` });
      } catch {
        // Skip failed fetches
      }
    }

    await archive.finalize();
    await archiveDone;

    const zipBuffer = Buffer.concat(chunks);
    const filename = `accountant-export-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Accountant export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
