"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FileText, ExternalLink, Loader2, Paperclip, Trash2, ArrowUpDown } from "lucide-react";

type SortField = "date" | "cost" | "type";
type SortDir = "desc" | "asc";

const SORT_OPTIONS: { field: SortField; dir: SortDir; label: string }[] = [
  { field: "date",  dir: "desc", label: "Newest first" },
  { field: "date",  dir: "asc",  label: "Oldest first" },
  { field: "cost",  dir: "desc", label: "Cost: high → low" },
  { field: "cost",  dir: "asc",  label: "Cost: low → high" },
  { field: "type",  dir: "asc",  label: "Type: A → Z" },
];

const STATUS_STYLES: Record<string, string> = {
  completed:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const STATUS_LABELS: Record<string, string> = {
  completed:   "Completed",
  scheduled:   "Scheduled",
  in_progress: "In Progress",
};

export type MaintenanceRecord = {
  id: string;
  type: string;
  description: string | null;
  date: string;
  cost: number | null;
  odometer: number | null;
  vendor: string | null;
  status: string | null;
  scheduled_date: string | null;
  next_due_date: string | null;
  next_due_miles: number | null;
  receipt_url: string | null;
};

export function MaintenanceRecordList({
  records: initialRecords,
  vehicleId,
}: {
  records: MaintenanceRecord[];
  vehicleId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  // Track per-record upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Local optimistic receipt_url map so the link appears immediately
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  // Sorting — default newest first
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");

  const sortedRecords = [...initialRecords].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") {
      cmp = a.date.localeCompare(b.date);
    } else if (sortField === "cost") {
      cmp = (a.cost ?? 0) - (b.cost ?? 0);
    } else if (sortField === "type") {
      cmp = a.type.localeCompare(b.type);
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const opt = SORT_OPTIONS[Number(e.target.value)];
    if (opt) { setSortField(opt.field); setSortDir(opt.dir); }
  }

  const currentSortIndex = SORT_OPTIONS.findIndex(
    (o) => o.field === sortField && o.dir === sortDir
  );

  // Soft-delete: hide rows optimistically after deletion
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(recordId: string) {
    setDeletingId(recordId);
    try {
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", recordId);
      if (error) throw error;
      setDeletedIds((prev) => new Set(prev).add(recordId));
      setConfirmId(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorId(recordId);
      setErrorMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // One hidden file input per record via refs map
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleFileChange(recordId: string, file: File) {
    setUploadingId(recordId);
    setErrorId(null);
    setErrorMsg("");
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${vehicleId}/maintenance-${recordId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("maintenance_records")
        .update({ receipt_url: publicUrl })
        .eq("id", recordId);
      if (updateError) throw updateError;

      setLocalUrls((prev) => ({ ...prev, [recordId]: publicUrl }));
      router.refresh();
    } catch (err: unknown) {
      setErrorId(recordId);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/30">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <label htmlFor="maintenance-sort" className="text-xs text-muted-foreground shrink-0">
          Sort by
        </label>
        <select
          id="maintenance-sort"
          value={currentSortIndex === -1 ? 0 : currentSortIndex}
          onChange={handleSortChange}
          className="text-xs bg-transparent text-foreground border-0 outline-none cursor-pointer hover:text-primary transition-colors"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      <ul className="divide-y divide-border">
      {sortedRecords.map((m) => {
        if (deletedIds.has(m.id)) return null;

        const status = m.status ?? "completed";
        const receiptUrl = localUrls[m.id] ?? m.receipt_url;
        const isUploading = uploadingId === m.id;
        const isDeleting = deletingId === m.id;
        const hasError = errorId === m.id;
        const isConfirming = confirmId === m.id;

        return (
          <li key={m.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Left: record details */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground capitalize text-sm">
                  {m.type.replace(/_/g, " ")}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] ?? ""}`}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {formatDate(m.date)}
                {m.vendor && <span> · {m.vendor}</span>}
                {m.odometer && <span> · {m.odometer.toLocaleString()} mi</span>}
              </p>

              {m.description && (
                <p className="text-sm text-foreground">{m.description}</p>
              )}

              {m.scheduled_date && status !== "completed" && (
                <p className="text-xs text-muted-foreground">
                  Scheduled: {formatDate(m.scheduled_date)}
                </p>
              )}

              {(m.next_due_date || m.next_due_miles) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Next due
                  {m.next_due_date && `: ${formatDate(m.next_due_date)}`}
                  {m.next_due_miles && ` · ${m.next_due_miles.toLocaleString()} mi`}
                </p>
              )}
            </div>

            {/* Right: cost + document */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
              <span className="text-sm font-medium text-foreground">
                {m.cost != null ? formatCurrency(m.cost) : <span className="text-muted-foreground">—</span>}
              </span>

              {receiptUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    View document
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {/* Allow replacing the document */}
                  <button
                    type="button"
                    onClick={() => inputRefs.current[m.id]?.click()}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    title="Replace document"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[m.id]?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                  {isUploading ? "Uploading…" : "Attach document"}
                </button>
              )}

              {hasError && (
                <p className="text-[11px] text-destructive">{errorMsg}</p>
              )}

              {/* Delete */}
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={isDeleting}
                    className="text-[11px] font-medium text-destructive hover:underline disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting…" : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(m.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={(el) => { inputRefs.current[m.id] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(m.id, file);
                  e.target.value = "";
                }}
              />
            </div>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
