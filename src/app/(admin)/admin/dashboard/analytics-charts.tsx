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
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={80}
          isAnimationActive={!reducedMotion}
          animationDuration={reducedMotion ? 0 : 450}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => formatCategory(String(label))}
        />
        <Legend formatter={(value) => formatCategory(String(value))} />
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
        <YAxis tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
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
        <XAxis type="number" tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
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
