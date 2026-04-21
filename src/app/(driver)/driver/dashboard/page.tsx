import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Receipt, Car, Wrench, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function DriverDashboardPage() {
  const supabase = await createClient();
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, year, location:locations(name)")
    .order("make");
  const { data: alerts } = await supabase
    .from("maintenance_alerts")
    .select("id, alert_type, due_date, vehicle:vehicles(id, make, model)")
    .eq("dismissed", false)
    .or(`due_date.is.null,due_date.lte.${in14Days}`)
    .order("due_date", { ascending: true })
    .limit(5);
  const { data: recentReceipts } = await supabase
    .from("receipts")
    .select("id, amount, date, category")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-5">

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/driver/receipts/new"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 h-24 cursor-pointer transition-shadow duration-200 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-sm hover:shadow-emerald">
            <Receipt className="h-5 w-5 text-white" />
            <p className="text-sm font-semibold text-white">New Receipt</p>
          </div>
        </Link>
        <Link
          href="/driver/requests/new"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 h-24 cursor-pointer bg-card border border-border hover:border-[var(--border-hi)] transition-colors duration-200">
            <Wrench className="h-5 w-5" style={{ color: "var(--emerald-soft)" }} />
            <p className="text-sm font-semibold text-foreground">Request a Car</p>
          </div>
        </Link>
      </div>

      {/* Maintenance alerts — due soon (next 14 days) */}
      {alerts && alerts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--amber-dim)" }}>
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--amber)" }} />
            </div>
            Due soon (next 14 days)
          </h2>
          <div className="space-y-1">
            {alerts.map((a) => {
              const v = a.vehicle as unknown as { id: string; make: string; model: string } | null;
              return (
                <Link
                  key={a.id}
                  href={v ? `/driver/vehicles/${v.id}` : "#"}
                  className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl text-sm border-b border-border last:border-0 hover:bg-accent cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="text-foreground text-xs font-medium">
                    {v ? `${v.make} ${v.model}` : "—"}
                  </span>
                  <span className="text-xs font-semibold shrink-0" style={{ color: "var(--amber)" }}>
                    {a.due_date ? formatDate(a.due_date) : a.alert_type}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent receipts */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
              <Receipt className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
            </div>
            Recent Receipts
          </h2>
          <Link
            href="/driver/receipts"
            className="flex items-center gap-0.5 text-xs font-medium cursor-pointer rounded-md outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ color: "var(--emerald-soft)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentReceipts && recentReceipts.length > 0 ? (
          <div className="space-y-1">
            {recentReceipts.map((r) => (
              <Link
                key={r.id}
                href={`/driver/receipts/${r.id}`}
                className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl hover:bg-accent cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-xs font-medium text-foreground capitalize">{r.category?.replace(/_/g, " ")}</span>
                <span className="text-xs font-bold text-foreground">{formatCurrency(Number(r.amount))}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">No receipts yet</p>
            <Link
              href="/driver/receipts/new"
              className="text-xs font-medium cursor-pointer rounded-md outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ color: "var(--emerald-soft)" }}
            >
              Add your first receipt →
            </Link>
          </div>
        )}
      </div>

      {/* Fleet overview */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-dim)" }}>
              <Car className="h-3.5 w-3.5" style={{ color: "var(--emerald-soft)" }} />
            </div>
            Fleet Overview
          </h2>
          <Link
            href="/driver/vehicles"
            className="flex items-center gap-0.5 text-xs font-medium cursor-pointer rounded-md outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ color: "var(--emerald-soft)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {vehicles && vehicles.length > 0 ? (
          <div className="space-y-1">
            {vehicles.slice(0, 5).map((v) => (
              <Link
                key={v.id}
                href={`/driver/vehicles/${v.id}`}
                className="flex justify-between items-center py-2 px-2 -mx-2 rounded-xl hover:bg-accent cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-xs font-medium text-foreground">
                  {v.year} {v.make} {v.model}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(v.location as unknown as { name: string })?.name ?? "—"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No vehicles in fleet</p>
        )}
      </div>

    </div>
  );
}
