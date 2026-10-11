import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDocumentStreamHref } from "@/lib/document-links";
import { VehicleGrid } from "./vehicle-grid";

export default async function AdminVehiclesPage() {
  const supabase = await createClient();
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: vehicles }, { data: locations }, { data: insurance }, { data: registrations }, { data: alerts }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select(
          "id, make, model, year, vin, color, license_plate, status, preview_image_path, location:locations(name)"
        )
        .order("make"),
      supabase.from("locations").select("id, name").order("name"),
      supabase.from("insurance").select("vehicle_id, expiry_date").lte("expiry_date", in60Days),
      supabase.from("registrations").select("vehicle_id, expiry_date").lte("expiry_date", in60Days),
      supabase
        .from("maintenance_alerts")
        .select("vehicle_id, due_date")
        .eq("dismissed", false)
        .not("due_date", "is", null)
        .lte("due_date", in60Days),
    ]);

  const vehiclesWithUrls = (vehicles ?? []).map((v) => {
    const loc = (Array.isArray(v.location) ? v.location[0] : v.location) as { name: string } | null;
    const allDates: { date: string; label: string }[] = [];
    (insurance ?? [])
      .filter((i) => i.vehicle_id === v.id)
      .forEach((i) => allDates.push({ date: i.expiry_date, label: "Insurance" }));
    (registrations ?? [])
      .filter((r) => r.vehicle_id === v.id)
      .forEach((r) => allDates.push({ date: r.expiry_date, label: "Registration" }));
    (alerts ?? [])
      .filter((a) => a.vehicle_id === v.id && a.due_date)
      .forEach((a) => allDates.push({ date: a.due_date!, label: "Alert" }));
    allDates.sort((a, b) => a.date.localeCompare(b.date));
    const next = allDates[0];
    return {
      ...v,
      location: loc,
      previewUrl: v.preview_image_path
        ? getDocumentStreamHref(
            supabase.storage.from("vehicle-previews").getPublicUrl(v.preview_image_path).data.publicUrl
          )
        : null,
      nextDueDate: next?.date,
      nextDueLabel: next?.label,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
        <div className="flex gap-2">
          <Link href="/admin/vehicles/import-documents">
            <Button variant="outline">Bulk import documents</Button>
          </Link>
          <Link href="/admin/vehicles/new">
            <Button>Add Vehicle</Button>
          </Link>
        </div>
      </div>

      <VehicleGrid
        vehicles={vehiclesWithUrls}
        locations={locations ?? []}
      />
    </div>
  );
}
