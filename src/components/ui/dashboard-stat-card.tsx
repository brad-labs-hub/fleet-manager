"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const focusRing =
  "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export interface DashboardStatCardProps {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  /** Optional link wrapping the whole card (e.g. KPIs) */
  href?: string;
  className?: string;
  iconWrapperClassName?: string;
  animateClassName?: string;
}

/**
 * KPI tile using the same Card chrome as ActivityChartCard (21st.dev pattern).
 */
export function DashboardStatCard({
  title,
  value,
  description,
  icon,
  href,
  className,
  iconWrapperClassName,
  animateClassName,
}: DashboardStatCardProps) {
  const card = (
    <Card
      className={cn(
        "h-full w-full shadow-sm transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconWrapperClassName
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-bold leading-none tracking-tight text-foreground font-syne sm:text-4xl">
          {value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("block h-full", focusRing, animateClassName)}
      >
        {card}
      </Link>
    );
  }

  return <div className={cn("h-full", animateClassName)}>{card}</div>;
}
