"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getDocumentStreamHref } from "@/lib/document-links";

const supabase = createClient();

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "in_repair", label: "In Repair" },
];


export default function EditVehiclePage() {
  const params = useParams();
  const id = params.id as string;
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("active");
  const [currentOdometer, setCurrentOdometer] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImagePath, setPreviewImagePath] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const [locsRes, vehicleRes] = await Promise.all([
      supabase.from("locations").select("id, name").order("name"),
      supabase.from("vehicles").select("*").eq("id", id).single(),
    ]);
    setLocations(locsRes.data ?? []);
    const v = vehicleRes.data;
    if (v) {
      setMake(v.make);
      setModel(v.model);
      setYear(String(v.year));
      setVin(v.vin ?? "");
      setLicensePlate(v.license_plate ?? "");
      setColor(v.color ?? "");
      setNotes(v.notes ?? "");
      setLocationId(v.location_id ?? "");
      setStatus(v.status ?? "active");
      setPreviewImagePath(v.preview_image_path ?? null);
      setCurrentOdometer(v.current_odometer != null ? String(v.current_odometer) : "");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({
          make,
          model,
          year: parseInt(year),
          vin: vin || null,
          license_plate: licensePlate || null,
          color: color || null,
          notes: notes || null,
          location_id: locationId || null,
          status,
          current_odometer: currentOdometer ? parseInt(currentOdometer, 10) : null,
          odometer_updated_at: currentOdometer ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      router.push(`/admin/vehicles/${id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${year} ${make} ${model}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      router.push("/admin/vehicles");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  async function handlePreviewUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingPreview(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/preview.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("vehicle-previews")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ preview_image_path: path, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) throw updateError;
      setPreviewImagePath(path);
      e.target.value = "";
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPreview(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/admin/vehicles/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Edit Vehicle</h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Vehicle Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">— None —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input id="vin" value={vin} onChange={(e) => setVin(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="currentOdometer">Current odometer (mi)</Label>
              <Input
                id="currentOdometer"
                type="number"
                min="0"
                placeholder="e.g. 45000"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Preview photo</Label>
              {previewImagePath && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={getDocumentStreamHref(
                      supabase.storage.from("vehicle-previews").getPublicUrl(previewImagePath).data.publicUrl
                    )}
                    alt="Preview"
                    className="w-24 h-16 rounded object-cover border border-border"
                  />
                  <span className="text-xs text-muted-foreground">Current preview</span>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePreviewUpload}
                disabled={uploadingPreview}
                className="mt-2"
              />
              {uploadingPreview && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Permanently delete this vehicle and all associated records. This cannot be undone.
          </p>
          <Button
            variant="outline"
            className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Vehicle"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
