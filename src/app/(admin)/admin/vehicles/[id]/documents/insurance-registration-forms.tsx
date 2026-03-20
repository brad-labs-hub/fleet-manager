"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WARRANTY_TYPES, type WarrantyType } from "@/types/database";

const supabase = createClient();

type Props = { vehicleId: string };

export function AddInsuranceForm({ vehicleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let documentUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${vehicleId}/insurance-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        documentUrl = urlData.publicUrl;
      }
      const { error: insertError } = await supabase.from("insurance").insert({
        vehicle_id: vehicleId,
        provider,
        policy_number: policyNumber || null,
        expiry_date: expiryDate,
        document_url: documentUrl,
      });
      if (insertError) throw insertError;
      setProvider("");
      setPolicyNumber("");
      setExpiryDate("");
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Insurance
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-border rounded-lg bg-muted/30 mt-3">
      <p className="font-medium text-foreground text-sm">New Insurance Record</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ins-provider">Provider *</Label>
          <Input id="ins-provider" value={provider} onChange={(e) => setProvider(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="ins-policy">Policy Number</Label>
          <Input id="ins-policy" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="ins-expiry">Expiry Date *</Label>
        <Input id="ins-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="ins-file">Document (optional)</Label>
        <Input id="ins-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

export function AddRegistrationForm({ vehicleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let documentUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${vehicleId}/registration-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        documentUrl = urlData.publicUrl;
      }
      const { error: insertError } = await supabase.from("registrations").insert({
        vehicle_id: vehicleId,
        state,
        expiry_date: expiryDate,
        document_url: documentUrl,
      });
      if (insertError) throw insertError;
      setState("");
      setExpiryDate("");
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Registration
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-border rounded-lg bg-muted/30 mt-3">
      <p className="font-medium text-foreground text-sm">New Registration Record</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="reg-state">State *</Label>
          <Input id="reg-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. CT" required />
        </div>
        <div>
          <Label htmlFor="reg-expiry">Expiry Date *</Label>
          <Input id="reg-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="reg-file">Document (optional)</Label>
        <Input id="reg-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

export function AddWarrantyForm({ vehicleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [warrantyType, setWarrantyType] = useState<WarrantyType>("limited_warranty");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryMiles, setExpiryMiles] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let documentUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${vehicleId}/warranty-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        documentUrl = urlData.publicUrl;
      }
      const { error: insertError } = await supabase.from("vehicle_warranties").insert({
        vehicle_id: vehicleId,
        warranty_type: warrantyType,
        expiry_date: expiryDate || null,
        expiry_miles: expiryMiles ? parseInt(expiryMiles, 10) : null,
        notes: notes || null,
        document_url: documentUrl,
      });
      if (insertError) throw insertError;
      setWarrantyType("limited_warranty");
      setExpiryDate("");
      setExpiryMiles("");
      setNotes("");
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Warranty
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-border rounded-lg bg-muted/30 mt-3">
      <p className="font-medium text-foreground text-sm">New Warranty Record</p>
      <div>
        <Label htmlFor="warranty-type">Warranty type *</Label>
        <select
          id="warranty-type"
          value={warrantyType}
          onChange={(e) => setWarrantyType(e.target.value as WarrantyType)}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
        >
          {WARRANTY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="warranty-expiry">Expiry date</Label>
          <Input id="warranty-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="warranty-miles">Expiry miles</Label>
          <Input id="warranty-miles" type="number" min={0} placeholder="e.g. 100000" value={expiryMiles} onChange={(e) => setExpiryMiles(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="warranty-notes">Notes</Label>
        <Input id="warranty-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </div>
      <div>
        <Label htmlFor="warranty-file">Document (optional)</Label>
        <Input id="warranty-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
