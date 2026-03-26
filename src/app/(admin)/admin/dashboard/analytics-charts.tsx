"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type CategoryData = { category: string; total: number };
type MonthlyData = { month: string; total: number };
type VehicleData = { name: string; total: number };

const PIE_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#14b8a6", "#8b5cf6", "#ec4899", "#f97316",
];

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Bar chart axis ticks: show dollars under 1k, else compact `$2.5k` style (not `$0k` for sub-500 ticks). */
function formatAxisSpend(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  if (abs < 1000) return `$${Math.round(n)}`;
  const k = n / 1000;
  if (abs < 10_000) {
    const t = Math.round(k * 10) / 10;
    return t % 1 === 0 ? `$${t}k` : `$${t.toFixed(1)}k`;
  }
  return `$${Math.round(k)}k`;
}

/** Card-style tooltip for spend-by-category (readable in light and dark). */
function SpendCategoryTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const label = row.name != null ? formatCategory(String(row.name)) : "—";
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">
        {formatCurrency(Number(row.value))}
      </p>
    </div>
  );
}

type LegendPayloadEntry = { value?: string | number; color?: string };

/** Legend with neutral text + swatches (avoids low-contrast colored labels on dark cards). */
function SpendCategoryLegend({ payload }: { payload?: ReadonlyArray<LegendPayloadEntry> }) {
  if (!payload?.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2.5 px-1">
      {payload.map((entry) => (
        <li
          key={String(entry.value)}
          className="flex max-w-[11rem] items-center gap-2 text-xs text-muted-foreground"
        >
          <span
            className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/70"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          <span className="truncate font-medium text-foreground/85">
            {formatCategory(String(entry.value))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function SpendByCategoryChart({ data }: { data: CategoryData[] }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length) return <p className="text-muted-foreground text-sm">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="46%"
          innerRadius={54}
          outerRadius={92}
          paddingAngle={2}
          cornerRadius={4}
          isAnimationActive={!reducedMotion}
          animationDuration={reducedMotion ? 0 : 450}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              stroke="var(--border)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<SpendCategoryTooltipContent />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Legend content={<SpendCategoryLegend />} verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlySpendChart({ data }: { data: MonthlyData[] }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length) return <p className="text-muted-foreground text-sm">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatAxisSpend} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar
          dataKey="total"
          fill="#6366f1"
          radius={[4, 4, 0, 0]}
          isAnimationActive={!reducedMotion}
          animationDuration={reducedMotion ? 0 : 450}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerVehicleChart({ data }: { data: VehicleData[] }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length) return <p className="text-muted-foreground text-sm">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 36 + 20, 120)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={formatAxisSpend} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar
          dataKey="total"
          fill="#22c55e"
          radius={[0, 4, 4, 0]}
          isAnimationActive={!reducedMotion}
          animationDuration={reducedMotion ? 0 : 450}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
