"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface ActivityDataPoint {
  day: string;
  value: number;
}

export interface ActivityChartCardProps {
  title?: string;
  totalValue: string;
  data: ActivityDataPoint[];
  className?: string;
  dropdownOptions?: string[];
  /** Replaces the demo “+12% from last week” line; omit to hide the trend row */
  trendDescription?: React.ReactNode;
  /** When true, shows the emerald trend icon next to `trendDescription` */
  showTrendIcon?: boolean;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Animated activity card with optional range dropdown (21st.dev–style), themed for shadcn.
 */
export function ActivityChartCard({
  title = "Activity",
  totalValue,
  data,
  className,
  dropdownOptions = ["Weekly", "Monthly", "Yearly"],
  trendDescription,
  showTrendIcon = false,
}: ActivityChartCardProps) {
  const titleId = React.useId();
  const reducedMotion = usePrefersReducedMotion();
  const [selectedRange, setSelectedRange] = React.useState(
    dropdownOptions[0] ?? ""
  );

  const maxValue = React.useMemo(() => {
    return data.reduce(
      (max, item) => (item.value > max ? item.value : max),
      0
    );
  }, [data]);

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.08,
          },
    },
  };

  const barVariants = {
    hidden: reducedMotion
      ? { scaleY: 1, opacity: 1 }
      : { scaleY: 0, opacity: 0, transformOrigin: "bottom" as const },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "bottom" as const,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as const,
          },
    },
  };

  const showDropdown = dropdownOptions.length > 1;

  return (
    <Card
      className={cn("h-full w-full shadow-sm transition-shadow duration-200 hover:shadow-md", className)}
      aria-labelledby={titleId}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle id={titleId} className="text-base font-syne">
            {title}
          </CardTitle>
          {showDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-sm cursor-pointer"
                  aria-haspopup="listbox"
                >
                  {selectedRange}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    className="cursor-pointer"
                    onSelect={() => setSelectedRange(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-col">
            <p className="text-4xl font-bold tracking-tighter text-foreground font-syne sm:text-5xl">
              {totalValue}
            </p>
            {trendDescription != null && trendDescription !== "" ? (
              <CardDescription className="mt-1 flex items-center gap-1.5">
                {showTrendIcon ? (
                  <TrendingUp
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                ) : null}
                <span>{trendDescription}</span>
              </CardDescription>
            ) : null}
          </div>

          <motion.div
            key={selectedRange}
            className="flex h-28 w-full items-end justify-between gap-1.5 sm:max-w-[min(100%,20rem)] sm:flex-1"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            aria-label="Activity chart"
          >
            {data.map((item, index) => (
              <div
                key={`${item.day}-${index}`}
                className="flex h-full w-full flex-col items-center justify-end gap-2"
                role="presentation"
              >
                <motion.div
                  className="w-full rounded-md bg-primary"
                  style={{
                    height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    minHeight: maxValue > 0 && item.value > 0 ? "4px" : undefined,
                  }}
                  variants={barVariants}
                  aria-label={`${item.day}: ${item.value}`}
                />
                <span className="text-[10px] text-muted-foreground sm:text-xs">
                  {item.day}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
