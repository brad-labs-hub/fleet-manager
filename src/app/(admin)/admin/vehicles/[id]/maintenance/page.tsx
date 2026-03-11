import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MaintenanceRecordList } from "./maintenance-record-list";

export default async function MaintenanceListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [vehicleRes, recordsRes] = await Promise.all([
    supabase.from("vehicles").select("id, year, make, model").eq("id", id).single(),
    supabase
      .from("maintenance_records")
      .select("id, type, description, date, cost, odometer, vendor, status, scheduled_date, next_due_date, next_due_miles, receipt_url")
      .eq("vehicle_id", id)
      .order("date", { ascending: false }),
  ]);

  if (vehicleRes.error || !vehicleRes.data) notFound();

  const vehicle = vehicleRes.data;
  const records = recordsRes.data ?? [];

  const totalCost = records.reduce((sum, r) => sum + Number(r.cost ?? 0), 0);
  const withDocs = records.filter((r) => r.receipt_url).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/admin/vehicles/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {vehicle.year} {vehicle.make} {vehicle.model}
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">Maintenance records</h1>
        </div>
        <Link href={`/admin/vehicles/${id}/maintenance/new`}>
          <Button>Add maintenance</Button>
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total records</p>
            <p className="text-2xl font-bold text-foreground">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total cost</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">With documents</p>
            <p className="text-2xl font-bold text-foreground">{withDocs}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">All records</h2>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 py-4">No maintenance records yet.</p>
          ) : (
            <MaintenanceRecordList records={records} vehicleId={id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
