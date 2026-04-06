"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getSecureDocumentHref } from "@/lib/document-links";

type ReceiptRow = {
  id: string;
  category: string;
  amount: number;
  date: string;
  vendor: string | null;
  document_url: string | null;
  vehicle_id: string | null;
  location_id: string | null;
  vehicle?: { id: string; make: string; model: string; year: number } | { id: string; make: string; model: string; year: number }[] | null;
  location?: { id: string; name: string } | { id: string; name: string }[] | null;
};

export type { ReceiptRow };

type VehicleRow = { id: string; make: string; model: string; year: number };

export function ReceiptsList({
  receipts,
  vehicles,
}: {
  receipts: ReceiptRow[];
  vehicles: VehicleRow[];
}) {
  const router = useRouter();
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState<"selected" | "filtered" | null>(null);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      if (vehicleFilter && r.vehicle_id !== vehicleFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [receipts, vehicleFilter, categoryFilter, dateFrom, dateTo]);

  const visibleIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const selectedCount = selectedIds.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const filteredAttachmentCount = filtered.filter((r) => Boolean(r.document_url)).length;

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function exportZip(
    type: "selected" | "filtered",
    payload: { startDate?: string; endDate?: string; receiptIds?: string[] }
  ) {
    setExportLoading(type);
    try {
      const res = await fetch("/api/export/accountant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const suffix = new Date().toISOString().slice(0, 10);
      a.download =
        type === "selected"
          ? `receipts-selected-${suffix}.zip`
          : `receipts-filtered-${suffix}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportLoading(null);
    }
  }

  async function handleDelete(r: ReceiptRow) {
    if (!confirm(`Delete this receipt (${formatCurrency(Number(r.amount))} on ${formatDate(r.date)})?`)) return;
    setDeletingId(r.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("receipts").delete().eq("id", r.id);
      if (error) throw error;
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const categories = Array.from(new Set(receipts.map((r) => r.category))).sort();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="filter-vehicle" className="text-xs text-muted-foreground">Vehicle</Label>
              <select
                id="filter-vehicle"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
              >
                <option value="">All</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="filter-category" className="text-xs text-muted-foreground">Category</Label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="filter-from" className="text-xs text-muted-foreground">Date from</Label>
              <Input
                id="filter-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-to" className="text-xs text-muted-foreground">Date to</Label>
              <Input
                id="filter-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} filtered receipts, {filteredAttachmentCount} with attachments
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCount} selected ({selectedVisibleCount} visible in current filter)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Select all filtered
                </label>
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={selectedCount === 0 || exportLoading !== null}
                >
                  Clear selection
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportZip("filtered", {
                      startDate: dateFrom || undefined,
                      endDate: dateTo || undefined,
                    })
                  }
                  disabled={filtered.length === 0 || exportLoading !== null}
                >
                  {exportLoading === "filtered"
                    ? "Exporting..."
                    : "Export all filtered"}
                </Button>
                <Button
                  onClick={() =>
                    exportZip("selected", {
                      receiptIds: Array.from(selectedIds),
                    })
                  }
                  disabled={selectedCount === 0 || exportLoading !== null}
                >
                  {exportLoading === "selected"
                    ? "Exporting..."
                    : `Export selected (${selectedCount})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {filtered.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1 flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select receipt ${r.vendor ?? r.category ?? "receipt"} ${r.date}`}
                  checked={selectedIds.has(r.id)}
                  onChange={(e) => toggleSelection(r.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground capitalize">
                  {r.category?.replace("_", " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(r.date)} — {r.vendor ?? "—"}
                </p>
                {(r.vehicle || r.location) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.vehicle && (
                      <span>
                        {Array.isArray(r.vehicle)
                          ? (r.vehicle[0] && `${r.vehicle[0].year} ${r.vehicle[0].make} ${r.vehicle[0].model}`)
                          : `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`}
                      </span>
                    )}
                    {r.vehicle && r.location && " · "}
                    {r.location && (
                      <span>
                        {Array.isArray(r.location) ? r.location[0]?.name : r.location.name}
                      </span>
                    )}
                  </p>
                )}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 sm:shrink-0 sm:border-l sm:border-border sm:pl-6">
                <p className="font-semibold text-foreground tabular-nums text-right text-lg sm:text-base sm:min-w-[6.5rem] sm:pt-0">
                  {formatCurrency(Number(r.amount))}
                </p>
                <div
                  className="flex flex-wrap items-center justify-end gap-2 sm:justify-start"
                  role="group"
                  aria-label="Receipt actions"
                >
                  {r.document_url && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={getSecureDocumentHref(r.document_url)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Document
                      </a>
                    </Button>
                  )}
                  <Link href={`/admin/receipts/${r.id}/edit`} className="cursor-pointer">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No receipts match the filters.</p>
        )}
      </div>
    </div>
  );
}
