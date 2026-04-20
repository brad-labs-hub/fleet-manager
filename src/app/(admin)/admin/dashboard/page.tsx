import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Car, Receipt, Plus, ArrowRight, Bell, TrendingUp } from "lucide-react";
import { HolographicCard } from "@/components/ui/holographic-card";
import { Sparkline } from "@/components/ui/sparkline";
import { CategoryBars } from "./category-bars";
import { GreetingHeader } from "./greeting";
import { MonthlySpendChart } from "./analytics-charts";

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function receiptDayKey(dateStr: string | null | undefined): string {
  return String(dateStr ?? "").slice(0, 10);
}

const CATEGORY_COLORS: Record<string, string> = {
  gas: "#6366f1",
  fuel: "#6366f1",
  maintenance: "#7c3aed",
  insurance: "#f59e0b",
  tires: "#10b981",
  registration: "#f43f5e",
  detailing: "#f97316",
  car_wash: "#f97316",
  parking: "#818cf8",
  tolls: "#818cf8",
  other: "#818cf8",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ytdStart = `${new Date().getFullYear()}-01-01`;
  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [
    profileRes,
    allReceiptsRes,
    vehiclesRes,
    recentReceiptsRes,
    maintenanceAlertsRes,
    insuranceAlertsRes,
    maintenanceCountRes,
    insuranceCountRes,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("name")
      .eq("id", user?.id ?? "")
      .single(),
    supabase
      .from("receipts")
      .select("amount, category, date, vehicle_id")
      .gte("date", ytdStart),
    supabase
      .from("vehicles")
      .select("id, make, model, year, license_plate, location:locations(name)")
      .order("make")
      .order("model"),
    supabase
      .from("receipts")
      .select("id, amount, category, date, vendor")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("maintenance_alerts")
      .select(
        "id, alert_type, due_date, severity, vehicle:vehicles(id, make, model, year)"
      )
      .eq("dismissed", false)
      .order("due_date")
      .limit(5),
    supabase
      .from("insurance")
      .select(
        "id, expiry_date, vehicle:vehicles(id, make, model, year)"
      )
      .lte("expiry_date", in90Days)
      .gte("expiry_date", today)
      .order("expiry_date")
      .limit(5),
    supabase
      .from("maintenance_alerts")
      .select("*", { count: "exact", head: true })
      .eq("dismissed", false),
    supabase
      .from("insurance")
      .select("*", { count: "exact", head: true })
      .lte("expiry_date", in90Days)
      .gte("expiry_date", today),
  ]);

  const userName = profileRes.data?.name ?? "there";
  const firstName = userName.split(" ")[0];
  const allReceipts = allReceiptsRes.data ?? [];
  const vehicles = vehiclesRes.data ?? [];
  const totalReceipts = allReceipts.reduce(
    (s, r) => s + Number(r.amount),
    0
  );
  const alertsTotal =
    (maintenanceCountRes.count ?? 0) + (insuranceCountRes.count ?? 0);

  // Category spend for horizontal bars
  const categoryMap = new Map<string, number>();
  allReceipts.forEach((r) => {
    const cat = r.category ?? "other";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(r.amount));
  });
  const categoryData = Array.from(categoryMap.entries())
    .map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_COLORS[category] ?? "#818cf8",
    }))
    .sort((a, b) => b.total - a.total);

  // Monthly spend (last 6 months)
  const now = new Date();
  const monthMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(
      d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      0
    );
  }
  allReceipts.forEach((r) => {
    const key = new Date(r.date).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
    if (monthMap.has(key))
      monthMap.set(key, (monthMap.get(key) ?? 0) + Number(r.amount));
  });
  const monthlyData = Array.from(monthMap.entries()).map(([month, total]) => ({
    month,
    total,
  }));

  // Last 7 days + prior 7 days
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
  const last7Total = weeklyActivityBars.reduce((s, b) => s + b.value, 0);

  let prior7Total = 0;
  for (let i = 7; i < 14; i++) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const key = localDayKey(d);
    prior7Total += allReceipts.reduce(
      (s, r) => s + (receiptDayKey(r.date) === key ? Number(r.amount) : 0),
      0
    );
  }

  let spendTrendLine: string;
  if (last7Total === 0 && prior7Total === 0) {
    spendTrendLine = "No spend in the last 7 days";
  } else if (prior7Total === 0) {
    spendTrendLine = "New activity vs prior week";
  } else {
    const pct = ((last7Total - prior7Total) / prior7Total) * 100;
    spendTrendLine = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs prior week`;
  }

  // Monthly sparkline data for KPI cards
  const monthlyTotals = monthlyData.map((m) => m.total);
  const weeklyValues = weeklyActivityBars.map((b) => b.value);

  // Alerts for Attention section
  type VehicleRef = { id: string; make: string; model: string; year: number } | null;
  function normalizeVehicle(raw: unknown): VehicleRef {
    if (!raw || typeof raw !== "object") return null;
    const v = raw as Record<string, unknown>;
    if (typeof v.id !== "string") return null;
    return {
      id: v.id,
      make: String(v.make ?? ""),
      model: String(v.model ?? ""),
      year: typeof v.year === "number" ? v.year : Number(v.year) || 0,
    };
  }

  type AlertItem = {
    vehicle: string;
    detail: string;
    due: string;
    severity: "critical" | "warn" | "info";
  };

  const attentionItems: AlertItem[] = [];

  (maintenanceAlertsRes.data ?? []).forEach((a) => {
    const v = normalizeVehicle(a.vehicle);
    const vName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown vehicle";
    const sev =
      a.severity === "high" || a.severity === "critical"
        ? "critical"
        : a.severity === "medium" || a.severity === "warn"
          ? "warn"
          : "info";
    attentionItems.push({
      vehicle: vName,
      detail: (a.alert_type ?? "").replace(/_/g, " "),
      due: a.due_date ? formatDate(a.due_date) : "—",
      severity: sev as "critical" | "warn" | "info",
    });
  });

  (insuranceAlertsRes.data ?? []).forEach((ins) => {
    const v = normalizeVehicle(ins.vehicle);
    const vName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown vehicle";
    attentionItems.push({
      vehicle: vName,
      detail: "Insurance expiring",
      due: ins.expiry_date ? formatDate(ins.expiry_date) : "—",
      severity: "warn",
    });
  });

  const maxBars = Math.max(...weeklyActivityBars.map((b) => b.value), 1);

  return (
    <div className="relative z-10 space-y-6">
      {/* ── Greeting Header ───────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4 animate-fade-up">
        <GreetingHeader firstName={firstName} alertsTotal={alertsTotal} />
        <div className="flex gap-2">
          <Link
            href="/admin/receipts/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium text-foreground transition-colors duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Add receipt
          </Link>
          <Link
            href="/admin/vehicles/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-medium transition-shadow duration-200 shadow-indigo-sm hover:shadow-indigo"
            style={{
              background: "linear-gradient(135deg,#6366f1,#7c3aed)",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add vehicle
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up delay-1">
        {[
          {
            title: "Fleet size",
            value: String(vehicles.length),
            sub: `${vehicles.length} in fleet`,
            accent: "var(--indigo-soft)",
            icon: <Car className="h-4 w-4" />,
            spark: monthlyTotals.length > 1 ? monthlyTotals : [1, 1],
          },
          {
            title: "Spend YTD",
            value: formatCurrency(totalReceipts),
            sub: "Year to date",
            accent: "var(--indigo-soft)",
            icon: <TrendingUp className="h-4 w-4" />,
            spark: monthlyTotals.length > 1 ? monthlyTotals : [1, 1],
          },
          {
            title: "Last 7 days",
            value: formatCurrency(last7Total),
            sub: "Receipts",
            accent: "#10b981",
            icon: <Receipt className="h-4 w-4" />,
            spark: weeklyValues.length > 1 ? weeklyValues : [1, 1],
          },
          {
            title: "Alerts",
            value: String(alertsTotal),
            sub: `${maintenanceCountRes.count ?? 0} maintenance · ${insuranceCountRes.count ?? 0} insurance`,
            accent: "#f59e0b",
            icon: <Bell className="h-4 w-4" />,
            spark: [1, 2, 1, 3, 2, 4, 3, 2],
          },
        ].map((k) => (
          <HolographicCard key={k.title} interactive>
            <div className="p-4 flex items-start justify-between gap-3">
              <div>
                <div className="micro text-muted-foreground">{k.title}</div>
                <div className="mt-1.5 text-3xl font-bold font-syne tracking-tight">
                  {k.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {k.sub}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--indigo-dim)",
                    color: k.accent,
                  }}
                >
                  {k.icon}
                </div>
                <div className="w-20 h-7 opacity-90">
                  <Sparkline
                    data={k.spark}
                    stroke={k.accent}
                    fill="rgba(99,102,241,0.14)"
                    height={28}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </HolographicCard>
        ))}
      </div>

      {/* ── Primary Grid: Vehicles | Spend + Receipts ── */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        {/* Vehicles list */}
        <HolographicCard
          interactive={false}
          className="flex flex-col min-h-0 animate-fade-up delay-2"
        >
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--indigo-dim)",
                    color: "var(--indigo-soft)",
                  }}
                >
                  <Car className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="text-sm font-semibold font-syne">Vehicles</div>
              </div>
              <div className="micro mt-1.5 text-muted-foreground">
                {vehicles.length} in fleet
              </div>
            </div>
            <Link
              href="/admin/vehicles"
              className="text-[11px] font-medium flex items-center gap-1 text-[var(--indigo-soft)] hover:underline"
            >
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-3 pb-3 flex-1 min-h-0">
            {vehicles.length > 0 ? (
              <ul className="space-y-1.5 max-h-[26rem] overflow-y-auto pr-1">
                {vehicles.map((v) => {
                  const loc =
                    v.location && typeof v.location === "object"
                      ? (v.location as { name?: string }).name
                      : null;
                  return (
                    <li key={v.id}>
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 hover:border-[rgba(99,102,241,0.35)] hover:bg-accent px-3 py-2.5 transition-colors duration-200"
                      >
                        <div className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center bg-[var(--indigo-dim)]">
                          <Car
                            className="h-4 w-4 text-[var(--indigo-soft)]"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {v.year} {v.make} {v.model}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {v.license_plate}
                            {loc ? ` · ${loc}` : ""}
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 ml-1"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No vehicles yet
                </p>
                <Link
                  href="/admin/vehicles/new"
                  className="mt-3 text-xs font-medium text-[var(--indigo-soft)] hover:underline"
                >
                  Add your first vehicle &rarr;
                </Link>
              </div>
            )}
          </div>
        </HolographicCard>

        {/* Right column: Spend + Recent Receipts */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Spend YTD hero */}
          <HolographicCard
            interactive
            className="flex-1 p-5 animate-fade-up delay-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold font-syne">
                Spend &middot; YTD
              </div>
              <div className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-md border border-border">
                Last 7 days
              </div>
            </div>
            <div className="mt-3 flex items-end gap-6 flex-wrap">
              <div>
                <div className="text-5xl font-bold font-syne tracking-tight leading-none">
                  {formatCurrency(totalReceipts)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5 flex-wrap">
                  <span>Last 7d:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(last7Total)}
                  </span>
                  <span className="text-emerald-500">
                    &middot; {spendTrendLine}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-[180px] max-w-sm">
                <div
                  className="w-full flex items-end gap-1.5"
                  style={{ height: 96 }}
                >
                  {weeklyActivityBars.map((b, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0"
                    >
                      <div
                        className="bar-rise w-full rounded-md bg-primary"
                        style={{
                          height: `${(b.value / maxBars) * 100}%`,
                          minHeight: b.value > 0 ? 4 : 0,
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {b.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </HolographicCard>

          {/* Recent Receipts */}
          <HolographicCard
            interactive
            className="p-5 animate-fade-up delay-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--emerald-dim)",
                    color: "#10b981",
                  }}
                >
                  <Receipt className="h-3.5 w-3.5" />
                </div>
                <div className="text-sm font-semibold font-syne">
                  Recent receipts
                </div>
              </div>
              <Link
                href="/admin/receipts"
                className="text-[11px] font-medium flex items-center gap-1 text-[var(--indigo-soft)] hover:underline"
              >
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentReceiptsRes.data?.length ? (
              <ul className="space-y-0.5">
                {recentReceiptsRes.data.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold capitalize text-foreground">
                        {r.category?.replace(/_/g, " ")}
                      </p>
                      {r.vendor && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {r.vendor}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-bold font-syne text-foreground">
                        {formatCurrency(Number(r.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
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
                <p className="mb-2 text-xs text-muted-foreground">
                  No receipts yet
                </p>
                <Link
                  href="/admin/receipts/new"
                  className="text-xs font-medium text-[var(--indigo-soft)] hover:underline"
                >
                  Add the first one &rarr;
                </Link>
              </div>
            )}
          </HolographicCard>
        </div>
      </div>

      {/* ── Analytics ─────────────────────────────────── */}
      <div className="grid gap-4 lg:gap-5">
        <div className="flex items-center gap-3 pt-1">
          <h2 className="whitespace-nowrap font-syne text-base font-bold text-foreground">
            Analytics
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="micro text-muted-foreground">Year to date</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 animate-fade-up delay-5">
          <HolographicCard interactive className="p-5">
            <div className="text-sm font-bold font-syne mb-1">
              Spend by category
            </div>
            <div className="text-[11px] text-muted-foreground mb-4">
              Receipts &middot; YTD
            </div>
            {categoryData.length > 0 ? (
              <CategoryBars data={categoryData} />
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </HolographicCard>

          <HolographicCard interactive className="p-5">
            <div className="text-sm font-bold font-syne mb-1">
              Monthly spend
            </div>
            <div className="text-[11px] text-muted-foreground mb-4">
              Last 6 months
            </div>
            <MonthlySpendChart data={monthlyData} />
          </HolographicCard>
        </div>
      </div>

      {/* ── Attention ─────────────────────────────────── */}
      {attentionItems.length > 0 && (
        <div className="grid gap-4 lg:gap-5">
          <div className="flex items-center gap-3 pt-1">
            <h2 className="whitespace-nowrap font-syne text-base font-bold text-foreground">
              Attention
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <Link
              href="/admin/expiring-soon"
              className="text-[11px] font-medium text-[var(--indigo-soft)] hover:underline"
            >
              See all
            </Link>
          </div>

          <HolographicCard interactive className="p-5 animate-fade-up delay-5">
            <ul className="space-y-2">
              {attentionItems.slice(0, 5).map((a, i) => {
                const dotColor =
                  a.severity === "critical"
                    ? "#f43f5e"
                    : a.severity === "warn"
                      ? "#f59e0b"
                      : "#818cf8";
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: dotColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {a.vehicle}
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {a.detail}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {a.due}
                    </span>
                  </li>
                );
              })}
            </ul>
          </HolographicCard>
        </div>
      )}
    </div>
  );
}
