import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  const guard = await requireRole(["employee", "controller"]);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const {
      receipts,
    }: {
      receipts: { date: string; category: string; amount: number; vendor: string | null; vehicle: { make: string; model: string; year: number } | null }[];
    } = body;

    const headers = ["Date", "Payee", "Category", "Amount", "Memo", "Class"];
    const rows = receipts?.map((r) => [
      r.date,
      r.vendor ?? "",
      r.category?.replace("_", " "),
      Number(r.amount).toFixed(2),
      r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "",
      r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "",
    ]) ?? [];

    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fleet-quickbooks.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
