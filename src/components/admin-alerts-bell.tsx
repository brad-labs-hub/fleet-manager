"use client";

import Link from "next/link";
import { Bell, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";

export type AdminBellInsuranceItem = {
  id: string;
  expiry_date: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
  } | null;
};

export type AdminBellMaintenanceItem = {
  id: string;
  alert_type: string;
  due_date: string | null;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
  } | null;
};

function vehicleLabel(v: AdminBellInsuranceItem["vehicle"]): string {
  if (!v) return "Unknown vehicle";
  return `${v.year} ${v.make} ${v.model}`;
}

export function AdminAlertsBell({
  insurance,
  maintenance,
  /** When set, badge uses this (true DB total); list may still be capped */
  totalCount,
}: {
  insurance: AdminBellInsuranceItem[];
  maintenance: AdminBellMaintenanceItem[];
  totalCount?: number;
}) {
  const listTotal = insurance.length + maintenance.length;
  const total = totalCount ?? listTotal;
  const badge =
    total === 0 ? null : total > 99 ? "99+" : String(total);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 text-muted-foreground hover:text-foreground",
            total > 0 && "text-foreground"
          )}
          aria-label={
            total === 0
              ? "Alerts — none"
              : `Alerts — ${total} notification${total === 1 ? "" : "s"}`
          }
        >
          <Bell className="h-4 w-4" />
          {badge !== null ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
              aria-hidden
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuLabel className="font-syne text-base font-semibold text-foreground">
          Alerts
        </DropdownMenuLabel>
        {total === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No expiring insurance or maintenance alerts.
          </p>
        ) : (
          <div className="max-h-[min(22rem,70vh)] overflow-y-auto">
            {insurance.length > 0 ? (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 py-1.5 text-xs font-medium text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-[var(--rose)]" />
                  Expiring insurance (90 days)
                </DropdownMenuLabel>
                {insurance.map((row) => (
                  <DropdownMenuItem key={`ins-${row.id}`} asChild>
                    <Link
                      href={
                        row.vehicle
                          ? `/admin/vehicles/${row.vehicle.id}`
                          : "/admin/vehicles"
                      }
                      className="flex cursor-pointer flex-col items-stretch gap-0.5 px-2 py-2"
                    >
                      <span className="truncate text-xs font-medium text-foreground">
                        {vehicleLabel(row.vehicle)}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--rose)]">
                        Expires {formatDate(row.expiry_date)}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}

            {insurance.length > 0 && maintenance.length > 0 ? (
              <DropdownMenuSeparator />
            ) : null}

            {maintenance.length > 0 ? (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 py-1.5 text-xs font-medium text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-[var(--amber)]" />
                  Maintenance
                </DropdownMenuLabel>
                {maintenance.map((row) => (
                  <DropdownMenuItem key={`m-${row.id}`} asChild>
                    <Link
                      href={
                        row.vehicle
                          ? `/admin/vehicles/${row.vehicle.id}/alerts`
                          : "/admin/vehicles"
                      }
                      className="flex cursor-pointer flex-col items-stretch gap-0.5 px-2 py-2"
                    >
                      <span className="truncate text-xs font-medium text-foreground">
                        {vehicleLabel(row.vehicle)}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--amber)]">
                        {row.due_date
                          ? `Due ${formatDate(row.due_date)}`
                          : row.alert_type}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}

            {total > listTotal && listTotal > 0 ? (
              <p className="border-t border-border px-2 py-2 text-center text-[11px] text-muted-foreground">
                Showing {listTotal} of {total}. Open vehicles for full lists.
              </p>
            ) : null}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
