"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 isolate z-[2] hidden opacity-50 contain-strict lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring" as const,
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
            >
              <div className="relative hidden min-h-[28rem] w-full dark:block lg:min-h-[36rem]">
                <Image
                  src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                  alt=""
                  fill
                  className="object-cover object-[center_top] opacity-90 lg:object-[center_20%]"
                  sizes="100vw"
                  priority
                />
              </div>
            </AnimatedGroup>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid items-center gap-10 pb-16 pt-6 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-10">
                <div className="text-center lg:text-left">
                  <AnimatedGroup variants={transitionVariants}>
                    <h1 className="mx-auto max-w-3xl text-balance text-5xl md:text-6xl lg:mx-0 lg:text-6xl xl:text-7xl">
                      Modern fleet management for families and small teams
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground lg:mx-0">
                      Track vehicles, maintenance, insurance, and receipts in one place with streamlined
                      workflows that fit how you actually run your fleet.
                    </p>
                  </AnimatedGroup>

                  <AnimatedGroup
                    variants={{
                      container: {
                        visible: {
                          transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.75,
                          },
                        },
                      },
                      ...transitionVariants,
                    }}
                    className="mt-10 flex justify-center lg:justify-start"
                  >
                    <div className="rounded-[14px] border border-border bg-foreground/10 p-0.5">
                      <Button asChild size="lg" className="rounded-xl px-8 text-base">
                        <Link href="/login">
                          <span className="text-nowrap">Sign in</span>
                        </Link>
                      </Button>
                    </div>
                  </AnimatedGroup>
                </div>

                <div className="relative">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-3 shadow-lg shadow-zinc-950/10 ring-1 ring-border md:p-4 dark:shadow-zinc-950/20">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                      <Image
                        src="/images/dashboard-preview.png"
                        alt="Fleet Manager dashboard preview"
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 720px"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-background/15 backdrop-blur-[2px] md:backdrop-blur-[3px]"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/10 to-background/70"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent"
                      />
                      <div className="absolute inset-0 flex items-end justify-center p-4 md:p-6">
                        <Button asChild size="sm" className="rounded-lg px-5 md:px-6">
                          <Link href="/login">Sign in to view full dashboard</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function HeroHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "max-w-4xl rounded-2xl border border-border bg-background/50 px-5 backdrop-blur-lg lg:px-5",
          )}
        >
          <div className="flex items-center justify-between gap-4 py-3 lg:py-4">
            <Link href="/" aria-label="Fleet Manager home" className="flex items-center space-x-2">
              <Logo />
            </Link>
            <Button asChild variant={isScrolled ? "default" : "outline"} size="sm" className="shrink-0">
              <Link href="/login">
                <span>Sign in</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-syne text-[10px] font-bold tracking-wide text-white shadow-sm">
        FM
      </span>
      <span className="font-syne text-sm font-bold leading-none text-foreground">
        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Fleet
        </span>
        <span className="text-foreground"> Manager</span>
      </span>
    </span>
  );
}
