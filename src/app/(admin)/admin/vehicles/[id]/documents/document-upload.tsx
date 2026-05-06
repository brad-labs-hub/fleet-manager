"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type DocType = "insurance" | "registration" | "maintenance" | "misc";

function isAllowedFile(f: File): boolean {
  return f.type === "application/pdf" || f.type.startsWith("image/");
}

export function DocumentUpload({ vehicleId }: { vehicleId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState<DocType>("insurance");
  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [state, setState] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter(isAllowedFile);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    if (docType === "insurance" && (!provider.trim() || !insuranceExpiry)) {
      setError("Provider and expiry date are required for insurance.");
      return;
    }
    if (docType === "registration" && (!state.trim() || !registrationExpiry)) {
      setError("State and expiry date are required for registration.");
      return;
    }
    if ((docType === "maintenance" || docType === "misc") && !title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setLoading(true);
    const batchId = Date.now();
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${vehicleId}/${docType}-${batchId}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);

        if (docType === "insurance") {
          await supabase.from("insurance").insert({
            vehicle_id: vehicleId,
            provider: provider.trim(),
            policy_number: policyNumber.trim() || null,
            expiry_date: insuranceExpiry,
            document_url: urlData.publicUrl,
          });
        } else if (docType === "registration") {
          await supabase.from("registrations").insert({
            vehicle_id: vehicleId,
            state: state.trim(),
            expiry_date: registrationExpiry,
            document_url: urlData.publicUrl,
          });
        } else {
          await supabase.from("vehicle_documents").insert({
            vehicle_id: vehicleId,
            doc_type: docType,
            title: title.trim(),
            document_url: urlData.publicUrl,
          });
        }
      }
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setProvider("");
      setPolicyNumber("");
      setInsuranceExpiry("");
      setState("");
      setRegistrationExpiry("");
      setTitle("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <Label htmlFor="docType">Document Type</Label>
        <select
          id="docType"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          className="w-full mt-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
        >
          <option value="insurance">Insurance</option>
          <option value="registration">Registration</option>
          <option value="maintenance">Maintenance</option>
          <option value="misc">Misc</option>
        </select>
      </div>

      {docType === "insurance" && (
        <>
          <div>
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. State Farm"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="policyNumber">Policy number</Label>
            <Input
              id="policyNumber"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="insuranceExpiry">Expiry date *</Label>
            <Input
              id="insuranceExpiry"
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </>
      )}

      {docType === "registration" && (
        <>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. NY"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="registrationExpiry">Expiry date *</Label>
            <Input
              id="registrationExpiry"
              type="date"
              value={registrationExpiry}
              onChange={(e) => setRegistrationExpiry(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </>
      )}

      {(docType === "maintenance" || docType === "misc") && (
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={docType === "maintenance" ? "e.g. Oil change receipt 2024" : "e.g. Title"}
            required
            className="mt-1"
          />
        </div>
      )}

      <div>
        <Label htmlFor="file">Files *</Label>
        <Input
          ref={fileInputRef}
          id="file"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          PDF, JPG, or PNG — select multiple files in one go or add more in batches.
        </p>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.lastModified}-${i}`}
                className="flex items-center justify-between gap-2 text-sm rounded-md border border-border px-2 py-1.5 bg-muted/30"
              >
                <span className="truncate">{f.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={files.length === 0 || loading}>
        {loading ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
