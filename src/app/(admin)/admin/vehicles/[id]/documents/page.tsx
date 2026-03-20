import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DocumentUpload } from "./document-upload";
import { DocumentLibrary, type DocumentItem } from "./document-library";
import { AddInsuranceForm, AddRegistrationForm, AddWarrantyForm } from "./insurance-registration-forms";

function mapToDocumentItems(
  vehicleId: string,
  insurance: { id: string; provider: string; policy_number: string | null; expiry_date: string; document_url: string | null }[],
  registrations: { id: string; state: string; expiry_date: string; document_url: string | null }[],
  warranties: { id: string; warranty_type: string; expiry_date: string | null; expiry_miles: number | null; document_url: string | null; created_at: string }[],
  emissions: { id: string; test_date: string; passed: boolean; expiry_date: string | null; document_url: string | null }[],
  vehicleDocs: { id: string; doc_type: string; title: string; document_url: string; notes: string | null; created_at: string }[],
  maintenance: { id: string; type: string; date: string; receipt_url: string | null }[]
): DocumentItem[] {
  const items: DocumentItem[] = [];

  for (const i of insurance) {
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
        vehicleId,
        canDelete: true,
      });
    }
  }

  for (const r of registrations) {
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
        vehicleId,
        canDelete: true,
      });
    }
  }

  for (const w of warranties) {
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
        vehicleId,
        canDelete: true,
      });
    }
  }

  for (const e of emissions) {
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
        vehicleId,
        canDelete: true,
      });
    }
  }

  for (const d of vehicleDocs) {
    items.push({
      id: `vault-${d.id}`,
      source: "vault",
      sourceId: d.id,
      title: d.title,
      subtitle: d.notes ?? d.doc_type,
      documentUrl: d.document_url,
      date: d.created_at.slice(0, 10),
      vehicleId,
      canDelete: true,
    });
  }

  for (const m of maintenance) {
    if (m.receipt_url) {
      items.push({
        id: `maint-${m.id}`,
        source: "maintenance",
        sourceId: m.id,
        title: `${m.type.replace(/_/g, " ")} — ${m.date}`,
        subtitle: "Maintenance record",
        documentUrl: m.receipt_url,
        date: m.date,
        vehicleId,
        canDelete: false,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export default async function VehicleDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [vehicleRes, warrantiesRes, emissionsRes, vehicleDocsRes, maintenanceRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, make, model, year, insurance(*), registrations(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("vehicle_warranties")
      .select("id, warranty_type, expiry_date, expiry_miles, document_url, created_at")
      .eq("vehicle_id", id)
      .order("expiry_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("vehicle_emissions")
      .select("id, test_date, passed, expiry_date, document_url")
      .eq("vehicle_id", id)
      .order("test_date", { ascending: false }),
    supabase
      .from("vehicle_documents")
      .select("id, doc_type, title, document_url, notes, created_at")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_records")
      .select("id, type, date, receipt_url")
      .eq("vehicle_id", id)
      .not("receipt_url", "is", null)
      .order("date", { ascending: false }),
  ]);

  if (vehicleRes.error || !vehicleRes.data) notFound();

  const vehicle = vehicleRes.data;
  const insuranceItems = (vehicle.insurance as { id: string; provider: string; policy_number: string | null; expiry_date: string; document_url: string | null }[]) ?? [];
  const registrationItems = (vehicle.registrations as { id: string; state: string; expiry_date: string; document_url: string | null }[]) ?? [];
  const warrantyItems = warrantiesRes.data ?? [];
  const emissionsItems = emissionsRes.data ?? [];
  const vehicleDocsItems = vehicleDocsRes.data ?? [];
  const maintenanceItems = maintenanceRes.data ?? [];

  const documentItems = mapToDocumentItems(
    id,
    insuranceItems,
    registrationItems,
    warrantyItems,
    emissionsItems,
    vehicleDocsItems,
    maintenanceItems
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/vehicles/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-foreground">
        Documents — {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      {/* Add forms */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Add documents</h2>
          <p className="text-sm text-muted-foreground">
            Add insurance, registrations, or upload to the vault.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <AddInsuranceForm vehicleId={id} />
            <AddRegistrationForm vehicleId={id} />
            <AddWarrantyForm vehicleId={id} />
          </div>
          <DocumentUpload vehicleId={id} />
        </CardContent>
      </Card>

      {/* Unified document library */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">All documents</h2>
          <p className="text-sm text-muted-foreground">
            {documentItems.length} document{documentItems.length !== 1 ? "s" : ""} — search, filter, and sort.
          </p>
        </CardHeader>
        <CardContent>
          <DocumentLibrary items={documentItems} vehicleId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
