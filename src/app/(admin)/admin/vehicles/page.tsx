import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleImage } from "@/components/vehicle-image";

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

export default async function AdminVehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, year, vin, color, license_plate, status, location:locations(name)")
    .order("make");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
        <Link href="/admin/vehicles/new">
          <Button>Add Vehicle</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {vehicles?.map((v) => (
          <Link key={v.id} href={`/admin/vehicles/${v.id}`}>
            <Card className="hover:bg-accent/50 transition cursor-pointer">
              <CardContent className="p-3 flex items-center gap-4">
                {/* Vehicle image thumbnail */}
                <div className="shrink-0 w-24 h-16 rounded overflow-hidden bg-muted">
                  <VehicleImage
                    make={v.make}
                    model={v.model}
                    year={v.year}
                    color={v.color}
                    vin={v.vin}
                    className="w-full h-full"
                  />
                </div>

                {/* Vehicle info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">
                      {v.year} {v.make} {v.model}
                    </h3>
                    {v.status && v.status !== "active" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[v.status] ?? ""}`}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    )}
                  </div>
                  {v.license_plate && (
                    <p className="text-sm text-muted-foreground">{v.license_plate}</p>
                  )}
                </div>

                {/* Location */}
                <span className="text-sm text-muted-foreground shrink-0">
                  {(v.location as unknown as { name: string })?.name ?? "—"}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!vehicles || vehicles.length === 0) && (
          <p className="text-muted-foreground text-center py-8">No vehicles</p>
        )}
      </div>
    </div>
  );
}
