import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Car, Receipt, AlertTriangle, Shield,
  Plus, ClipboardList, ArrowRight,
} from "lucide-react";
import {
  SpendByCategoryChart,
  MonthlySpendChart,
  PerVehicleChart,
} from "./analytics-charts";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  const ytdStart = `${new Date().getFullYear()}-01-01`;
  const { data: receiptSum } = await supabase.from("receipts").select("amount").gte("date", ytdStart);
  const totalReceipts = receiptSum?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [expiringInsuranceRes, alertsRes, allReceiptsRes, vehiclesForChartsRes, recentReceiptsRes, maintenanceYtdRes] =
    await Promise.all([
      supabase
        .from("insurance")
        .select("id, expiry_date, vehicle_id, vehicle:vehicles(id, make, model, year)")
        .lte("expiry_date", in90Days).gte("expiry_date", today).order("expiry_date").limit(5),
      supabase
        .from("maintenance_alerts")
        .select("id, alert_type, due_date, vehicle_id, vehicle:vehicles(id, make, model, year)")
        .eq("dismissed", false).order("due_date").limit(5),
      supabase.from("receipts").select("amount, category, date, vehicle_id").gte("date", ytdStart),
      supabase.from("vehicles").select("id, make, model, year"),
      supabase.from("receipts").select("id, amount, category, date, vendor").order("created_at", { ascending: false }).limit(5),
      supabase.from("maintenance_records").select("vehicle_id, cost").gte("date", ytdStart),
    ]);

  const expiringInsurance = expiringInsuranceRes.data ?? [];
  const alerts = alertsRes.data ?? [];
  const allReceipts = allReceiptsRes.data ?? [];

  // Analytics
  const categoryMap = new Map<string, number>();
  allReceipts.forEach((r) => {
    const cat = r.category ?? "other";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(r.amount));
  });
  const categoryData = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);

  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(d.toLocaleString("en-US", { month: "short", year: "2-digit" }), 0);
  }
  allReceipts.forEach((r) => {
    const key = new Date(r.date).toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + Number(r.amount));
  });
  const monthlyData = Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));

  const vehicles = vehiclesForChartsRes.data ?? [];
  const vehicleMap = new Map<string, number>();
  allReceipts.forEach((r) => {
    if (r.vehicle_id) vehicleMap.set(r.vehicle_id, (vehicleMap.get(r.vehicle_id) ?? 0) + Number(r.amount));
  });
  (maintenanceYtdRes.data ?? []).forEach((m) => {
    if (m.vehicle_id) vehicleMap.set(m.vehicle_id, (vehicleMap.get(m.vehicle_id) ?? 0) + Number(m.cost ?? 0));
  });
  const vehicleData = Array.from(vehicleMap.entries())
    .map(([vid, total]) => {
      const v = vehicles.find((vv) => vv.id === vid);
      return { name: v ? `${v.year} ${v.make} ${v.model}` : "Unknown", total };
    }).sort((a, b) => b.total - a.total).slice(0, 8);

  // Fuel (gas) only: by vehicle and by month
  const gasReceipts = allReceipts.filter((r) => r.category === "gas");
  const fuelVehicleMap = new Map<string, number>();
  gasReceipts.forEach((r) => {
    if (r.vehicle_id) fuelVehicleMap.set(r.vehicle_id, (fuelVehicleMap.get(r.vehicle_id) ?? 0) + Number(r.amount));
  });
  const fuelVehicleData = Array.from(fuelVehicleMap.entries())
    .map(([vid, total]) => {
      const v = vehicles.find((vv) => vv.id === vid);
      return { name: v ? `${v.year} ${v.make} ${v.model}` : "Unknown", total };
    }).sort((a, b) => b.total - a.total).slice(0, 8);
  const fuelMonthMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fuelMonthMap.set(d.toLocaleString("en-US", { month: "short", year: "2-digit" }), 0);
  }
  gasReceipts.forEach((r) => {
    const key = new Date(r.date).toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (fuelMonthMap.has(key)) fuelMonthMap.set(key, (fuelMonthMap.get(key) ?? 0) + Number(r.amount));
  });
  const fuelMonthlyData = Array.from(fuelMonthMap.entries()).map(([month, total]) => ({ month, total }));

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="relative z-10 space-y-6">

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold font-syne text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/receipts/new"
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium text-foreground transition-colors duration-200 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Add Receipt
            </button>
          </Link>
          <Link
            href="/admin/vehicles/new"
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium shadow-indigo-sm hover:shadow-indigo transition-shadow duration-200 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Add Vehicle
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles */}
        <Link
          href="/admin/vehicles"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-fade-up delay-1"
        >
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[rgba(99,102,241,0.2)] border-t-2 border-t-[var(--indigo)] p-5 shadow-sm hover:shadow-md hover:border-[rgba(99,102,241,0.35)] transition-shadow duration-200 group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, var(--indigo-glow), transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicles</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--indigo-dim)" }}>
                <Car className="h-4 w-4" style={{ color: "var(--indigo-soft)" }} />
              </div>
            </div>
            <p className="text-3xl font-bold font-syne text-foreground leading-none">{vehicleCount ?? 0}</p>
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>in fleet</p>
          </div>
        </Link>

        {/* Total Spend */}
        <Link
          href="/admin/receipts"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-fade-up delay-2"
        >
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[rgba(16,185,129,0.2)] border-t-2 border-t-[var(--emerald)] p-5 shadow-sm hover:shadow-md hover:border-[rgba(16,185,129,0.35)] transition-shadow duration-200 cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, var(--emerald-dim), transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spend YTD</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
                <Receipt className="h-4 w-4" style={{ color: "var(--emerald)" }} />
              </div>
            </div>
            <p className="text-3xl font-bold font-syne text-foreground leading-none">{formatCurrency(totalReceipts)}</p>
            <p className="text-xs mt-2 text-muted-foreground">since Jan 1</p>
          </div>
        </Link>

        {/* Alerts */}
        <Link
          href="/admin/vehicles"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-fade-up delay-3"
        >
          <div className={`relative overflow-hidden rounded-2xl bg-card border-t-2 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${
            alerts.length > 0
              ? "border border-[rgba(249,115,22,0.2)] border-t-[var(--amber)] hover:border-[rgba(249,115,22,0.35)]"
              : "border border-border border-t-muted"
          }`}>
            {alerts.length > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, var(--amber-dim), transparent 70%)", transform: "translate(30%, -30%)" }} />
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alerts</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: alerts.length > 0 ? "var(--amber-dim)" : "var(--surface2)" }}>
                <AlertTriangle className="h-4 w-4" style={{ color: alerts.length > 0 ? "var(--amber)" : "var(--muted-foreground)" }} />
              </div>
            </div>
            <p className="text-3xl font-bold font-syne text-foreground leading-none">{alerts.length}</p>
            <p className="text-xs mt-2 text-muted-foreground">{alerts.length === 0 ? "all clear" : "need attention"}</p>
          </div>
        </Link>

        {/* Insurance */}
        <div className={`relative overflow-hidden rounded-2xl bg-card border-t-2 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-up delay-4 ${
          expiringInsurance.length > 0
            ? "border border-[rgba(244,63,94,0.2)] border-t-[var(--rose)]"
            : "border border-border border-t-muted"
        }`}>
          {expiringInsurance.length > 0 && (
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, var(--rose-dim), transparent 70%)", transform: "translate(30%, -30%)" }} />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insurance</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: expiringInsurance.length > 0 ? "var(--rose-dim)" : "var(--surface2)" }}>
              <Shield className="h-4 w-4" style={{ color: expiringInsurance.length > 0 ? "var(--rose)" : "var(--muted-foreground)" }} />
            </div>
          </div>
          <p className="text-3xl font-bold font-syne text-foreground leading-none">{expiringInsurance.length}</p>
          <p className="text-xs mt-2 text-muted-foreground">{expiringInsurance.length === 0 ? "all current" : "expiring in 90 days"}</p>
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up delay-3">
        <Link
          href="/admin/receipts/new"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-shadow duration-200 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-sm hover:shadow-indigo group">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-semibold text-white">New Receipt</p>
          </div>
        </Link>
        <Link
          href="/admin/requests"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer bg-card border border-border shadow-sm hover:shadow-md hover:border-[var(--border-hi)] transition-shadow duration-200">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.12)" }}>
              <ClipboardList className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Requests</p>
          </div>
        </Link>
      </div>

      {/* ── Alerts + Recent receipts ────────────────────── */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Expiring Insurance */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-syne text-foreground flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--rose-dim)" }}>
                <Shield className="h-3.5 w-3.5" style={{ color: "var(--rose)" }} />
              </div>
              Expiring Insurance
            </h2>
            <span className="text-xs text-muted-foreground">90 days</span>
          </div>
          {expiringInsurance.length ? (
            <ul className="space-y-1">
              {expiringInsurance.map((i) => {
                const v = i.vehicle as unknown as { id: string; make: string; model: string; year: number } | null;
                return (
                  <li key={i.id}>
                    <Link href={v ? `/admin/vehicles/${v.id}` : "#"}
                      className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl text-sm hover:bg-accent transition-colors group">
                      <span className="text-foreground group-hover:text-primary truncate mr-2 text-xs font-medium">
                        {v ? `${v.year} ${v.make} ${v.model}` : "Unknown"}
                      </span>
                      <span className="text-xs font-semibold whitespace-nowrap shrink-0" style={{ color: "var(--rose)" }}>
                        {formatDate(i.expiry_date)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
                <Shield className="h-5 w-5" style={{ color: "var(--emerald)" }} />
              </div>
              <p className="text-xs text-muted-foreground">All policies current</p>
            </div>
          )}
        </div>

        {/* Maintenance Alerts */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-syne text-foreground flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--amber-dim)" }}>
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--amber)" }} />
              </div>
              Maintenance Alerts
            </h2>
          </div>
          {alerts.length ? (
            <ul className="space-y-1">
              {alerts.map((a) => {
                const v = a.vehicle as unknown as { id: string; make: string; model: string; year: number } | null;
                return (
                  <li key={a.id}>
                    <Link href={v ? `/admin/vehicles/${v.id}/alerts` : "#"}
                      className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl text-sm hover:bg-accent transition-colors group">
                      <span className="text-foreground group-hover:text-primary truncate mr-2 text-xs font-medium">
                        {v ? `${v.year} ${v.make} ${v.model}` : "Unknown"}
                      </span>
                      <span className="text-xs font-semibold whitespace-nowrap shrink-0" style={{ color: "var(--amber)" }}>
                        {a.due_date ? formatDate(a.due_date) : a.alert_type}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
                <AlertTriangle className="h-5 w-5" style={{ color: "var(--emerald)" }} />
              </div>
              <p className="text-xs text-muted-foreground">No pending alerts</p>
            </div>
          )}
        </div>

        {/* Recent Receipts */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-syne text-foreground flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
                <Receipt className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
              </div>
              Recent Receipts
            </h2>
            <Link href="/admin/receipts" className="flex items-center gap-0.5 text-xs font-medium hover:underline" style={{ color: "var(--indigo-soft)" }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentReceiptsRes.data?.length ? (
            <ul className="space-y-1">
              {recentReceiptsRes.data.map((r) => (
                <li key={r.id} className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl hover:bg-accent transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-foreground capitalize">{r.category?.replace(/_/g, " ")}</p>
                    {r.vendor && <p className="text-[11px] text-muted-foreground">{r.vendor}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold font-syne text-foreground">{formatCurrency(Number(r.amount))}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-accent">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">No receipts yet</p>
              <Link href="/admin/receipts/new" className="text-xs font-medium hover:underline" style={{ color: "var(--indigo-soft)" }}>
                Add the first one →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics ─────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        <h2 className="text-base font-bold font-syne text-foreground whitespace-nowrap">Analytics</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Year to date</span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-sm font-bold font-syne text-foreground mb-1">Spend by Category</p>
          <p className="text-xs text-muted-foreground mb-4">All categories</p>
          <SpendByCategoryChart data={categoryData} />
        </div>
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-sm font-bold font-syne text-foreground mb-1">Monthly Spend</p>
          <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
          <MonthlySpendChart data={monthlyData} />
        </div>
      </div>

      {vehicleData.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-sm font-bold font-syne text-foreground mb-1">Top Vehicles by Total Spend</p>
          <p className="text-xs text-muted-foreground mb-4">Receipts + maintenance, year to date</p>
          <PerVehicleChart data={vehicleData} />
        </div>
      )}

      {(fuelVehicleData.length > 0 || fuelMonthlyData.some((d) => d.total > 0)) && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <h2 className="text-base font-bold font-syne text-foreground whitespace-nowrap">Fuel</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Gas receipts, YTD / last 6 months</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {fuelMonthlyData.some((d) => d.total > 0) && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-sm font-bold font-syne text-foreground mb-1">Fuel by month</p>
                <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
                <MonthlySpendChart data={fuelMonthlyData} />
              </div>
            )}
            {fuelVehicleData.length > 0 && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-sm font-bold font-syne text-foreground mb-1">Fuel by vehicle</p>
                <p className="text-xs text-muted-foreground mb-4">Year to date</p>
                <PerVehicleChart data={fuelVehicleData} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
