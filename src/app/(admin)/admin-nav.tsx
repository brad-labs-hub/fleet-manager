"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Receipt, Users, MapPin, CalendarClock, FolderOpen, Wrench,
  FileDown, Upload, ClipboardList,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/expiring-soon", label: "Expiring soon", icon: CalendarClock },
];

const TOOLS_ITEMS = [
  { href: "/admin/exports", label: "Exports", icon: FileDown },
  { href: "/admin/imports", label: "Imports", icon: Upload },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
];

type Props = { role: string };

export function AdminNav({ role }: Props) {
  const pathname = usePathname();
  const toolsActive = TOOLS_ITEMS.some(({ href }) => pathname === href || pathname.startsWith(href + "/"));

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 px-3 py-2 h-auto rounded-xl text-sm font-medium whitespace-nowrap ${
                toolsActive
                  ? "bg-[var(--indigo-dim)] text-[var(--indigo-soft)] border border-[rgba(99,102,241,0.22)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[10rem]">
            {TOOLS_ITEMS.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
