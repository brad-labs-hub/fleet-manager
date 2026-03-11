"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const supabase = createClient();

export default function DriverNewEmissionPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const router = useRouter();

  const [vehicleLabel, setVehicleLabel] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [passed, setPassed] = useState(true);
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("year, make, model")
      .eq("id", vehicleId)
      .single()
      .then(({ data }) => {
        if (data) setVehicleLabel(`${data.year} ${data.make} ${data.model}`);
      });
  }, [vehicleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let documentUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${vehicleId}/emissions-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
        documentUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("vehicle_emissions").insert({
        vehicle_id: vehicleId,
        test_date: testDate,
        passed,
        expiry_date: expiryDate || null,
        document_url: documentUrl,
        created_by: user.id,
      });
      if (insertError) throw insertError;

      router.push(`/driver/vehicles/${vehicleId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/driver/vehicles/${vehicleId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to vehicle
      </Link>
      <h1 className="text-2xl font-bold text-foreground">
        Log Emissions Test{vehicleLabel ? ` — ${vehicleLabel}` : ""}
      </h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Emissions Test Details</h2>
          <p className="text-sm text-muted-foreground">Record the result of an emissions inspection.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="testDate">Test date</Label>
              <Input
                id="testDate"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Result</Label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setPassed(true)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    passed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-border text-muted-foreground hover:border-green-400 hover:text-green-600"
                  }`}
                >
                  Pass
                </button>
                <button
                  type="button"
                  onClick={() => setPassed(false)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    !passed
                      ? "bg-red-500 border-red-500 text-white"
                      : "border-border text-muted-foreground hover:border-red-400 hover:text-red-600"
                  }`}
                >
                  Fail
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emissionDoc">Certificate / document (optional)</Label>
              <Input
                id="emissionDoc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
