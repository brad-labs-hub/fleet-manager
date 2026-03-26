"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type HolographicCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Wrapper for children (default: relative z-10) */
  contentClassName?: string;
  /** Disable tilt / pointer glow (also forced when prefers-reduced-motion) */
  interactive?: boolean;
};

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
 * Tilt + moving iridescent highlight (pointer-driven). Respects reduced motion.
 */
export function HolographicCard({
  children,
  className,
  contentClassName,
  interactive = true,
}: HolographicCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const enableTilt = interactive && !reducedMotion;

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableTilt || !cardRef.current) return;
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 12;
      const rotateY = (centerX - x) / 12;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--bg-x", `${(x / rect.width) * 100}%`);
      card.style.setProperty("--bg-y", `${(y / rect.height) * 100}%`);
      card.style.transform = `perspective(920px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1)`;
    },
    [enableTilt]
  );

  const handleMouseLeave = React.useCallback(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform =
      "perspective(920px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.setProperty("--x", "50%");
    card.style.setProperty("--y", "50%");
    card.style.setProperty("--bg-x", "50%");
    card.style.setProperty("--bg-y", "50%");
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group holographic-card border border-border bg-card text-card-foreground shadow-sm transition-shadow duration-200",
        enableTilt && "cursor-pointer hover:shadow-lg hover:border-primary/35",
        reducedMotion && "holographic-card--static",
        className
      )}
      onMouseMove={enableTilt ? handleMouseMove : undefined}
      onMouseLeave={enableTilt ? handleMouseLeave : undefined}
    >
      <div className={cn("relative z-10 holo-content", contentClassName)}>
        {children}
      </div>
      {enableTilt ? <div className="holo-glow pointer-events-none" aria-hidden /> : null}
    </div>
  );
}
