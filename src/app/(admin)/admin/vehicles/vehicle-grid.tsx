"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { VehicleImage } from "@/components/vehicle-image";

type Location = { id: string; name: string };

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  license_plate: string | null;
  status: string | null;
  preview_image_path: string | null;
  previewUrl: string | null;
  location: { name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  active:         "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  out_of_service: "bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300",
  in_repair:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  archived:       "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  sold:           "bg-blue-100  text-blue-700  dark:bg-blue-900/40   dark:text-blue-300",
};

const STATUS_LABELS: Record<string, string> = {
  active:         "Active",
  out_of_service: "Out of Service",
  in_repair:      "In Repair",
  archived:       "Archived",
  sold:           "Sold",
};

const INACTIVE_STATUSES = new Set(["archived", "sold"]);

type StatusFilter = "active" | "in_repair" | "out_of_service" | "archived" | "sold" | "all";

const STATUS_PILL_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",           label: "All" },
  { value: "active",        label: "Active" },
  { value: "in_repair",     label: "In Repair" },
  { value: "out_of_service",label: "Out of Service" },
  { value: "archived",      label: "Archived" },
  { value: "sold",          label: "Sold" },
];

export function VehicleGrid({
  vehicles,
}: {
  vehicles: Vehicle[];
  locations: Location[];
}) {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("active");

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((v) => v.location?.name).filter(Boolean))) as string[];
    return unique.sort();
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchLoc =
        locationFilter === "all" ||
        (v.location?.name ?? "") === locationFilter;

      const matchStatus =
        statusFilter === "all"
          ? true
          : (v.status ?? "active") === statusFilter;

      return matchLoc && matchStatus;
    });
  }, [vehicles, locationFilter, statusFilter]);

  const inactiveCount = vehicles.filter((v) => INACTIVE_STATUSES.has(v.status ?? "")).length;

  return (
    <div className="space-y-5">
      {/* Location tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border pb-3">
        <button
          onClick={() => setLocationFilter("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            locationFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          All locations
        </button>
        {locationOptions.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocationFilter(loc)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              locationFilter === loc
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_PILL_OPTIONS.map(({ value, label }) => {
          const count =
            value === "all"
              ? vehicles.filter((v) =>
                  locationFilter === "all" || (v.location?.name ?? "") === locationFilter
                ).length
              : vehicles.filter(
                  (v) =>
                    (v.status ?? "active") === value &&
                    (locationFilter === "all" || (v.location?.name ?? "") === locationFilter)
                ).length;

          if (count === 0 && value !== "all" && value !== "active") return null;

          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === value
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {label}
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  statusFilter === value ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No vehicles match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}

      {/* Hint when active filter hides inactive vehicles */}
      {statusFilter === "active" && inactiveCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {inactiveCount} archived / sold vehicle{inactiveCount !== 1 ? "s" : ""} hidden.{" "}
          <button
            className="underline hover:text-foreground"
            onClick={() => setStatusFilter("all")}
          >
            Show all
          </button>
        </p>
      )}
    </div>
  );
}

function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  const status = v.status ?? "active";
  const isInactive = INACTIVE_STATUSES.has(status);

  return (
    <Link href={`/admin/vehicles/${v.id}`}>
      <div
        className={`group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-lg transition-all duration-200 cursor-pointer ${
          isInactive ? "opacity-60" : ""
        }`}
      >
        {/* Image panel */}
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          <VehicleImage
            make={v.make}
            model={v.model}
            year={v.year}
            color={v.color}
            vin={v.vin}
            imageUrl={v.previewUrl}
            className="w-full h-full object-cover"
          />
          {/* Status badge overlay (non-active only) */}
          {status !== "active" && (
            <span
              className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm ${STATUS_STYLES[status] ?? ""}`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          <p className="font-semibold text-foreground text-sm leading-tight truncate">
            {v.year} {v.make} {v.model}
          </p>
          <div className="flex items-center justify-between gap-2">
            {v.license_plate ? (
              <span className="text-xs text-muted-foreground font-mono tracking-wide">
                {v.license_plate}
              </span>
            ) : (
              <span />
            )}
            {v.location?.name && (
              <span className="text-xs text-muted-foreground truncate max-w-[50%] text-right">
                {v.location.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
