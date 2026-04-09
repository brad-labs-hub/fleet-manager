import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Key, Droplets, Wrench, AlertTriangle, FileText, ClipboardCheck } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getSecureDocumentHref } from "@/lib/document-links";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicleRow, error } = await supabase
    .from("vehicles")
    .select(
      `
      *,
      location:locations(*),
      keys(*),
      fluid_checks(*),
      maintenance_records(*),
      maintenance_alerts(*),
      insurance(*),
      registrations(*),
      vehicle_emissions(*)
    `
    )
    .eq("id", id)
    .single();

  const { data: inspections } = await supabase
    .from("vehicle_inspections")
    .select("id, inspected_at, result, notes")
    .eq("vehicle_id", id)
    .order("inspected_at", { ascending: false })
    .limit(5);

  if (error || !vehicleRow) notFound();

  const warrantiesRes = await supabase.from("vehicle_warranties").select("*").eq("vehicle_id", id);
  const vehicle = {
    ...vehicleRow,
    vehicle_warranties: warrantiesRes.error ? [] : (warrantiesRes.data ?? []),
  };

  const loc = vehicle.location as { name: string; code: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          {vehicle.color && (
            <p className="text-muted-foreground">{vehicle.color}</p>
          )}
          {vehicle.license_plate && (
            <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
          )}
          {(vehicle as { current_odometer?: number | null }).current_odometer != null && (
            <p className="text-sm text-muted-foreground">
              Odometer: {(vehicle as { current_odometer: number }).current_odometer.toLocaleString()} mi
            </p>
          )}
          {loc && (
            <p className="text-sm text-muted-foreground mt-1">
              Location: {loc.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/driver/vehicles/${id}/mileage`}>
            <Button size="sm" variant="outline">Log mileage</Button>
          </Link>
          <Link href={`/driver/vehicles/${id}/inspection/new`}>
            <Button size="sm" variant="outline">Pre-trip inspection</Button>
          </Link>
          <Link href={`/driver/vehicles/${id}/emissions/new`}>
            <Button size="sm" variant="outline">Log emission test</Button>
          </Link>
          <Link href={`/driver/vehicles/${id}/maintenance/new`}>
            <Button size="sm">Log Maintenance</Button>
          </Link>
        </div>
      </div>

      {vehicle.maintenance_alerts &&
        (
          vehicle.maintenance_alerts as { dismissed: boolean }[]
        ).filter((a) => !a.dismissed).length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <h2 className="font-semibold flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </h2>
            </CardHeader>
            <CardContent className="space-y-1">
              {(
                    vehicle.maintenance_alerts as {
                      id: string;
                      alert_type: string;
                      due_date: string;
                      dismissed: boolean;
                    }[]
                  )
                    .filter((a) => !a.dismissed)
                    .map((a) => (
                    <p key={a.id} className="text-sm">
                        {a.alert_type} — {a.due_date ? formatDate(a.due_date) : "Due"}
                      </p>
                    ))}
            </CardContent>
          </Card>
        )}

      {inspections && inspections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold flex items-center gap-2 text-foreground">
              <ClipboardCheck className="h-4 w-4" />
              Recent inspections
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {inspections.map((inv) => {
                const date = inv.inspected_at.slice(0, 10);
                const items = (inv.result as { name: string; ok: boolean }[]) || [];
                const failed = items.filter((i) => !i.ok).map((i) => i.name);
                return (
                  <li key={inv.id} className="text-foreground">
                    {formatDate(date)}
                    {failed.length > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 ml-1">
                        — {failed.join(", ")} failed
                      </span>
                    )}
                    {inv.notes && <span className="text-muted-foreground block">{inv.notes}</span>}
                  </li>
                );
              })}
            </ul>
            <Link href={`/driver/vehicles/${id}/inspection/new`} className="mt-2 inline-block">
              <Button variant="outline" size="sm">New inspection</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2 text-foreground text-base">
            <FileText className="h-5 w-5 text-primary" />
            Documents
          </h2>
          <p className="text-sm text-muted-foreground">Insurance, registration, warranty, and emissions — tap to open PDF</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Insurance</h3>
            {(vehicle.insurance as unknown[])?.length > 0 ? (
              <ul className="space-y-2">
                {(vehicle.insurance as {
                  id: string;
                  provider: string;
                  policy_number: string | null;
                  expiry_date: string;
                  document_url: string | null;
                }[]).map((i) => (
                  <li key={i.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg p-3 bg-muted/40">
                    <div>
                      <span className="font-medium text-foreground">{i.provider}</span>
                      {i.policy_number && <span className="text-muted-foreground"> — {i.policy_number}</span>}
                      <p className="text-xs text-muted-foreground">Expires {formatDate(i.expiry_date)}</p>
                    </div>
                    {i.document_url ? (
                      <a
                        href={getSecureDocumentHref(i.document_url)}
                        className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
                        aria-label="View insurance PDF"
                      >
                        <FileText className="h-4 w-4" />
                        View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No document</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No insurance records</p>
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Registrations</h3>
            {(vehicle.registrations as unknown[])?.length > 0 ? (
              <ul className="space-y-2">
                {(vehicle.registrations as {
                  id: string;
                  state: string;
                  expiry_date: string;
                  document_url: string | null;
                }[]).map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg p-3 bg-muted/40">
                    <div>
                      <span className="font-medium text-foreground">{r.state}</span>
                      <p className="text-xs text-muted-foreground">Expires {formatDate(r.expiry_date)}</p>
                    </div>
                    {r.document_url ? (
                      <a
                        href={getSecureDocumentHref(r.document_url)}
                        className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
                        aria-label="View registration PDF"
                      >
                        <FileText className="h-4 w-4" />
                        View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No document</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No registration records</p>
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Warranty</h3>
            {(vehicle.vehicle_warranties as unknown[])?.length > 0 ? (
              <ul className="space-y-2">
                {(vehicle.vehicle_warranties as {
                  id: string;
                  warranty_type: string;
                  expiry_date: string | null;
                  expiry_miles: number | null;
                  document_url: string | null;
                }[]).map((w) => {
                  const typeLabel = w.warranty_type?.replace(/_/g, " ") ?? "Warranty";
                  const expiry = w.expiry_date
                    ? `Expires ${formatDate(w.expiry_date)}`
                    : w.expiry_miles
                      ? `Expires at ${w.expiry_miles.toLocaleString()} mi`
                      : null;
                  return (
                    <li key={w.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg p-3 bg-muted/40">
                      <div>
                        <span className="font-medium text-foreground capitalize">{typeLabel}</span>
                        {expiry && <p className="text-xs text-muted-foreground">{expiry}</p>}
                      </div>
                      {w.document_url ? (
                        <a
                          href={getSecureDocumentHref(w.document_url)}
                          className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
                          aria-label="View warranty PDF"
                        >
                          <FileText className="h-4 w-4" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No document</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No warranty records</p>
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emissions</h3>
            {(vehicle.vehicle_emissions as unknown[])?.length > 0 ? (
              <ul className="space-y-2">
                {(vehicle.vehicle_emissions as {
                  id: string;
                  test_date: string;
                  passed: boolean;
                  expiry_date: string | null;
                  document_url: string | null;
                }[])
                  .sort((a, b) => b.test_date.localeCompare(a.test_date))
                  .map((e) => (
                    <li key={e.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg p-3 bg-muted/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{formatDate(e.test_date)}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            e.passed
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}>
                            {e.passed ? "Pass" : "Fail"}
                          </span>
                        </div>
                        {e.expiry_date && (
                          <p className="text-xs text-muted-foreground">Expires {formatDate(e.expiry_date)}</p>
                        )}
                      </div>
                      {e.document_url ? (
                        <a
                          href={getSecureDocumentHref(e.document_url)}
                          className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
                          aria-label="View emissions certificate"
                        >
                          <FileText className="h-4 w-4" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No document</span>
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No emissions records</p>
            )}
            <Link href={`/driver/vehicles/${id}/emissions/new`} className="mt-3 inline-block">
              <Button variant="outline" size="sm">Log emission test</Button>
            </Link>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" />
            Keys
          </h2>
        </CardHeader>
        <CardContent>
          {(vehicle.keys as unknown[])?.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {(vehicle.keys as { id: string; key_type: string; location: string }[]).map(
                (k) => (
                  <li key={k.id}>
                    {k.key_type} — {k.location ?? "—"}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No keys recorded</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Fluid Checks
          </h2>
        </CardHeader>
        <CardContent>
          {(vehicle.fluid_checks as unknown[])?.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.fluid_checks as {
                id: string;
                fluid_type: string;
                level: string;
                last_check_date: string;
              }[]).map((f) => (
                <li key={f.id} className="flex justify-between">
                  <span>{f.fluid_type}</span>
                  <span>
                    {f.level} — {formatDate(f.last_check_date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No fluid checks</p>
          )}
          <Link href={`/driver/vehicles/${id}/fluids/new`} className="mt-2 block">
            <Button variant="outline" size="sm">
              Add Fluid Check
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Recent Maintenance
          </h2>
        </CardHeader>
        <CardContent>
          {(vehicle.maintenance_records as unknown[])?.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {(vehicle.maintenance_records as {
                id: string;
                type: string;
                description: string;
                date: string;
                cost: number;
              }[])
                .slice(0, 5)
                .map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>
                      {m.type} — {formatDate(m.date)}
                    </span>
                    <span>{m.cost ? formatCurrency(m.cost) : "—"}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No maintenance records</p>
          )}
          <Link href={`/driver/vehicles/${id}/maintenance/new`} className="mt-2 block">
            <Button variant="outline" size="sm">
              Log Maintenance
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
