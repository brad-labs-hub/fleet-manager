import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleGrid } from "./vehicle-grid";

export default async function AdminVehiclesPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: locations }] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        "id, make, model, year, vin, color, license_plate, status, preview_image_path, location:locations(name)"
      )
      .order("make"),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  const vehiclesWithUrls = (vehicles ?? []).map((v) => ({
    ...v,
    location: v.location as { name: string } | null,
    previewUrl: v.preview_image_path
      ? supabase.storage
          .from("vehicle-previews")
          .getPublicUrl(v.preview_image_path).data.publicUrl
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
        <Link href="/admin/vehicles/new">
          <Button>Add Vehicle</Button>
        </Link>
      </div>

      <VehicleGrid
        vehicles={vehiclesWithUrls}
        locations={locations ?? []}
      />
    </div>
  );
}
