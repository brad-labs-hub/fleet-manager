"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpDown, Search } from "lucide-react";

type SortOption = "date-desc" | "date-asc" | "cost-desc" | "cost-asc" | "type-asc";
type StatusFilter = "all" | "completed" | "scheduled" | "in_progress";

export type MaintenanceSectionRecord = {
  id: string;
  type: string;
  date: string;
  cost: number | null;
  status?: string | null;
  scheduled_date?: string | null;
  receipt_url?: string | null;
  vendor?: string | null;
  description?: string | null;
};

export function MaintenanceSectionList({ records }: { records: MaintenanceSectionRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("date-desc");

  const filtered = useMemo(() => {
    let list = records;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.type.toLowerCase().includes(q) ||
        (m.vendor?.toLowerCase().includes(q) ?? false) ||
        (m.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((m) => (m.status ?? "completed") === statusFilter);
    }

    list = [...list].sort((a, b) => {
      if (sort === "date-desc") return b.date.localeCompare(a.date);
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "cost-desc") return (b.cost ?? 0) - (a.cost ?? 0);
      if (sort === "cost-asc") return (a.cost ?? 0) - (b.cost ?? 0);
      return a.type.localeCompare(b.type);
    });

    return list;
  }, [records, search, statusFilter, sort]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search maintenance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In progress</option>
        </select>

        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm bg-transparent text-foreground border-0 outline-none"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="cost-desc">Cost: high to low</option>
            <option value="cost-asc">Cost: low to high</option>
            <option value="type-asc">Type: A to Z</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-2">No maintenance records match your filters.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {filtered.map((m) => (
            <li key={m.id} className="flex justify-between items-center gap-2">
              <span className="text-foreground">
                <span className="capitalize">{m.type.replace(/_/g, " ")}</span>
                {m.vendor && <span className="text-muted-foreground"> · {m.vendor}</span>}
                {" — "}
                {formatDate(m.date)}
                {m.status && m.status !== "completed" && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {m.status === "scheduled" ? "Scheduled" : "In progress"}
                    {m.scheduled_date && ` ${formatDate(m.scheduled_date)}`}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3">
                {m.receipt_url && (
                  <a
                    href={m.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    View doc
                  </a>
                )}
                <span className="text-muted-foreground">{m.cost ? formatCurrency(m.cost) : "—"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
