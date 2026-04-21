"use client";

import { formatCurrency } from "@/lib/utils";

type CategoryBarData = {
  category: string;
  total: number;
  color: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  gas: "#10b981",
  fuel: "#10b981",
  maintenance: "#0d9488",
  insurance: "#f59e0b",
  tires: "#34d399",
  registration: "#f43f5e",
  detailing: "#f97316",
  car_wash: "#f97316",
  parking: "#6ee7b7",
  tolls: "#6ee7b7",
  other: "#6ee7b7",
};

export function CategoryBars({ data }: { data: CategoryBarData[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      {data.map((c, i) => {
        const pct = (c.total / max) * 100;
        const color =
          c.color || CATEGORY_COLORS[c.category.toLowerCase()] || "#6ee7b7";
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
