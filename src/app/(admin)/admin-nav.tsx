"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Receipt, FileDown,
  Upload, Users, ClipboardList, MapPin, CalendarClock, FolderOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/expiring-soon", label: "Expiring soon", icon: CalendarClock },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  { href: "/admin/exports", label: "Exports", icon: FileDown },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin/imports", label: "Imports", icon: Upload },
];

type Props = { role: string };

export function AdminNav({ role }: Props) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card/60 backdrop-blur-xl px-4">
      <div className="max-w-6xl mx-auto flex gap-1 py-2 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-[var(--indigo-dim)] text-[var(--indigo-soft)] border border-[rgba(99,102,241,0.22)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
        {role === "controller" && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              pathname === "/admin/users"
                ? "bg-[var(--indigo-dim)] text-[var(--indigo-soft)] border border-[rgba(99,102,241,0.22)]"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            Users
          </Link>
        )}
      </div>
    </nav>
  );
}
