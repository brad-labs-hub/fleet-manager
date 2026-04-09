import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getSecureDocumentHref } from "@/lib/document-links";
import { VehicleDriverAssignments } from "./vehicle-driver-assignments";
import { MaintenanceSectionList } from "./maintenance/maintenance-section-list";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  out_of_service: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  in_repair: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  out_of_service: "Out of Service",
  in_repair: "In Repair",
};

export default async function AdminVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ytdStart = `${new Date().getFullYear()}-01-01`;
  const [vehicleRes, receiptsSumRes, maintenanceSumRes, assignmentsRes, driversRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        `
      *,
      location:locations(*),
      maintenance_records(*),
      insurance(*),
      registrations(*),
      vehicle_emissions(*),
      keys(*)
    `
      )
      .eq("id", id)
      .single(),
    supabase.from("receipts").select("amount").eq("vehicle_id", id).gte("date", ytdStart),
    supabase.from("maintenance_records").select("cost").eq("vehicle_id", id).gte("date", ytdStart),
    supabase.from("driver_assignments").select("user_id").eq("vehicle_id", id),
    supabase.from("user_profiles").select("id, name, email").eq("role", "driver"),
  ]);

  const { data: vehicleRow, error } = vehicleRes;
  const receiptsYtd = (receiptsSumRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const maintenanceYtd = (maintenanceSumRes.data ?? []).reduce((s, m) => s + Number(m.cost ?? 0), 0);
  const totalYtd = receiptsYtd + maintenanceYtd;

  const assignmentUserIds = (assignmentsRes.data ?? []).map((a) => a.user_id);
  const driversList = driversRes.data ?? [];
  const assignedProfiles = assignmentUserIds
    .map((uid) => driversList.find((d) => d.id === uid))
    .filter(Boolean)
    .map((d) => ({ user_id: d!.id, name: d!.name, email: d!.email }));

  if (error || !vehicleRow) notFound();

  // Fetch warranties separately so missing migration/table does not break the whole page
  const warrantiesRes = await supabase.from("vehicle_warranties").select("*").eq("vehicle_id", id);
  const vehicle = {
    ...vehicleRow,
    vehicle_warranties: warrantiesRes.error ? [] : (warrantiesRes.data ?? []),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[vehicle.status as string] ?? ""}`}>
                {STATUS_LABELS[vehicle.status as string] ?? vehicle.status}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {(vehicle.location as unknown as { name: string })?.name ?? "—"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/vehicles/${id}/documents`}>
            <Button variant="outline">Documents</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/keys`}>
            <Button variant="outline">Keys</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/tires`}>
            <Button variant="outline">Tires</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/alerts`}>
            <Button variant="outline">Alerts</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/emissions/new`}>
            <Button variant="outline">Add Emission</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/maintenance`}>
            <Button variant="outline">Maintenance</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/maintenance/new`}>
            <Button variant="outline">Add Maintenance</Button>
          </Link>
          <Link href={`/admin/vehicles/${id}/edit`}>
            <Button>Edit</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Details</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          {vehicle.vin && <p><span className="text-muted-foreground">VIN:</span> {vehicle.vin}</p>}
          {vehicle.license_plate && <p><span className="text-muted-foreground">License:</span> {vehicle.license_plate}</p>}
          {vehicle.color && <p><span className="text-muted-foreground">Color:</span> {vehicle.color}</p>}
          {(vehicle as { current_odometer?: number | null }).current_odometer != null && (
            <p>
              <span className="text-muted-foreground">Odometer:</span>{" "}
              {(vehicle as { current_odometer: number }).current_odometer.toLocaleString()} mi
              {(vehicle as { odometer_updated_at?: string | null }).odometer_updated_at && (
                <span className="text-muted-foreground ml-1">
                  (updated {formatDate((vehicle as { odometer_updated_at: string }).odometer_updated_at.slice(0, 10))})
                </span>
              )}
            </p>
          )}
          {vehicle.notes && <p><span className="text-muted-foreground">Notes:</span> {vehicle.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Cost summary</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipts (YTD)</span>
            <span className="font-medium text-foreground">{formatCurrency(receiptsYtd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maintenance (YTD)</span>
            <span className="font-medium text-foreground">{formatCurrency(maintenanceYtd)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-medium text-foreground">Total spend (YTD)</span>
            <span className="font-bold text-foreground">{formatCurrency(totalYtd)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Assigned drivers</h2>
        </CardHeader>
        <CardContent>
          <VehicleDriverAssignments
            vehicleId={id}
            assigned={assignedProfiles}
            drivers={driversList}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Insurance</h2>
        </CardHeader>
        <CardContent>
          {(vehicle.insurance as unknown[])?.length ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.insurance as { id: string; provider: string; expiry_date: string; document_url: string | null }[]).map(
                (i) => (
                  <li key={i.id} className="flex justify-between items-center gap-2">
                    <span className="text-foreground">{i.provider}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">expires {formatDate(i.expiry_date)}</span>
                      {i.document_url && (
                        <a
                          href={getSecureDocumentHref(i.document_url)}
                          className="text-primary hover:underline text-xs font-medium"
                          aria-label="View insurance document"
                        >
                          View
                        </a>
                      )}
                    </span>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground">No insurance records</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Registrations</h2>
        </CardHeader>
        <CardContent>
          {(vehicle.registrations as unknown[])?.length ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.registrations as { id: string; state: string; expiry_date: string; document_url: string | null }[]).map(
                (r) => (
                  <li key={r.id} className="flex justify-between items-center gap-2">
                    <span className="text-foreground">{r.state}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">expires {formatDate(r.expiry_date)}</span>
                      {r.document_url && (
                        <a
                          href={getSecureDocumentHref(r.document_url)}
                          className="text-primary hover:underline text-xs font-medium"
                          aria-label="View registration document"
                        >
                          View
                        </a>
                      )}
                    </span>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground">No registration records</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Warranty</h2>
            <Link
              href={`/admin/vehicles/${id}/documents`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(vehicle.vehicle_warranties as unknown[])?.length ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.vehicle_warranties as {
                id: string;
                warranty_type: string;
                expiry_date: string | null;
                expiry_miles: number | null;
                document_url: string | null;
              }[]).map((w) => {
                const typeLabel = w.warranty_type?.replace(/_/g, " ") ?? "Warranty";
                const expiry = w.expiry_date
                  ? `expires ${formatDate(w.expiry_date)}`
                  : w.expiry_miles
                    ? `expires at ${w.expiry_miles.toLocaleString()} mi`
                    : null;
                return (
                  <li key={w.id} className="flex justify-between items-center gap-2">
                    <span className="text-foreground capitalize">{typeLabel}</span>
                    <span className="flex items-center gap-2">
                      {expiry && <span className="text-muted-foreground">{expiry}</span>}
                      {w.document_url && (
                        <a
                          href={getSecureDocumentHref(w.document_url)}
                          className="text-primary hover:underline text-xs font-medium"
                          aria-label="View warranty document"
                        >
                          View
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No warranty records</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Emissions</h2>
            <Link
              href={`/admin/vehicles/${id}/emissions/new`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(vehicle.vehicle_emissions as unknown[])?.length ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.vehicle_emissions as {
                id: string;
                test_date: string;
                passed: boolean;
                expiry_date: string | null;
                document_url: string | null;
              }[])
                .sort((a, b) => b.test_date.localeCompare(a.test_date))
                .map((e) => (
                  <li key={e.id} className="flex justify-between items-center gap-2">
                    <span className="text-foreground flex items-center gap-2">
                      {formatDate(e.test_date)}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        e.passed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}>
                        {e.passed ? "Pass" : "Fail"}
                      </span>
                      {e.expiry_date && (
                        <span className="text-muted-foreground text-xs">expires {formatDate(e.expiry_date)}</span>
                      )}
                    </span>
                    {e.document_url && (
                      <a
                        href={getSecureDocumentHref(e.document_url)}
                        className="text-primary hover:underline text-xs font-medium shrink-0"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No emissions records</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Maintenance</h2>
            <Link
              href={`/admin/vehicles/${id}/maintenance`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(vehicle.maintenance_records as unknown[])?.length ? (
            <MaintenanceSectionList
              records={
                vehicle.maintenance_records as {
                  id: string;
                  type: string;
                  date: string;
                  cost: number | null;
                  status?: string | null;
                  scheduled_date?: string | null;
                  receipt_url?: string | null;
                  vendor?: string | null;
                  description?: string | null;
                }[]
              }
            />
          ) : (
            <p className="text-muted-foreground">No maintenance records</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
