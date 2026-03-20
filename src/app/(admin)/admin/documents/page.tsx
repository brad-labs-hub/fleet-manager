import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DocumentLibrary, type DocumentItem } from "../vehicles/[id]/documents/document-library";

export default async function FleetDocumentsPage() {
  const supabase = await createClient();

  const [vehiclesRes, insuranceRes, registrationsRes, warrantiesRes, emissionsRes, vehicleDocsRes, maintenanceRes] = await Promise.all([
    supabase.from("vehicles").select("id, year, make, model").order("make"),
    supabase.from("insurance").select("id, vehicle_id, provider, policy_number, expiry_date, document_url"),
    supabase.from("registrations").select("id, vehicle_id, state, expiry_date, document_url"),
    supabase.from("vehicle_warranties").select("id, vehicle_id, warranty_type, expiry_date, expiry_miles, document_url, created_at"),
    supabase.from("vehicle_emissions").select("id, vehicle_id, test_date, passed, expiry_date, document_url"),
    supabase.from("vehicle_documents").select("id, vehicle_id, doc_type, title, document_url, notes, created_at"),
    supabase.from("maintenance_records").select("id, vehicle_id, type, date, receipt_url").not("receipt_url", "is", null),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const vehicleMap = new Map(vehicles.map((v) => [v.id, `${v.year} ${v.make} ${v.model}`]));

  const items: DocumentItem[] = [];

  for (const i of insuranceRes.data ?? []) {
    if (i.document_url) {
      items.push({
        id: `ins-${i.id}`,
        source: "insurance",
        sourceId: i.id,
        title: i.provider,
        subtitle: i.policy_number ? `Policy ${i.policy_number} · expires ${i.expiry_date}` : `Expires ${i.expiry_date}`,
        documentUrl: i.document_url,
        date: i.expiry_date,
        expiryDate: i.expiry_date,
        vehicleId: i.vehicle_id,
        vehicleLabel: vehicleMap.get(i.vehicle_id) ?? undefined,
        canDelete: true,
      });
    }
  }

  for (const r of registrationsRes.data ?? []) {
    if (r.document_url) {
      items.push({
        id: `reg-${r.id}`,
        source: "registration",
        sourceId: r.id,
        title: r.state,
        subtitle: `Expires ${r.expiry_date}`,
        documentUrl: r.document_url,
        date: r.expiry_date,
        expiryDate: r.expiry_date,
        vehicleId: r.vehicle_id,
        vehicleLabel: vehicleMap.get(r.vehicle_id) ?? undefined,
        canDelete: true,
      });
    }
  }

  for (const w of warrantiesRes.error ? [] : (warrantiesRes.data ?? [])) {
    if (w.document_url) {
      const typeLabel = w.warranty_type?.replace(/_/g, " ") ?? "Warranty";
      const subtitle = w.expiry_date
        ? `Expires ${w.expiry_date}`
        : w.expiry_miles
          ? `Expires at ${w.expiry_miles.toLocaleString()} mi`
          : typeLabel;
      items.push({
        id: `warr-${w.id}`,
        source: "warranty",
        sourceId: w.id,
        title: typeLabel,
        subtitle,
        documentUrl: w.document_url,
        date: w.expiry_date ?? w.created_at.slice(0, 10),
        expiryDate: w.expiry_date ?? undefined,
        vehicleId: w.vehicle_id,
        vehicleLabel: vehicleMap.get(w.vehicle_id) ?? undefined,
        canDelete: true,
      });
    }
  }

  for (const e of emissionsRes.data ?? []) {
    if (e.document_url) {
      items.push({
        id: `emi-${e.id}`,
        source: "emissions",
        sourceId: e.id,
        title: `Emissions test ${e.test_date}`,
        subtitle: e.passed ? "Pass" : "Fail",
        documentUrl: e.document_url,
        date: e.test_date,
        expiryDate: e.expiry_date ?? undefined,
        vehicleId: e.vehicle_id,
        vehicleLabel: vehicleMap.get(e.vehicle_id) ?? undefined,
        canDelete: true,
      });
    }
  }

  for (const d of vehicleDocsRes.data ?? []) {
    items.push({
      id: `vault-${d.id}`,
      source: "vault",
      sourceId: d.id,
      title: d.title,
      subtitle: d.notes ?? d.doc_type,
      documentUrl: d.document_url,
      date: d.created_at.slice(0, 10),
      vehicleId: d.vehicle_id,
      vehicleLabel: vehicleMap.get(d.vehicle_id) ?? undefined,
      canDelete: true,
    });
  }

  for (const m of maintenanceRes.data ?? []) {
    if (m.receipt_url) {
      items.push({
        id: `maint-${m.id}`,
        source: "maintenance",
        sourceId: m.id,
        title: `${m.type.replace(/_/g, " ")} — ${m.date}`,
        subtitle: "Maintenance record",
        documentUrl: m.receipt_url,
        date: m.date,
        vehicleId: m.vehicle_id,
        vehicleLabel: vehicleMap.get(m.vehicle_id) ?? undefined,
        canDelete: false,
      });
    }
  }

  items.sort((a, b) => b.date.localeCompare(a.date));

  const vehicleOptions = vehicles.map((v) => ({
    id: v.id,
    label: `${v.year} ${v.make} ${v.model}`,
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Fleet documents</h1>
      <p className="text-muted-foreground text-sm">
        All documents across all vehicles. Filter by vehicle, type, or search.
      </p>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">All documents</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} document{items.length !== 1 ? "s" : ""} across {vehicles.length} vehicles.
          </p>
        </CardHeader>
        <CardContent>
          <DocumentLibrary
            items={items}
            vehicleId=""
            vehicles={vehicleOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
