import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getDocumentStreamHref } from "@/lib/document-links";
import { VehicleImage } from "@/components/vehicle-image";

export default async function VehiclesListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: assignmentRows } = user
    ? await supabase.from("driver_assignments").select("vehicle_id").eq("user_id", user.id)
    : { data: [] };
  const assignedVehicleIds = new Set((assignmentRows ?? []).map((r) => r.vehicle_id));

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, year, vin, color, license_plate, preview_image_path, location:locations(name, code)")
    .order("make");

  const sortedVehicles = (vehicles ?? []).slice().sort((a, b) => {
    const aAssigned = assignedVehicleIds.has(a.id);
    const bAssigned = assignedVehicleIds.has(b.id);
    if (aAssigned && !bAssigned) return -1;
    if (!aAssigned && bAssigned) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
      {assignedVehicleIds.size > 0 && (
        <p className="text-sm text-muted-foreground">Your assigned vehicles are listed first.</p>
      )}
      <div className="space-y-3">
        {sortedVehicles.map((v) => {
          const previewUrl = v.preview_image_path
            ? getDocumentStreamHref(
                supabase.storage.from("vehicle-previews").getPublicUrl(v.preview_image_path).data.publicUrl
              )
            : null;
          return (
          <Link key={v.id} href={`/driver/vehicles/${v.id}`}>
            <Card className="hover:bg-accent/50 transition cursor-pointer">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="shrink-0 w-24 h-16 rounded overflow-hidden bg-muted">
                  <VehicleImage
                    make={v.make}
                    model={v.model}
                    year={v.year}
                    color={v.color}
                    vin={v.vin}
                    imageUrl={previewUrl}
                    className="w-full h-full"
                  />
                </div>

                {/* Vehicle info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {v.year} {v.make} {v.model}
                  </h3>
                  {v.color && (
                    <p className="text-sm text-muted-foreground">{v.color}</p>
                  )}
                  {v.license_plate && (
                    <p className="text-sm text-muted-foreground">{v.license_plate}</p>
                  )}
                </div>

                {/* Location */}
                <span className="text-sm text-muted-foreground shrink-0">
                  {(v.location as unknown as { name: string; code: string })?.name ??
                    (v.location as unknown as { name: string; code: string })?.code ??
                    "—"}
                </span>
              </CardContent>
            </Card>
          </Link>
          );
        })}
        {sortedVehicles.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No vehicles in fleet</p>
        )}
      </div>
    </div>
  );
}
