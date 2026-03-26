import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Car, Receipt, Plus, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import {
  SpendByCategoryChart,
  MonthlySpendChart,
  PerVehicleChart,
} from "./analytics-charts";

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function receiptDayKey(dateStr: string | null | undefined): string {
  return String(dateStr ?? "").slice(0, 10);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const ytdStart = `${new Date().getFullYear()}-01-01`;
  const { data: receiptSum } = await supabase.from("receipts").select("amount").gte("date", ytdStart);
  const totalReceipts = receiptSum?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

  const [allReceiptsRes, vehiclesForChartsRes, recentReceiptsRes, maintenanceYtdRes] =
    await Promise.all([
      supabase.from("receipts").select("amount, category, date, vehicle_id").gte("date", ytdStart),
      supabase
        .from("vehicles")
        .select("id, make, model, year, license_plate")
        .order("make")
        .order("model"),
      supabase.from("receipts").select("id, amount, category, date, vendor").order("created_at", { ascending: false }).limit(5),
      supabase.from("maintenance_records").select("vehicle_id, cost").gte("date", ytdStart),
    ]);

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

  // Last 7 days + prior 7 days (local) for activity chart / trend
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weeklyActivityBars: { day: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const key = localDayKey(d);
    const sum = allReceipts.reduce(
      (s, r) => s + (receiptDayKey(r.date) === key ? Number(r.amount) : 0),
      0
    );
    weeklyActivityBars.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: sum,
    });
  }
  const last7ReceiptsTotal = weeklyActivityBars.reduce((s, b) => s + b.value, 0);
  let prior7ReceiptsTotal = 0;
  for (let i = 7; i < 14; i++) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const key = localDayKey(d);
    prior7ReceiptsTotal += allReceipts.reduce(
      (s, r) => s + (receiptDayKey(r.date) === key ? Number(r.amount) : 0),
      0
    );
  }
  let spendTrendLine: string;
  if (last7ReceiptsTotal === 0 && prior7ReceiptsTotal === 0) {
    spendTrendLine = "No spend in the last 7 days";
  } else if (prior7ReceiptsTotal === 0) {
    spendTrendLine = "New activity vs prior week";
  } else {
    const pct =
      ((last7ReceiptsTotal - prior7ReceiptsTotal) / prior7ReceiptsTotal) * 100;
    spendTrendLine = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs prior week`;
  }

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

      {/* ── Primary grid: fleet list | spend + receipts ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-0 flex-col shadow-sm transition-shadow duration-200 hover:shadow-md animate-fade-up delay-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold font-syne">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--indigo-dim)]"
                >
                  <Car className="h-3.5 w-3.5 text-[var(--indigo-soft)]" aria-hidden />
                </div>
                Vehicles
              </CardTitle>
              <CardDescription className="mt-1.5">
                {vehicles.length} in fleet · quick links
              </CardDescription>
            </div>
            <Link
              href="/admin/vehicles"
              className="flex shrink-0 items-center gap-0.5 rounded-lg text-xs font-medium text-[var(--indigo-soft)] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
            {vehicles.length > 0 ? (
              <ul className="grid max-h-[min(22rem,52vh)] gap-2 overflow-y-auto pr-1 sm:max-h-[min(26rem,55vh)]">
                {vehicles.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/vehicles/${v.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 text-sm transition-colors duration-200 hover:border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--indigo-dim)]">
                        <Car className="h-4 w-4 text-[var(--indigo-soft)]" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {v.year} {v.make} {v.model}
                        </p>
                        {v.license_plate ? (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {v.license_plate}
                          </p>
                        ) : null}
                      </div>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-muted-foreground opacity-50"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">No vehicles yet</p>
                <Link
                  href="/admin/vehicles/new"
                  className="mt-3 text-xs font-medium text-[var(--indigo-soft)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Add your first vehicle →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <Link
            href="/admin/receipts"
            className="block min-h-0 flex-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-fade-up delay-2"
          >
            <ActivityChartCard
              title="Spend YTD"
              totalValue={formatCurrency(totalReceipts)}
              data={weeklyActivityBars}
              dropdownOptions={["Last 7 days"]}
              trendDescription={
                <>
                  <span className="text-muted-foreground">Last 7 days: </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(last7ReceiptsTotal)}
                  </span>
                  <span className="text-muted-foreground"> · {spendTrendLine}</span>
                </>
              }
              showTrendIcon
              className="h-full min-h-[14rem]"
            />
          </Link>

          <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md animate-fade-up delay-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold font-syne">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: "var(--emerald-dim)" }}
                >
                  <Receipt className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
                </div>
                Recent Receipts
              </CardTitle>
              <Link
                href="/admin/receipts"
                className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:underline"
                style={{ color: "var(--indigo-soft)" }}
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {recentReceiptsRes.data?.length ? (
                <ul className="max-h-[min(16rem,40vh)] space-y-1 overflow-y-auto pr-1">
                  {recentReceiptsRes.data.map((r) => (
                    <li
                      key={r.id}
                      className="-mx-2 flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-accent"
                    >
                      <div>
                        <p className="text-xs font-semibold capitalize text-foreground">
                          {r.category?.replace(/_/g, " ")}
                        </p>
                        {r.vendor && (
                          <p className="text-[11px] text-muted-foreground">{r.vendor}</p>
                        )}
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <p className="text-xs font-bold font-syne text-foreground">
                          {formatCurrency(Number(r.amount))}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(r.date)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">No receipts yet</p>
                  <Link
                    href="/admin/receipts/new"
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--indigo-soft)" }}
                  >
                    Add the first one →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Analytics + fuel: single grid ─────────────────────────────── */}
      <div className="grid gap-4 lg:gap-5">
        <div className="flex items-center gap-3 pt-1">
          <h2 className="whitespace-nowrap font-syne text-base font-bold text-foreground">
            Analytics
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="whitespace-nowrap text-xs text-muted-foreground">Year to date</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold font-syne">Spend by Category</CardTitle>
              <CardDescription>All categories</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendByCategoryChart data={categoryData} />
            </CardContent>
          </Card>
          <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold font-syne">Monthly Spend</CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlySpendChart data={monthlyData} />
            </CardContent>
          </Card>
        </div>

        {vehicleData.length > 0 && (
          <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold font-syne">
                Top Vehicles by Total Spend
              </CardTitle>
              <CardDescription>Receipts + maintenance, year to date</CardDescription>
            </CardHeader>
            <CardContent>
              <PerVehicleChart data={vehicleData} />
            </CardContent>
          </Card>
        )}

        {(fuelVehicleData.length > 0 || fuelMonthlyData.some((d) => d.total > 0)) && (
          <>
            <div className="flex items-center gap-3 pt-1">
              <h2 className="whitespace-nowrap font-syne text-base font-bold text-foreground">
                Fuel
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Gas receipts, YTD / last 6 months
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {fuelMonthlyData.some((d) => d.total > 0) && (
                <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold font-syne">Fuel by month</CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MonthlySpendChart data={fuelMonthlyData} />
                  </CardContent>
                </Card>
              )}
              {fuelVehicleData.length > 0 && (
                <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold font-syne">Fuel by vehicle</CardTitle>
                    <CardDescription>Year to date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PerVehicleChart data={fuelVehicleData} />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
