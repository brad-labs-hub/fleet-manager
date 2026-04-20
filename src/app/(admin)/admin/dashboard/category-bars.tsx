"use client";

import { formatCurrency } from "@/lib/utils";

type CategoryBarData = {
  category: string;
  total: number;
  color: string;
};

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

export function CategoryBars({ data }: { data: CategoryBarData[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      {data.map((c, i) => {
        const pct = (c.total / max) * 100;
        const color =
          c.color || CATEGORY_COLORS[c.category.toLowerCase()] || "#818cf8";
        return (
          <div key={c.category}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-medium capitalize text-foreground">
                {c.category.replace(/_/g, " ")}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {formatCurrency(c.total)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bar-rise"
                style={{
                  width: `${pct}%`,
                  background: color,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
