"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { getSecureDocumentHref } from "@/lib/document-links";
import { FileText, Search, Trash2, ExternalLink } from "lucide-react";

export type DocumentSource = "insurance" | "registration" | "warranty" | "emissions" | "vault" | "maintenance";

export type DocumentItem = {
  id: string;
  source: DocumentSource;
  sourceId: string;
  title: string;
  subtitle?: string;
  documentUrl: string;
  date: string;
  expiryDate?: string;
  vehicleId: string;
  vehicleLabel?: string;
  canDelete: boolean;
};

const SOURCE_LABELS: Record<DocumentSource, string> = {
  insurance: "Insurance",
  registration: "Registration",
  warranty: "Warranty",
  emissions: "Emissions",
  vault: "Vault",
  maintenance: "Maintenance",
};

const SOURCE_BADGE_STYLES: Record<DocumentSource, string> = {
  insurance: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  registration: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  warranty: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  emissions: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  vault: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  maintenance: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

type SortOption = "date-desc" | "date-asc" | "expiry";

function isExpiringSoon(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate);
  const now = new Date();
  const days = (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return days <= 60 && days >= 0;
}

function isExpired(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

type VehicleOption = { id: string; label: string };

export function DocumentLibrary({
  items,
  vehicleId,
  vehicles,
}: {
  items: DocumentItem[];
  vehicleId: string;
  vehicles?: VehicleOption[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentSource | "all">("all");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [vehicleFilter, setVehicleFilter] = useState<string>(vehicles?.length ? "all" : vehicleId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = items;

    if (vehicles && vehicleFilter !== "all") {
      list = list.filter((d) => d.vehicleId === vehicleFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.subtitle?.toLowerCase().includes(q) ?? false)
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((d) => d.source === typeFilter);
    }

    list = [...list].sort((a, b) => {
      if (sort === "date-desc") return b.date.localeCompare(a.date);
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "expiry") {
        const aExp = a.expiryDate ?? "9999-12-31";
        const bExp = b.expiryDate ?? "9999-12-31";
        return aExp.localeCompare(bExp);
      }
      return 0;
    });

    return list;
  }, [items, search, typeFilter, sort, vehicleFilter, vehicles]);

  async function handleDelete(item: DocumentItem) {
    if (!item.canDelete) return;
    if (!confirm(`Delete this ${SOURCE_LABELS[item.source].toLowerCase()} document?`)) return;

    setDeletingId(item.sourceId);
    try {
      if (item.source === "insurance") {
        await supabase.from("insurance").delete().eq("id", item.sourceId);
      } else if (item.source === "registration") {
        await supabase.from("registrations").delete().eq("id", item.sourceId);
      } else if (item.source === "warranty") {
        await supabase.from("vehicle_warranties").delete().eq("id", item.sourceId);
      } else if (item.source === "emissions") {
        await supabase.from("vehicle_emissions").delete().eq("id", item.sourceId);
      } else if (item.source === "vault") {
        await supabase.from("vehicle_documents").delete().eq("id", item.sourceId);
      }
      router.refresh();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No documents yet. Add insurance, registrations, or upload to the vault above.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        {vehicles && vehicles.length > 0 && (
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        )}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentSource | "all")}
          className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground"
        >
          <option value="all">All types</option>
          {(Object.keys(SOURCE_LABELS) as DocumentSource[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="expiry">Expiry soon</option>
        </select>
      </div>

      {/* List */}
      <ul className="divide-y divide-border">
        {filtered.map((d) => {
          const expiringSoon = isExpiringSoon(d.expiryDate);
          const expired = isExpired(d.expiryDate);
          const isDeleting = deletingId === d.sourceId;

          return (
            <li key={`${d.source}-${d.sourceId}`} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE_STYLES[d.source]}`}>
                    {SOURCE_LABELS[d.source]}
                  </span>
                  {expired && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      Expired
                    </span>
                  )}
                  {expiringSoon && !expired && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Expiring soon
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground text-sm mt-1 truncate">{d.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {d.vehicleLabel && (
                    <Link
                      href={`/admin/vehicles/${d.vehicleId}/documents`}
                      className="text-xs text-primary hover:underline"
                    >
                      {d.vehicleLabel}
                    </Link>
                  )}
                  {d.subtitle && (
                    <span className="text-xs text-muted-foreground truncate">{d.subtitle}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {d.expiryDate && (
                  <span className="text-xs text-muted-foreground">
                    <span className="sm:hidden">Exp </span>
                    {formatDate(d.expiryDate)}
                  </span>
                )}
                <a
                  href={getSecureDocumentHref(d.documentUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View
                  <ExternalLink className="w-3 h-3" />
                </a>
                {d.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(d)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? "…" : "Delete"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && items.length > 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No documents match your search.
        </p>
      )}
    </div>
  );
}
