export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AdminAlertsBell,
  type AdminBellInsuranceItem,
  type AdminBellMaintenanceItem,
} from "@/components/admin-alerts-bell";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function normalizeVehicle(
  raw: unknown
): AdminBellInsuranceItem["vehicle"] {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const id = typeof v.id === "string" ? v.id : null;
  if (!id) return null;
  return {
    id,
    make: String(v.make ?? ""),
    model: String(v.model ?? ""),
    year: typeof v.year === "number" ? v.year : Number(v.year) || 0,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "driver";
  const isAdmin = role === "controller" || role === "employee";
  if (!isAdmin) redirect("/driver/dashboard");

  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [
    expiringInsuranceRes,
    maintenanceAlertsRes,
    insuranceCountRes,
    maintenanceAlertsCountRes,
  ] = await Promise.all([
    supabase
      .from("insurance")
      .select("id, expiry_date, vehicle_id, vehicle:vehicles(id, make, model, year)")
      .lte("expiry_date", in90Days)
      .gte("expiry_date", today)
      .order("expiry_date")
      .limit(50),
    supabase
      .from("maintenance_alerts")
      .select("id, alert_type, due_date, vehicle_id, vehicle:vehicles(id, make, model, year)")
      .eq("dismissed", false)
      .order("due_date")
      .limit(50),
    supabase
      .from("insurance")
      .select("*", { count: "exact", head: true })
      .lte("expiry_date", in90Days)
      .gte("expiry_date", today),
    supabase
      .from("maintenance_alerts")
      .select("*", { count: "exact", head: true })
      .eq("dismissed", false),
  ]);

  const alertsBellTotal =
    (insuranceCountRes.count ?? 0) + (maintenanceAlertsCountRes.count ?? 0);

  const bellInsurance: AdminBellInsuranceItem[] = (
    expiringInsuranceRes.data ?? []
  ).map((row) => ({
    id: row.id,
    expiry_date: row.expiry_date,
    vehicle: normalizeVehicle(row.vehicle),
  }));

  const bellMaintenance: AdminBellMaintenanceItem[] = (
    maintenanceAlertsRes.data ?? []
  ).map((row) => ({
    id: row.id,
    alert_type: row.alert_type,
    due_date: row.due_date,
    vehicle: normalizeVehicle(row.vehicle),
  }));

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border px-4 py-2.5 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 cursor-pointer rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-emerald-sm shrink-0">
                <span className="text-white text-xs font-bold font-syne tracking-wide">FM</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold font-syne text-foreground leading-none">Fleet Manager</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">Admin</div>
              </div>
            </Link>
            <div className="h-5 w-px bg-border mx-1" />
            <Link
              href="/driver/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1 cursor-pointer transition-colors duration-200 hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Driver View
            </Link>
          </div>
          <div className="flex items-center gap-0.5">
            <AdminAlertsBell
              insurance={bellInsurance}
              maintenance={bellMaintenance}
              totalCount={alertsBellTotal}
            />
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminNav role={role} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
