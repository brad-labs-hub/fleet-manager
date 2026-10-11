import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  const guard = await requireRole(["employee", "controller"]);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const {
      receipts,
      vehicles,
      maintenance,
    }: {
      receipts: { category: string; amount: number; date: string; vendor: string | null; vehicle: { make: string; model: string; year: number } | null }[];
      vehicles: { make: string; model: string; year: number }[];
      maintenance: { type: string; cost: number | null; date: string; vehicle: { make: string; model: string; year: number } | null }[];
    } = body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Fleet Manager";

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];
    summarySheet.addRows([
      { metric: "Total Vehicles", value: vehicles?.length ?? 0 },
      { metric: "Total Receipts", value: receipts?.length ?? 0 },
      {
        metric: "Total Receipt Amount",
        value: receipts?.reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0) ?? 0,
      },
      { metric: "Total Maintenance Records", value: maintenance?.length ?? 0 },
    ]);

    const receiptsSheet = workbook.addWorksheet("Receipts");
    receiptsSheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Vendor", key: "vendor", width: 20 },
      { header: "Vehicle", key: "vehicle", width: 25 },
    ];
    receipts?.forEach((r: { date: string; category: string; amount: number; vendor: string | null; vehicle: { make: string; model: string; year: number } | null }) => {
      receiptsSheet.addRow({
        date: r.date,
        category: r.category?.replace("_", " "),
        amount: Number(r.amount),
        vendor: r.vendor ?? "",
        vehicle: r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "",
      });
    });

    const maintenanceSheet = workbook.addWorksheet("Maintenance");
    maintenanceSheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Type", key: "type", width: 15 },
      { header: "Cost", key: "cost", width: 12 },
      { header: "Vehicle", key: "vehicle", width: 25 },
    ];
    maintenance?.forEach((m: { date: string; type: string; cost: number | null; vehicle: { make: string; model: string; year: number } | null }) => {
      maintenanceSheet.addRow({
        date: m.date,
        type: m.type?.replace("_", " "),
        cost: m.cost ?? "",
        vehicle: m.vehicle ? `${m.vehicle.year} ${m.vehicle.make} ${m.vehicle.model}` : "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="fleet-export.xlsx"`,
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
