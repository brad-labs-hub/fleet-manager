"use client";

import { useEffect, useState } from "react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getLocalDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function GreetingHeader({
  firstName,
  alertsTotal,
}: {
  firstName: string;
  alertsTotal: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dateLabel = mounted ? getLocalDate() : "";
  const greeting = mounted ? getGreeting() : "Hello";

  return (
    <div>
      <div className="micro text-muted-foreground mb-1">{dateLabel}</div>
      <h1 className="text-[30px] leading-[1.05] font-bold font-syne tracking-tight">
        {greeting}, {firstName}.
        <br />
        <span className="text-muted-foreground font-medium">
          Your fleet is{" "}
          <span className="text-foreground">calm</span> &mdash;{" "}
          {alertsTotal} item{alertsTotal !== 1 ? "s" : ""} need attention.
        </span>
      </h1>
    </div>
  );
}
