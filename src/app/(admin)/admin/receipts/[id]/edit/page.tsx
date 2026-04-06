"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RECEIPT_CATEGORIES, type ReceiptCategory } from "@/types/database";
import { getSecureDocumentHref } from "@/lib/document-links";

export default function EditReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [category, setCategory] = useState<ReceiptCategory>("gas");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; make: string; model: string; year: number }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [vRes, lRes, rRes] = await Promise.all([
        supabase.from("vehicles").select("id, make, model, year").order("make"),
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("receipts").select("*").eq("id", id).single(),
      ]);
      setVehicles(vRes.data ?? []);
      setLocations(lRes.data ?? []);
      const r = rRes.data;
      if (r) {
        setCategory((r.category as ReceiptCategory) ?? "gas");
        setAmount(String(r.amount ?? ""));
        setDate((r.date ?? "").toString().slice(0, 10));
        setVendor(r.vendor ?? "");
        setNotes(r.notes ?? "");
        setVehicleId(r.vehicle_id ?? "");
        setLocationId(r.location_id ?? "");
        setDocumentUrl(r.document_url ?? null);
      }
      setLoadingData(false);
    }
    load();
  }, [supabase, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalDocumentUrl = documentUrl;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `receipts/${id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
        finalDocumentUrl = urlData.publicUrl;
      }
      const { error } = await supabase
        .from("receipts")
        .update({
          category,
          amount: parseFloat(amount),
          date,
          vendor: vendor || null,
          notes: notes || null,
          vehicle_id: vehicleId || null,
          location_id: locationId || null,
          document_url: finalDocumentUrl,
        })
        .eq("id", id);
      if (error) throw error;
      router.push("/admin/receipts");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Edit Receipt</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/receipts" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Receipts
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Edit Receipt</h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Receipt Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ReceiptCategory)}
                className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {RECEIPT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Shell, Mobil"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle">Vehicle (optional)</Label>
                <select
                  id="vehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">— None —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="location">Location (optional)</Label>
                <select
                  id="location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">— None —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="file">Document (optional — replace existing)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1"
              />
              {documentUrl && !file && (
                <p className="text-sm text-muted-foreground mt-1">
                  <a href={getSecureDocumentHref(documentUrl)} target="_blank" rel="noopener noreferrer" className="underline">
                    View current document
                  </a>
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
